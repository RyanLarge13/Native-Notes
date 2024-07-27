import { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, StyleSheet } from "react-native";
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
 setMenuOpen,
 darkMode
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
   setMenuOpen={setMenuOpen}
   darkMode={darkMode}
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
 setMenuOpen,
 darkMode
}) => {
 const childFolders = folders.filter(fold => fold.parentFolderId !== parentId);
 const topFolders = folders.filter(fold => fold.parentFolderId === parentId);

 const [folderStates, setFolderStates] = useState({});

 const transXAni = useRef(new Animated.Value(15)).current;
 const opacAni = useRef(new Animated.Value(0)).current;

 useEffect(() => {
  Animated.parallel([
   Animated.spring(transXAni, {
    toValue: 0,
    tension: 100,
    friction: 10,
    useNativeDriver: true
   }),
   Animated.timing(opacAni, {
    toValue: 1,
    duration: 100,
    useNativeDriver: true
   })
  ]).start();
 }, [folderStates]);

 const toggleNested = folderId => {
  setFolderStates(prev => ({
   ...prev,
   [folderId]: !prev[folderId]
  }));
 };

 return (
  <>
   {topFolders.length > 0 ? (
    <>
     {topFolders.map(fold => (
      <Animated.View
       key={fold.folderid}
       style={[
        styles.folder,
        {
         translateX: transXAni,
         opacity: opacAni,
         backgroundColor: darkMode ? "#111" : "#fff"
        }
       ]}
      >
       <Pressable
        key={fold.folderid}
        style={[styles.folder, { marginLeft: 5 * level }]}
        onPress={() => {
         if (moving) {
          open.item.title === fold.title ? null : setSelectedFolder(fold);
          return;
         }
         setFolder(fold);
         setMenuOpen(false);
        }}
       >
        <View
         style={[
          styles.folderColor,
          { backgroundColor: `${formatColor(fold.color)}` },
          open.item.title === fold.title ? { opacity: 0.3 } : { opacity: 1 }
         ]}
        ></View>
        <View style={styles.titleAndArrow}>
         <Text style={darkMode ? styles.white : styles.black }>{fold.title}</Text>
         {open.item.title !== fold.title && (
          <Pressable
           style={styles.dropDown}
           onPress={() => toggleNested(fold.folderid)}
          >
           {folderStates[fold.folderid] ? (
            <Icon style={darkMode ? styles.white : styles.black} name="arrow-down" />
           ) : (
            <Icon style={darkMode ? styles.white : styles.black } name="arrow-right" />
           )}
          </Pressable>
         )}
        </View>
        <View style={styles.nestContainer}>
         {folderStates[fold.folderid] ? (
          <NestedFolder
           moving={moving}
           setPickFolder={setPickFolder}
           setSelectedFolder={setSelectedFolder}
           setFolder={setFolder}
           childFolders={childFolders}
           parentId={fold.folderid}
           level={level + 1}
           open={open}
           setMenuOpen={setMenuOpen}
           darkMode={darkMode}
          />
         ) : null}
        </View>
       </Pressable>
      </Animated.View>
     ))}
    </>
   ) : null}
  </>
 );
};

const styles = StyleSheet.create({
 folder: {
  marginVertical: 2.5,
  maxWidth: "100%",
  paddingVertical: 5,
  paddingRight: 10,
  paddingLeft: 15,
  borderRadius: 10,
  position: "relative"
 },
 folderColor: {
  position: "absolute",
  top: 0,
  left: 0,
  bottom: 0,
  width: 4,
  borderRadius: 10
 },
 titleAndArrow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center"
 },
 dropDown: {
  padding: 10
 },
 nestContainer: {
  flexDirection: "column"
 },
 white: {
  color: "#fff"
 },
 black: {
  color: "#000"
 },
 slate: {
  color: "#aaa"
 }
});

export default Tree;
