import { updateNote } from "./api";

// One worker per note. The newest pending snapshot replaces older unsent snapshots.
// The worker lives at module scope, not in the editor component.
const workers = new Map();
const localWrites = new Map();

export const enqueueNoteSave = ({ note, token, db, setAllData, onError }) => {
  if (!note?.noteid) throw new Error("Existing note ID required");
  const id = note.noteid;
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
    while (worker.pending) {
      const job = worker.pending;
      worker.pending = null;
      try {
        const response = await updateNote(job.token, {
          notesId: id,
          title: job.note.title,
          htmlNotes: job.note.htmlText,
          locked: job.note.locked,
          folderId: job.note.folderId,
          update: new Date(job.note.updated),
        });
        if (!response?.data?.data?.[0]) throw new Error("Invalid save response");
        // Do not replace the local snapshot with an older server response.
        // Clear only the outbox revision that was actually acknowledged.
        await job.db.runAsync(
          "DELETE FROM note_save_outbox WHERE noteid = ? AND updated = ?",
          [id, job.note.updated],
        );
      } catch (error) {
        console.error("Note sync failed; retained locally for retry:", error);
        job.onError?.(error);
        // The durable outbox remains intact for the next retry.
        break;
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
  const previous = localWrites.get(note.noteid) || Promise.resolve();
  const write = previous.catch(() => {}).then(() =>
    db.withExclusiveTransactionAsync(async (tx) => {
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
    }),
  );
  localWrites.set(note.noteid, write);
  try {
    await write;
  } finally {
    if (localWrites.get(note.noteid) === write) localWrites.delete(note.noteid);
  }
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
  rows.forEach(note => enqueueNoteSave({ note, token, db, setAllData, onError }));
};
