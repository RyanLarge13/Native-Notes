import { useEffect, useRef } from "react";
import {
 View,
 ScrollView,
 Animated,
 StyleSheet,
 Text,
 Pressable
} from "react-native";
import { useNavigate } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/FontAwesome5";
import Tree from "./Tree";

const Menu = ({
 menuOpen,
 setMenuOpen,
 folders,
 setFolder,
 allData,
 systemFolder,
 setSystemFolder,
 setPickFolder,
 setAllData,
 setUser
}) => {
 const animation = useRef(new Animated.Value(-500)).current;
 const animationOpacity = useRef(new Animated.Value(0)).current;
 const navigate = useNavigate();

 useEffect(() => {
  if (menuOpen) {
   Animated.spring(animation, {
    toValue: 0,
    tension: 100,
    friction: 10,
    useNativeDriver: true
   }).start();
   Animated.spring(animationOpacity, {
    toValue: 1,
    tension: 100,
    friction: 10, 
    useNativeDriver: true
   }).start();
  }
  if (!menuOpen) {
   Animated.spring(animation, {
    toValue: -500,
    tension: 100,
    friction: 10,
    useNativeDriver: true
   }).start();
   Animated.spring(animationOpacity, {
    toValue: 0,
    tension: 100,
    friction: 10,
    useNativeDriver: true
   }).start();
  }
 }, [menuOpen]);

 const logout = async () => {
  await AsyncStorage.removeItem("authToken")
   .then(res => {
    console.log("Stored token removed");
   })
   .catch(err => {
    console.log("Error removing stored token: ", err);
   })
   .finally(() => {
    console.log("Stored token removal attempt complete");
   });
  setMenuOpen(false);
  navigate("/login");
  setUser(null);
  setAllData(null);
 };

 const deleteAccount = () => {};

 return (
  <>
   {menuOpen && (
    <Pressable
     onPress={() => setMenuOpen(false)}
     style={[styles.backdrop]}
    ></Pressable>
   )}
   <Animated.ScrollView
    style={[
     styles.container,
     { translateX: animation, opacity: animationOpacity }
    ]}
   >
    <View
     style={{
      paddingHorizontal: 25,
      paddingVertical: 50
     }}
    >
     <View>
      <Text style={[styles.white, styles.heading]}>
       {allData.user.username}
      </Text>
      <View style={styles.notesBtnContainer}>
       <Pressable
        onPress={() => {
         setSystemFolder("all");
         setMenuOpen(false);
        }}
        style={styles.btn}
       >
        <Text style={styles.white}>
         All Notes{" "}
         <Text style={styles.slate}>{"   " + allData.notes.length}</Text>
        </Text>
        <Icon name="sticky-note" style={styles.white} />
       </Pressable>
       <Pressable
        onPress={() => {
         setSystemFolder("locked");
         setMenuOpen(false);
        }}
        style={styles.btn}
       >
        <Text style={styles.white}>
         Locked Notes{" "}
         <Text style={styles.slate}>
          {" "}
          {allData.notes.filter(note => note.locked).length}
         </Text>
        </Text>
        <Icon name="lock" style={styles.white} />
       </Pressable>
       <Pressable style={styles.btn}>
        <Text style={styles.white}>
         Shared Notes <Text style={styles.amber}> Beta</Text>
        </Text>
        <Icon name="share-alt" style={styles.white} />
       </Pressable>
       <Pressable
        onPress={() => {
         setSystemFolder("trash");
         setMenuOpen(false);
        }}
        style={styles.btn}
       >
        <Text style={styles.white}>
         Trash <Text style={styles.slate}> 0</Text>
        </Text>
        <Icon name="trash" style={styles.white} />
       </Pressable>
      </View>
      <Pressable onPress={() => logout()} style={styles.logout}>
       <Text>Logout &rarr;</Text>
      </Pressable>
      <Pressable onPress={() => deleteAccount()} style={styles.delete}>
       <Text style={styles.white}>Delete Account</Text>
      </Pressable>
      <Text style={[styles.white, { marginTop: 25, fontSize: 20 }]}>
       Folders <Text style={styles.slate}> {allData.folders.length}</Text>
      </Text>
      <View style={styles.folderContainer}>
       <Tree
        moving={false}
        setPickFolder={setPickFolder}
        setSelectedFolder={null}
        setFolder={setFolder}
        folders={allData.folders}
        parentId={null}
        level={0}
        open={{ item: { title: null } }}
       />
      </View>
      <Pressable onPress={() => {}} style={styles.settings}>
       <Text>Settings</Text>
      </Pressable>
     </View>
    </View>
   </Animated.ScrollView>
  </>
 );
};

const styles = StyleSheet.create({
 backdrop: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.4)"
 },
 container: {
  position: "absolute",
  left: 0,
  top: 0,
  bottom: 0,
  width: "90%",
  backgroundColor: "#000"
 },
 notesBtnContainer: {
  marginTop: 25
 },
 folderContainer: {
  marginTop: 25,
  flexDirection: "column"
 },
 folder: {
  marginVertical: 5,
  paddingVertical: 10,
  paddingRight: 10,
  paddingLeft: 15,
  backgroundColor: "#111",
  borderRadius: 10,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
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
 white: {
  color: "#fff"
 },
 slate: {
  color: "#aaa"
 },
 amber: {
  color: "#fcd34d"
 },
 heading: {
  fontSize: 25
 },
 btn: {
  marginVertical: 5,
  paddingVertical: 15,
  paddingHorizontal: 10,
  backgroundColor: "#111",
  borderRadius: 10,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center"
 },
 logout: {
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 5,
  backgroundColor: "#fcd34d",
  marginTop: 10
 },
 settings: {
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 5,
  backgroundColor: "#fcd34d",
  marginTop: 15
 },
 delete: {
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 5,
  backgroundColor: "#f55",
  marginTop: 10
 }
});

export default Menu;
