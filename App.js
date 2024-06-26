import { useState, useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import {
 StyleSheet,
 Text,
 Pressable,
 ScrollView,
 View,
 TextInput
} from "react-native";
import { BackHandler } from "react-native";
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
 const [allData, setAllData] = useState({
  user: { username: "", email: "", userId: "", createdAt: "" },
  folders: [],
  notes: []
 });
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
  createTables();
 }, []);

 useEffect(() => {
  if (systemFolder === "main") {
   findChildNotes();
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
  if (allData.folders.length > 0 && allData.notes.length > 0) {
   findChildNotes();
  }
 }, [folder, allData]);

 const findChildNotes = () => {
  if (!folder && allData.folders.length > 0 && allData.notes.length > 0) {
   const topFolders = allData.folders.filter(
    fold => fold.parentFolderId === null
   );
   const topNotes = allData.notes.filter(aNote => aNote.folderId === null);
   setNotes(topNotes);
   setFolders(topFolders);
   setMainTitle("Folders");
   return;
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
   return;
  }
 };

 useEffect(() => {
  if (token) {
   grabFromDb();
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
   if (tokenString) {
    setToken(tokenString);
   }
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
  try {
   const db = await SQLite.openDatabaseAsync("localstore");
   const dbUser = await db.getFirstAsync(`SELECT * FROM user`);
   const dbFolders = await db.getAllAsync(`SELECT * FROM folders`);
   const dbNotes = await db.getAllAsync(`SELECT * FROM notes`);
   const newAllData = { user: dbUser, folders: dbFolders, notes: dbNotes };
   return newAllData;
  } catch (err) {
   console.log("selecting data", err);
   return { user: null, folders: [], notes: [] };
  }
 };

 const createTables = async () => {
  //  await deleteDatabase();
  // return;
  try {
   const db = await SQLite.openDatabaseAsync("localstore");
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
     parentFolderId INTEGER
    );
   CREATE TABLE IF NOT EXISTS notes (
     title TEXT NOT NULL, 
     noteid INTEGER NOT NULL, 
     locked BOOLEAN, 
     htmlText TEXT NOT NULL, 
     folderId INTEGER, 
     createdAt TIMESTAMP NOT NULL, 
     updated TIMESTAMP NOT NULL, 
     trashed BOOLEAN
    );
  `);
  } catch (err) {
   console.log(err);
  }
 };

 const storeDataInDb = async data => {
  try {
   const db = await SQLite.openDatabaseAsync("localstore");
   const userToStore = data.userToStore;
   const foldersToStore = data.foldersToStore;
   const notesToStore = data.notesToStore;
   if (userToStore) {
    await storeUserInDb(db, userToStore);
   }
   if (foldersToStore.length > 0) {
    await storeFoldersInDb(db, foldersToStore);
   }
   if (notesToStore.length > 0) {
    await storeNotesInDb(db, notesToStore);
   }
  } catch (err) {
   console.log("Storing new user data error: ", err);
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

 const filterData = (serverFolders, serverNotes, serverUser, storedData) => {
  if (storedData.folders && storedData.notes && storedData.user) {
   const localFoldersIdSet = new Set(
    storedData.folders.map(fold => fold.folderid)
   );
   const localNotesIdSet = new Set(storedData.notes.map(aNote => aNote.noteid));
   const foldersToStore = serverFolders.filter(
    fold => !localFoldersIdSet.has(fold.folderid)
   );
   const notesToStore = serverNotes.filter(
    aNote => !localNotesIdSet.has(aNote.noteid)
   );
   if (serverUser.userId === storedData.user.userId) {
    return { foldersToStore, notesToStore, userToStore: null };
   } else {
    return { foldersToStore, notesToStore, userToStore: serverUser };
   }
  } else {
   return {
    foldersToStore: serverFolders,
    notesToStore: serverNotes,
    userToStore: serverUser
   };
  }
 };

 const grabFromDb = async () => {
  const storedData = await fetchFromDb();
  if (
   storedData.user &&
   storedData.folders.length > 0 &&
   storedData.notes.length > 0
  ) {
   setAllData(storedData);
   setUser(storedData.user);
   setLoading(false);
  } else {
   console.log("No data");
  }
  getData(storedData);
 };

 const getData = storedData => {
  const notesToRender = storedData.notes.filter(
   aNote => aNote.folderId == null
  );
  setNotes(notesToRender);
  getUserData(token)
   .then(async response => {
    const data = response.data.data;
    const dataToStore = await filterData(
     data.folders,
     data.notes,
     data.user,
     storedData
    );
    setAllData(data);
    setUser(data.user);
    setLoading(false);
    await storeDataInDb(dataToStore);
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
   return true;
  }
  if (menuOpen) {
   setMenuOpen(false);
   return true;
  }
  if (options) {
   setOptions(false);
   return true;
  }
  if (pickFolder) {
   setPickFolder(false);
   setSelectedFolder(null);
   return true;
  }
  if (open.show) {
   setOpen({ show: false });
   return true;
  }
  const parentId = folder ? folder.parentFolderId : null;
  if (parentId === null && mainTitle !== "Folders") {
   setMainTitle("Folders");
   setFolder(null);
   return true;
  }
  if (parentId) {
   const parentFolder = allData.folders.filter(
    fold => fold.folderid === parentId
   )[0];
   setFolder(parentFolder);
   return true;
  }
  if (parentId === null) {
   return false;
  }
 };

 useEffect(() => {
  BackHandler.addEventListener("hardwareBackPress", goBack);
  return () => {
   BackHandler.removeEventListener("hardwareBackPress", goBack);
  };
 }, [folder, note, pickFolder, open, menuOpen, options, mainTitle]);

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
         allNotes={allData.notes}
         setMenuOpen={setMenuOpen}
        />
       )
      }
     >
      <Route
       path="newfolder"
       element={
        <NewFolder
         navigateBack={handleNavBack}
         setAllData={setAllData}
         folder={folder}
         token={token}
         SQLite={SQLite}
        />
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
         SQLite={SQLite}
        />
       }
      />
     </Route>
    </Routes>
    {user ? (
     <Pressable onPress={() => toggleOptions()} style={styles.addIcon}>
      <Icon name="edit" style={styles.iconColor} />
     </Pressable>
    ) : null}
    {!note ? <Options setOptions={setOptions} options={options} /> : null}
    {open.show ? (
     <Settings
      item={open.item}
      type={open.type}
      setOpen={setOpen}
      token={token}
      setAllData={setAllData}
      setPickFolder={setPickFolder}
      selectedFolder={selectedFolder}
      setSelectedFolder={setSelectedFolder}
      SQLite={SQLite}
     />
    ) : null}
    {allData ? (
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
    ) : null}
    {pickFolder ? (
     <>
      <Pressable
       onPress={() => {
        setSelectedFolder(null);
        setPickFolder(false);
       }}
       style={styles.backdrop}
      ></Pressable>
      <ScrollView style={styles.pickFolder}>
       <View style={styles.tree}>
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
      </ScrollView>
     </>
    ) : null}
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
 tree: {
  marginTop: 40
 },
 pickFolder: {
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: "#222",
  borderRadius: 10,
  elevation: 2,
  paddingVertical: 0,
  paddingHorizontal: 10
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
  marginVertical: 10,
  backgroundColor: "#fcd34d",
  padding: 8,
  borderRadius: 10,
  elevation: 2
 }
});
