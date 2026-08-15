import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-native";
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Pressable,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
  BackHandler,
} from "react-native";
import { createNewNote, updateNote } from "../utils/api";
import { FontAwesome5 } from "@expo/vector-icons";
import WebView from "react-native-webview";
import EditorHTML from "../webView/html.js";
import renderEditor from "../webView/editHTML";
import Toolbar from "../components/Toolbar.jsx";

const NewNote = ({
  folder,
  token,
  setAllData,
  note,
  setNote,
  db,
  autoSave,
  theme,
  darkMode,
}) => {
  const [title, setTitle] = useState(note ? note.title : "");
  const [closed, setClosed] = useState(false);
  const [saving, setSaving] = useState(false);

  // Holds a list of format states to update toolbar
  const [formatState, setFormatState] = useState({});

  const navigate = useNavigate();
  const webviewRef = useRef();
  const webviewReady = useRef(false);
  const currentHTML = useRef(note?.htmlText ?? "");

  const opacityAni = useRef(new Animated.Value(0)).current;
  const transYAni = useRef(new Animated.Value(500)).current;

  const sendEditorCommand = (command, value) => {
    webviewRef.current?.postMessage(
      JSON.stringify({
        command,
        value,
      }),
    );
  };

  const handleFormat = (format) => {
    webviewRef.current?.postMessage(format);
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        closeNote();
        return true;
      },
    );

    return () => subscription.remove();
  }, [closed]);

  useEffect(() => {
    if (!autoSave || !note) return;

    const saveInterval = setInterval(() => {
      saveNote(currentHTML.current);
    }, 10000);

    return () => clearInterval(saveInterval);
  }, [autoSave, note]);

  const initializeEditor = () => {
    webviewReady.current = true;

    setWebViewTheme();

    if (note?.htmlText) {
      sendEditorCommand("setHTML", note.htmlText);
    } else {
      sendEditorCommand("setHTML", "");
    }
  };

  const setWebViewTheme = () => {
    if (!darkMode) {
      sendEditorCommand("setTheme", {
        backgroundColor: "#EEEEEE",
        color: "#000000",
      });
    } else {
      sendEditorCommand("setTheme", {
        backgroundColor: "#000000",
        color: "#FFFFFF",
      });
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAni, {
        delay: 100,
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(transYAni, {
        delay: 100,
        toValue: 0,
        tension: 150,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const closeNote = () => {
    if (closed) return;

    setClosed(true);

    const htmlToSave = currentHTML.current;

    Animated.parallel([
      Animated.timing(opacityAni, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(transYAni, {
        toValue: 500,
        tension: 150,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      await saveNote(htmlToSave);

      setNote(null);
      navigate("/");
    });
  };

  useEffect(() => {
    if (!webviewReady.current) return;

    sendEditorCommand("setTheme", {
      backgroundColor: darkMode ? "#000000" : "#EEEEEE",
      color: darkMode ? "#FFFFFF" : "#000000",
    });
  }, [darkMode]);

  const onMessage = (event) => {
    const receivedData = JSON.parse(event.nativeEvent.data);

    switch (receivedData.type) {
      case "selectionState":
        setFormatState(receivedData.payload);
        break;

      case "contentChanged":
        currentHTML.current = receivedData.payload;
        break;

      case "ready":
        webviewReady.current = true;

        sendEditorCommand("setTheme", {
          backgroundColor: darkMode ? "#000000" : "#EEEEEE",
          color: darkMode ? "#FFFFFF" : "#000000",
        });

        sendEditorCommand("setHTML", note?.htmlText ?? "");
        break;
    }
  };

  const saveNote = async (content) => {
    setSaving(true);
    if (note) {
      const updatedNote = {
        notesId: note.noteid,
        title: title,
        htmlNotes: content,
        locked: note.locked,
        folderId: folder ? folder.folderid : null,
        update: new Date(),
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
            updated: resNote.updated,
          };
          setSaving(false);
          setAllData((prevUser) => {
            const newNotes = prevUser.notes.filter(
              (note) => note.noteid !== resNote.notesid,
            );
            newNotes.push(noteToPush);
            const newData = {
              ...prevUser,
              notes: newNotes,
            };
            return newData;
          });
          await db.runAsync(
            `UPDATE notes SET title = ?, htmlText = ?, locked = ?, folderId = ?,
      \`updated\` = ? WHERE noteid = ?`,
            [
              resNote.title,
              resNote.htmlnotes,
              resNote.locked,
              resNote.folderid,
              resNote.updated,
              resNote.notesid,
            ],
          );
        })
        .catch((err) => {
          console.log(err);
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
            updated: resNote.updated,
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
            resNote.trashed,
          );
          if (close) {
            navigate("/");
            setNote(null);
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  return (
    <Animated.View
      style={[styles.container, { opacity: opacityAni, translateY: transYAni }]}
    >
      <KeyboardAvoidingView
        style={[
          styles.container,
          { backgroundColor: darkMode ? "#000" : "#eee" },
        ]}
        keyboardVerticalOffset={0} // adjust if you have a header
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.saveInputContainer}>
            <TextInput
              style={[styles.title, { color: darkMode ? "#fff" : "#000" }]}
              placeholder="Title"
              value={title}
              placeholderTextColor="#aaa"
              onChangeText={(titleText) => setTitle(titleText)}
            />
            <Pressable
              style={[
                styles.save,
                { backgroundColor: theme.on ? theme.color : "#fcd34d" },
              ]}
              onPress={() => saveNote(currentHTML.current)}
            >
              {saving ? (
                <FontAwesome5 name="cloud-upload-alt" />
              ) : (
                <FontAwesome5 name="save" />
              )}
            </Pressable>
          </View>
        </TouchableWithoutFeedback>
        <WebView
          ref={webviewRef}
          style={[styles.editor, { color: darkMode ? "#fff" : "#000" }]}
          javaScriptEnabled={true}
          source={{ html: EditorHTML }}
          onLoad={() => initializeEditor()}
          onMessage={onMessage}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("WebView error: ", nativeEvent);
          }}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
        />
        <Toolbar webviewRef={webviewRef} darkMode={darkMode} theme={theme} />
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
    paddingTop: 50,
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 25,
    paddingTop: 0,
    paddingBottom: 10,
    color: "#fff",
    maxWidth: "75%",
  },
  saveInputContainer: {
    padding: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  save: {
    padding: 6,
    borderRadius: 2,
    elevation: 2,
  },
  editor: {
    flex: 1,
    textAlignVertical: "top",
  },
  white: {
    color: "#fff",
    fontSize: 17,
  },
});

export default NewNote;
