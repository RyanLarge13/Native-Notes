import { useState, useRef, memo } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Pressable,
  Text,
} from "react-native";
import { createNewNote, updateNote } from "../utils/api";
import { useNavigate } from "react-router-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import WebView from "react-native-webview";
import EditorHTML from "../webView/html.js";
import renderEditor from "../webView/editHTML";

const NewNote = memo(({ folder, token, setAllData, note }) => {
  const [title, setTitle] = useState(note ? note.title : "");
  const [selected, setSelected] = useState([]);
  const navigate = useNavigate();
  const webviewRef = useRef();

  const handleFormat = (format) => {
    const newSelected = [...selected, format];
    setSelected(newSelected);
    webviewRef.current?.postMessage(format);
  };

  const onMessage = (event) => {
    const receivedData = event.nativeEvent.data;
    saveNote(receivedData);
  };

  const saveNote = (content) => {
    if (note) {
      const updatedNote = {
        notesId: note.noteid,
        title: title,
        htmlNotes: content,
        locked: note.locked, 
        folderId: folder ? folder.folderid : null
      };
      return updateNote(token, updatedNote)
        .then((res) => {
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
          navigate("/");
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          console.log("Finished updating");
        });
    }
    const newNote = {
      folderId: folder ? folder.folderid : null,
      title: title,
      htmlNotes: content,
    };
    createNewNote(token, newNote)
      .then((res) => {
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
        navigate("/");
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        console.log("new note uploaded");
      });
  };

  return (
    <>
      <KeyboardAvoidingView style={styles.container}>
        <TextInput
          style={styles.title}
          placeholder="Title"
          value={title}
          placeholderTextColor="#aaa"
          onChangeText={(titleText) => setTitle(titleText)}
        />
        <Pressable style={styles.save} onPress={() => handleFormat("html")}>
          <Text>Save</Text>
        </Pressable>
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
    </>
  );
});

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
    paddingVertical: 10,
    marginBottom: 25,
    fontSize: 25,
    color: "#fff",
  },
  save: {
    padding: 10,
    borderRadius: 10,
    elevation: 2,
    backgroundColor: "#fcd34d",
    marginBottom: 15,
    width: 100,
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
