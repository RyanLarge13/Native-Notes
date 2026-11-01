import { createNewFolder, createNewNote } from "./api";

// An HTTP error is not a lost response. Both are recorded without blindly
// repeating POST, since the server may have committed before reporting failure.
export const classifyCreateFailure = error => {
  if (error?.response?.status != null) return "http_" + error.response.status;
  if (error?.kind === "malformed_response") return "malformed_response";
  if (error?.request || error?.code === "ECONNABORTED" || error?.code === "ERR_NETWORK")
    return "no_response";
  return "unknown";
};

export const requireCreatedId = (response, kind) => {
  const row = response?.data?.data?.[0];
  const value = kind === "note" ? row?.notesid : row?.folderid;
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    const error = new Error("Invalid " + kind + " creation response");
    error.kind = "malformed_response";
    throw error;
  }
  return id;
};

// 'pending' means not yet dispatched. 'sent' is persisted BEFORE POST,
// so a crash or lost response can never cause an automatic duplicate POST.
export const stageCreation = async (db, kind, itemid) => {
  await db.runAsync(
    "INSERT OR IGNORE INTO creation_outbox (kind, itemid, status) VALUES (?, ?, 'pending')",
    [kind, itemid],
  );
};
export const markCreationSent = async (db, kind, itemid) => {
  const result = await db.runAsync(
    "UPDATE creation_outbox SET status = 'sent' WHERE kind = ? AND itemid = ? AND status = 'pending'",
    [kind, itemid],
  );
  return result?.changes === 1;
};
export const markCreationUncertain = async (db, kind, itemid, status) => {
  await db.runAsync(
    "UPDATE creation_outbox SET status = ? WHERE kind = ? AND itemid = ?",
    [status, kind, itemid],
  );
};
export const clearCreation = async (tx, kind, itemid) => {
  await tx.runAsync("DELETE FROM creation_outbox WHERE kind = ? AND itemid = ?", [kind, itemid]);
};
export const pendingCreations = db => db.getAllAsync(
  "SELECT kind, itemid, status FROM creation_outbox ORDER BY kind, itemid",
);

// Replays only never-dispatched creations. 'sent', HTTP failures and malformed
// responses require reconciliation, not another blind POST.
export const sendStagedCreation = async ({ db, kind, itemid, token, payload, onSuccess, onError }) => {
  if (!await markCreationSent(db, kind, itemid)) return false;
  try {
    const response = kind === "note"
      ? await createNewNote(token, payload)
      : await createNewFolder(token, payload);
    const serverId = requireCreatedId(response, kind);
    await onSuccess(serverId);
    return true;
  } catch (error) {
    const status = classifyCreateFailure(error);
    await markCreationUncertain(db, kind, itemid, status);
    onError?.(error, { kind, itemid, status });
    return false;
  }
};
