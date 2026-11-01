import { createNewNote, updateNote } from "../utils/api";
import { saveNewNoteLocally, retryPendingNoteSaves } from "../utils/noteSaveQueue";

jest.mock("../utils/api", () => ({ createNewNote: jest.fn(), updateNote: jest.fn() }));
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const deferred = () => {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
};
const draft = (htmlText, updated = "2026-11-01T12:00:00Z") => ({
  noteid: -123, title: "Draft", htmlText, locked: false, folderId: null,
  createdAt: "2026-11-01T12:00:00Z", updated, trashed: false,
});
const dbFixture = () => {
  const notes = new Map();
  const outbox = new Map();
  const creations = new Map();
  const run = async (sql, args) => {
    if (sql.includes("INSERT INTO creation_outbox")) creations.set(args[1], "pending");
    else if (sql.includes("DELETE FROM creation_outbox")) creations.delete(args[1]);
    else if (sql.includes("INSERT INTO notes")) {
      const existing = notes.get(args[0]);
      notes.set(args[0], existing ? { ...existing, title: args[1], htmlText: args[3], updated: args[6] } :
        { noteid: args[0], title: args[1], locked: args[2], htmlText: args[3], folderId: args[4], createdAt: args[5], updated: args[6], trashed: args[7] });
    } else if (sql.includes("INSERT INTO note_save_outbox") && sql.includes("VALUES")) outbox.set(args[0], args[1]);
    else if (sql.includes("UPDATE notes SET noteid")) {
      const n = notes.get(args[1]); notes.delete(args[1]); notes.set(args[0], { ...n, noteid: args[0] });
    } else if (sql.includes("DELETE FROM note_save_outbox")) outbox.delete(args[0]);
    else if (sql.includes("INSERT INTO note_save_outbox") && sql.includes("SELECT")) outbox.set(args[0], notes.get(args[0]).updated);
  };
  return {
    notes, outbox, creations,
    withExclusiveTransactionAsync: async fn => fn({ runAsync: run }),
    getFirstAsync: async (sql, args) => sql.includes("creation_outbox") ? { status: creations.get(args[1]) } : notes.get(args[0]),
    getAllAsync: async () => [...outbox.keys()].map(id => notes.get(id)),
    runAsync: async (sql, args) => {
      if (sql.includes("UPDATE creation_outbox")) creations.set(args[2], args[0]);
      if (sql.includes("DELETE FROM note_save_outbox") && outbox.get(args[0]) === args[1]) outbox.delete(args[0]);
    },
  };
};
const ui = () => {
  let state = { notes: [] };
  return { setAllData: fn => { state = fn(state); }, get: () => state };
};
beforeEach(() => { createNewNote.mockReset(); updateNote.mockReset(); });

test("new note is persisted locally before server responds, then ID is reconciled", async () => {
  const db = dbFixture(), state = ui(), pending = deferred();
  createNewNote.mockReturnValueOnce(pending.promise);
  updateNote.mockResolvedValue({ data: { data: [{ notesid: 42 }] } });
  await saveNewNoteLocally({ db, note: draft("first"), token: "test", setAllData: state.setAllData });
  expect(db.notes.get(-123).htmlText).toBe("first");
  expect(db.outbox.has(-123)).toBe(true);
  pending.resolve({ data: { data: [{ notesid: 42 }] } });
  await tick(); await tick();
  expect(db.notes.has(-123)).toBe(false);
  expect(db.notes.get(42).htmlText).toBe("first");
  expect(state.get().notes[0].noteid).toBe(42);
  expect(createNewNote).toHaveBeenCalledTimes(1);
});

test("edits during pending creation use one POST and latest content", async () => {
  const db = dbFixture(), state = ui(), pending = deferred();
  createNewNote.mockReturnValueOnce(pending.promise);
  updateNote.mockResolvedValue({ data: { data: [{ notesid: 43 }] } });
  await saveNewNoteLocally({ db, note: draft("A"), token: "test", setAllData: state.setAllData });
  await saveNewNoteLocally({ db, note: draft("B", "2026-11-01T12:00:01Z"), token: "test", setAllData: state.setAllData });
  expect(createNewNote).toHaveBeenCalledTimes(1);
  pending.resolve({ data: { data: [{ notesid: 43 }] } });
  await tick(); await tick();
  expect(db.notes.get(43).htmlText).toBe("B");
  expect(updateNote.mock.calls.at(-1)[1].htmlNotes).toBe("B");
});

test("startup does not blindly POST unacknowledged temporary IDs", async () => {
  const db = dbFixture(), state = ui();
  createNewNote.mockResolvedValue({ data: { data: [{ notesid: 44 }] } });
  // Simulate a draft surviving restart with no active worker.
  db.notes.set(-123, draft("offline"));
  db.outbox.set(-123, draft("offline").updated);
  await retryPendingNoteSaves({ db, token: "test", setAllData: state.setAllData });
  expect(createNewNote).not.toHaveBeenCalled();
  expect(db.notes.get(-123).htmlText).toBe("offline");
});

test.each([
  ["dropped response", { request: {}, code: "ERR_NETWORK" }, "no_response"],
  ["server HTTP 500", { response: { status: 500 } }, "http_500"],
  ["malformed success", null, "malformed_response"],
])("%s retains draft without duplicate POST", async (_name, failure, expectedStatus) => {
  const db = dbFixture(), state = ui();
  if (failure) createNewNote.mockRejectedValueOnce(failure);
  else createNewNote.mockResolvedValueOnce({ data: { data: [{}] } });
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    await saveNewNoteLocally({ db, note: draft("keep me"), token: "test", setAllData: state.setAllData });
    await tick(); await tick();
    expect(db.notes.get(-123).htmlText).toBe("keep me");
    expect(db.creations.get(-123)).toBe(expectedStatus);
    await retryPendingNoteSaves({ db, token: "test", setAllData: state.setAllData });
    expect(createNewNote).toHaveBeenCalledTimes(1);
  } finally { spy.mockRestore(); }
});
