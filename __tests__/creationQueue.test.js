import { createNewFolder, createNewNote } from "../utils/api";
import { classifyCreateFailure, requireCreatedId, sendStagedCreation } from "../utils/creationQueue";
jest.mock("../utils/api", () => ({ createNewFolder: jest.fn(), createNewNote: jest.fn() }));

test.each([
  [{ response: { status: 500 } }, "http_500"],
  [{ request: {}, code: "ERR_NETWORK" }, "no_response"],
  [{ code: "ECONNABORTED" }, "no_response"],
  [{ kind: "malformed_response" }, "malformed_response"],
])("classifies creation failure without conflating HTTP and network failures", (error, expected) => {
  expect(classifyCreateFailure(error)).toBe(expected);
});

test("validates created folder and note identifiers", () => {
  expect(requireCreatedId({ data: { data: [{ folderid: 19 }] } }, "folder")).toBe(19);
  expect(requireCreatedId({ data: { data: [{ notesid: 20 }] } }, "note")).toBe(20);
  expect(() => requireCreatedId({ data: { data: [{}] } }, "folder")).toThrow();
  expect(() => requireCreatedId(undefined, "note")).toThrow();
});

test("folder creation with HTTP 500 is retained and cannot POST again", async () => {
  const state = new Map([[-10, "pending"]]);
  const db = {
    runAsync: jest.fn(async (_sql, args) => {
      if (args[0] !== "sent" && args[0] !== "http_500") return { changes: 0 };
      if (args[0] === "sent" && state.get(args[2]) !== "pending") return { changes: 0 };
      state.set(args[2], args[0]);
      return { changes: 1 };
    }),
  };
  createNewFolder.mockReset().mockRejectedValue({ response: { status: 500 } });
  const onSuccess = jest.fn(), onError = jest.fn();
  const job = { db, kind: "folder", itemid: -10, token: "test", payload: { title: "New" }, onSuccess, onError };
  expect(await sendStagedCreation(job)).toBe(false);
  expect(state.get(-10)).toBe("http_500");
  expect(await sendStagedCreation(job)).toBe(false);
  expect(createNewFolder).toHaveBeenCalledTimes(1);
  expect(onSuccess).not.toHaveBeenCalled();
  expect(onError).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: "http_500" }));
});
