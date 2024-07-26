import { useState, useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, Pressable, ScrollView, View } from "react-native";
import {
  TRenderEngineProvider,
  RenderHTMLConfigProvider,
} from "react-native-render-html";
import Spinner from "react-native-loading-spinner-overlay";
import { NativeRouter, Routes, Route } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SQLite from "expo-sqlite";
import { loginUser, getUserData } from "./utils/api";
import Login from "./states/Login";
import Account from "./states/Account";
import NewFolder from "./states/NewFolder";
import NewNote from "./states/NewNote";
import Options from "./components/Options";
import Settings from "./components/Settings";
import Menu from "./components/Menu";
import Tree from "./components/Tree";
import SystemNotif from "./components/SystemNotif";
import UserSettings from "./components/UserSettings";
import { v4 as uuidv4 } from "uuid";

const customStyles = {
  body: { color: "#fff", fontSize: 12 },
};

const App = () => {
  const [allData, setAllData] = useState({
    user: { username: "", email: "", userId: "", createdAt: "" },
    folders: [],
    notes: [],
  });
  const [user, setUser] = useState(null);
  const [systemNotifs, setSystemNotifs] = useState([]);
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
  const [userSettingsOpen, setUserSettingsOpen] = useState(false);
  const [systemFolder, setSystemFolder] = useState("main");
  const [pickFolder, setPickFolder] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [layoutOptions, setLayoutOptions] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [view, setView] = useState(false);
  const [order, setOrder] = useState(false);
  const [theme, setTheme] = useState({ on: false, color: "bg-amber-300" });
  const [autoSave, setAutoSave] = useState(false);
  const [appLock, setAppLock] = useState(false);
  const [sort, setSort] = useState("Title");
  const [saveLocation, setSaveLocation] = useState(false);
  const [location, setLocation] = useState(null);
  const [db, setDb] = useState(null);

  useEffect(() => {
    if (!db) {
      setDatabase();
    }
    if (db) {
      createTables();
    }
  }, [db]);

  const setDatabase = async (store) => {
    const myStore = await SQLite.openDatabaseAsync("localstore");
    setDb(myStore);
  };

  useEffect(() => {
    setFolders([]);
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

  const fetchLocation = () => {
    const theFolder = allData.folders.filter(
      (fold) => fold.folderid === location
    );
    const subfolders = allData.folders.filter(
      (fold) => fold.parentFolderId === location
    );
    const nestedNotes = allData.notes.filter(
      (aNote) => aNote.folderId === location
    );
    setFolders(subfolders);
    setNotes(nestedNotes);
    setMainTitle(theFolder.title);
    setLocation(null);
  };

  const findChildNotes = () => {
    if (!folder && allData.folders.length > 0 && allData.notes.length > 0) {
      const topFolders = allData.folders.filter(
        (fold) => fold.parentFolderId === null
      );
      const topNotes = allData.notes.filter((aNote) => !aNote.folderId);
      setNotes(topNotes);
      setFolders(topFolders);
      setMainTitle("Folders");
      return;
    }
    if (folder) {
      const subfolders = allData.folders.filter(
        (fold) => fold.parentFolderId === folder.folderid
      );
      const nestedNotes = allData.notes.filter(
        (aNote) => aNote.folderId === folder.folderid
      );
      setFolders(subfolders);
      setNotes(nestedNotes);
      setMainTitle(folder.title);
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
    setNotes(allData.notes.filter((note) => note?.locked));
    setMainTitle("Locked Notes");
  };

  const getAll = () => {
    setNotes(allData.notes);
    setMainTitle("All Notes");
  };

  const getTrash = () => {
    setNotes(allData.notes.filter((note) => note?.trashed));
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

  const storeToken = async (storedToken) => {
    try {
      await AsyncStorage.setItem("authToken", storedToken);
      setToken(storedToken);
    } catch (err) {
      console.log(err);
    }
  };

  const handleLogin = async (username, email, password, type) => {
    await loginUser(username, email, password)
      .then((res) => {
        const newToken = res.data.data;
        setToken(newToken);
        storeToken(newToken);
        const newNotifs = [
          {
            id: uuidv4(),
            color: "#55ff55",
            title: "Login Successful",
            text: "Welcome back!",
            actions: [{ text: "close", func: () => setSystemNotifs([]) }],
          },
        ];
        setSystemNotifs(newNotifs);
      })
      .catch((err) => {
        const newNotifs = [
          {
            id: uuidv4(),
            color: "#ff5555",
            title: `Error ${type}`,
            text: err.response.data.message,
            actions: [{ text: "close", func: () => setSystemNotifs([]) }],
          },
        ];
        setSystemNotifs(newNotifs);
      });
  };

  const removeToken = async () => {
    await AsyncStorage.removeItem("authToken");
  };

  const deleteDatabase = async () => {
    try {
      await db.closeAsync();
      await SQLite.deleteDatabaseAsync("localstore");
      console.log("Database deleted successfully.");
    } catch (error) {
      console.error("Error deleting database:", error);
    }
  };

  const setPreferences = (dbUser) => {
    const stringPrefs = dbUser?.preferences;
    if (stringPrefs) {
      const preferences = JSON.parse(dbUser.preferences);
      if (preferences.darkMode !== null || preferences.darkMode !== undefined) {
        setDarkMode(preferences.darkMode);
      } else {
        setDarkMode(true);
      }
      if (preferences.theme.on) {
        setTheme({ on: true, color: preferences.theme.color });
      } else {
        setTheme({
          on: false,
          color: preferences.theme.color
            ? preferences.theme.color
            : "bg-amber-300",
        });
      }
      if (preferences.view === true) {
        setView(true);
      } else {
        setView(false);
      }
      if (preferences.autoSave === true) {
        setAutoSave(preferences.autoSave);
      } else {
        setAutoSave(false);
      }
      if (preferences.appLock === true) {
        setAppLock(true);
      } else {
        setAppLock(false);
      }
      if (preferences.order === true) {
        setOrder(true);
      } else {
        setOrder(false);
      }
      if (preferences.sort) {
        setSort(preferences.sort);
      } else {
        setSort("Title");
      }
      setSaveLocation(preferences.saveLocation);
      setLocation(preferences?.location);
    } else {
      console.log("No preferences");
    }
  };

  const fetchFromDb = async () => {
    try {
      const dbUser = await db.getFirstAsync(`SELECT * FROM user`);
      const dbFolders = await db.getAllAsync(`SELECT * FROM folders`);
      const dbNotes = await db.getAllAsync(`SELECT * FROM notes`);
      setPreferences(dbUser);
      const newAllData = { user: dbUser, folders: dbFolders, notes: dbNotes };
      return newAllData;
    } catch (err) {
      console.log("selecting data", err);
      return { user: null, folders: [], notes: [] };
    }
  };

  const createTables = async () => {
    // await deleteDatabase();
    // return;
    try {
      await db.execAsync(`
   CREATE TABLE IF NOT EXISTS user (
     userId INTEGER PRIMARY KEY NOT NULL, 
     username TEXT NOT NULL, 
     email TEXT NOT NULL, 
     createdAt TEXT NOT NULL,
     preferences TEXT NOT NULL
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

  const storeDataInDb = async (data) => {
    try {
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
    INSERT INTO user (userId, username, email, createdAt, preferences)
    VALUES (?, ?, ?, ?, ?);
   `,
        user.userId,
        user.username,
        user.email,
        user.createdAt,
        JSON.stringify({
          darkMode: darkMode,
          theme: theme,
          view: view,
          order: order,
          autoSave: autoSave,
          appLock: appLock,
          sort: sort,
          saveLocation: true,
          location: "null",
        })
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
        storedData.folders.map((fold) => fold.folderid)
      );
      const localNotesIdSet = new Set(
        storedData.notes.map((aNote) => aNote.noteid)
      );
      const foldersToStore = serverFolders.filter(
        (fold) => !localFoldersIdSet.has(fold.folderid)
      );
      const notesToStore = serverNotes.filter(
        (aNote) => !localNotesIdSet.has(aNote.noteid)
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
        userToStore: serverUser,
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
    // getData(storedData);
  };

  const getData = (storedData) => {
    const notesToRender = storedData.notes.filter(
      (aNote) => aNote.folderId == null
    );
    setNotes(notesToRender);
    getUserData(token)
      .then(async (response) => {
        const data = response.data.data;
        const dataToStore = filterData(
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
      .catch((err) => {
        console.log(err);
        setToken(null);
        setUser(null);
        removeToken();
      })
      .finally(() => {
        console.log("Finished data");
      });
  };

  const setNewLocation = (id) => {
    const newPreferences = {
      order: order,
      appLock: appLock,
      autoSave: autoSave,
      darkMode: darkMode,
      theme: theme,
      view: view,
      sort: sort,
      saveLocation: saveLocation,
      location: id,
    };
    try {
      db.runAsync(
        `
        UPDATE user SET preferences = ? WHERE userId = ?
        `,
        [JSON.stringify(newPreferences), user.userId]
      );
    } catch (err) {
      console.log(err);
    }
  };

  const goBack = () => {
    if (note) {
      setNote(null);
      return true;
    }
    if (userSettingsOpen) {
      setUserSettingsOpen(false);
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
    if (layoutOptions) {
      setLayoutOptions(false);
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
    if (parentId === null && systemFolder !== "main") {
      setSystemFolder("main");
      setMainTitle("Folders");
      setFolder(null);
      if (saveLocation) {
        setNewLocation(null);
      }
      return true;
    }
    if (parentId === null && folder === null) {
      return false;
    }
    if (parentId !== null) {
      const parentFolder = allData.folders.filter(
        (fold) => fold.folderid === parentId
      )[0];
      setFolder(parentFolder);
      if (saveLocation) {
        setNewLocation(parentFolder.id);
      }
      return true;
    }
    if (parentId === null) {
      setFolder(null);
      return true;
    }
  };

  const saveNewLocation = () => {
    setPickFolder(false);
  };

  return (
    <NativeRouter>
      <TRenderEngineProvider tagsStyles={customStyles}>
        <RenderHTMLConfigProvider>
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
                      pickFolder={pickFolder}
                      open={open}
                      menuOpen={menuOpen}
                      options={options}
                      setOptions={setOptions}
                      note={note}
                      setNote={setNote}
                      allNotes={allData.notes}
                      setMenuOpen={setMenuOpen}
                      systemFolder={systemFolder}
                      layoutOptions={layoutOptions}
                      setLayoutOptions={setLayoutOptions}
                      userSettingsOpen={userSettingsOpen}
                      view={view}
                      setView={setView}
                      order={order}
                      setOrder={setOrder}
                      sort={sort}
                      setSort={setSort}
                      saveLocation={saveLocation}
                      autoSave={autoSave}
                      darkMode={darkMode}
                      theme={theme}
                      appLock={appLock}
                      user={user}
                      db={db}
                    />
                  )
                }
              >
                <Route
                  path="newfolder"
                  element={
                    <NewFolder
                      setAllData={setAllData}
                      folder={folder}
                      token={token}
                      db={db}
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
                      setNote={setNote}
                      db={db}
                    />
                  }
                />
              </Route>
            </Routes>
            {!note ? (
              <Options setOptions={setOptions} options={options} />
            ) : null}
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
                db={db}
                setSystemNotifs={setSystemNotifs}
              />
            ) : null}
            {allData ? (
              <>
                <Menu
                  menuOpen={menuOpen}
                  setMenuOpen={setMenuOpen}
                  folders={folders}
                  setFolder={setFolder}
                  allData={allData}
                  systemFolder={systemFolder}
                  setSystemFolder={setSystemFolder}
                  setPickFolder={setPickFolder}
                  setUserSettingsOpen={setUserSettingsOpen}
                />
                <UserSettings
                  open={userSettingsOpen}
                  setOpen={setUserSettingsOpen}
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  setSystemNotifs={setSystemNotifs}
                  setMenuOpen={setMenuOpen}
                  setAllData={setAllData}
                  setUser={setUser}
                  deleteDatabase={deleteDatabase}
                  view={view}
                  setView={setView}
                  order={order}
                  setOrder={setOrder}
                  theme={theme}
                  setTheme={setTheme}
                  appLock={appLock}
                  setAppLock={setAppLock}
                  autoSave={autoSave}
                  setAutoSave={setAutoSave}
                  sort={sort}
                  setSort={setSort}
                  saveLocation={saveLocation}
                  setSaveLocation={setSaveLocation}
                  db={db}
                  user={user}
                />
              </>
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
                      setMenuOpen={setMenuOpen}
                    />
                    <Text style={[styles.white, { marginTop: 10 }]}>
                      {open.item.title} &rarr;{" "}
                      {selectedFolder ? selectedFolder.title : ""}
                    </Text>
                    <Pressable
                      style={styles.topLevel}
                      onPress={() => {
                        setSelectedFolder({
                          folderid: null,
                          title: "Top level",
                        });
                      }}
                    >
                      <Text style={styles.white}>Send to top level</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => saveNewLocation()}
                      style={styles.saveFolder}
                    >
                      <Text>Save</Text>
                    </Pressable>
                  </View>
                </ScrollView>
              </>
            ) : null}
            {systemNotifs.map((notif, index) => (
              <SystemNotif
                setSystemNotifs={setSystemNotifs}
                systemNotifs={systemNotifs}
                notif={notif}
                index={index}
              />
            ))}
          </View>
        </RenderHTMLConfigProvider>
      </TRenderEngineProvider>
    </NativeRouter>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 25,
    paddingTop: 25,
  },
  text: {
    color: "#fff",
    textAlign: "center",
  },
  white: {
    color: "#fff",
    textAlign: "center",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  tree: {
    marginTop: 40,
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
    paddingHorizontal: 10,
  },
  topLevel: {
    marginTop: 20,
    backgroundColor: "#222",
    borderWidth: 1,
    borderColor: "#fff",
    padding: 8,
    borderRadius: 10,
    elevation: 2,
  },
  saveFolder: {
    marginVertical: 10,
    backgroundColor: "#fcd34d",
    padding: 8,
    borderRadius: 10,
    elevation: 2,
  },
});

export default App;
