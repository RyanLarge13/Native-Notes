import { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import formatColor from "../utils/helpers/formatColor";
import Icon from "react-native-vector-icons/FontAwesome5";

const NestedFolder = ({
  moving,
  setPickFolder,
  setSelectedFolder,
  setFolder,
  childFolders,
  parentId,
  level,
  open,
}) => {
  return (
    <Tree
      moving={moving}
      setPickFolder={setPickFolder}
      setSelectedFolder={setSelectedFolder}
      setFolder={setFolder}
      folders={childFolders}
      parentId={parentId}
      level={level}
      open={open}
    />
  );
};

const Tree = ({
  moving,
  setPickFolder,
  setSelectedFolder,
  setFolder,
  folders,
  parentId,
  level,
  open,
}) => {
  const childFolders = folders.filter(
    (fold) => fold.parentFolderId !== parentId
  );
  const topFolders = folders.filter((fold) => fold.parentFolderId === parentId);

  const [folderStates, setFolderStates] = useState({});

  const toggleNested = (folderId) => {
    setFolderStates((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  return (
    <>
      {topFolders.length > 0 && (
        <>
          {topFolders.map((fold) => (
            <Pressable
              key={fold.folderid}
              style={[styles.folder, { marginLeft: 5 * level }]}
              onPress={() => {
                moving
                  ? open.item.title === fold.title
                    ? null
                    : setSelectedFolder(fold)
                  : setFolder(fold);
              }}
            >
              <View
                style={[
                  styles.folderColor,
                  { backgroundColor: `${formatColor(fold.color)}` },
                  open.item.title === fold.title
                    ? { opacity: 0.3 }
                    : { opacity: 1 },
                ]}
              ></View>
              <View style={styles.titleAndArrow}>
                <Text style={styles.white}>{fold.title}</Text>
                {open.item.title !== fold.title && <Pressable
                  style={styles.dropDown}
                  onPress={() => toggleNested(fold.folderid)}
                >
                  {folderStates[fold.folderid] ? (
                    <Icon style={styles.white} name="arrow-down" />
                  ) : (
                    <Icon style={styles.white} name="arrow-right" />
                  )}
                </Pressable>} 
              </View>
              <View style={styles.nestContainer}>
                {folderStates[fold.folderid] && (
                  <NestedFolder
                    moving={moving}
                    setPickFolder={setPickFolder}
                    setSelectedFolder={setSelectedFolder}
                    setFolder={setFolder}
                    childFolders={childFolders}
                    parentId={fold.folderid}
                    level={level + 1}
                    open={open}
                  />
                )}
              </View>
            </Pressable>
          ))}
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  folder: {
    marginVertical: 5,
    maxWidth: "100%",
    paddingVertical: 5,
    paddingRight: 10,
    paddingLeft: 15,
    backgroundColor: "#111",
    borderRadius: 10,
    position: "relative",
  },
  folderColor: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
    borderRadius: 10,
  },
  titleAndArrow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropDown: {
    padding: 10,
  },
  nestContainer: {
    flexDirection: "column",
  },
  white: {
    color: "#fff",
  },
  slate: {
    color: "#aaa",
  },
});

export default Tree;
