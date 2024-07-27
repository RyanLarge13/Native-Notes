import { useEffect, useState, useRef } from "react";
import {
 View,
 Animated,
 Text,
 TextInput,
 StyleSheet,
 Pressable
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import MaterialIcon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigate } from "react-router-native";

// use folder for the folder title on scroll in header
const Header = ({
 folder,
 setFolder,
 goBack,
 notes,
 setNotes,
 allNotes,
 setMenuOpen,
 view,
 setView,
 layoutOptions,
 setLayoutOptions,
 darkMode
}) => {
 const [search, setSearch] = useState(false);
 const [searchText, setSearchText] = useState("");

 const animationOpacity = useRef(new Animated.Value(0)).current;
 const scaleAni = useRef(new Animated.Value(0)).current;
 const opacityAni = useRef(new Animated.Value(0)).current;

 const navigate = useNavigate();

 useEffect(() => {
  if (!folder) {
   if (!searchText) {
    return setNotes([]);
   }
   const notesCopy = [...allNotes];
   showSearchedNotes(notesCopy);
  }
  if (folder) {
   if (!searchText) {
    const folderNotes = allNotes.filter(
     aNote => aNote.folderId === folder.folderid
    );
    return setNotes(folderNotes);
   }
   const notesCopy = [...notes];
   showSearchedNotes(notesCopy);
  }
 }, [searchText]);

 useEffect(() => {
  if (search) {
   Animated.spring(animationOpacity, {
    toValue: 1,
    tension: 100,
    friction: 10,
    useNativeDriver: true
   }).start();
  }
  if (!search) {
   Animated.spring(animationOpacity, {
    toValue: 0,
    tension: 100,
    friction: 10,
    useNativeDriver: true
   }).start();
  }
 }, [search]);

 useEffect(() => {
  if (layoutOptions) {
   Animated.parallel([
    Animated.timing(opacityAni, {
     toValue: 1,
     duration: 100,
     useNativeDriver: true
    }),
    Animated.spring(scaleAni, {
     toValue: 1,
     tension: 100,
     friction: 10,
     useNativeDriver: true
    })
   ]).start();
  } else {
   Animated.parallel([
    Animated.timing(opacityAni, {
     toValue: 0,
     duration: 100,
     useNativeDriver: true
    }),
    Animated.spring(scaleAni, {
     toValue: 0,
     tension: 100,
     friction: 10,
     useNativeDriver: true
    })
   ]).start();
  }
 }, [layoutOptions]);

 const showSearchedNotes = copy => {
  const notesToSet = copy.filter(aNote => aNote.title.includes(searchText));
  setNotes(notesToSet);
 };

 return (
  <View style={styles.container}>
   <View style={styles.subContainer}>
    <Pressable onPress={() => setMenuOpen(true)}>
     <Icon
      name="menu"
      style={{ color: darkMode ? "#fff" : "#000", fontSize: 20 }}
     />
    </Pressable>
    {folder ? (
     <>
      <Pressable style={styles.btn} onPress={() => goBack()}>
       <Text style={[styles.back, { color: darkMode ? "#fff" : "#000" }]}>
        &larr;
       </Text>
      </Pressable>
      <Pressable onPress={() => setFolder(null)}>
       <Icon
        name="home"
        style={[styles.home, { color: darkMode ? "#fff" : "#000" }]}
       />
      </Pressable>
     </>
    ) : null}
   </View>
   <Animated.View style={{ opacity: animationOpacity }}>
    <TextInput
     underlineColorAndroid="transparent"
     placeholder={
      !folder ? "Search all notes" : `Search notes in ${folder.title}`
     }
     placeholderTextColor="#aaa"
     value={searchText}
     onChangeText={txt => setSearchText(txt)}
     style={[
      styles.searchInput,
      { color: darkMode ? styles.white : styles.black }
     ]}
    />
   </Animated.View>
   <View style={styles.subContainer}>
    <Pressable onPress={() => setSearch(prev => !prev)} style={styles.btn}>
     <Icon
      name="search"
      style={[styles.search, { color: darkMode ? "#fff" : "#000" }]}
     />
    </Pressable>
    <Pressable
     onPress={() => setLayoutOptions(prev => !prev)}
     style={styles.btn}
    >
     <MaterialIcon
      name="dots-vertical"
      style={[styles.dots, { color: darkMode ? "#fff" : "#000" }]}
     />
    </Pressable>
    <Animated.View
     style={[
      styles.layoutOptsContainer,
      {
       backgroundColor: darkMode ? "#111" : "#fff",
       opacity: opacityAni,
       scaleX: scaleAni,
       scaleY: scaleAni
      }
     ]}
    >
     <Pressable
      onPress={() => {
       setLayoutOptions(false);
       setView(prev => !prev);
      }}
      style={styles.layoutOptsBtn}
     >
      <Text style={darkMode ? styles.white : styles.black}>
       {view ? "List" : "Grid View"}
      </Text>
     </Pressable>
     <Pressable
      style={styles.layoutOptsBtn}
      onPress={() => {
       setLayoutOptions(false);
       navigate("/newfolder");
      }}
     >
      <Text style={darkMode ? styles.white : styles.black}>Create Folder</Text>
     </Pressable>
    </Animated.View>
   </View>
  </View>
 );
};

const styles = StyleSheet.create({
 container: {
  width: "100%",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center"
 },
 subContainer: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  columnGap: 2,
  position: "relative"
 },
 back: {
  marginLeft: 5,
  fontSize: 12
 },
 home: {
  marginLeft: 5,
  fontSize: 15
 },
 searchInput: {
  maxWidth: 200,
  fontSize: 12,
  height: 20
 },
 search: {
  maxWidth: 200,
  fontSize: 20,
  height: 20
 },
 dots: {
  maxWidth: 200,
  fontSize: 20,
  height: 20
 },
 layoutOptsContainer: {
  position: "absolute",
  width: 200,
  right: 0,
  top: 40,
  // transform: [{ translateY: 100 }],
  borderRadius: 10,
  paddingHorizontal: 15
 },
 layoutOptsBtn: {
  paddingVertical: 20,
  width: "100%"
 },
 white: {
  color: "#fff"
 },
 black: {
  color: "#000"
 },
 btn: {
  padding: 8
 }
});

export default Header;
