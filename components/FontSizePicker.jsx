import { Text, StyleSheet, View, Pressable, TextInput } from "react-native";
import React, { useEffect, useState } from "react";

const PRESET_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60];

const MIN_FONT_SIZE = 5;
const MAX_FONT_SIZE = 120;

const FontSizePicker = ({ fontSize, sendEditorCommand, darkMode, theme }) => {
  const [customSize, setCustomSize] = useState(String(fontSize ?? 16));

  const accent = theme?.on ? theme.color : "#fcd34d";

  const colors = {
    background: darkMode ? "#171717" : "#ffffff",
    secondary: darkMode ? "#262626" : "#f2f2f2",
    pressed: darkMode ? "#363636" : "#e5e5e5",
    border: darkMode ? "#343434" : "#dedede",
    text: darkMode ? "#f5f5f5" : "#222222",
    muted: darkMode ? "#a3a3a3" : "#737373",
  };

  useEffect(() => {
    if (fontSize != null) {
      setCustomSize(String(fontSize));
    }
  }, [fontSize]);

  const applySize = (size) => {
    const numericSize = Number(size);

    if (!Number.isFinite(numericSize)) {
      return;
    }

    const safeSize = Math.min(
      MAX_FONT_SIZE,
      Math.max(MIN_FONT_SIZE, numericSize),
    );

    setCustomSize(String(safeSize));

    sendEditorCommand("font-size", safeSize);
  };

  const handleCustomChange = (value) => {
    // Only allow digits.
    const cleaned = value.replace(/[^0-9]/g, "");
    setCustomSize(cleaned);
  };

  const applyCustomSize = () => {
    if (!customSize) return;

    applySize(customSize);
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
        <Text
          style={[
            styles.title,
            {
              color: colors.muted,
            },
          ]}
        >
          FONT SIZE
        </Text>

        <Text
          style={[
            styles.currentSize,
            {
              color: accent,
            },
          ]}
        >
          {fontSize ?? 16}
        </Text>
      </View>

      {/* CUSTOM SIZE */}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.secondary,
            borderColor: colors.border,
          },
        ]}
      >
        <TextInput
          value={fontSize}
          onChangeText={handleCustomChange}
          onSubmitEditing={applyCustomSize}
          keyboardType="number-pad"
          selectTextOnFocus
          maxLength={6}
          style={[
            styles.input,
            {
              color: colors.text,
            },
          ]}
        />

        <Pressable
          onPress={applyCustomSize}
          style={({ pressed }) => [
            styles.applyButton,
            {
              backgroundColor: pressed ? colors.pressed : accent + "25",
            },
          ]}
        >
          <Text
            style={[
              styles.applyText,
              {
                color: accent,
              },
            ]}
          >
            Apply
          </Text>
        </Pressable>
      </View>

      {/* PRESETS */}

      <Text
        style={[
          styles.sectionLabel,
          {
            color: colors.muted,
          },
        ]}
      >
        PRESETS
      </Text>

      <View style={styles.grid}>
        {PRESET_SIZES.map((size) => {
          const selected = Number(fontSize) === size;

          return (
            <Pressable
              key={size}
              onPress={() => applySize(size)}
              style={({ pressed }) => [
                styles.sizeButton,
                {
                  backgroundColor: selected
                    ? accent + "25"
                    : pressed
                      ? colors.pressed
                      : colors.secondary,

                  borderColor: selected ? accent : "transparent",
                },
              ]}
            >
              <Text
                style={[
                  styles.sizeText,
                  {
                    color: selected ? accent : colors.text,
                  },
                ]}
              >
                {size}
              </Text>
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

    width: 270,

    padding: 12,

    borderWidth: 1,
    borderRadius: 16,

    elevation: 10,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 10,

    zIndex: 200,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    paddingHorizontal: 4,
    marginBottom: 10,
  },

  title: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },

  currentSize: {
    fontSize: 12,
    fontWeight: "700",
  },

  inputContainer: {
    height: 46,

    flexDirection: "row",
    alignItems: "center",

    borderWidth: 1,
    borderRadius: 11,

    paddingLeft: 12,
    paddingRight: 5,

    marginBottom: 14,
  },

  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    paddingVertical: 0,
  },

  px: {
    fontSize: 12,
    marginRight: 8,
  },

  applyButton: {
    height: 34,

    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: 12,

    borderRadius: 8,
  },

  applyText: {
    fontSize: 12,
    fontWeight: "700",
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,

    marginLeft: 4,
    marginBottom: 7,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",

    gap: 6,
  },

  sizeButton: {
    width: 56,
    height: 38,

    justifyContent: "center",
    alignItems: "center",

    borderWidth: 1,
    borderRadius: 9,
  },

  sizeText: {
    fontSize: 13,
    fontWeight: "600",
  },
});

export default FontSizePicker;
