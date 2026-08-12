import { StyleSheet, ScrollView, Pressable, View, Text } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useState } from "react";
import ColorPicker from "./ColorPicker";
import FontSizePicker from "./FontSizePicker";

const Toolbar = ({ webviewRef, darkMode, theme }) => {
  const [selected, setSelected] = useState([]);
  const [fontColor, setFontColor] = useState(false);
  const [fontHighlight, setFontHighlight] = useState(false);
  const [fontSize, setFontSize] = useState(false);
  const [fontSizeState, setFontSizeState] = useState(12);

  /*
    TODO:
        1. Implement these features in webview
               * checklists
  */

  const sendEditorCommand = (command, value) => {
    webViewRef.current?.postMessage(
      JSON.stringify({
        command,
        value,
      }),
    );
  };

  return (
    <>
      {textOptions ? (
        <View style={[styles.optionsContainer]}>
          <View style={styles.selectGroup}>
            <Pressable
              onPress={() => sendEditorCommand("bold")}
              style={styles.btn}
            >
              <FontAwesome5
                name="bold"
                style={[styles.white, styles.iconSize]}
              />
            </Pressable>
            <Pressable
              onPress={() => sendEditorCommand("italic")}
              style={styles.btn}
            >
              <FontAwesome5
                name="italic"
                style={[styles.white, styles.iconSize]}
              />
            </Pressable>
            <Pressable
              onPress={() => sendEditorCommand("underline")}
              style={styles.btn}
            >
              <FontAwesome5
                name="underline"
                style={[styles.white, styles.iconSize]}
              />
            </Pressable>
          </View>
          <View style={styles.selectGroup}>
            <Pressable
              onPress={() => sendEditorCommand("alignLeft")}
              style={styles.btn}
            >
              <FontAwesome5
                name="align-left"
                style={[styles.white, styles.iconSize]}
              />
            </Pressable>
            <Pressable
              onPress={() => sendEditorCommand("alignCenter")}
              style={styles.btn}
            >
              <FontAwesome5
                name="align-center"
                style={[styles.white, styles.iconSize]}
              />
            </Pressable>
            <Pressable
              onPress={() => sendEditorCommand("alignRight")}
              style={styles.btn}
            >
              <FontAwesome5
                name="align-right"
                style={[styles.white, styles.iconSize]}
              />
            </Pressable>
          </View>
          <View style={styles.selectGroup}>
            <Pressable
              onPress={() => sendEditorCommand("ol")}
              style={styles.btn}
            >
              <FontAwesome5
                name="list-ol"
                style={[styles.white, styles.iconSize]}
              />
            </Pressable>
            <Pressable
              onPress={() => sendEditorCommand("ul")}
              style={styles.btn}
            >
              <FontAwesome5
                name="list-ul"
                style={[styles.white, styles.iconSize]}
              />
            </Pressable>
            <Pressable
              onPress={() => sendEditorCommand("check")}
              style={styles.btn}
            >
              <FontAwesome5
                name="list"
                style={[styles.white, styles.iconSize]}
              />
            </Pressable>
          </View>
          <View style={styles.selectGroup}>
            <Pressable
              onPress={() => sendEditorCommand("indent")}
              style={styles.btn}
            >
              <FontAwesome5
                name="indent"
                style={[styles.white, styles.iconSize]}
              />
            </Pressable>
            <Pressable
              onPress={() => sendEditorCommand("outdent")}
              style={styles.btn}
            >
              <FontAwesome5
                name="outdent"
                style={[styles.white, styles.iconSize]}
              />
            </Pressable>
          </View>
        </View>
      ) : null}
      {fontColor ? (
        <ColorPicker
          setState={setFontColor}
          initialColor="#FFFFFF"
          onSelectColor={(color) => {
            sendEditorCommand("foreColor", color);
          }}
        />
      ) : null}
      {fontSize ? (
        <FontSizePicker
          setFontSize={setSize}
          sendEditorCommand={sendEditorCommand}
        />
      ) : null}
      <ScrollView
        horizontal={true}
        style={[
          styles.container,
          { backgroundColor: darkMode ? "#000" : "#eee" },
        ]}
      >
        <Pressable
          onPress={() => sendEditorCommand("undo", null)}
          style={styles.btn}
        >
          <FontAwesome5 name="undo" style={[styles.white, styles.iconSize]} />
        </Pressable>
        <Pressable
          onPress={() => sendEditorCommand("redo", null)}
          style={styles.btn}
        >
          <FontAwesome5 name="redo" style={[styles.white, styles.iconSize]} />
        </Pressable>
        <Pressable onPress={() => (prev) => !prev} style={styles.btn}>
          <FontAwesome5
            name="text-height"
            style={[styles.white, styles.iconSize]}
          />
        </Pressable>
        <Pressable
          onPress={() => setFontColor((prev) => !prev)}
          style={styles.btn}
        >
          <FontAwesome5 name="font" style={[styles.white, styles.iconSize]} />
        </Pressable>
        <Pressable
          onPress={() => setFontHighlight((prev) => !prev)}
          style={styles.btn}
        >
          <FontAwesome5
            name="highlighter"
            style={[styles.white, styles.iconSize]}
          />
        </Pressable>
        <Pressable
          onPress={() => setFontSize((prev) => !prev)}
          style={[styles.btn, styles.row]}
        >
          <Text style={styles.white}>{fontSizeState}</Text>
          <FontAwesome5
            name="angle-down"
            style={[styles.white, styles.iconSize]}
          />
        </Pressable>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    flex: 1,
    bottom: 0,
    right: 0,
    left: 0,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  optionsContainer: {
    position: "absolute",
    bottom: 50,
    left: 0,
    padding: 10,
    backgroundColor: "#222",
    elevation: 5,
    borderRadius: 10,
  },
  selectGroup: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 10,
    backgroundColor: "#444",
  },
  row: {
    flexDirection: "row",
  },
  white: {
    color: "#fff",
  },
  iconSize: {
    fontSize: 18,
    marginHorizontal: 10,
  },
  btn: {
    padding: 10,
  },
});

export default Toolbar;
