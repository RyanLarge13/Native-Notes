import { createNewNote, updateNote } from "./api";
import { classifyCreateFailure, requireCreatedId } from "./creationQueue";

// One worker per note. The newest pending snapshot replaces older unsent snapshots.
// The worker lives at module scope, not in the editor component.
const workers = new Map();
const localWrites = new Map();
const createWorkers = new Map();
const createWrites = new Map();
const deletingNotes = new Set();
const activeRequests = new Map();
export const markNotesDeleting = ids => ids.forEach(id => deletingNotes.add(id));
export const unmarkNotesDeleting = ids => ids.forEach(id => deletingNotes.delete(id));
export const waitForNoteWrites = async ids => Promise.all(ids.map(async id => {
  await localWrites.get(id)?.catch(() => {});
  await createWrites.get(id)?.catch(() => {});
}));
export const waitForNoteRequests = async ids => Promise.all(ids.map(id => activeRequests.get(id)?.catch(() => {})));


// SQLite noteid is INTEGER. Negative IDs are reserved for unsynced local notes.
export const makeTemporaryNoteId = () => -Math.floor(Math.random() * 2000000000 + 1);

export const enqueueNoteSave = ({ note, token, db, setAllData, onError }) => {
  if (!note?.noteid) throw new Error("Existing note ID required");
  const id = note.noteid;
  if (deletingNotes.has(id)) return;
  let worker = workers.get(id);
  if (!worker) {
    worker = { pending: null, running: false };
    workers.set(id, worker);
  }
  worker.pending = { note: { ...note }, token, db, setAllData, onError };
  if (!worker.running) void drain(id, worker);
};

const drain = async (id, worker) => {
  worker.running = true;
  try {
    while (worker.pending && !deletingNotes.has(id)) {
      const job = worker.pending;
      worker.pending = null;
      try {
        if (deletingNotes.has(id)) break;
        const deleted = await job.db.getFirstAsync?.("SELECT 1 AS present FROM deletion_outbox WHERE kind = ? AND itemid = ?", ["note", id]);
        if (deleted) break;
        const request = updateNote(job.token, {
          notesId: id,
          title: job.note.title,
          htmlNotes: job.note.htmlText,
          locked: job.note.locked,
          folderId: job.note.folderId,
          update: new Date(job.note.updated),
        });
        activeRequests.set(id, request);
        const response = await request;
        if (!response?.data?.data?.[0]) throw new Error("Invalid save response");
        // Do not replace the local snapshot with an older server response.
        // Clear only the outbox revision that was actually acknowledged.
        await job.db.runAsync(
          "DELETE FROM note_save_outbox WHERE noteid = ? AND updated = ?",
          [id, job.note.updated],
        );
      } catch (error) {
        if (deletingNotes.has(id)) break;
        console.error("Note sync failed; retained locally for retry:", error);
        job.onError?.(error);
        // A newer snapshot may already be waiting; attempt that one once.
        // Otherwise leave the durable outbox for a later retry.
        if (!worker.pending) break;
      } finally {
        activeRequests.delete(id);
      }
    }
  } finally {
    worker.running = false;
    workers.delete(id);
  }
};

export const saveExistingNoteLocally = async ({ db, note, token, setAllData, onError }) => {
  // Serialize local writes for the same note, too: SQLite operations may
  // otherwise finish out of order when the user edits rapidly.
  if (deletingNotes.has(note.noteid)) return;
  const previous = localWrites.get(note.noteid) || Promise.resolve();
  let saved = false;
  const write = previous.catch(() => {}).then(() =>
    db.withExclusiveTransactionAsync(async (tx) => {
      if (deletingNotes.has(note.noteid)) return;
      const tombstone = await tx.getFirstAsync("SELECT 1 AS present FROM deletion_outbox WHERE kind = ? AND itemid = ?", ["note", note.noteid]);
      if (tombstone) return;
      await tx.runAsync(
        `UPDATE notes SET title = ?, htmlText = ?, locked = ?, folderId = ?, updated = ?
         WHERE noteid = ?`,
        [note.title, note.htmlText, note.locked, note.folderId, note.updated, note.noteid],
      );
      await tx.runAsync(
        `INSERT INTO note_save_outbox (noteid, updated)
         VALUES (?, ?) ON CONFLICT(noteid) DO UPDATE SET updated = excluded.updated`,
        [note.noteid, note.updated],
      );
      saved = true;
    }),
  );
  localWrites.set(note.noteid, write);
  try {
    await write;
  } finally {
    if (localWrites.get(note.noteid) === write) localWrites.delete(note.noteid);
  }
  if (!saved || deletingNotes.has(note.noteid)) return;
  setAllData(prev => ({
    ...prev,
    notes: prev.notes.map(item => item.noteid === note.noteid ? note : item),
  }));
  enqueueNoteSave({ note, token, db, setAllData, onError });
};

export const retryPendingNoteSaves = async ({ db, token, setAllData, onError }) => {
  const rows = await db.getAllAsync(
    `SELECT n.* FROM notes n INNER JOIN note_save_outbox q ON n.noteid = q.noteid`,
  );
  // Temporary IDs need server-side idempotency/reconciliation before retry.
  rows.filter(note => note.noteid > 0 && !deletingNotes.has(note.noteid)).forEach(note => enqueueNoteSave({ note, token, db, setAllData, onError }));
};


// New notes keep a stable local identity until the server returns its ID.
// Create is sent at most once per live process; ambiguous failures require
// explicit reconciliation before retry to avoid duplicate server notes.
export const saveNewNoteLocally = async ({ db, note, token, setAllData, onError }) => {
  const id = note.noteid;
  if (deletingNotes.has(id)) return;
  if (!Number.isInteger(id) || id >= 0) throw new Error("Temporary negative note ID required");
  const previous = createWrites.get(id) || Promise.resolve();
  const write = previous.catch(() => {}).then(() => db.withExclusiveTransactionAsync(async tx => {
    await tx.runAsync(
      `INSERT INTO notes (noteid, title, locked, htmlText, folderId, createdAt, updated, trashed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(noteid) DO UPDATE SET title=excluded.title, htmlText=excluded.htmlText, updated=excluded.updated`,
      [id, note.title, note.locked ?? false, note.htmlText, note.folderId, note.createdAt, note.updated, note.trashed ?? false],
    );
    await tx.runAsync(
      `INSERT INTO note_save_outbox (noteid, updated) VALUES (?, ?)
       ON CONFLICT(noteid) DO UPDATE SET updated=excluded.updated`,
      [id, note.updated],
    );
    await tx.runAsync("INSERT OR IGNORE INTO creation_outbox (kind, itemid, status) VALUES (?, ?, 'pending')", ["note", id]);
  }));
  createWrites.set(id, write);
  try { await write; }
  finally { if (createWrites.get(id) === write) createWrites.delete(id); }
  setAllData(prev => ({
    ...prev,
    notes: prev.notes.some(n => n.noteid === id)
      ? prev.notes.map(n => n.noteid === id ? note : n)
      : [...prev.notes, note],
  }));
  enqueueNewNoteCreate({ db, note, token, setAllData, onError });
};

export const enqueueNewNoteCreate = ({ db, note, token, setAllData, onError }) => {
  const id = note.noteid;
  let worker = createWorkers.get(id);
  if (worker) {
    worker.latest = { db, note, token, setAllData, onError };
    return;
  }
  worker = { latest: { db, note, token, setAllData, onError } };
  createWorkers.set(id, worker);
  void (async () => {
    const first = worker.latest;
    try {
      if (deletingNotes.has(id)) return;
      // Read latest locally committed snapshot just before sending create.
      const local = await db.getFirstAsync("SELECT * FROM notes WHERE noteid = ?", [id]);
      if (!local || deletingNotes.has(id)) return;
      const queued = await db.getFirstAsync("SELECT status FROM creation_outbox WHERE kind = ? AND itemid = ?", ["note", id]);
      if (queued?.status !== "pending") return;
      await db.runAsync("UPDATE creation_outbox SET status = ? WHERE kind = ? AND itemid = ?", ["sent", "note", id]);
      const res = await createNewNote(token, {
        folderId: local.folderId, title: local.title, htmlNotes: local.htmlText,
      });
      const serverId = requireCreatedId(res, "note");
      // Wait for all already-scheduled local writes before swapping IDs.
      await createWrites.get(id)?.catch(() => {});
      // Atomically replace the local ID, preserving any edits made while
      // the create request was in flight.
      await db.withExclusiveTransactionAsync(async tx => {
        await tx.runAsync("UPDATE notes SET noteid = ? WHERE noteid = ?", [serverId, id]);
        await tx.runAsync("DELETE FROM creation_outbox WHERE kind = ? AND itemid = ?", ["note", id]);
        await tx.runAsync("DELETE FROM note_save_outbox WHERE noteid = ?", [id]);
        await tx.runAsync(
          `INSERT INTO note_save_outbox (noteid, updated)
           SELECT noteid, updated FROM notes WHERE noteid = ?`,
          [serverId],
        );
      });
      setAllData(prev => ({
        ...prev,
        notes: Array.from(new Map(prev.notes.map(n => {
          const mapped = n.noteid === id ? { ...n, noteid: serverId } : n;
          return [mapped.noteid, mapped];
        })).values()),
      }));
      const newest = await db.getFirstAsync("SELECT * FROM notes WHERE noteid = ?", [serverId]);
      // Always update with the latest local snapshot: it may differ from
      // the original POST body. The existing-note queue handles serialization.
      if (newest) enqueueNoteSave({ ...worker.latest, note: newest });
    } catch (error) {
      const status = classifyCreateFailure(error);
      await db.runAsync("UPDATE creation_outbox SET status = ? WHERE kind = ? AND itemid = ?", [status, "note", id]);
      console.error("New note creation pending reconciliation (" + status + "):", error);
      first.onError?.(error);
      // Do not retry POST automatically: the server may have created the note
      // even when the client lost its response.
    } finally {
      createWorkers.delete(id);
    }
  })();
};
