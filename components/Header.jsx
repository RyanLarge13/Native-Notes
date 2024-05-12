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
 setView
}) => {
 const [search, setSearch] = useState(false);
 const [searchText, setSearchText] = useState("");
 const [layoutOptions, setLayoutOptions] = useState(false);

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
     <Icon name="menu" style={styles.white} />
    </Pressable>
    {folder ? (
     <>
      <Pressable style={styles.btn} onPress={() => goBack()}>
       <Text style={styles.back}>&larr;</Text>
      </Pressable>
      <Pressable onPress={() => setFolder(null)}>
       <Icon name="home" style={[styles.back, { fontSize: 15 }]} />
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
     style={styles.search}
    />
   </Animated.View>
   <View style={styles.subContainer}>
    <Pressable onPress={() => setSearch(prev => !prev)} style={styles.btn}>
     <Icon name="search" style={styles.white} />
    </Pressable>
    <Pressable onPress={() => setLayoutOptions(true)} style={styles.btn}>
     <MaterialIcon name="dots-vertical" style={styles.white} />
    </Pressable>
    <Animated.View
     style={[
      styles.layoutOptsContainer,
      { opacity: opacityAni, scaleX: scaleAni, scaleY: scaleAni }
     ]}
    >
     <Pressable
      onPress={() => {
       setLayoutOptions(false);
       setView(prev => !prev);
      }}
      style={styles.layoutOptsBtn}
     >
      <Text style={styles.layoutOptsText}>{view ? "List" : "Grid View"}</Text>
     </Pressable>
     <Pressable
      style={styles.layoutOptsBtn}
      onPress={() => {
       setLayoutOptions(false);
       navigate("/newfolder");
      }}
     >
      <Text style={styles.layoutOptsText}>Create Folder</Text>
     </Pressable>
     <Pressable style={styles.layoutOptsBtn}>
      <Text style={styles.layoutOptsText}>Edit</Text>
     </Pressable>
     <Pressable style={styles.layoutOptsBtn}>
      <Text style={styles.layoutOptsText}>Pin Favs</Text>
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
  alignItems: "center",
  paddingVertical: 20,
  backgroundColor: "#000"
 },
 subContainer: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center"
 },
 white: {
  color: "#fff",
  fontSize: 20
 },
 back: {
  color: "#fff",
  marginLeft: 5,
  fontSize: 10
 },
 search: {
  color: "#fff",
  maxWidth: 200,
  fontSize: 12,
  height: 20
 },
 layoutOptsContainer: {
  position: "absolute",
  width: 200,
  right: 0,
  bottom: 0,
  borderRadius: 10,
  backgroundColor: "#111",
  paddingHorizontal: 15
 },
 layoutOptsBtn: {
  paddingVertical: 10,
  width: "100%"
 },
 layoutOptsText: {
  color: "#fff"
 },
 btn: {
  padding: 8
 }
});

export default Header;
