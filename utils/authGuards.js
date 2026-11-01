import * as LocalAuthentication from "expo-local-authentication";

// A canceled, rejected, or malformed authentication result is never permission.
export const authenticateDevice = async (options = {}) => {
  try {
    const result = await LocalAuthentication.authenticateAsync(options);
    return result?.success === true;
  } catch (error) {
    console.warn("Device authentication unavailable:", error);
    return false;
  }
};

export const authorizeNoteOpen = async (note, authenticate = authenticateDevice) => {
  if (!note) return false;
  if (!note.locked) return true;
  return (await authenticate({ promptMessage: "Unlock note", cancelLabel: "Cancel" })) === true;
};
