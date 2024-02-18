import { useState } from "react";
import { View, StyleSheet, TextInput, Text, Pressable } from "react-native";
import { useNavigate } from "react-router-native";
import { createNewFolder } from "../utils/api";
import { v4 as uuidv4 } from "uuid";
import Colors from "../components/Colors";

const NewFolder = ({ setAllData, folder, token }) => {
 const [color, setColor] = useState("bg-red-300");
 const [title, setTitle] = useState("");
 const navigate = useNavigate();

 const createFolder = () => {
  try {
   const tempId = uuidv4();
   const newFolder = {
    folderid: tempId,
    title,
    color,
    parentFolderId: folder ? folder.folderid : null
   };
   setAllData(prevUser => {
    const newData = {
     ...prevUser,
     folders: [...prevUser.folders, newFolder]
    };
    
    return newData;
   });
   navigate("/");
   createNewFolder(token, newFolder)
    .then(res => {
     const resFolder = res.data.data[0];
     setAllData(prevData => {
      const newFolders = prevData.folders.map(aFold => {
       if (aFold.folderid === tempId) {
        return { ...aFold, folderid: resFolder.folderid };
       }
       return aFold;
      });
      const newData = {...prevData,folders: newFolders} 
      return newData;
     });
    })
    .catch(err => {
     console.log(err);
    });
  } catch (err) {
   console.log(err);
  }
 };

 return (
  <>
   <Pressable onPress={() => navigate("/")} style={styles.backdrop}></Pressable>
   <View style={styles.container}>
    <Text style={[styles.white, styles.heading]}>Create a new folder</Text>
    <TextInput
     style={[styles.white, styles.input, styles.heading]}
     placeholder="title"
     placeholderTextColor="#aaa"
     value={title}
     onChangeText={text => setTitle(text)}
    />
    <Colors setColor={setColor} selectedColor={color} />
    <Pressable onPress={() => createFolder()} style={styles.btn}>
     <Text>Create &rarr;</Text>
    </Pressable>
   </View>
  </>
 );
};

const styles = StyleSheet.create({
 backdrop: {
  position: "absolute",
  top: 0,
  bottom: 0,
  right: 0,
  left: 0,
  backgroundColor: "rgba(0,0,0,0.4)"
 },
 container: {
  position: "absolute",
  bottom: 50,
  right: 25,
  left: 25,
  padding: 10,
  elevation: 10,
  borderRadius: 10,
  backgroundColor: "#222"
 },
 heading: {
  fontSize: 16
 },
 white: {
  color: "#fff"
 },
 btn: {
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 10,
  backgroundColor: "#fcd34d",
  elevation: 3,
  marginTop: 15,
  width: 125
 },
 input: {
  paddingVertical: 10,
  paddingHorizontal: 5
 }
});

export default NewFolder;
