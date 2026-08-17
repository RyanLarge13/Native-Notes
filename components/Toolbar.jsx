import { StyleSheet, ScrollView, Pressable, View, Text } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import ColorPicker from "./ColorPicker";
import FontSizePicker from "./FontSizePicker";
import LinkDialog from "./Toolbar/LinkDialog";
import BlockTypeDialog from "./Toolbar/blockTypeDialog";
import FontFamilyDialog from "./Toolbar/FontFamilyDialog";

const Toolbar = ({ webviewRef, darkMode, theme, formatState }) => {
  const [fontColor, setFontColor] = useState(false);
  const [fontHighlight, setFontHighlight] = useState(false);

  // UI Pop ups
  const [insertOptions, setInsertOptions] = useState(false);
  const [fontSize, setFontSize] = useState(false);
  const [textOptions, setTextOptions] = useState(false);
  const [linkDialogShow, setLinkDialogShow] = useState(false);
  const [blockTypeDialogOpen, setBlockTypeDialogOpen] = useState(false);
  const [fontFamilyDialogOpen, setFontFamilyDialogOpen] = useState(false);

  const accent = theme?.on ? theme.color : "#fcd34d";

  const colors = {
    background: darkMode ? "#171717" : "#ffffff",
    secondary: darkMode ? "#262626" : "#f2f2f2",
    pressed: darkMode ? "#363636" : "#e5e5e5",
    border: darkMode ? "#343434" : "#dedede",
    text: darkMode ? "#f5f5f5" : "#222222",
    muted: darkMode ? "#a3a3a3" : "#737373",
  };

  const sendEditorCommand = (command, value = null) => {
    webviewRef.current?.postMessage(
      JSON.stringify({
        command,
        value,
      }),
    );
  };

  const closePanels = (except = null) => {
    if (except !== "text") setTextOptions(false);
    if (except !== "color") setFontColor(false);
    if (except !== "highlight") setFontHighlight(false);
    if (except !== "size") setFontSize(false);
    if (except !== "insert") setInsertOptions(false);
  };

  const togglePanel = (panel) => {
    const setters = {
      text: [textOptions, setTextOptions],
      color: [fontColor, setFontColor],
      highlight: [fontHighlight, setFontHighlight],
      size: [fontSize, setFontSize],
      insert: [insertOptions, setInsertOptions],
    };

    const [currentValue, setter] = setters[panel];

    closePanels(panel);
    setter(!currentValue);
  };

  const ToolButton = ({
    icon,
    command,
    value = null,
    onPress,
    active = false,
    label,
  }) => (
    <Pressable
      onPress={onPress || (() => sendEditorCommand(command, value))}
      hitSlop={5}
      style={({ pressed }) => [
        styles.toolButton,
        {
          backgroundColor: active
            ? accent + "25"
            : pressed
              ? colors.pressed
              : "transparent",
        },
      ]}
    >
      {label ? (
        <Text
          style={[
            styles.buttonLabel,
            {
              color: active ? accent : colors.text,
            },
          ]}
        >
          {label}
        </Text>
      ) : null}

      {icon ? (
        <FontAwesome5
          name={icon}
          style={[
            styles.icon,
            {
              color: active ? accent : colors.text,
            },
          ]}
        />
      ) : null}
    </Pressable>
  );

  const Divider = () => (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: colors.border,
        },
      ]}
    />
  );

  const mapBlockTypeToString = (blockType) => {
    switch (blockType) {
      case "p":
        return "Normal";
      case "h1":
        return "Title";
      case "h2":
        return "H2";
      case "h3":
        return "H3";
      case "h4":
        return "H4";
      default:
        blockType;
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* SECONDARY FORMATTING PANEL */}

      {textOptions && (
        <View
          style={[
            styles.optionsContainer,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.optionSection}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>
              STYLE
            </Text>

            <View style={styles.optionRow}>
              <ToolButton
                icon="bold"
                command="bold"
                active={formatState.bold}
              />
              <ToolButton
                icon="italic"
                command="italic"
                active={formatState.italic}
              />
              <ToolButton
                icon="underline"
                command="underline"
                active={formatState.underline}
              />
              <ToolButton
                icon="strikethrough"
                command="strikeThrough"
                active={formatState.strikethrough}
              />
              <ToolButton icon="eraser" command="clearFormatting" />
            </View>
          </View>

          <View
            style={[
              styles.horizontalDivider,
              { backgroundColor: colors.border },
            ]}
          />

          <View style={styles.optionSection}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>
              ALIGNMENT
            </Text>

            <View style={styles.optionRow}>
              <ToolButton
                icon="align-left"
                command="alignLeft"
                active={formatState.alignLeft}
              />
              <ToolButton
                icon="align-center"
                command="alignCenter"
                active={formatState.alignCenter}
              />
              <ToolButton
                icon="align-right"
                command="alignRight"
                active={formatState.alignRight}
              />
            </View>
          </View>

          <View
            style={[
              styles.horizontalDivider,
              { backgroundColor: colors.border },
            ]}
          />

          <View style={styles.optionSection}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>
              LISTS
            </Text>

            <View style={styles.optionRow}>
              <ToolButton
                icon="list-ol"
                command="ol"
                active={formatState.orderedList}
              />
              <ToolButton
                icon="list-ul"
                command="ul"
                active={formatState.unorderedList}
              />
              <ToolButton
                icon="tasks"
                command="check"
                active={formatState.checkList}
              />
            </View>
          </View>

          <View
            style={[
              styles.horizontalDivider,
              { backgroundColor: colors.border },
            ]}
          />

          <View style={styles.optionSection}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>
              INDENT
            </Text>

            <View style={styles.optionRow}>
              <ToolButton icon="outdent" command="outdent" />
              <ToolButton icon="indent" command="indent" />
            </View>
          </View>
        </View>
      )}

      {/* COLOR PICKER */}

      {fontColor && (
        <ColorPicker
          setState={setFontColor}
          initialColor="#FFFFFF"
          onSelectColor={(color) => {
            sendEditorCommand("color", color);
          }}
        />
      )}

      {/* HIGHLIGHT PICKER */}

      {fontHighlight && (
        <ColorPicker
          setState={setFontHighlight}
          initialColor="#FFFFFF"
          onSelectColor={(color) => {
            sendEditorCommand("highlight", color);
          }}
          title="Text Highlight"
        />
      )}

      {/* INSERT OPTIONS */}

      {insertOptions && (
        <View
          style={[
            styles.optionsContainer,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>
            INSERT
          </Text>

          <View style={styles.optionRow}>
            <ToolButton
              icon="link"
              command="createLink"
              active={linkDialogShow}
            />
            <ToolButton
              icon="quote-right"
              command="blockquote"
              active={formatState.blockType === "blockquote"}
            />
            <ToolButton
              icon="code"
              command="codeBlock"
              active={formatState.blockType === "code"}
            />
            <ToolButton icon="minus" command="horizontalRule" />
          </View>
        </View>
      )}

      {/* FONT SIZE PICKER */}

      {fontSize && (
        <FontSizePicker
          fontSize={formatState.fontSize}
          sendEditorCommand={sendEditorCommand}
          darkMode={darkMode}
          theme={theme}
        />
      )}

      {/* LINK DIALOG */}
      {linkDialogShow ? (
        <LinkDialog
          setLinkDialogShow={setLinkDialogShow}
          formatState={formatState}
          sendEditorCommand={sendEditorCommand}
          darkMode={darkMode}
          theme={theme}
        />
      ) : null}

      {/* BLOCK TYPE DIALOG */}

      {blockTypeDialogOpen ? (
        <BlockTypeDialog
          setBlockTypeDialogOpen={setBlockTypeDialogOpen}
          formatState={formatState}
          mapBlockTypeToString={mapBlockTypeToString}
          sendEditorCommand={sendEditorCommand}
          darkMode={darkMode}
          theme={theme}
        />
      ) : null}

      {/* FONT FAMILY DIALOG */}

      {fontFamilyDialogOpen ? (
        <FontFamilyDialog
          setFontFamilyDialogOpen={setFontFamilyDialogOpen}
          formatState={formatState.fontName}
          sendEditorCommand={sendEditorCommand}
          darkMode={darkMode}
          theme={theme}
        />
      ) : null}

      {/* MAIN TOOLBAR */}

      <View
        style={[
          styles.toolbar,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
        >
          {/* History */}

          <View style={styles.group}>
            <ToolButton icon="undo" command="undo" />
            <ToolButton icon="redo" command="redo" />
          </View>

          <Divider />

          {/* Formatting */}

          <View style={styles.group}>
            <ToolButton
              icon="text-height"
              active={textOptions}
              onPress={() => togglePanel("text")}
            />

            <ToolButton
              icon="font"
              active={fontColor}
              onPress={() => togglePanel("color")}
            />

            <ToolButton
              icon="highlighter"
              active={fontHighlight}
              onPress={() => togglePanel("highlight")}
            />
          </View>

          <Divider />

          {/* Headings and block information */}
          <ToolButton
            label={mapBlockTypeToString(formatState.blockType) || "Normal"}
            active={blockTypeDialogOpen}
            onPress={() => setBlockTypeDialogOpen((prev) => !prev)}
          />
          <ToolButton
            label={"H1"}
            active={formatState.blockType === "h2"}
            onPress={() => sendEditorCommand("heading", "h2")}
          />
          <ToolButton
            label={"H2"}
            active={formatState.blockType === "h3"}
            onPress={() => sendEditorCommand("heading", "h3")}
          />
          <ToolButton
            label={"H3"}
            active={formatState.blockType === "h4"}
            onPress={() => sendEditorCommand("heading", "h4")}
          />

          <Divider />

          {/* Font Family */}
          <ToolButton
            label={formatState.fontName}
            active={fontFamilyDialogOpen}
            onPress={() => setFontFamilyDialogOpen((prev) => !prev)}
          />

          <Divider />

          {/* Font Size */}

          <Pressable
            onPress={() => togglePanel("size")}
            style={({ pressed }) => [
              styles.fontSizeButton,
              {
                backgroundColor: fontSize
                  ? accent + "25"
                  : pressed
                    ? colors.pressed
                    : colors.secondary,
              },
            ]}
          >
            <Text
              style={[
                styles.fontSizeText,
                {
                  color: fontSize ? accent : colors.text,
                },
              ]}
            >
              {formatState.fontSize}
            </Text>

            <FontAwesome5
              name="chevron-down"
              size={10}
              color={fontSize ? accent : colors.muted}
            />
          </Pressable>

          <Divider />

          <ToolButton
            icon="plus"
            active={insertOptions}
            onPress={() => togglePanel("insert")}
          />

          <ToolButton icon="eraser" command="clearFormatting" />
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    position: "relative",
  },

  toolbar: {
    height: 52,
    borderWidth: 1,
    borderRadius: 16,
    elevation: 6,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },

  scrollContent: {
    paddingHorizontal: 6,
    alignItems: "center",
  },

  group: {
    flexDirection: "row",
    alignItems: "center",
  },

  toolButton: {
    width: 42,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  icon: {
    fontSize: 17,
  },

  buttonLabel: {
    fontSize: 14,
    fontWeight: "600",
  },

  divider: {
    width: 1,
    height: 25,
    marginHorizontal: 5,
  },

  fontSizeButton: {
    minWidth: 58,
    height: 36,
    paddingHorizontal: 11,
    marginHorizontal: 3,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  fontSizeText: {
    fontSize: 14,
    fontWeight: "600",
  },

  optionsContainer: {
    position: "absolute",
    bottom: 60,
    left: 0,

    minWidth: 190,

    paddingVertical: 8,
    paddingHorizontal: 8,

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

    zIndex: 100,
  },

  optionSection: {
    paddingVertical: 4,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginLeft: 7,
    marginBottom: 3,
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  horizontalDivider: {
    height: 1,
    marginHorizontal: 6,
    marginVertical: 3,
  },
});

export default Toolbar;
