import { deleteAFolder, deleteANote } from "./api";

const inFlight = new Set();

// Deleting the same resource again is safe when the server treats an already
// absent resource as deleted. A 404 is acknowledged as already gone.
export const retryPendingDeletions = async ({ db, token, onError }) => {
  const pending = await db.getAllAsync("SELECT kind, itemid FROM deletion_outbox");
  for (const { kind, itemid } of pending) {
    const key = `${kind}:${itemid}`;
    if (inFlight.has(key)) continue;
    inFlight.add(key);
    try {
      if (kind === "folder") await deleteAFolder(token, itemid);
      else if (kind === "note") await deleteANote(token, itemid);
      else throw new Error("Unknown deletion type");
      await db.runAsync("DELETE FROM deletion_outbox WHERE kind = ? AND itemid = ?", [kind, itemid]);
    } catch (error) {
      if (error?.response?.status === 404) {
        await db.runAsync("DELETE FROM deletion_outbox WHERE kind = ? AND itemid = ?", [kind, itemid]);
      } else {
        onError?.(error, { kind, itemid });
      }
    } finally {
      inFlight.delete(key);
    }
  }
};
