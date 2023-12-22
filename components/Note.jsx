import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Ripple from "react-native-material-ripple";
import RenderHtml from "react-native-render-html";
import { useNavigate } from "react-router-native";
import * as LocalAuthentication from "expo-local-authentication";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const customStyles = {
  body: { color: "#fff", fontSize: 12 },
};

const Note = memo(({ note, setOpen, setNote, view }) => {
  const navigate = useNavigate();
  const htmlToRender = note.htmlText.slice(0, 60) + " ...";

  const openNote = () => {
    if (note.locked) {
      LocalAuthentication.authenticateAsync({})
        .then((res) => {
          const authenticated = res.success;
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
    <Ripple
      onPress={() => openNote()}
      onLongPress={() => openSettings()}
      rippleColor="#fff"
      rippleOpacity={0.9}
      style={[
        styles.note,
        view ? { width: "45%", height: 100 } : { width: "100%", height: 200 },
      ]}
    >
      <Text style={[styles.title, view ? { fontSize: 14 } : { fontSize: 25 }]}>
        {note.title}
      </Text>
      <Text style={styles.date}>
        {new Date(note.createdAt).toLocaleDateString()}
      </Text>
      <View style={styles.html}>
        {!note.locked && (
          <RenderHtml
            contentWidth={200}
            source={{ html: htmlToRender }}
            tagsStyles={customStyles}
          />
        )}
      </View>
      {note.locked && (
        <View style={styles.locked}>
          <Icon name="lock" style={styles.red} />
        </View>
      )}
    </Ripple>
  );
});

const styles = StyleSheet.create({
  note: {
    padding: 15,
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
  html: {
    marginTop: 25,
  },
  locked: {
    position: "absolute",
    bottom: 10,
    left: 10,
  },
});

export default Note;
