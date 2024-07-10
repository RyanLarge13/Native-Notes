import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import Ripple from "react-native-material-ripple";
import RenderHtml from "react-native-render-html";
import { useNavigate } from "react-router-native";
import * as LocalAuthentication from "expo-local-authentication";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const customStyles = {
  body: { color: "#fff", fontSize: 12 },
};

const Note = ({ note, setOpen, setNote, view, index }) => {
  const navigate = useNavigate();

  const scaleAni = useRef(new Animated.Value(0)).current;

  const htmlToRender = note.htmlText.slice(0, 200) + " ...";

  useEffect(() => {
    Animated.spring(scaleAni, {
      toValue: 1,
      tension: 100,
      delay: 100 * index,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, []);

  const openNote = () => {
    if (note.locked) {
      LocalAuthentication.authenticateAsync({})
        .then((res) => {
          // res.success;
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
        })
        .finally(() => {
          console.log("Attempted fingerprint auth");
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
          transform: [{ scaleX: scaleAni }, { scaleY: scaleAni }],
        },
        view ? { width: "45%", height: 100 } : { width: "100%", height: 200 },
      ]}
    >
      <Ripple
        onPress={() => openNote()}
        onLongPress={() => openSettings()}
        rippleColor="#fff"
        rippleOpacity={0.9}
        style={[styles.note, { width: "100%", height: "100%", elevation: 0 }]}
      >
        <Text
          style={[styles.title, view ? { fontSize: 14 } : { fontSize: 25 }]}
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
            <RenderHtml
              contentWidth={200}
              source={{ html: htmlToRender }}
              tagsStyles={customStyles}
            />
          ) : null}
        </View>
      </Ripple>
      {note.locked ? (
        <View style={styles.locked}>
          <Icon name="lock" style={styles.red} />
        </View>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  note: {
    padding: 7,
    borderRadius: 10,
    backgroundColor: "#222",
    elevation: 2,
    overflow: "hidden",
    position: "relative",
  },
  title: {
    color: "#fff",
  },
  date: {
    color: "#aaa",
    fontSize: 12,
  },
  white: {
    color: "#fff",
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
});

export default Note;
