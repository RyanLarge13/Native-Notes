import { View, Text, StyleSheet } from "react-native";
import Ripple from "react-native-material-ripple";
import formatColor from "../utils/helpers/formatColor";
import { useEffect, useState } from "react";

const Folder = ({ folder, setFolder, setOpen, allNotes, saveLocation, darkMode}) => {
  const [notesLen, setNotesLen] = useState(0);

  useEffect(() => {
    if (allNotes.length > 0) {
      const lenOfNotes = allNotes.filter(
        (anote) => anote.folderId === folder.folderid
      ).length;
      setNotesLen(lenOfNotes);
    }
  }, [allNotes]);

  const openFolderSettings = () => {
    setOpen({ show: true, item: folder, type: "folder" });
  };

  return (
    <Ripple
      rippleColor="#fff"
      rippleOpacity={0}
      onLongPress={(e) => openFolderSettings(e)}
      onPress={() => {
        setFolder(folder);
        saveLocation(folder.folderid);
      }}
      style={[styles.folder, {backgroundColor: darkMode ? "#112" : "#aaa"}]}
    >
      <Text style={styles.gray}>{notesLen === 0 ? null : notesLen}</Text>
      <View
        style={[
          styles.color,
          { backgroundColor: `${formatColor(folder.color)}` },
        ]}
      ></View>
      <Text style={styles.white}>{folder.title}</Text>
    </Ripple>
  );
};

const styles = StyleSheet.create({
  folder: {
    padding: 8,
    borderRadius: 10,
    justifyContent: "space-between",
    alignItems: "flex-start",
    elevation: 2,
    width: 100,
    height: 65,
    position: "relative ",
  },
  color: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "50%",
    height: 6,
    borderBottomLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  white: {
    color: "#fff",
    fontSize: 10,
  },
  gray: {
    color: "#777",
    fontSize: 8,
  },
});

export default Folder;
