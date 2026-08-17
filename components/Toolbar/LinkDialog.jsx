import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Keyboard,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { FontAwesome5 } from "@expo/vector-icons";

const LinkDialog = ({
  setLinkDialogShow,
  formatState,
  sendEditorCommand,
  darkMode,
  theme,
}) => {
  const [linkText, setLinkText] = useState(formatState?.selectedText ?? "");
  const [url, setUrl] = useState("");
  const [hadSelection, setHadSelection] = useState(false);

  const urlInputRef = useRef(null);

  const accent = theme?.on ? theme.color : "#fcd34d";

  const colors = {
    background: darkMode ? "#171717" : "#ffffff",
    secondary: darkMode ? "#262626" : "#f2f2f2",
    pressed: darkMode ? "#363636" : "#e5e5e5",
    border: darkMode ? "#343434" : "#dedede",
    text: darkMode ? "#f5f5f5" : "#222222",
    muted: darkMode ? "#a3a3a3" : "#737373",
    danger: "#ef4444",
  };

  const closeDialog = () => {
    Keyboard.dismiss();
    setLinkDialogShow(false);
  };

  const normalizeURL = (value) => {
    const trimmed = value.trim();

    if (!trimmed) return "";

    // Keep URLs that already contain a protocol.
    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) {
      return trimmed;
    }

    // Make ordinary website addresses useful automatically.
    return `https://${trimmed}`;
  };

  const createLink = () => {
    const cleanURL = normalizeURL(url);
    const cleanText = linkText.trim();

    if (!cleanURL) {
      return;
    }

    /*
     * We send both values regardless of whether there
     * was originally a selection.
     *
     * This makes the WebView API much nicer:
     *
     * {
     *   command: "create-link",
     *   value: {
     *     text: "OpenAI",
     *     url: "https://openai.com",
     *     hadSelection: true
     *   }
     * }
     */
    sendEditorCommand("create-link", {
      text: cleanText || cleanURL,
      url: cleanURL,
      hadSelection,
    });

    closeDialog();
  };

  const canSubmit = url.trim().length > 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      {/* HEADER */}

      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <View
            style={[
              styles.headerIcon,
              {
                backgroundColor: accent + "20",
              },
            ]}
          >
            <FontAwesome5 name="link" size={13} color={accent} />
          </View>

          <View>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                },
              ]}
            >
              Add Link
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.muted,
                },
              ]}
            >
              Link text to a webpage
            </Text>
          </View>
        </View>

        <Pressable
          hitSlop={8}
          onPress={closeDialog}
          style={({ pressed }) => [
            styles.closeButton,
            {
              backgroundColor: pressed ? colors.pressed : "transparent",
            },
          ]}
        >
          <FontAwesome5 name="times" size={15} color={colors.muted} />
        </Pressable>
      </View>

      {/* LINK TEXT */}

      <View style={styles.field}>
        <Text
          style={[
            styles.label,
            {
              color: colors.muted,
            },
          ]}
        >
          TEXT
        </Text>

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
            },
          ]}
        >
          <FontAwesome5
            name="font"
            size={13}
            color={colors.muted}
            style={styles.inputIcon}
          />

          <TextInput
            value={linkText}
            onChangeText={setLinkText}
            placeholder="Text to display"
            placeholderTextColor={colors.muted}
            selectionColor={accent}
            returnKeyType="next"
            onSubmitEditing={() => {
              urlInputRef.current?.focus();
            }}
            style={[
              styles.input,
              {
                color: colors.text,
              },
            ]}
          />
        </View>

        {hadSelection && (
          <Text
            style={[
              styles.helperText,
              {
                color: colors.muted,
              },
            ]}
          >
            Using your selected text
          </Text>
        )}
      </View>

      {/* URL */}

      <View style={styles.field}>
        <Text
          style={[
            styles.label,
            {
              color: colors.muted,
            },
          ]}
        >
          URL
        </Text>

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
            },
          ]}
        >
          <FontAwesome5
            name="globe"
            size={13}
            color={colors.muted}
            style={styles.inputIcon}
          />

          <TextInput
            ref={urlInputRef}
            value={url}
            onChangeText={setUrl}
            placeholder="https://example.com"
            placeholderTextColor={colors.muted}
            selectionColor={accent}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="done"
            onSubmitEditing={createLink}
            style={[
              styles.input,
              {
                color: colors.text,
              },
            ]}
          />
        </View>
      </View>

      {/* ACTIONS */}

      <View style={styles.actions}>
        <Pressable
          onPress={closeDialog}
          style={({ pressed }) => [
            styles.cancelButton,
            {
              backgroundColor: pressed ? colors.pressed : "transparent",
            },
          ]}
        >
          <Text
            style={[
              styles.cancelText,
              {
                color: colors.muted,
              },
            ]}
          >
            Cancel
          </Text>
        </Pressable>

        <Pressable
          disabled={!canSubmit}
          onPress={createLink}
          style={({ pressed }) => [
            styles.addButton,
            {
              backgroundColor: !canSubmit
                ? colors.secondary
                : pressed
                  ? accent + "40"
                  : accent + "25",

              borderColor: !canSubmit ? colors.border : accent,
            },
          ]}
        >
          <FontAwesome5
            name="link"
            size={12}
            color={canSubmit ? accent : colors.muted}
          />

          <Text
            style={[
              styles.addText,
              {
                color: canSubmit ? accent : colors.muted,
              },
            ]}
          >
            Add Link
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 60,
    right: 0,

    width: 310,

    padding: 14,

    borderWidth: 1,
    borderRadius: 16,

    elevation: 12,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,

    zIndex: 300,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    marginBottom: 18,
  },

  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  headerIcon: {
    width: 34,
    height: 34,

    borderRadius: 9,

    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 15,
    fontWeight: "700",
  },

  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },

  closeButton: {
    width: 32,
    height: 32,

    borderRadius: 8,

    justifyContent: "center",
    alignItems: "center",
  },

  field: {
    marginBottom: 14,
  },

  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,

    marginLeft: 4,
    marginBottom: 6,
  },

  inputContainer: {
    minHeight: 45,

    flexDirection: "row",
    alignItems: "center",

    borderWidth: 1,
    borderRadius: 10,

    paddingHorizontal: 11,
  },

  inputIcon: {
    marginRight: 9,
  },

  input: {
    flex: 1,

    fontSize: 14,
    paddingVertical: 10,
  },

  helperText: {
    fontSize: 10,
    marginTop: 5,
    marginLeft: 4,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",

    gap: 7,
    marginTop: 2,
  },

  cancelButton: {
    height: 38,

    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: 13,
    borderRadius: 9,
  },

  cancelText: {
    fontSize: 12,
    fontWeight: "600",
  },

  addButton: {
    height: 38,

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    gap: 7,

    paddingHorizontal: 14,

    borderWidth: 1,
    borderRadius: 9,
  },

  addText: {
    fontSize: 12,
    fontWeight: "700",
  },
});

export default LinkDialog;
