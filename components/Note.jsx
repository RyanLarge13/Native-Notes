import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Ripple from "react-native-material-ripple";
import { RenderHTMLSource } from "react-native-render-html";
import { useNavigate } from "react-router-native";
import * as LocalAuthentication from "expo-local-authentication";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const Note = React.memo(
  ({ note, setOpen, setNote, view, index, width, darkMode, theme }) => {
    const isPressed = useSharedValue(false);
    const offset = useSharedValue({ x: 0, y: 0 });

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

    const animatedDrag = useAnimatedStyle(() => {
      return {
        transform: [
          { translateX: offset.value.x },
          { translateY: offset.value.y },
          { scale: withSpring(isPressed.value ? 1.01 : 1) },
        ],
        backgroundColor: darkMode
          ? isPressed.value
            ? "#333"
            : "#222"
          : isPressed
          ? "#ddd"
          : "#ccc",
      };
    });

    const start = useSharedValue({ x: 0, y: 0 });
    const gesture = Gesture.Pan()
      .onBegin(() => {
        isPressed.value = true;
      })
      .onUpdate((e) => {
        offset.value = {
          x: e.translationX + start.value.x,
          y: e.translationY + start.value.y,
        };
      })
      .onEnd(() => {
        start.value = {
          x: offset.value.x,
          y: offset.value.y,
        };
      })
      .onFinalize(() => {
        isPressed.value = false;
        offset.value = {
          x: 0,
          y: 0,
        };
        start.value = {
          x: 0,
          y: 0,
        };
      });

    return (
      <Animated.View
        style={[
          styles.note,
          animatedDrag,
          view
            ? { width: "45%", height: 100 }
            : {
                width: "100%",
                height: 200,
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
            <Icon name="lock" style={styles.red} />
          </View>
        ) : null}
        <GestureDetector gesture={gesture}>
          <View style={styles.drag}>
            <Icon
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
        </GestureDetector>
      </Animated.View>
    );
  }
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
