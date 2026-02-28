import React from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import Ripple from "react-native-material-ripple";
import { RenderHTMLSource } from "react-native-render-html";
import { useNavigate } from "react-router-native";
import * as LocalAuthentication from "expo-local-authentication";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const Note = React.memo(
  ({ note, setOpen, setNote, view, index, width, darkMode, theme }) => {
    const navigate = useNavigate();
    const htmlToRender = note?.htmlText?.slice(0, 200) + " ..." || "";

    const openNote = () => {
      if (note.locked) {
        LocalAuthentication.authenticateAsync({})
          .then((res) => {
            if (!res.success) {
              console.log("Failed auth");
            }
            if (res.success) {
              setNote(note);
              navigate("/newnote");
            }
          })
          .catch((err) => {
            console.log(err);
          });
      }
      if (!note.locked) {
        setNote(note);
        navigate("/newnote");
      }
    };

    const openSettings = () => {
      setOpen({ show: true, item: note, type: "note" });
    };

    return (
      <Animated.View
        style={[
          styles.note,
          {
            width: view ? "45%" : "100%",
            height: view ? 100 : 200,
            backgroundColor: darkMode ? "#222" : "#EEE",
          },
        ]}
      >
        <Ripple
          onPress={() => openNote()}
          onLongPress={() => openSettings()}
          rippleColor="#fff"
          rippleOpacity={0.9}
          style={[
            styles.note,
            {
              width: "100%",
              height: "100%",
              elevation: 0,
            },
          ]}
        >
          <Text
            style={{
              fontSize: view ? 14 : 25,
              color: darkMode ? "#fff" : "#000",
            }}
          >
            {note.title}
          </Text>
          <Text style={styles.date}>
            {new Date(note.createdAt).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Text>
          <View>
            {!note.locked ? (
              <RenderHTMLSource
                contentWidth={width}
                source={{ html: htmlToRender }}
              />
            ) : null}
          </View>
        </Ripple>
        {note.locked ? (
          <View style={styles.locked}>
            <MaterialCommunityIcons name="lock" style={styles.red} />
          </View>
        ) : null}
        <View style={styles.drag}>
          <MaterialCommunityIcons
            name="drag"
            style={[
              theme.on
                ? { color: theme.color }
                : darkMode
                  ? styles.white
                  : styles.black,
              { fontSize: 20 },
            ]}
          />
        </View>
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  note: {
    padding: 7,
    borderRadius: 10,
    elevation: 2,
    overflow: "hidden",
    position: "relative",
  },
  date: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 5,
  },
  white: {
    color: "#fff",
  },
  black: {
    color: "#000",
  },
  red: {
    color: "#fc534d",
    fontSize: 20,
  },
  locked: {
    position: "absolute",
    bottom: 5,
    left: 5,
  },
  drag: {
    display: "none",
    position: "absolute",
    padding: 20,
    top: -15,
    right: -15,
  },
});

export default Note;
