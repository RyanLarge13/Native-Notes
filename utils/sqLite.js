import * as SQLite from "expo-sqlite";

const STORE_NAME = "localstore";
const DEFAULT_PREFERENCES = {
  darkMode: true,
  theme: {
    on: false,
    color: "bg-amber-300",
  },
  view: false,
  order: false,
  autoSave: false,
  appLock: false,
  sort: "Title",
  saveLocation: true,
  location: null,
};

export const openDB = async () => {
  try {
    const myStore = await SQLite.openDatabaseAsync(STORE_NAME);

    return myStore;
  } catch (err) {
    console.log(`Error opening store ${STORE_NAME} using SQLite: `);
    console.log(err);

    return null;
  }
};

export const initializeSQLiteTables = async (db) => {
  // await deleteDatabase();
  // return;
  try {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS user (
          userId INTEGER PRIMARY KEY NOT NULL, 
          username TEXT NOT NULL, 
          email TEXT NOT NULL, 
          createdAt TEXT NOT NULL,
          preferences TEXT NOT NULL
          );
        CREATE TABLE IF NOT EXISTS folders (
          folderid INTEGER PRIMARY KEY NOT NULL, 
          title TEXT NOT NULL, 
          color TEXT NOT NULL, 
          parentFolderId INTEGER
          );
        CREATE TABLE IF NOT EXISTS note_save_outbox (noteid INTEGER PRIMARY KEY NOT NULL, updated TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS notes (
          title TEXT NOT NULL, 
          noteid INTEGER PRIMARY KEY NOT NULL, 
          locked BOOLEAN DEFAULT FALSE, 
          htmlText TEXT, 
          folderId INTEGER, 
          createdAt TIMESTAMP NOT NULL, 
          updated TIMESTAMP NOT NULL, 
          trashed BOOLEAN
          );
      `);

    return true;
  } catch (err) {
    console.log("Error creating tables inside sql database");
    console.log(err);
    return false;
  }
};

export const grabFromDatabase = async (db) => {
  // BY THE TIME THIS CALL HAPPENS DB SHOULD EXIST AND TABLES AS WELL
  // IT IS OKAY IF NO DATA IS IN THERE

  try {
    const dbUser = await db.getFirstAsync(`SELECT * FROM user`);
    const dbFolders = await db.getAllAsync(`SELECT * FROM folders`);
    const dbNotes = await db.getAllAsync(`SELECT * FROM notes`);

    if (!dbUser) {
      return { cachedUser: null, cachedFolders: [], cachedNotes: [] };
    }

    const cachedData = {
      cachedUser: dbUser,
      cachedFolders: dbFolders,
      cachedNotes: dbNotes,
    };
    return cachedData;
  } catch (err) {
    console.log(
      "Error fetching user, folders or notes from localSQLite DB inside grabFromDatabase method: ",
    );
    console.log(err);
    return { cachedUser: null, cachedFolders: [], cachedNotes: [] };
  }
};

export const replaceLocalCache = async (
  data,
  db,
  cachedPreferences = DEFAULT_PREFERENCES,
) => {
  if (!db || !data?.user) {
    console.log("Invalid database or server data");
    return false;
  }

  const { user, folders = [], notes = [] } = data;
  if (!Array.isArray(folders) || !Array.isArray(notes) ||
      !user.userId || !user.username || !user.email || !user.createdAt) {
    return false;
  }

  try {
    // Exclusive transaction ensures that deletes and inserts are atomic.
    // Do not swallow insertion errors: a failure must roll back everything.
    await db.withExclusiveTransactionAsync(async (tx) => {
      const pending = await tx.getFirstAsync("SELECT COUNT(*) AS count FROM note_save_outbox");
      if (pending?.count > 0) throw new Error("Pending local note changes");
      await tx.runAsync("DELETE FROM notes");
      await tx.runAsync("DELETE FROM folders");
      await tx.runAsync("DELETE FROM user");
      await tx.runAsync(
        "INSERT INTO user (userId, username, email, createdAt, preferences) VALUES (?, ?, ?, ?, ?)",
        [user.userId, user.username, user.email, user.createdAt, JSON.stringify(cachedPreferences)],
      );
      for (const folder of folders) {
        await tx.runAsync(
          "INSERT INTO folders (folderid, title, color, parentFolderId) VALUES (?, ?, ?, ?)",
          [folder.folderid, folder.title, folder.color, folder.parentFolderId ?? null],
        );
      }
      for (const note of notes) {
        await tx.runAsync(
          `INSERT INTO notes (noteid, title, locked, htmlText, folderId, createdAt, updated, trashed)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [note.noteid, note.title, Boolean(note.locked), note.htmlText ?? "",
            note.folderId ?? null, note.createdAt, note.updated, Boolean(note.trashed)],
        );
      }
    });
    return true;
  } catch (err) {
    console.log("Error replacing local SQLite cache:", err);
    return false;
  }
};

export const removeFoldersFromDb = async (db, foldersToRemove) => {
  try {
    foldersToRemove.forEach(async (fold) => {
      await db.runAsync(
        `
            DELETE FROM folders WHERE folderid = $deleteid
          `,
        { $deleteId: fold.folderid },
      );
    });
  } catch (err) {
    console.log(`Error removing folder from local DB. Error: ${err}`);
  }
};

export const removeNotesFromDb = async (db, notesToRemove) => {
  try {
    notesToRemove.forEach(async (note) => {
      await db.runAsync(
        `
            DELETE FROM notes WHERE noteid = $deleteid
          `,
        { $deleteId: note.noteid },
      );
    });
  } catch (err) {
    console.log(`Errors removing notes from localDB. Error: ${err}`);
  }
};

export const deleteDatabase = async (db) => {
  try {
    await db.closeAsync();
    await SQLite.deleteDatabaseAsync("localstore");
    console.log("Database deleted successfully.");
  } catch (error) {
    console.error("Error deleting database:", error);
  }
};
