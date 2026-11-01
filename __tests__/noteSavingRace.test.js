import { updateNote } from "../utils/api";
import { saveExistingNoteLocally, retryPendingNoteSaves } from "../utils/noteSaveQueue";

jest.mock("../utils/api", () => ({ updateNote: jest.fn() }));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const response = (htmlnotes) => ({ data: { data: [{ htmlnotes }] } });
const note = (htmlText, updated) => ({
  noteid: 7, title: "Test", htmlText, folderId: 1,
  locked: false, createdAt: "2026-01-01", updated,
});
const makeDb = () => {
  const rows = new Map();
  const outbox = new Map();
  const tx = { runAsync: jest.fn(async (sql, args) => {
    if (sql.includes("UPDATE notes")) rows.set(args[5], { ...rows.get(args[5]), title: args[0], htmlText: args[1], updated: args[4], noteid: args[5] });
    if (sql.includes("INSERT INTO note_save_outbox")) outbox.set(args[0], args[1]);
  }) };
  return {
    rows, outbox,
    withExclusiveTransactionAsync: jest.fn(async cb => cb(tx)),
    runAsync: jest.fn(async (_sql, args) => {
      if (outbox.get(args[0]) === args[1]) outbox.delete(args[0]);
    }),
    getAllAsync: jest.fn(async () => [...outbox.keys()].map(id => rows.get(id))),
  };
};
const state = () => {
  let data = { notes: [note("original", "2026-01-01")] };
  return { setAllData: fn => { data = fn(data); }, get: () => data };
};

beforeEach(() => updateNote.mockReset());

test("serializes overlapping saves and retains the newest content", async () => {
  const db = makeDb();
  const ui = state();
  const first = deferred();
  updateNote.mockReturnValueOnce(first.promise).mockResolvedValueOnce(response("B"));
  await saveExistingNoteLocally({ db, note: note("A", "2026-01-02"), token: "test", setAllData: ui.setAllData });
  await saveExistingNoteLocally({ db, note: note("B", "2026-01-03"), token: "test", setAllData: ui.setAllData });
  expect(updateNote).toHaveBeenCalledTimes(1);
  expect(db.rows.get(7).htmlText).toBe("B");
  expect(db.outbox.get(7)).toBe("2026-01-03");
  first.resolve(response("A"));
  await tick();
  await tick();
  expect(updateNote).toHaveBeenCalledTimes(2);
  expect(updateNote.mock.calls[1][1].htmlNotes).toBe("B");
  expect(db.outbox.size).toBe(0);
  expect(ui.get().notes[0].htmlText).toBe("B");
});

test("server failure retains the local snapshot for later retry", async () => {
  const db = makeDb();
  const ui = state();
  updateNote.mockRejectedValueOnce(new Error("offline"));
  await saveExistingNoteLocally({ db, note: note("offline edit", "2026-01-04"), token: "test", setAllData: ui.setAllData });
  await tick();
  expect(db.outbox.get(7)).toBe("2026-01-04");
  expect(db.rows.get(7).htmlText).toBe("offline edit");
  updateNote.mockResolvedValueOnce(response("offline edit"));
  await retryPendingNoteSaves({ db, token: "test", setAllData: ui.setAllData });
  await tick();
  expect(db.outbox.size).toBe(0);
});

test("local persistence completes without waiting for a slow server", async () => {
  const db = makeDb();
  const ui = state();
  const pending = deferred();
  updateNote.mockReturnValueOnce(pending.promise);
  await saveExistingNoteLocally({ db, note: note("ready locally", "2026-01-05"), token: "test", setAllData: ui.setAllData });
  expect(db.rows.get(7).htmlText).toBe("ready locally");
  expect(db.outbox.size).toBe(1);
  pending.resolve(response("ready locally"));
  await tick();
});
