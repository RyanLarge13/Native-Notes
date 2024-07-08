import { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Pressable,
  Animated,
  Text,
} from "react-native";
import { createNewNote, updateNote } from "../utils/api";
import { useNavigate } from "react-router-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import WebView from "react-native-webview";
import EditorHTML from "../webView/html.js";
import renderEditor from "../webView/editHTML";

const NewNote = ({ folder, token, setAllData, note, setNote, SQLite }) => {
  const [title, setTitle] = useState(note ? note.title : "");
  const [selected, setSelected] = useState([]);
  const [closed, setClosed] = useState(false);
  const navigate = useNavigate();
  const webviewRef = useRef();

  const opacityAni = useRef(new Animated.Value(0)).current;
  const transYAni = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAni, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(transYAni, {
        toValue: 0,
        tension: 150,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
    if (closed) {
      Animated.parallel([
        Animated.timing(opacityAni, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(transYAni, {
          toValue: 500,
          tension: 150,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [closed]);

  const handleFormat = (format) => {
    const newSelected = [...selected, format];
    setSelected(newSelected);
    webviewRef.current?.postMessage(format);
  };

  const onMessage = (event) => {
    const receivedData = event.nativeEvent.data;
    saveNote(receivedData);
  };

  const saveNote = async (content) => {
    const db = await SQLite.openDatabaseAsync("localstore");
    setClosed(true);
    if (note) {
      const updatedNote = {
        notesId: note.noteid,
        title: title,
        htmlNotes: content,
        locked: note.locked,
        folderId: folder ? folder.folderid : null,
      };
      updateNote(token, updatedNote)
        .then(async (res) => {
          const resNote = res.data.data[0];
          const noteToPush = {
            title: resNote.title,
            createdAt: resNote.createdat,
            noteid: resNote.notesid,
            htmlText: resNote.htmlnotes,
            locked: resNote.locked,
            folderId: resNote.folderid,
          };
          setAllData((prevUser) => {
            const newNotes = prevUser.notes.filter(
              (note) => note.noteid !== resNote.notesid
            );
            newNotes.push(noteToPush);
            const newData = {
              ...prevUser,
              notes: newNotes,
            };
            return newData;
          });
          await db.runAsync(
            `UPDATE notes SET title = ?, htmlText = ?, locked = ?, folderId = ? WHERE noteid = ?`,
            [
              resNote.title,
              resNote.htmlnotes,
              resNote.locked,
              resNote.folderid,
              resNote.notesid,
            ]
          );
          navigate("/");
          setNote(null);
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          console.log("Finished updating");
        });
      return;
    } else {
      const newNote = {
        folderId: folder ? folder.folderid : null,
        title: title,
        htmlNotes: content,
      };
      createNewNote(token, newNote)
        .then(async (res) => {
          const resNote = res.data.data[0];
          const noteToPush = {
            title: resNote.title,
            createdAt: resNote.createdat,
            noteid: resNote.notesid,
            htmlText: resNote.htmlnotes,
            folderId: resNote.folderid,
          };
          setAllData((prevUser) => {
            const newData = {
              ...prevUser,
              notes: [...prevUser.notes, noteToPush],
            };
            return newData;
          });
          await db.runAsync(
            `INSERT INTO notes (noteid, title, locked, htmlText, folderId, createdAt,
    updated, trashed) VALUES (?,?,?,?,?,?,?,?)`,
            resNote.notesid,
            resNote.title,
            resNote.locked,
            resNote.htmlnotes,
            resNote.folderid,
            resNote.createdat,
            resNote.updated,
            resNote.trashed
          );
          navigate("/");
          setNote(null);
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          console.log("new note uploaded");
        });
    }
  };

  return (
    <Animated.View
      style={[styles.container, { opacity: opacityAni, translateY: transYAni }]}
    >
      <KeyboardAvoidingView style={styles.container}>
        <View style={styles.saveInputContainer}>
          <TextInput
            style={styles.title}
            placeholder="Title"
            value={title}
            placeholderTextColor="#aaa"
            onChangeText={(titleText) => setTitle(titleText)}
          />
          <Pressable style={styles.save} onPress={() => handleFormat("html")}>
            <Icon name="save" />
          </Pressable>
        </View>
        <WebView
          ref={webviewRef}
          style={styles.editor}
          javaScriptEnabled={true}
          source={{ html: note ? renderEditor(note.htmlText) : EditorHTML }}
          onMessage={onMessage}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("WebView error: ", nativeEvent);
          }}
        />
        <View style={styles.controlBar}>
          <Pressable onPress={() => handleFormat("heading")} style={styles.btn}>
            <Icon
              name="heading"
              style={[
                styles.white,
                selected.includes("heading") && styles.selected,
              ]}
            />
          </Pressable>
          <Pressable onPress={() => handleFormat("bold")} style={styles.btn}>
            <Icon name="bold" style={styles.white} />
          </Pressable>
          <Pressable onPress={() => handleFormat("italic")} style={styles.btn}>
            <Icon name="italic" style={styles.white} />
          </Pressable>
          <Pressable
            onPress={() => handleFormat("underline")}
            style={styles.btn}
          >
            <Icon name="underline" style={styles.white} />
          </Pressable>
          <Text style={styles.seperator}> | </Text>
          <Pressable
            onPress={() => handleFormat("alignLeft")}
            style={styles.btn}
          >
            <Icon name="align-left" style={styles.white} />
          </Pressable>
          <Pressable
            onPress={() => handleFormat("alignCenter")}
            style={styles.btn}
          >
            <Icon name="align-center" style={styles.white} />
          </Pressable>
          <Pressable
            onPress={() => handleFormat("alignRight")}
            style={styles.btn}
          >
            <Icon name="align-right" style={styles.white} />
          </Pressable>
          <Text style={styles.seperator}> | </Text>
          <Pressable onPress={() => handleFormat("list")} style={styles.btn}>
            <Icon name="list" style={styles.white} />
          </Pressable>
          <Pressable onPress={() => handleFormat("undo")} style={styles.btn}>
            <Icon name="undo" style={styles.white} />
          </Pressable>
          <Pressable onPress={() => handleFormat("redo")} style={styles.btn}>
            <Icon name="redo" style={styles.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 25,
    color: "#fff",
  },
  saveInputContainer: {
    padding: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    border: "#eee",
  },
  save: {
    padding: 6,
    borderRadius: 2,
    elevation: 2,
    backgroundColor: "#fcd34d",
  },
  editor: {
    flex: 1,
    color: "#fff",
    textAlignVertical: "top",
    backgroundColor: "#000",
  },
  controlBar: {
    position: "absolute",
    bottom: 0,
    right: 0,
    left: 0,
    paddingVertical: 10,
    paddingRight: 50,
    paddingLeft: 10,
    backgroundColor: "#111",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 10,
  },
  btn: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 2,
    elevation: 2,
    backgroundColor: "#555",
  },
  selected: {
    borderWidth: 3,
    borderEndColor: "#fff",
  },
  white: {
    color: "#fff",
    fontSize: 17,
  },
  seperator: {
    color: "#aaa",
  },
});

export default NewNote;
