import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import React from "react";
import { FontAwesome5 } from "@expo/vector-icons";

const FONT_FAMILIES = [
  {
    label: "System Default",
    value: "System Default",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  },
  {
    label: "Sans Serif",
    value: "Sans Serif",
    fontFamily: undefined,
  },
  {
    label: "Arial",
    value: "Arial, sans-serif",
    fontFamily: "Arial",
  },
  {
    label: "Helvetica",
    value: "Helvetica, Arial, sans-serif",
    fontFamily: "Helvetica",
  },
  {
    label: "Georgia",
    value: "Georgia, serif",
    fontFamily: "Georgia",
  },
  {
    label: "Times New Roman",
    value: "'Times New Roman', Times, serif",
    fontFamily: "Times New Roman",
  },
  {
    label: "Verdana",
    value: "Verdana, sans-serif",
    fontFamily: "Verdana",
  },
  {
    label: "Trebuchet",
    value: "'Trebuchet MS', sans-serif",
    fontFamily: "Trebuchet MS",
  },
  {
    label: "Courier New",
    value: "'Courier New', monospace",
    fontFamily: "Courier New",
  },
  {
    label: "Monospace",
    value: "monospace",
    fontFamily: "monospace",
  },
  {
    label: "Serif",
    value: "serif",
    fontFamily: "serif",
  },
];

const FontFamilyDialog = ({
  setFontFamilyDialogOpen,
  formatState,
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

  /*
   * Browsers sometimes report fonts with quotes,
   * different casing, or just the primary family.
   *
   * This gives us a reasonably forgiving comparison.
   */
  const normalizeFont = (font) => {
    if (!font) return "";

    return font.replace(/['"]/g, "").split(",")[0].trim().toLowerCase();
  };

  const currentFont = normalizeFont(formatState);

  const getSelected = (font) => {
    if (font.label === "Default" && !currentFont) {
      return true;
    }

    return (
      normalizeFont(font.value) === currentFont ||
      normalizeFont(font.fontFamily) === currentFont
    );
  };

  const selectFont = (font) => {
    sendEditorCommand("fontFamily", font.value);

    setFontFamilyDialogOpen(false);
  };

  const currentLabel =
    FONT_FAMILIES.find(getSelected)?.label ?? formatState ?? "Default";

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

      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View>
          <Text
            style={[
              styles.headerLabel,
              {
                color: colors.muted,
              },
            ]}
          >
            FONT FAMILY
          </Text>

          <Text
            numberOfLines={1}
            style={[
              styles.currentFont,
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
          onPress={() => setFontFamilyDialogOpen(false)}
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

      {/* FONT LIST */}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.fontList}
        showsVerticalScrollIndicator={false}
      >
        {FONT_FAMILIES.map((font) => {
          const selected = getSelected(font);

          return (
            <Pressable
              key={font.label}
              onPress={() => selectFont(font)}
              style={({ pressed }) => [
                styles.fontOption,
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
              <View style={styles.fontContent}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.fontName,
                    {
                      color: selected ? accent : colors.text,

                      fontFamily: font.fontFamily,
                    },
                  ]}
                >
                  {font.label}
                </Text>

                <Text
                  numberOfLines={1}
                  style={[
                    styles.preview,
                    {
                      color: colors.muted,

                      fontFamily: font.fontFamily,
                    },
                  ]}
                >
                  The quick brown fox
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",

    bottom: 60,
    right: 0,

    width: 285,
    maxHeight: 410,

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

    marginBottom: 5,
  },

  headerLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.9,

    marginBottom: 2,
  },

  currentFont: {
    fontSize: 14,
    fontWeight: "600",

    maxWidth: 200,
  },

  closeButton: {
    width: 30,
    height: 30,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 8,
  },

  scrollView: {
    flexGrow: 0,
  },

  fontList: {
    gap: 3,
    paddingBottom: 2,
  },

  fontOption: {
    minHeight: 60,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 11,
    paddingVertical: 7,

    borderWidth: 1,
    borderRadius: 10,
  },

  fontContent: {
    flex: 1,
    justifyContent: "center",
  },

  fontName: {
    fontSize: 15,
  },

  preview: {
    fontSize: 10,
    marginTop: 3,
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

export default FontFamilyDialog;
