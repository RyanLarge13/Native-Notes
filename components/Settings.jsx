import { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  Animated,
} from "react-native";
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
  SQLite,
  setSystemNotifs,
}) => {
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState(item.color);
  const [isLocked, setIsLocked] = useState(item.locked);

  const scaleAni = useRef(new Animated.Value(0)).current;
  const opacityAni = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAni, {
      toValue: 1,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
    Animated.timing(opacityAni, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, []);

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
        setSelectedFolder(null);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        console.log("Finsihed updating folder");
      });
  };

  const confirmDeleteFolder = () => {
    setSystemNotifs([
      {
        id: 1,
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
            },
          },
        ],
      },
    ]);
  };

  const deleteFolder = async () => {
    const folderId = item.folderid;
    deleteAFolder(token, folderId)
      .then(async (res) => {
        const db = await SQLite.openDatabaseAsync("localstore");
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
        await db.runAsync(
          `
      DELETE FROM folders WHERE folderid = $deleteId
    `,
          { $deleteId: folderIdToDelete }
        );
        setOpen({ show: false });
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        console.log("delete a folder complete");
      });
  };

  const confirmDeleteNote = () => {
    setSystemNotifs([
      {
        id: 1,
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
            },
          },
        ],
      },
    ]);
  };

  const deleteNote = () => {
    const noteId = item.noteid;
    deleteANote(token, noteId)
      .then(async (res) => {
        const db = await SQLite.openDatabaseAsync("localstore");
        const noteIdToDelete = res.data.data[0].notesid;
        setAllData((prevData) => {
          const newNotes = prevData.notes.filter(
            (note) => note.noteid !== noteIdToDelete
          );
          const newData = { ...prevData, notes: newNotes };
          return newData;
        });
        await db.runAsync(
          `
      DELETE FROM notes WHERE noteid = $deleteId
    `,
          { $deleteId: noteIdToDelete }
        );
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
      folderId: folder ? folder.folderId : null,
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
      <Animated.View style={[styles.backdrop, { opacity: opacityAni }]}>
        <Pressable
          onPress={() => {
            setSelectedFolder(null);
            setOpen({ show: false });
          }}
          style={{
            backgroundColor: "transparent",
            width: "100%",
            height: "100%",
          }}
        ></Pressable>
      </Animated.View>
      {type === "folder" ? (
        <Animated.View
          style={[styles.container, { scaleX: scaleAni, scaleY: scaleAni }]}
        >
          <View
            style={[styles.color, { backgroundColor: formatColor(newColor) }]}
          ></View>
          <View style={styles.header}>
            <Text style={[styles.white, styles.largeText]}>{item.title}</Text>
            <Pressable onPress={() => confirmDeleteFolder()}>
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
        </Animated.View>
      ) : (
        <Animated.View
          style={[styles.container, { scaleX: scaleAni, scaleY: scaleAni }]}
        >
          <View style={styles.header}>
            <Text style={[styles.white, styles.largeText]}>{item.title}</Text>
            <Pressable onPress={() => confirmDeleteNote()}>
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
