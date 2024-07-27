import { useState, useEffect, useRef } from "react";
import {
 View,
 TextInput,
 Text,
 Pressable,
 StyleSheet,
 Animated,
 Switch
} from "react-native";
import {
 deleteAFolder,
 deleteANote,
 updateFolder,
 updateNote
} from "../utils/api";
import { unFormatColor, formatColor } from "../utils/helpers/formatColor.js";
import { v4 as uuidv4 } from "uuid";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Colors from "./Colors";

const Settings = ({
 item,
 type,
 setOpen,
 token,
 setAllData,
 setPickFolder,
 selectedFolder,
 setSelectedFolder,
 db,
 setSystemNotifs,
 darkMode
}) => {
 const [newTitle, setNewTitle] = useState("");
 const [newColor, setNewColor] = useState(formatColor(item.color));
 const [isLocked, setIsLocked] = useState(item.locked === 1 || item.locked ===
 true ? true : false);

 const scaleAni = useRef(new Animated.Value(0)).current;
 const opacityAni = useRef(new Animated.Value(0)).current;

 useEffect(() => {
  console.log(isLocked);
  Animated.spring(scaleAni, {
   toValue: 1,
   tension: 100,
   friction: 10,
   useNativeDriver: true
  }).start();
  Animated.timing(opacityAni, {
   toValue: 1,
   duration: 100,
   useNativeDriver: true
  }).start();
 }, []);

 const updateAFolder = async () => {
  const newFolder = {
   parentFolderId: selectedFolder
    ? selectedFolder.parentFolderId
    : item.parentFolderId,
   title: newTitle ? newTitle : item.title,
   color: unFormatColor(newColor),
   folderId: item.folderid
  };
  setAllData(prevData => {
   const newFolders = prevData.folders.filter(
    fold => fold.folderid !== newFolder.folderId
   );
   newFolders.push({ ...newFolder, folderid: item.folderid });
   const newData = {
    ...prevData,
    folders: newFolders
   };
   return newData;
  });
  await db.runAsync(
   `
      UPDATE folders SET title = ?, color = ?, parentFolderId = ? WHERE folderid = ?
    `,
   [
    newFolder.title,
    newFolder.color,
    newFolder.parentFolderId,
    newFolder.folderId
   ]
  );
  setOpen({ show: false });
  setSelectedFolder(null);
  updateFolder(token, newFolder)
   .then(async res => {
    console.log("Folder updated");
   })
   .catch(err => {
    console.log(err);
   })
   .finally(() => {
    console.log("Finsihed updating folder");
   });
 };

 const confirmDeleteFolder = () => {
  setSystemNotifs([
   {
    id: uuidv4(),
    color: "#f33",
    title: `Delete Folder ${item.title}`,
    text: "Are you sure you want to delete this folder?",
    actions: [
     { text: "close", func: () => setSystemNotifs([]) },
     {
      text: "delete",
      func: () => {
       setSystemNotifs([]);
       deleteFolder();
      }
     }
    ]
   }
  ]);
 };

 const deleteFolder = async () => {
  const folderId = item.folderid;
  setAllData(prevData => {
   const newFolders = prevData.folders.filter(
    fold => fold.folderid !== folderId
   );
   const newData = {
    ...prevData,
    folders: newFolders
   };
   return newData;
  });
  await db.runAsync(
   `
      DELETE FROM folders WHERE folderid = $deleteId
    `,
   { $deleteId: folderId }
  );
  setOpen({ show: false });
  deleteAFolder(token, folderId)
   .then(async res => {
    console.log("response complete");
   })
   .catch(err => {
    console.log(err);
   })
   .finally(() => {
    console.log("delete a folder complete");
   });
 };

 const confirmDeleteNote = () => {
  setSystemNotifs([
   {
    id: uuidv4(),
    color: "#f33",
    title: `Delete Note ${item.title}`,
    text: "Are you sure you want to delete this note?",
    actions: [
     { text: "close", func: () => setSystemNotifs([]) },
     {
      text: "delete",
      func: () => {
       setSystemNotifs([]);
       deleteNote();
      }
     }
    ]
   }
  ]);
 };

 const deleteNote = async () => {
  const noteId = item.noteid;
  setAllData(prevData => {
   const newNotes = prevData.notes.filter(note => note.noteid !== noteId);
   const newData = { ...prevData, notes: newNotes };
   return newData;
  });
  await db.runAsync(
   `
      DELETE FROM notes WHERE noteid = $deleteId
    `,
   { $deleteId: noteId }
  );
  setOpen({ show: false });
  deleteANote(token, noteId)
   .then(async res => {
    console.log("request complete");
   })
   .catch(err => {
    console.log(err);
   })
   .finally(() => {
    console.log("delete a note complete");
   });
 };

 const updateNoteTitleOrLocked = async () => {
  const updatedNote = {
   notesId: item.noteid,
   title: newTitle ? newTitle : item.title,
   htmlNotes: item.htmlText,
   locked: isLocked,
   folderId: item.folderId,
   updated: new Date()
  };
  updateNote(token, updatedNote)
   .then(async res => {
    const resNote = res.data.data[0];
    console.log(resNote);
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
    try {
     await db.runAsync(
      `
      UPDATE notes SET title = ?, locked = ?, htmlText = ?, folderId = ?,
      updated = ? WHERE noteid = ?
    `,
      [
       resNote.title,
       resNote.locked,
       resNote.htmlnotes,
       resNote.folderid,
       resNote.updated,
       resNote.notesid
      ]
     );
    } catch (err) {
     console.log("err updating db note");
    }
    setOpen({ show: false });
   })
   .catch(err => {
    console.log(err);
   })
   .finally(() => {
    console.log("Finished note update of title or locked");
   });
 };

 const openFolderTree = () => {
  setPickFolder(true);
 };

 return (
  <>
   <Animated.View style={[styles.backdrop, { opacity: opacityAni }]}>
    <Pressable
     onPress={() => {
      setSelectedFolder(null);
      setOpen({ show: false });
     }}
     style={{
      backgroundColor: "transparent",
      width: "100%",
      height: "100%"
     }}
    ></Pressable>
   </Animated.View>
   {type === "folder" ? (
    <Animated.View
     style={[
      styles.container,
      {
       backgroundColor: darkMode ? "#222" : "#fff",
       scaleX: scaleAni,
       scaleY: scaleAni
      }
     ]}
    >
     <View style={[styles.color, { backgroundColor: newColor }]}></View>
     <View style={styles.header}>
      <TextInput
       style={[styles.white, styles.largeText]}
       placeholder={item.title}
       placeholderTextColor="#aaa"
       value={newTitle}
       onChangeText={text => setNewTitle(text)}
      />
      <Pressable onPress={() => confirmDeleteFolder()}>
       <Icon style={[styles.red, styles.largeText]} name="delete" />
      </Pressable>
     </View>
     <View style={styles.info}>
      <Colors setColor={setNewColor} selectedColor={newColor} />
     </View>
     {selectedFolder && (
      <Text style={darkMode ? styles.white : styles.black}>
       Moving {item.title} &rarr; {selectedFolder.title}
      </Text>
     )}
     <View style={styles.saveOrMoveContainer}>
      <Pressable onPress={() => updateAFolder()} style={styles.save}>
       <Text>Save</Text>
      </Pressable>
      <Pressable onPress={() => openFolderTree()} style={styles.move}>
       <Icon
        style={[styles.moveBtn, { color: darkMode ? "#fff" : "#000" }]}
        name="folder-move"
       />
      </Pressable>
     </View>
    </Animated.View>
   ) : (
    <Animated.View
     style={[
      styles.container,
      {
       backgroundColor: darkMode ? "#111" : "#fff",
       scaleX: scaleAni,
       scaleY: scaleAni
      }
     ]}
    >
     <View style={styles.header}>
      <TextInput
       style={[styles.title, darkMode ? styles.white : styles.black]}
       placeholder={item.title}
       placeholderTextColor="#aaa"
       value={newTitle}
       onChangeText={text => setNewTitle(text)}
      />
      <Pressable onPress={() => confirmDeleteNote()}>
       <Icon style={[styles.red, styles.largeText]} name="delete" />
      </Pressable>
     </View>
     <View style={styles.lock}>
      <Text style={darkMode ? styles.white : styles.black}>Lock</Text>
      <Switch
       trackColor={{ false: "#fda4af", true: "#6ee7b7" }}
       thumbColor={isLocked ? "#5effa7" : "#ff808d"}
       ios_backgroundColor="#000000"
       onValueChange={() => setIsLocked(prev => !prev)}
       value={isLocked}
      />
     </View>
     <Text style={styles.gray}>
      Created On{" "}
      {new Date(item.createdAt).toLocaleDateString("en-US", {
       month: "short",
       day: "numeric"
      })}
     </Text>
     <Pressable onPress={() => updateNoteTitleOrLocked()} style={styles.save}>
      <Text>Save</Text>
     </Pressable>
    </Animated.View>
   )}
  </>
 );
};

const styles = StyleSheet.create({
 backdrop: {
  position: "absolute",
  top: 0,
  right: 0,
  left: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.4)"
 },
 title: {
  fontSize: 20
 },
 largeText: {
  fontSize: 20
 },
 container: {
  position: "absolute",
  bottom: 50,
  right: 25,
  left: 25,
  borderRadius: 10,
  elevation: 2,
  padding: 10,
  paddingTop: 15
 },
 color: {
  position: "absolute",
  top: 0,
  right: 0,
  width: "50%",
  height: 10,
  borderBottomLeftRadius: 10,
  borderTopRightRadius: 10
 },
 header: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center"
 },
 info: {
  marginTop: 15
 },
 white: {
  color: "#fff"
 },
 black: {
  color: "#000"
 },
 red: {
  color: "#faa"
 },
 gray: {
  color: "#aaa"
 },
 save: {
  padding: 10,
  borderRadius: 10,
  elevation: 2,
  backgroundColor: "#fcd34d",
  marginTop: 15,
  flex: 1
 },
 lock: {
  marginTop: 8,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center"
 },
 lockedBtn: {
  fontSize: 18,
  color: "#fcd34d"
 },
 saveOrMoveContainer: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 10
 },
 move: {
  padding: 10
 },
 moveBtn: {
  fontSize: 20
 }
});

export default Settings;
