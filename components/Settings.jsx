import { useState } from "react";
import { View, TextInput, Text, Pressable, StyleSheet } from "react-native";
import {
  deleteAFolder,
  deleteANote,
  updateFolder,
  updateNote,
  updateFolderPosition,
} from "../utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import formatColor from "../utils/helpers/formatColor";
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
}) => {
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState(item.color);
  const [isLocked, setIsLocked] = useState(item.locked);

  const updateAFolder = () => {
    const newFolder = {
      parentFolderId: selectedFolder
        ? selectedFolder.folderid
        : item.parentFolderId,
      title: newTitle ? newTitle : item.title,
      color: newColor,
      folderId: item.folderid,
    };
    updateFolder(token, newFolder)
      .then((res) => {
        const resFolder = res.data.data[0];
        const folderToPush = {
          title: resFolder.title,
          color: resFolder.color,
          folderid: resFolder.folderid,
          parentFolderId: resFolder.parentfolderid,
        };
        setAllData((prevData) => {
          const newFolders = prevData.folders.filter(
            (fold) => fold.folderid !== resFolder.folderid
          );
          newFolders.push(folderToPush);
          const newData = {
            ...prevData,
            folders: newFolders,
          };
          return newData;
        });
        setOpen({ show: false });
        setSelectedFolder(null)
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        console.log("Finsihed updating folder");
      });
  };

  const deleteFolder = () => {
    const folderId = item.folderid;
    deleteAFolder(token, folderId)
      .then((res) => {
        const folderIdToDelete = res.data.data[0].folderid;
        setAllData((prevData) => {
          const newFolders = prevData.folders.filter(
            (fold) => fold.folderid !== folderIdToDelete
          );
          const newData = {
            ...prevData,
            folders: newFolders,
          };
          return newData;
        });
        setOpen({ show: false });
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        console.log("delete a folder complete");
      });
  };

  const deleteNote = () => {
    const noteId = item.noteid;
    deleteANote(token, noteId)
      .then((res) => {
        const noteIdToDelete = res.data.data[0].notesid;
        setAllData((prevData) => {
          const newNotes = prevData.notes.filter(
            (note) => note.noteid !== noteIdToDelete
          );
          const newData = { ...prevData, notes: newNotes };
          return newData;
        });
        setOpen({ show: false });
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        console.log("delete a note complete");
      });
  };

  const updateNoteTitleOrLocked = () => {
    const updatedNote = {
      notesId: item.noteid,
      title: newTitle ? newTitle : item.title,
      htmlNotes: item.htmlText,
      locked: isLocked,
    };
    updateNote(token, updatedNote)
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
        setOpen({ show: false });
      })
      .catch((err) => {
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
      <Pressable
        onPress={() => {
          setSelectedFolder(null);
          setOpen({ show: false });
        }}
        style={styles.backdrop}
      ></Pressable>
      {type === "folder" ? (
        <View style={styles.container}>
          <View
            style={[styles.color, { backgroundColor: formatColor(newColor) }]}
          ></View>
          <View style={styles.header}>
            <Text style={[styles.white, styles.largeText]}>{item.title}</Text>
            <Pressable onPress={() => deleteFolder()}>
              <Icon style={[styles.red, styles.largeText]} name="delete" />
            </Pressable>
          </View>
          <View style={styles.info}>
            <TextInput
              style={styles.white}
              placeholder={item.title}
              placeholderTextColor="#aaa"
              value={newTitle}
              onChangeText={(text) => setNewTitle(text)}
            />
            <Colors setColor={setNewColor} selectedColor={newColor} />
          </View>
          {selectedFolder && (
            <Text style={styles.white}>
              Moving {item.title} &rarr; {selectedFolder.title}
            </Text>
          )}
          <View style={styles.saveOrMoveContainer}>
            <Pressable onPress={() => updateAFolder()} style={styles.save}>
              <Text>Save</Text>
            </Pressable>
            <Pressable onPress={() => openFolderTree()} style={styles.move}>
              <Icon style={styles.moveBtn} name="folder-move" />
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={[styles.white, styles.largeText]}>{item.title}</Text>
            <Pressable onPress={() => deleteNote()}>
              <Icon style={[styles.red, styles.largeText]} name="delete" />
            </Pressable>
          </View>
          <Text style={styles.gray}>
            {new Date(item.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
          <Pressable
            style={styles.lock}
            onPress={() => setIsLocked((prev) => !prev)}
          >
            <Text style={styles.white}>Lock</Text>
            {isLocked ? (
              <Icon style={styles.lockedBtn} name="lock" />
            ) : (
              <Icon style={[styles.white, { fontSize: 18 }]} name="lock-open" />
            )}
          </Pressable>
          <View style={styles.info}>
            <TextInput
              placeholder={item.title}
              placeholderTextColor="#aaa"
              value={newTitle}
              onChangeText={(text) => setNewTitle(text)}
            />
          </View>
          <Pressable
            onPress={() => updateNoteTitleOrLocked()}
            style={styles.save}
          >
            <Text>Save</Text>
          </Pressable>
        </View>
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
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  container: {
    position: "absolute",
    bottom: 50,
    right: 25,
    left: 25,
    borderRadius: 10,
    elevation: 2,
    padding: 10,
    paddingTop: 15,
    backgroundColor: "#222",
  },
  color: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "50%",
    height: 10,
    borderBottomLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  info: {
    marginTop: 15,
  },
  white: {
    color: "#fff",
  },
  red: {
    color: "#faa",
  },
  gray: {
    color: "#aaa",
  },
  largeText: {
    fontSize: 20,
  },
  save: {
    padding: 10,
    borderRadius: 10,
    elevation: 2,
    backgroundColor: "#fcd34d",
    marginTop: 15,
    width: 100,
  },
  lock: {
    marginTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lockedBtn: {
    fontSize: 18,
    color: "#fcd34d",
  },
  saveOrMoveContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  move: {
    padding: 10,
  },
  moveBtn: {
    fontSize: 20,
    color: "#fff",
  },
});

export default Settings;
