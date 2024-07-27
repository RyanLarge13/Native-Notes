import { useState, useRef, useEffect } from "react";
import {
 View,
 TextInput,
 StyleSheet,
 KeyboardAvoidingView,
 Pressable,
 Animated,
 Keyboard,
 TouchableWithoutFeedback
} from "react-native";
import { createNewNote, updateNote } from "../utils/api";
import { useNavigate } from "react-router-native";
import Icon from "react-native-vector-icons/FontAwesome5";
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
 autoSave
}) => {
 const [title, setTitle] = useState(note ? note.title : "");
 const [closed, setClosed] = useState(false);
 const navigate = useNavigate();
 const webviewRef = useRef();

 const opacityAni = useRef(new Animated.Value(0)).current;
 const transYAni = useRef(new Animated.Value(500)).current;

 const handleFormat = format => {
  webviewRef.current?.postMessage(format);
 };

 useEffect(() => {
  let saveInterval;
  if (autoSave && note) {
   saveInterval = setInterval(() => {
    handleFormat("html", false);
    console.log("saving");
   }, 15000);
  }
  return () => clearInterval(saveInterval);
 }, [autoSave]);

 useEffect(() => {
  Animated.parallel([
   Animated.timing(opacityAni, {
    toValue: 1,
    duration: 200,
    useNativeDriver: true
   }),
   Animated.spring(transYAni, {
    toValue: 0,
    tension: 150,
    friction: 10,
    useNativeDriver: true
   })
  ]).start();
  if (closed) {
   Animated.parallel([
    Animated.timing(opacityAni, {
     toValue: 0,
     duration: 100,
     useNativeDriver: true
    }),
    Animated.spring(transYAni, {
     toValue: 500,
     tension: 150,
     friction: 10,
     useNativeDriver: true
    })
   ]).start();
  }
 }, [closed]);

 const onMessage = (event, close) => {
  const receivedData = event.nativeEvent.data;
  saveNote(receivedData, close);
 };

 const saveNote = async (content, close) => {
  if (close) {
   setClosed(true);
  }
  if (note) {
   const updatedNote = {
    notesId: note.noteid,
    title: title,
    htmlNotes: content,
    locked: note.locked,
    folderId: folder ? folder.folderid : null, 
    update: new Date()
   };
   if (close) {
    setNote(null);
    navigate("/");
   }
   updateNote(token, updatedNote)
    .then(async res => {
     const resNote = res.data.data[0];
     const noteToPush = {
      title: resNote.title,
      createdAt: resNote.createdat,
      noteid: resNote.notesid,
      htmlText: resNote.htmlnotes,
      locked: resNote.locked,
      folderId: resNote.folderid, 
      updated: resNote.updated
     };
     setAllData(prevUser => {
      const newNotes = prevUser.notes.filter(
       note => note.noteid !== resNote.notesid
      );
      newNotes.push(noteToPush);
      const newData = {
       ...prevUser,
       notes: newNotes
      };
      return newData;
     });
     await db.runAsync(
      `UPDATE notes SET title = ?, htmlText = ?, locked = ?, folderId = ?,
      update = ? WHERE noteid = ?`,
      [
       resNote.title,
       resNote.htmlnotes,
       resNote.locked,
       resNote.folderid,
       resNote.updated,
       resNote.notesid
      ]
     );
    })
    .catch(err => {
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
    htmlNotes: content
   };
   createNewNote(token, newNote)
    .then(async res => {
     const resNote = res.data.data[0];
     const noteToPush = {
      title: resNote.title,
      createdAt: resNote.createdat,
      noteid: resNote.notesid,
      htmlText: resNote.htmlnotes,
      folderId: resNote.folderid, 
      updated: resNote.updated
     };
     setAllData(prevUser => {
      const newData = {
       ...prevUser,
       notes: [...prevUser.notes, noteToPush]
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
     if (close) {
      navigate("/");
      setNote(null);
     }
    })
    .catch(err => {
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
     <View style={styles.saveInputContainer}>
      <TextInput
       style={styles.title}
       placeholder="Title"
       value={title}
       placeholderTextColor="#aaa"
       onChangeText={titleText => setTitle(titleText)}
      />
      <Pressable style={styles.save} onPress={() => handleFormat("html", true)}>
       <Icon name="save" />
      </Pressable>
     </View>
    </TouchableWithoutFeedback>
    <WebView
     ref={webviewRef}
     style={styles.editor}
     javaScriptEnabled={true}
     source={{ html: note ? renderEditor(note.htmlText) : EditorHTML }}
     onMessage={onMessage}
     onError={syntheticEvent => {
      const { nativeEvent } = syntheticEvent;
      console.error("WebView error: ", nativeEvent);
     }}
    />
    <Toolbar webviewRef={webviewRef} />
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
  paddingTop: 50,
  paddingBottom: 100,
  paddingHorizontal: 20
 },
 title: {
  fontSize: 25,
  paddingTop: 0,
  paddingBottom: 10,
  color: "#fff",
  maxWidth: "75%"
 },
 saveInputContainer: {
  padding: 5,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottomWidth: 1,
  border: "#eee"
 },
 save: {
  padding: 6,
  borderRadius: 2,
  elevation: 2,
  backgroundColor: "#fcd34d"
 },
 editor: {
  flex: 1,
  color: "#fff",
  textAlignVertical: "top",
  backgroundColor: "#000"
 },
 white: {
  color: "#fff",
  fontSize: 17
 }
});

export default NewNote;
