import { StyleSheet, ScrollView, Pressable, View, Text } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useState } from "react";
import ColorPicker from "./ColorPicker";
import FontSizePicker from "./FontSizePicker";

const Toolbar = ({ webviewRef, darkMode, theme }) => {
  const [selected, setSelected] = useState([]);
  const [textOptions, setTextOptions] = useState(false);
  const [fontColor, setFontColor] = useState(false);
  const [fontHighlight, setFontHighlight] = useState(false);
  const [fontSize, setFontSize] = useState(false);
  const [fontSizeState, setFontSizeState] = useState(12);

  const handleFormat = (format, setState, value) => {
    console.log(
      `Handling format. check for fontsize type: ${format}. Value: ${value}`,
    );
    const newSelected = [...selected, format];
    setSelected(newSelected);
    if (setState) {
      setState();
    }
    if (format === "color" && value) {
      webviewRef.current?.postMessage({ command: "color", color: value });
      return;
    }
    if (format === "font-size") {
      console.log(
        `Format === font-size and now calling specific webviewRef command to update the fontsize. passing it in pixels value: ${value}`,
      );
      webviewRef.current?.postMessage({
        command: "font-size",
        size: `${value}px`,
      });
      console.log("Successfully called webviewRef.current.postMessage");
      console.log(webviewRef.current);
      return;
    }
    webviewRef.current?.postMessage(format);
  };

  const setSize = (size) => {
    console.log(
      `Set fontsize being called now in Toolbar component. Size: ${size}`,
    );
    setFontSizeState(size);
    handleFormat("font-size", setFontSize, size);
  };

  const closeView = (setState) => {
    setState(false);
  };

  /*
    TODO:
        1. Implement these features in webview
               * checklists
  */

  return (
    <>
      {textOptions ? (
        <View style={[styles.optionsContainer]}>
          <View style={styles.selectGroup}>
            <Pressable
              onPress={() => handleFormat("bold", setTextOptions)}
              style={styles.btn}
            >
              <FontAwesome5
                name="bold"
                style={[styles.white, styles.iconSize]}
              />
            </Pressable>
            <Pressable
              onPress={() => handleFormat("italic", setTextOptions)}
              style={styles.btn}
            >
              <FontAwesome5
                name="italic"
                style={[styles.white, styles.iconSize]}
              />
            </Pressable>
            <Pressable
              onPress={() => handleFormat("underline", setTextOptions)}
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
              onPress={() => handleFormat("alignLeft", setTextOptions)}
              style={styles.btn}
            >
              <FontAwesome5
                name="align-left"
                style={[styles.white, styles.iconSize]}
              />
            </Pressable>
            <Pressable
              onPress={() => handleFormat("alignCenter", setTextOptions)}
              style={styles.btn}
            >
              <FontAwesome5
                name="align-center"
                style={[styles.white, styles.iconSize]}
              />
            </Pressable>
            <Pressable
              onPress={() => handleFormat("alignRight", setTextOptions)}
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
              onPress={() => handleFormat("ol", setTextOptions)}
              style={styles.btn}
            >
              <FontAwesome5
                name="list-ol"
                style={[styles.white, styles.iconSize]}
              />
            </Pressable>
            <Pressable
              onPress={() => handleFormat("ul", setTextOptions)}
              style={styles.btn}
            >
              <FontAwesome5
                name="list-ul"
                style={[styles.white, styles.iconSize]}
              />
            </Pressable>
            <Pressable
              onPress={() => handleFormat("check", setTextOptions)}
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
              onPress={() => handleFormat("indent", setTextOptions)}
              style={styles.btn}
            >
              <FontAwesome5
                name="indent"
                style={[styles.white, styles.iconSize]}
              />
            </Pressable>
            <Pressable
              onPress={() => handleFormat("outdent", setTextOptions)}
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
      {fontColor ? <ColorPicker /> : null}
      {fontSize ? <FontSizePicker setFontSize={setSize} /> : null}
      <ScrollView
        horizontal={true}
        style={[
          styles.container,
          { backgroundColor: darkMode ? "#000" : "#eee" },
        ]}
      >
        <Pressable
          onPress={() => handleFormat("undo", null)}
          style={styles.btn}
        >
          <FontAwesome5 name="undo" style={[styles.white, styles.iconSize]} />
        </Pressable>
        <Pressable
          onPress={() => handleFormat("redo", null)}
          style={styles.btn}
        >
          <FontAwesome5 name="redo" style={[styles.white, styles.iconSize]} />
        </Pressable>
        <Pressable
          onPress={() => setTextOptions((prev) => !prev)}
          style={styles.btn}
        >
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
