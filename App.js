import { useState, useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, Pressable, View, TextInput } from "react-native";
import Spinner from "react-native-loading-spinner-overlay";
import { NativeRouter, Routes, Route } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SQLite from "expo-sqlite";
import { loginUser, getUserData } from "./utils/api";
import Icon from "react-native-vector-icons/Feather";
import Login from "./states/Login";
import Account from "./states/Account";
import NewFolder from "./states/NewFolder";
import NewNote from "./states/NewNote";
import Options from "./components/Options";
import Settings from "./components/Settings";
import Menu from "./components/Menu";
import Tree from "./components/Tree";

export default function App() {
 const [allData, setAllData] = useState(null);
 const [user, setUser] = useState(null);
 const [folders, setFolders] = useState([]);
 const [folder, setFolder] = useState(null);
 const [notes, setNotes] = useState([]);
 const [mainTitle, setMainTitle] = useState("Folders");
 const [token, setToken] = useState("");
 const [options, setOptions] = useState(false);
 const [loading, setLoading] = useState(true);
 const [open, setOpen] = useState({ show: false, folder: null });
 const [note, setNote] = useState(null);
 const [menuOpen, setMenuOpen] = useState(false);
 const [systemFolder, setSystemFolder] = useState("main");
 const [pickFolder, setPickFolder] = useState(false);
 const [selectedFolder, setSelectedFolder] = useState(null);

 useEffect(() => {
  if (systemFolder === "main") {
   return;
  }
  if (systemFolder === "locked") {
   getLocked();
  }
  if (systemFolder === "all") {
   getAll();
  }
  if (systemFolder === "trash") {
   getTrash();
  }
 }, [systemFolder]);

 useEffect(() => {
  if (allData) {
   if (!folder) {
    const topFolders = allData.folders.filter(
     fold => fold.parentFolderId === null
    );
    const topNotes = allData.notes.filter(aNote => aNote.folderId === null);
    setFolders(topFolders);
    setNotes(topNotes);
    setMainTitle("Folders");
   }
   if (folder) {
    const subfolders = allData.folders.filter(
     fold => fold.parentFolderId === folder.folderid
    );
    const nestedNotes = allData.notes.filter(
     aNote => aNote.folderId === folder.folderid
    );
    setFolders(subfolders);
    setNotes(nestedNotes);
    setMainTitle(folder.title);
   }
  }
 }, [folder, allData]);

 useEffect(() => {
  if (token) {
   getData();
  }
  if (!token) {
   getToken();
  }
 }, [token]);

 const getLocked = () => {
  setNotes(allData.notes.filter(note => note?.locked));
  setMainTitle("Locked Notes");
 };

 const getAll = () => {
  setFolder(null);
  setNotes(allData.notes);
  setMainTitle("All Notes");
 };

 const getTrash = () => {
  setNotes([]);
  setMainTitle("Trash");
 };

 const getToken = async () => {
  try {
   const tokenString = await AsyncStorage.getItem("authToken");
   if (!tokenString) {
    setLoading(false);
   }
   setToken(tokenString);
  } catch (err) {
   console.log(err);
  }
 };

 const storeToken = async storedToken => {
  try {
   await AsyncStorage.setItem("authToken", storedToken);
   setToken(storedToken);
  } catch (err) {
   console.log(err);
  }
 };

 const handleLogin = (username, email, password) => {
  loginUser(username, email, password)
   .then(res => {
    const newToken = res.data.data;
    setToken(newToken);
    storeToken(newToken);
   })
   .catch(err => {
    console.log(err);
   })
   .finally(() => {
    console.log("Finished login");
   });
 };

 const removeToken = async () => {
  await AsyncStorage.removeItem("authToken");
 };

 const deleteDatabase = async () => {
  try {
   await SQLite.deleteDatabaseAsync("localstore");
   console.log("Database deleted successfully.");
  } catch (error) {
   console.error("Error deleting database:", error);
  }
 };

 const fetchFromDb = async () => {
  //await deleteDatabase();
  // return;
  try {
   const db = await SQLite.openDatabaseAsync("localstore");
   const dbUser = await db.getFirstAsync(`SELECT * FROM user`);
   const dbFolders = await db.getAllAsync(`SELECT * FROM folders`);
   const dbNotes = await db.getAllAsync(`SELECT * FROM notes`);
   //   console.log(`user: ${JSON.stringify(dbUser, null, 2)}`);
   // console.log(`folders: ${JSON.stringify(dbFolders, null, 2)}`);
   // console.log(`notes: ${JSON.stringify(dbNotes, null, 2)}`);
   //return;
   const newAllData = { user: dbUser, folders: dbFolders, notes: dbNotes };
   return newAllData;
  } catch (err) {
   console.log("selecting data", err);
  }
 };

 const storeDataInDb = async data => {
  try {
   const db = await SQLite.openDatabaseAsync("localstore");
   const serverUser = data.user;
   const serverFolders = data.folders;
   const serverNotes = data.notes;
   await db.execAsync(`
   CREATE TABLE IF NOT EXISTS user (
     userId INTEGER PRIMARY KEY NOT NULL, 
     username TEXT NOT NULL, 
     email TEXT NOT NULL, 
     createdAt TEXT NOT NULL
    );
   CREATE TABLE IF NOT EXISTS folders (
     folderid INTEGER PRIMARY KEY NOT NULL, 
     title TEXT NOT NULL, 
     color TEXT NOT NULL, 
     parentFolderId TEXT
    );
   CREATE TABLE IF NOT EXISTS notes (
     title TEXT NOT NULL, 
     noteid TEXT NOT NULL, 
     locked BOOLEAN, 
     htmlText TEXT NOT NULL, 
     folderId TEXT, 
     createdAt TIMESTAMP NOT NULL, 
     updated TIMESTAMP NOT NULL, 
     trashed BOOLEAN
    );
  `);
   storeUserInDb(db, serverUser);
   storeFoldersInDb(db, serverFolders);
   storeNotesInDb(db, serverNotes);
  } catch (err) {
   console.log("creating tables", err);
  }
 };

 const storeUserInDb = async (db, user) => {
  try {
   await db.runAsync(
    `
    INSERT INTO user (userId, username, email, createdAt)
    VALUES (?, ?, ?, ?);
   `,
    user.userId,
    user.username,
    user.email,
    user.createdAt
   );
  } catch (err) {
   console.log("inserting user", err);
  }
 };

 const storeFoldersInDb = async (db, folders) => {
  try {
   for (const folder of folders) {
    await db.runAsync(
     `
    INSERT INTO folders (folderid, title, color, parentFolderId)
    VALUES (?, ?, ?, ?);
   `,
     folder.folderid,
     folder.title,
     folder.color,
     folder.parentFolderId
    );
   }
  } catch (err) {
   console.log("inserting folders", err);
  }
 };

 const storeNotesInDb = async (db, notes) => {
  try {
   for (const note of notes) {
    await db.runAsync(
     `
    INSERT INTO notes (noteid, title, locked, htmlText, folderId, createdAt,
    updated, trashed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
   `,
     note.noteid,
     note.title,
     note.locked,
     note.htmlText,
     note.folderId,
     note.createdAt,
     note.updated,
     note.trashed
    );
   }
  } catch (err) {
   console.log("inserting notes", err);
  }
 };

 const getData = async () => {
  const allDbData = await fetchFromDb();
  console.log("db user", allDbData.user);
  //setUser(JSON.stringify(allDbData.user));
  setAllData(allDbData);
  setLoading(false);
  getUserData(token)
   .then(response => {
    const data = response.data.data;
    setAllData(data);
    setUser(data.user);
    console.log("server user", data.user);
    setLoading(false);
    storeDataInDb(data);
   })
   .catch(err => {
    console.log(err);
    setToken(null);
    setUser(null);
    removeToken();
   })
   .finally(() => {
    console.log("Finished data");
   });
 };

 const goBack = () => {
  if (note) {
   setNote(null);
  }
  const parentId = folder.parentFolderId;
  if (!parentId && mainTitle !== "Folders") {
   setMainTitle("Folders");
   return setFolder(null);
  }
  if (!parentId) {
   return setFolder(null);
  }
  const parentFolder = allData.folders.filter(
   fold => fold.folderid === parentId
  )[0];
  setNote(null);
  setFolder(parentFolder);
 };

 const saveNewLocation = () => {
  setPickFolder(false);
 };

 const toggleOptions = () => {
  setOptions(prev => !prev);
 };

 return (
  <NativeRouter>
   <View style={styles.container}>
    <StatusBar style="light" />
    <Spinner visible={loading} />
    <Routes>
     <Route
      path="/"
      element={
       !user ? (
        loading ? (
         <Spinner visible={loading} />
        ) : (
         <Login handleLogin={handleLogin} />
        )
       ) : (
        <Account
         mainTitle={mainTitle}
         folders={folders}
         notes={notes}
         setNotes={setNotes}
         folder={folder}
         setFolder={setFolder}
         goBack={goBack}
         setOpen={setOpen}
         note={note}
         setNote={setNote}
         allNotes={allData?.notes}
         setMenuOpen={setMenuOpen}
        />
       )
      }
     >
      <Route
       path="newfolder"
       element={
        <NewFolder setAllData={setAllData} folder={folder} token={token} />
       }
      />
      <Route
       path="newnote"
       element={
        <NewNote
         folder={folder}
         token={token}
         setAllData={setAllData}
         note={note}
        />
       }
      />
     </Route>
    </Routes>
    <Options setOptions={setOptions} options={options} />
    {open.show && (
     <Settings
      item={open.item}
      type={open.type}
      setOpen={setOpen}
      token={token}
      setAllData={setAllData}
      setPickFolder={setPickFolder}
      selectedFolder={selectedFolder}
      setSelectedFolder={setSelectedFolder}
     />
    )}
    {allData && (
     <Menu
      menuOpen={menuOpen}
      setMenuOpen={setMenuOpen}
      folders={folders}
      setFolder={setFolder}
      allData={allData}
      systemFolder={systemFolder}
      setSystemFolder={setSystemFolder}
      setPickFolder={setPickFolder}
      setAllData={setAllData}
      setUser={setUser}
     />
    )}
    {pickFolder && (
     <>
      <Pressable
       onPress={() => {
        setSelectedFolder(null);
        setPickFolder(false);
       }}
       style={styles.backdrop}
      ></Pressable>
      <View style={styles.pickFolder}>
       <Tree
        moving={true}
        setPickFolder={setPickFolder}
        setSelectedFolder={setSelectedFolder}
        setFolder={setFolder}
        folders={allData.folders}
        parentId={null}
        level={1}
        open={open}
       />
       <Text style={[styles.white, { marginTop: 10 }]}>
        {open.item.title} &rarr; {selectedFolder ? selectedFolder.title : ""}
       </Text>
       <Pressable
        style={styles.topLevel}
        onPress={() => {
         setSelectedFolder({ folderid: null, title: "Top level" });
        }}
       >
        <Text style={styles.white}>Send to top level</Text>
       </Pressable>
       <Pressable onPress={() => saveNewLocation()} style={styles.saveFolder}>
        <Text>Save</Text>
       </Pressable>
      </View>
     </>
    )}
    {user && (
     <Pressable onPress={() => toggleOptions()} style={styles.addIcon}>
      <Icon name="edit" style={styles.iconColor} />
     </Pressable>
    )}
   </View>
  </NativeRouter>
 );
}

const styles = StyleSheet.create({
 container: {
  flex: 1,
  backgroundColor: "#000",
  paddingHorizontal: 25,
  paddingTop: 25
 },
 text: {
  color: "#fff",
  textAlign: "center"
 },
 white: {
  color: "#fff",
  textAlign: "center"
 },
 addIcon: {
  position: "absolute",
  bottom: 10,
  right: 10,
  padding: 20,
  borderRadius: 1000,
  backgroundColor: "#111"
 },
 iconColor: {
  color: "#fcd34d",
  fontSize: 15
 },
 backdrop: {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: "rgba(0,0,0,0.4)"
 },
 pickFolder: {
  position: "absolute",
  top: 25,
  left: 5,
  right: 5,
  backgroundColor: "#222",
  borderRadius: 10,
  elevation: 2,
  padding: 8
 },
 topLevel: {
  marginTop: 20,
  backgroundColor: "#222",
  borderWidth: 1,
  borderColor: "#fff",
  padding: 8,
  borderRadius: 10,
  elevation: 2
 },
 saveFolder: {
  marginTop: 10,
  backgroundColor: "#fcd34d",
  padding: 8,
  borderRadius: 10,
  elevation: 2
 }
});
