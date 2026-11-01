import { authenticateDevice, authorizeNoteOpen } from "../utils/authGuards";
import * as LocalAuthentication from "expo-local-authentication";

jest.mock("expo-local-authentication", () => ({
  authenticateAsync: jest.fn(),
}));

describe("device authentication is fail closed", () => {
  beforeEach(() => jest.clearAllMocks());

  test("only explicit success grants access", async () => {
    LocalAuthentication.authenticateAsync.mockResolvedValue({ success: true });
    expect(await authenticateDevice()).toBe(true);
    LocalAuthentication.authenticateAsync.mockResolvedValue({ success: false, error: "authentication_failed" });
    expect(await authenticateDevice()).toBe(false);
  });

  test.each([{ success: false, error: "user_cancel" }, { success: false, error: "system_cancel" }, {}, null])(
    "canceled or malformed result cannot grant access: %p", async result => {
      LocalAuthentication.authenticateAsync.mockResolvedValue(result);
      expect(await authenticateDevice()).toBe(false);
    },
  );

  test("native errors deny access", async () => {
    const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
    LocalAuthentication.authenticateAsync.mockRejectedValue(new Error("Unavailable"));
    expect(await authenticateDevice()).toBe(false);
    warning.mockRestore();
  });

  test("unlocked notes open without prompting", async () => {
    const auth = jest.fn();
    expect(await authorizeNoteOpen({ noteid: 1, locked: false }, auth)).toBe(true);
    expect(auth).not.toHaveBeenCalled();
  });

  test("locked notes require explicit authentication success on every attempt", async () => {
    const auth = jest.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const note = { noteid: 2, locked: true };
    expect(await authorizeNoteOpen(note, auth)).toBe(false);
    expect(await authorizeNoteOpen(note, auth)).toBe(true);
    expect(await authorizeNoteOpen(note, auth)).toBe(false);
    expect(auth).toHaveBeenCalledTimes(3);
  });

  test("missing note cannot be opened", async () => {
    expect(await authorizeNoteOpen(null)).toBe(false);
  });
});
