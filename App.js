import { useState, useEffect } from "react";
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
import {
  loginUser,
  signupUser,
  getUserData,
  createNewFolder,
  createNewNote,
} from "./utils/api";
import * as LocalAuthentication from "expo-local-authentication";
import Login from "./states/Login";
import Signup from "./states/Signup";
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
import { GestureHandlerRootView } from "react-native-gesture-handler";

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
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!db) {
      setDatabase();
    }
    if (db) {
      createTables();
    }
  }, [db]);

  const generateDb = async () => {
    const db = await SQLite.openDatabaseAsync("localstore");
    return db;
  };

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
    if (allData) {
      if (location && saveLocation) {
        fetchLocation();
      } else {
        findChildNotes();
      }
    }
  }, [folder, allData]);

  const fetchLocation = () => {
    /*TODO:
      1. Possibly uncomment out a few of these comments to create faster responsiveness
    */
    setLocation(null);
    const theFolder = allData.folders.filter(
      (fold) => fold.folderid === location
    );
    // const subfolders = allData.folders.filter(
    //   (fold) => fold.parentFolderId === location
    // );
    // const nestedNotes = allData.notes.filter(
    //   (aNote) => aNote.folderId === location
    // );
    // setNotes(nestedNotes);
    setFolder(theFolder[0] ? theFolder[0] : null);
    // setFolders(subfolders);
    // setMainTitle(theFolder[0] ? theFolder[0].title : "Folders");
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
      setNotes(nestedNotes);
      setFolders(subfolders);
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

  const handleSignup = (username, email, password) => {
    signupUser(username, email, password)
      .then((res) => {
        const newNotifs = [
          {
            id: uuidv4(),
            color: "#55ff55",
            title: "Successful Signup!",
            text: "Welcome, please login to access your account",
            actions: [{ text: "close", func: () => setSystemNotifs([]) }],
          },
        ];
        setSystemNotifs(newNotifs);
        return true;
      })
      .catch((err) => {
        console.log(err);
        const newNotifs = [
          {
            id: uuidv4(),
            color: "#ff5555",
            title: "Error Signing Up",
            text:
              err.response.data.message ||
              "It looks like there might be an issue with your internet connection, please try to sign up again",
            actions: [{ text: "close", func: () => setSystemNotifs([]) }],
          },
        ];
        setSystemNotifs(newNotifs);
        return false;
      });
  };

  const handleLogin = async (username, email, password) => {
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

  const authenticateUser = async () => {
    LocalAuthentication.authenticateAsync({})
      .then((res) => {
        if (!res.success) {
          if (tries > 2) {
            const newNotifs = [
              {
                id: uuidv4(),
                color: "#fde047",
                title: "Last Attempt",
                text: "You have attempted to unlock your notes 3 times. One more failed attempt and the app will close and you will be logged out for your security",
                actions: [{ text: "close", func: () => setSystemNotifs([]) }],
              },
            ];
            setSystemNotifs(newNotifs);
          }
          if (tries > 3) {
            console.log("kill app");
          }
          authenticateUser();
          setTries((prev) => prev + 1);
        }
        if (res.success) {
          return true;
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const setPreferences = async (dbUser) => {
    const stringPrefs = dbUser?.preferences;
    if (stringPrefs) {
      const preferences = JSON.parse(dbUser.preferences);
      if (preferences.darkMode !== null || preferences.darkMode !== undefined) {
        setDarkMode(preferences.darkMode);
      } else {
        setDarkMode(true);
      }
      setTheme({
        on: preferences.theme.on,
        color: preferences.theme.color
          ? preferences.theme.color
          : "bg-amber-300",
      });
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
        await authenticateUser();
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
     locked BOOLEAN DEFAULT FALSE, 
     htmlText TEXT, 
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
    let tempDb = db;
    if (!tempDb) {
      tempDb = await generateDb();
    }
    try {
      const userToStore = data.userToStore;
      const foldersToStore = data.foldersToStore;
      const notesToStore = data.notesToStore;
      const notesToRemove = data.notesToRemove;
      const foldersToRemove = data.foldersToRemove;
      if (userToStore) {
        await storeUserInDb(tempDb, userToStore);
      }
      if (foldersToStore.length > 0) {
        await storeFoldersInDb(tempDb, foldersToStore);
      }
      if (notesToStore.length > 0) {
        await storeNotesInDb(tempDb, notesToStore);
      }
      if (notesToRemove.length > 0) {
        removeNotesFromDb(tempDb, notesToRemove);
      }
      if (foldersToRemove.length > 0) {
        removeFoldersFromDb(tempDb, foldersToRemove);
      }
    } catch (err) {
      console.log("Storing new user data error: ", err);
    }
  };

  const storeUserInDb = async (db, user) => {
    console.log(
      `Attempting to store user in local database. Checking if database exists or not`
    );
    console.log(db, user);
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
          note.locked || note.locked === 1 ? true : false,
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

  const removeFoldersFromDb = async (db, foldersToRemove) => {
    try {
      foldersToRemove.forEach(async (fold) => {
        await db.runAsync(
          `
            DELETE FROM folders WHERE folderid = $deleteid
          `,
          { $deleteId: fold.folderid }
        );
      });
    } catch (err) {
      console.log(`Error removing folder from local DB. Error: ${err}`);
    }
  };

  const removeNotesFromDb = async (db, notesToRemove) => {
    try {
      notesToRemove.forEach(async (note) => {
        await db.runAsync(
          `
            DELETE FROM notes WHERE noteid = $deleteid
          `,
          { $deleteId: note.noteid }
        );
      });
    } catch (err) {
      console.log(`Errors removing notes from localDB. Error: ${err}`);
    }
  };

  const filterData = (serverFolders, serverNotes, serverUser, storedData) => {
    if (storedData.folders && storedData.notes && storedData.user) {
      // Build unique Folder and Note ID sets
      const localFoldersIdSet = new Set(
        storedData.folders.map((fold) => fold.folderid)
      );
      const localNotesIdSet = new Set(
        storedData.notes.map((aNote) => aNote.noteid)
      );

      // Update local
      // Folders to rove from local. What local has and server does not change when
      //offline mode is created
      const foldersToRemove = storedData.folders.filter(
        (fold) =>
          !serverFolders.some((aFold) => aFold.folderid === fold.folderid)
      );
      // Notes to rove from local. What local has and server does not change when
      //	offline mode is created
      const notesToRemove = storedData.notes.filter(
        (not) => !serverFolders.some((aNote) => aNote.noteid === not.noteid)
      );

      // Only folders that local does NOT have
      const foldersToStore = serverFolders.filter(
        (fold) => !localFoldersIdSet.has(fold.folderid)
      );
      // Only notes that local does NOT have
      const notesToStore = serverNotes.filter(
        (aNote) => !localNotesIdSet.has(aNote.noteid)
      );
      // Update local

      if (serverUser.userId === storedData.user.userId) {
        return {
          foldersToStore,
          notesToStore,
          userToStore: null,
          foldersToRemove,
          notesToRemove,
        };
      } else {
        return {
          foldersToStore,
          notesToStore,
          userToStore: serverUser,
          foldersToRemove,
          notesToRemove,
        };
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
    getData(storedData);
  };

  const getData = (storedData) => {
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
        setFolders(data.folders);
        setUser(data.user);
        setLoading(false);
        await storeDataInDb(dataToStore);
      })
      .catch((err) => {
        console.log(err);
        setToken(null);
        setUser(null);
        if (err.response?.status === 401) {
          removeToken();
        }
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
      <GestureHandlerRootView>
        <TRenderEngineProvider tagsStyles={customStyles}>
          <RenderHTMLConfigProvider>
            <View
              style={[
                styles.container,
                { backgroundColor: darkMode ? "#000" : "#eee" },
              ]}
            >
              <StatusBar style={darkMode ? "light" : "dark"} />
              <Spinner visible={loading} />
              <Routes>
                <Route
                  path="/signup"
                  element={<Signup handleSignup={handleSignup} />}
                />
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
                        darkMode={darkMode}
                        theme={theme}
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
                        autoSave={autoSave}
                        theme={theme}
                        darkMode={darkMode}
                      />
                    }
                  />
                </Route>
              </Routes>
              {!note ? (
                <Options
                  setOptions={setOptions}
                  options={options}
                  darkMode={darkMode}
                  theme={theme.color}
                />
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
                  darkMode={darkMode}
                  theme={theme}
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
                    darkMode={darkMode}
                    theme={theme}
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
                  <ScrollView
                    style={[
                      styles.pickFolder,
                      { backgroundColor: darkMode ? "#222" : "#eee" },
                    ]}
                  >
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
                        darkMode={darkMode}
                      />
                      <Text
                        style={[
                          darkMode ? styles.white : styles.black,
                          { marginTop: 10 },
                        ]}
                      >
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
                        style={[
                          styles.saveFolder,
                          {
                            backgroundColor: theme.on ? theme.color : "#fcd34d",
                          },
                        ]}
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
                  darkMode={darkMode}
                />
              ))}
            </View>
          </RenderHTMLConfigProvider>
        </TRenderEngineProvider>
      </GestureHandlerRootView>
    </NativeRouter>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  black: {
    color: "#000",
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
    padding: 8,
    borderRadius: 10,
    elevation: 2,
  },
});

export default App;
