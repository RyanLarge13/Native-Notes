import { View, Text, Pressable, StyleSheet } from "react-native";
import React from "react";
import { FontAwesome5 } from "@expo/vector-icons";

const BLOCK_TYPES = [
  {
    label: "Title",
    value: 1,
    name: "h1",
    type: "heading",
    description: "Main note heading",
    fontSize: 22,
    fontWeight: "700",
  },
  {
    label: "Normal",
    value: "p",
    name: "p",
    type: "paragraph",
    description: "Regular body text",
    fontSize: 15,
    fontWeight: "400",
  },
  {
    label: "Heading 1",
    value: 2,
    name: "h2",
    type: "heading",
    description: "Primary section",
    fontSize: 19,
    fontWeight: "700",
  },
  {
    label: "Heading 2",
    value: 3,
    name: "h3",
    type: "heading",
    description: "Secondary section",
    fontSize: 17,
    fontWeight: "600",
  },
  {
    label: "Heading 3",
    value: 4,
    name: "h4",
    type: "heading",
    description: "Small section",
    fontSize: 15,
    fontWeight: "600",
  },
];

const BlockTypeDialog = ({
  setBlockTypeDialogOpen,
  formatState,
  mapBlockTypeToString,
  sendEditorCommand,
  darkMode,
  theme,
}) => {
  const accent = theme?.on ? theme.color : "#fcd34d";

  const colors = {
    background: darkMode ? "#171717" : "#ffffff",

    secondary: darkMode ? "#262626" : "#f2f2f2",

    pressed: darkMode ? "#363636" : "#e5e5e5",

    border: darkMode ? "#343434" : "#dedede",

    text: darkMode ? "#f5f5f5" : "#222222",

    muted: darkMode ? "#a3a3a3" : "#737373",
  };

  const currentBlock = formatState?.blockType ?? "p";

  const currentLabel = mapBlockTypeToString(currentBlock);

  const selectBlockType = (type, value) => {
    console.log(type, value);
    sendEditorCommand(type, value);

    setBlockTypeDialogOpen(false);
  };

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
        <View>
          <Text
            style={[
              styles.headerLabel,
              {
                color: colors.muted,
              },
            ]}
          >
            TEXT STYLE
          </Text>

          <Text
            style={[
              styles.currentStyle,
              {
                color: colors.text,
              },
            ]}
          >
            {currentLabel}
          </Text>
        </View>

        <Pressable
          hitSlop={8}
          onPress={() => setBlockTypeDialogOpen(false)}
          style={({ pressed }) => [
            styles.closeButton,
            {
              backgroundColor: pressed ? colors.pressed : "transparent",
            },
          ]}
        >
          <FontAwesome5 name="times" size={14} color={colors.muted} />
        </Pressable>
      </View>

      {/* OPTIONS */}

      <View style={styles.options}>
        {BLOCK_TYPES.map((item) => {
          const selected = currentBlock === item.name;

          return (
            <Pressable
              key={item.value}
              onPress={() => selectBlockType(item.type, item.value)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: selected
                    ? accent + "18"
                    : pressed
                      ? colors.pressed
                      : "transparent",

                  borderColor: selected ? accent : "transparent",
                },
              ]}
            >
              {/* TEXT PREVIEW */}

              <View style={styles.optionContent}>
                <Text
                  numberOfLines={1}
                  style={{
                    color: selected ? accent : colors.text,

                    fontSize: item.fontSize,

                    fontWeight: item.fontWeight,
                  }}
                >
                  {item.label}
                </Text>

                <Text
                  style={[
                    styles.description,
                    {
                      color: colors.muted,
                    },
                  ]}
                >
                  {item.description}
                </Text>
              </View>

              {/* SELECTED INDICATOR */}

              <View
                style={[
                  styles.radio,
                  {
                    borderColor: selected ? accent : colors.border,
                  },
                ]}
              >
                {selected && (
                  <View
                    style={[
                      styles.radioInner,
                      {
                        backgroundColor: accent,
                      },
                    ]}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",

    bottom: 60,
    right: 0,

    width: 285,

    padding: 12,

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
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 4,
    paddingBottom: 10,

    borderBottomWidth: StyleSheet.hairlineWidth,

    borderBottomColor: "rgba(128,128,128,0.25)",

    marginBottom: 6,
  },

  headerLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.9,

    marginBottom: 2,
  },

  currentStyle: {
    fontSize: 14,
    fontWeight: "600",
  },

  closeButton: {
    width: 30,
    height: 30,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 8,
  },

  options: {
    gap: 3,
  },

  option: {
    minHeight: 58,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 11,
    paddingVertical: 7,

    borderWidth: 1,
    borderRadius: 10,
  },

  optionContent: {
    flex: 1,
    justifyContent: "center",
  },

  description: {
    fontSize: 10,
    marginTop: 2,
  },

  radio: {
    width: 17,
    height: 17,

    borderWidth: 1.5,
    borderRadius: 9,

    alignItems: "center",
    justifyContent: "center",

    marginLeft: 10,
  },

  radioInner: {
    width: 8,
    height: 8,

    borderRadius: 4,
  },
});

export default BlockTypeDialog;
