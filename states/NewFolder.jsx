import { useState, useEffect, useRef } from "react";
import { StyleSheet, Animated, TextInput, Text, Pressable } from "react-native";
import { useNavigate } from "react-router-native";
import { createNewFolder } from "../utils/api";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import Colors from "../components/Colors";

const NewFolder = ({ setAllData, folder, token, db }) => {
  const [color, setColor] = useState("bg-red-300");
  const [title, setTitle] = useState("");
  const navigate = useNavigate();

  const opacityAni = useRef(new Animated.Value(0)).current;
  const scaleAni = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAni, {
        toValue: 1.0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAni, {
        toValue: 1,
        tension: 150,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const createFolder = () => {
    try {
      const tempId = uuidv4();
      const newFolder = {
        folderid: tempId,
        title,
        color,
        parentFolderId: folder ? folder.folderid : null,
      };
      setAllData((prevUser) => {
        const newData = {
          ...prevUser,
          folders: [...prevUser.folders, newFolder],
        };

        return newData;
      });
      navigate("/");
      createNewFolder(token, newFolder)
        .then(async (res) => {
          const resFolder = res.data.data[0];
          setAllData((prevData) => {
            const newFolders = prevData.folders.map((aFold) => {
              if (aFold.folderid === tempId) {
                return { ...aFold, folderid: resFolder.folderid };
              }
              return aFold;
            });
            const newData = { ...prevData, folders: newFolders };
            return newData;
          });
          await db.runAsync(
            `INSERT INTO folders (folderid, title, color, parentFolderId) VALUES (?,?,?,?);`,
            resFolder.folderid,
            resFolder.title,
            resFolder.color,
            resFolder.parentFolderId
          );
        })
        .catch((err) => {
          console.log(err);
        });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => navigate("/")}
        style={styles.backdrop}
      ></Pressable>
      <Animated.View
        style={[
          styles.container,
          { opacity: opacityAni, scaleX: scaleAni, scaleY: scaleAni },
        ]}
      >
        <Text style={[styles.white, styles.heading]}>Create a new folder</Text>
        <TextInput
          style={[styles.white, styles.input, styles.heading]}
          placeholder="title"
          placeholderTextColor="#aaa"
          value={title}
          onChangeText={(text) => setTitle(text)}
        />
        <Colors setColor={setColor} selectedColor={color} />
        <Pressable onPress={() => createFolder()} style={styles.btn}>
          <Text>Create &rarr;</Text>
        </Pressable>
      </Animated.View>
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
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  container: {
    position: "absolute",
    bottom: 50,
    right: 25,
    left: 25,
    padding: 10,
    elevation: 10,
    borderRadius: 10,
    backgroundColor: "#222",
  },
  heading: {
    fontSize: 16,
  },
  white: {
    color: "#fff",
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#fcd34d",
    elevation: 3,
    marginTop: 15,
    width: 125,
  },
  input: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
});

export default NewFolder;
