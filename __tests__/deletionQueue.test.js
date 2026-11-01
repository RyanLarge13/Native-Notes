import { retryPendingDeletions } from "../utils/deletionQueue";
import { deleteAFolder, deleteANote } from "../utils/api";

jest.mock("../utils/api", () => ({ deleteAFolder: jest.fn(), deleteANote: jest.fn() }));

const makeDb = (rows) => {
  const pending = [...rows];
  return {
    pending,
    getAllAsync: jest.fn(async () => [...pending]),
    runAsync: jest.fn(async (_sql, [kind, id]) => {
      const index = pending.findIndex(row => row.kind === kind && row.itemid === id);
      if (index >= 0) pending.splice(index, 1);
    }),
  };
};

beforeEach(() => jest.clearAllMocks());

test("acknowledges successful folder and note deletions", async () => {
  const db = makeDb([{ kind: "folder", itemid: 3 }, { kind: "note", itemid: 7 }]);
  deleteAFolder.mockResolvedValue({});
  deleteANote.mockResolvedValue({});
  await retryPendingDeletions({ db, token: "token" });
  expect(deleteAFolder).toHaveBeenCalledWith("token", 3);
  expect(deleteANote).toHaveBeenCalledWith("token", 7);
  expect(db.pending).toEqual([]);
});

test("server failure leaves deletion queued for next retry", async () => {
  const db = makeDb([{ kind: "note", itemid: 9 }]);
  const error = new Error("offline");
  const onError = jest.fn();
  deleteANote.mockRejectedValueOnce(error).mockResolvedValueOnce({});
  await retryPendingDeletions({ db, token: "token", onError });
  expect(db.pending).toHaveLength(1);
  expect(onError).toHaveBeenCalledWith(error, { kind: "note", itemid: 9 });
  await retryPendingDeletions({ db, token: "token" });
  expect(db.pending).toEqual([]);
});

test("already-deleted server resource (404) is acknowledged", async () => {
  const db = makeDb([{ kind: "folder", itemid: 4 }]);
  deleteAFolder.mockRejectedValue({ response: { status: 404 } });
  await retryPendingDeletions({ db, token: "token" });
  expect(db.pending).toEqual([]);
});

test("unknown deletion type is not silently discarded", async () => {
  const db = makeDb([{ kind: "other", itemid: 2 }]);
  const onError = jest.fn();
  await retryPendingDeletions({ db, token: "token", onError });
  expect(db.pending).toHaveLength(1);
  expect(onError).toHaveBeenCalledTimes(1);
});
