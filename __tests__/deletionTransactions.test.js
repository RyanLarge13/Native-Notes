import { deleteFolderLocally, deleteNoteLocally } from "../utils/sqLite";
jest.mock("expo-sqlite", () => ({}));

const makeDb = (fail = "") => {
  const state = {
    folders: [{ folderid: 1, parentFolderId: null }, { folderid: 2, parentFolderId: 1 }, { folderid: 3, parentFolderId: 2 }, { folderid: 4, parentFolderId: null }],
    notes: [{ noteid: 11, folderId: 1 }, { noteid: 12, folderId: 3 }, { noteid: 13, folderId: 4 }],
    outbox: [],
    saves: [11, 12, 13],
  };
  return {
    state,
    withExclusiveTransactionAsync: async callback => {
      const staged = JSON.parse(JSON.stringify(state));
      const tx = {
        getAllAsync: async sql => sql.includes("FROM folders") ? staged.folders : staged.notes,
        runAsync: async (sql, args) => {
          if (fail && sql.includes(fail)) throw new Error("SQLite failure");
          if (sql.startsWith("DELETE FROM notes")) staged.notes = staged.notes.filter(n => n.noteid !== args[0]);
          if (sql.startsWith("DELETE FROM folders")) staged.folders = staged.folders.filter(f => f.folderid !== args[0]);
          if (sql.startsWith("DELETE FROM note_save_outbox")) staged.saves = staged.saves.filter(id => id !== args[0]);
          if (sql.includes("INSERT OR IGNORE INTO deletion_outbox")) staged.outbox.push(args);
        },
      };
      const result = await callback(tx);
      Object.assign(state, staged);
      return result;
    },
  };
};

test("folder deletion removes all nested folders and notes, not unrelated records", async () => {
  const db = makeDb();
  const result = await deleteFolderLocally(db, 1);
  expect(result.folderIds).toEqual(expect.arrayContaining([1, 2, 3]));
  expect(result.noteIds).toEqual(expect.arrayContaining([11, 12]));
  expect(db.state.folders).toEqual([{ folderid: 4, parentFolderId: null }]);
  expect(db.state.notes).toEqual([{ noteid: 13, folderId: 4 }]);
  expect(db.state.outbox).toEqual([["folder", 1]]);
});

test("failed nested delete rolls back all local changes and outbox", async () => {
  const db = makeDb("DELETE FROM folders");
  const before = JSON.parse(JSON.stringify(db.state));
  await expect(deleteFolderLocally(db, 1)).rejects.toThrow("SQLite failure");
  expect(db.state).toEqual(before);
});

test("note deletion clears pending save and queues server deletion", async () => {
  const db = makeDb();
  await deleteNoteLocally(db, 11);
  expect(db.state.notes.some(note => note.noteid === 11)).toBe(false);
  expect(db.state.saves.includes(11)).toBe(false);
  expect(db.state.outbox).toEqual([["note", 11]]);
});
