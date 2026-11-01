import { grabFromDatabase, replaceLocalCache } from "../utils/sqLite";

jest.mock("expo-sqlite", () => ({}));

const user = { userId: 1, username: "tester", email: "test@example.com", createdAt: "2026-01-01" };
const folder = { folderid: 3, title: "Projects", color: "#fff", parentFolderId: null };
const note = { noteid: 8, title: "Plan", htmlText: "<p>Hello</p>", folderId: 3,
  locked: false, createdAt: "2026-01-01", updated: "2026-01-02", trashed: false };
const snapshot = (suffix) => ({
  user: { ...user, username: suffix },
  folders: [{ ...folder, title: suffix }],
  notes: [{ ...note, title: suffix }],
});

// In-memory transactional stand-in. Every operation mutates a staged copy,
// which is committed only if the callback completes successfully.
const fakeDb = (initial = { user: null, folders: [], notes: [] }) => {
  let state = structuredClone(initial);
  let failOn = null;
  let pending = 0;
  const db = {
    failWhen: text => { failOn = text; },
    setPending: n => { pending = n; },
    get state() { return state; },
    getFirstAsync: async sql => sql.includes("FROM user") ? state.user : null,
    getAllAsync: async sql => sql.includes("FROM folders") ? state.folders : state.notes,
    withExclusiveTransactionAsync: async callback => {
      const staged = structuredClone(state);
      const tx = {
        getFirstAsync: async () => ({ count: pending }),
        runAsync: async (sql, args = []) => {
          if (failOn && sql.includes(failOn)) throw new Error("Injected SQLite failure");
          if (sql.includes("DELETE FROM notes")) staged.notes = [];
          else if (sql.includes("DELETE FROM folders")) staged.folders = [];
          else if (sql.includes("DELETE FROM user")) staged.user = null;
          else if (sql.includes("INSERT INTO user")) staged.user = {
            userId: args[0], username: args[1], email: args[2],
            createdAt: args[3], preferences: args[4],
          };
          else if (sql.includes("INSERT INTO folders")) staged.folders.push({
            folderid: args[0], title: args[1], color: args[2], parentFolderId: args[3],
          });
          else if (sql.includes("INSERT INTO notes")) staged.notes.push({
            noteid: args[0], title: args[1], locked: args[2], htmlText: args[3],
            folderId: args[4], createdAt: args[5], updated: args[6], trashed: args[7],
          });
        },
      };
      await callback(tx);
      state = staged;
    },
  };
  return db;
};

describe("SQLite cache storage and retrieval", () => {
  let log;
  beforeEach(() => { log = jest.spyOn(console, "log").mockImplementation(() => {}); });
  afterEach(() => log.mockRestore());

  test("stores and retrieves user, folders and notes", async () => {
    const db = fakeDb();
    expect(await replaceLocalCache(snapshot("First"), db)).toBe(true);
    const result = await grabFromDatabase(db);
    expect(result.cachedUser.username).toBe("First");
    expect(result.cachedFolders).toEqual([expect.objectContaining({ folderid: 3, title: "First" })]);
    expect(result.cachedNotes).toEqual([expect.objectContaining({
      noteid: 8, title: "First", htmlText: "<p>Hello</p>", folderId: 3,
    })]);
  });

  test.each(["INSERT INTO user", "INSERT INTO folders", "INSERT INTO notes"])(
    "rolls back all previous data if %s fails", async (failure) => {
      const db = fakeDb();
      expect(await replaceLocalCache(snapshot("Original"), db)).toBe(true);
      const before = structuredClone(db.state);
      db.failWhen(failure);
      expect(await replaceLocalCache(snapshot("Replacement"), db)).toBe(false);
      expect(db.state).toEqual(before);
      const result = await grabFromDatabase(db);
      expect(result.cachedNotes[0].title).toBe("Original");
      expect(result.cachedFolders[0].title).toBe("Original");
    },
  );

  test("does not overwrite cached notes when local sync is pending", async () => {
    const db = fakeDb();
    await replaceLocalCache(snapshot("Original"), db);
    db.setPending(1);
    expect(await replaceLocalCache(snapshot("Replacement"), db)).toBe(false);
    expect(db.state.notes[0].title).toBe("Original");
  });

  test("rejects malformed snapshots without touching existing data", async () => {
    const db = fakeDb();
    await replaceLocalCache(snapshot("Original"), db);
    expect(await replaceLocalCache({ user, folders: null, notes: {} }, db)).toBe(false);
    expect(db.state.notes[0].title).toBe("Original");
  });
});

describe("server refresh duplicate and pending-edit safeguards", () => {
  let log;
  beforeEach(() => { log = jest.spyOn(console, "log").mockImplementation(() => {}); });
  afterEach(() => log.mockRestore());

  test("repeated server IDs are stored once per snapshot", async () => {
    const db = fakeDb();
    const incoming = snapshot("Latest");
    incoming.notes.push({ ...incoming.notes[0], title: "Latest duplicate" });
    incoming.folders.push({ ...incoming.folders[0], title: "Latest folder duplicate" });
    expect(await replaceLocalCache(incoming, db)).toBe(true);
    expect(db.state.notes).toHaveLength(1);
    expect(db.state.notes[0].title).toBe("Latest duplicate");
    expect(db.state.folders).toHaveLength(1);
    expect(db.state.folders[0].title).toBe("Latest folder duplicate");
    expect(await replaceLocalCache(incoming, db)).toBe(true);
    expect(db.state.notes).toHaveLength(1);
    expect(db.state.folders).toHaveLength(1);
  });

  test("edit queued after server response but before exclusive replacement is protected", async () => {
    const db = fakeDb();
    await replaceLocalCache(snapshot("Original"), db);
    // A queued local write is visible when the exclusive transaction begins.
    db.setPending(1);
    expect(await replaceLocalCache(snapshot("Stale server"), db)).toBe(false);
    const cached = await grabFromDatabase(db);
    expect(cached.cachedNotes[0].title).toBe("Original");
  });
});
