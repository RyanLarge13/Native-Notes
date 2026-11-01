import { shouldSkipNoteSave } from "../utils/noteSaveGuard";

describe("note saving race conditions", () => {
  test("does not send an unchanged existing note again", () => {
    expect(shouldSkipNoteSave({
      saving: false, hasExistingNote: true, htmlChanged: false, titleChanged: false,
    })).toBe(true);
  });

  test("allows a changed note when no save is pending", () => {
    expect(shouldSkipNoteSave({
      saving: false, hasExistingNote: true, htmlChanged: true, titleChanged: false,
    })).toBe(false);
  });

  test("REGRESSION: edits made while a request is pending must not be discarded", () => {
    // Reproduce: autosave begins for version A, then the user types version B
    // and presses Save or closes the editor before A's response arrives.
    // This should schedule/retain B rather than silently skipping the request.
    expect(shouldSkipNoteSave({
      saving: true, hasExistingNote: true, htmlChanged: true, titleChanged: false,
    })).toBe(false);
  });
});
