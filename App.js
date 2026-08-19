import { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, Pressable, ScrollView, View } from "react-native";
import {
  TRenderEngineProvider,
  RenderHTMLConfigProvider,
} from "react-native-render-html";
import Spinner from "react-native-loading-spinner-overlay";
import { NativeRouter, Routes, Route } from "react-router-native";
import { getUserData } from "./utils/api";
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
import {
  initializeSQLiteTables,
  openDB,
  replaceLocalCache,
  grabFromDatabase,
} from "./utils/sqLite";
import { getToken, removeToken } from "./utils/asyncStorage";

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
  const [saveLocation, setSaveLocation] = useState(true);
  const [location, setLocation] = useState(null);
  const [db, setDb] = useState(null);
  const [tries, setTries] = useState(0);

  // HANDLE REQUESTS TO SPECIAL SYSTEM LEVEL FOLDER STRUCTURES IN APP -------------
  useEffect(() => {
    // RESET FOLDERS TO NOTHING FOR ALL INSTANCES
    setFolders([]);

    switch (systemFolder) {
      case "main":
        findLastFolderLocationAndRoute(location);
        return;
      case "locked":
        getLocked();
        return;
      case "all":
        getAll();
        return;
      case "trash":
        getTrash();
        return;
      default:
        return;
    }
  }, [systemFolder]);

  // INITIALIZE ENTIRE APPLICATION -----------
  useEffect(() => {
    const openDatabase = async () => {
      // OPEN DATABASE -----------
      const db = await openDB();

      if (!db) {
        //  Database must be initialized down the line
        console.log("Database initialization failed inside useEffect");
        setLoading(false);
        return;
      }

      setDb(db);

      // BUILD TABLES IN DATABASE -----------
      const SQLiteTableInitializer = await initializeSQLiteTables(db);

      if (!SQLiteTableInitializer) {
        // Must build new tables down the line
        console.log("Databse table initilizer failed inside useEffect");
        setLoading(false);
        return;
      }

      // FIND EXISTING TOKEN ----------------
      const token = await getToken();

      if (token === null) {
        // User will login and build new token
        setLoading(false);
        return;
      }

      setToken(token);

      // TOKEN AND DB EXIST AT THIS POINT
      // GRAB CACHED DATA --------------------
      const {
        cachedUser,
        cachedFolders = [],
        cachedNotes = [],
      } = await grabFromDatabase(db);

      // IF USER DOES NOT EXIST IN CACHE DELETE TOKEN DATA AND FORCE LOGIN
      // KEEP DB OPEN
      if (!cachedUser) {
        console.log("User cache data does not exist");
        await resetAppStateAndForceLogin();
        return;
      }

      // INITIALIZE STALE CACHE DATA TO STATE AND LOAD APP ------------
      const currentPreferences = await applyPreferences(cachedUser);
      const cachedAllData = {
        user: cachedUser,
        folders: cachedFolders,
        notes: cachedNotes,
      };
      setAllData(cachedAllData);
      setUser(cachedUser);

      // MAKE SURE APP LOADS INTO LAST KNOWN LOCATION
      if (currentPreferences?.location) {
        findLastFolderLocationAndRoute(
          currentPreferences.location,
          cachedAllData,
        );
      }
      setLoading(false);

      // GRAB SERVER DATA ---------
      console.log("Grabbing server data");
      continueServerWork(token, cachedUser.preferences);
    };

    openDatabase();
  }, []);

  useEffect(() => {
    updatePageState();
  }, [folder, allData]);

  const resetAppStateAndForceLogin = async () => {
    // CHANGE IN FUTURE FOR OFFLINE SUPPORT
    await removeToken();
    setToken(false);
    setLoading(false);
    return;
  };

  const applyPreferences = async (dbUser) => {
    if (!dbUser?.preferences) {
      return null;
    }

    try {
      const preferences = JSON.parse(dbUser.preferences);

      setDarkMode(preferences.darkMode ?? true);

      setTheme({
        on: preferences.theme?.on ?? false,
        color: preferences.theme?.color ?? "bg-amber-300",
      });

      setView(preferences.view ?? false);
      setAutoSave(preferences.autoSave ?? false);
      setOrder(preferences.order ?? false);
      setSort(preferences.sort ?? "Title");
      setSaveLocation(preferences.saveLocation ?? true);
      setLocation(preferences.location ?? null);

      if (preferences.appLock) {
        const authenticated = await authenticateUser();

        if (!authenticated) {
          return null;
        }
      }

      setAppLock(preferences.appLock ?? false);

      return preferences;
    } catch (err) {
      console.error("Failed to load user preferences:", err);
      return null;
    }
  };

  const continueServerWork = async (token, preferences = null) => {
    console.log("Getting server data");
    console.log(token);
    const serverData = await getFreshServerData(token);

    console.log("Fetched fresh server data");

    if (!serverData) {
      //  WHY WAS THERE NO GOOD SERVER DATA
      // EITHER ERROR OR DATA FIELD MISSING
      // WHAT TO DO THEN?????
      // UPDATE RESETAPPSTATEANDFORCELOGIN METHOD
      // await //resetAppStateAndForceLogin();
      console.log("No server data");
      setLoading(false);
      return;
    }

    // UPDATE STATE WITH FRESH DATA FROM SERVER --------------
    setAllData(serverData);
    setUser(serverData.user);

    findLastFolderLocationAndRoute(preferences?.location, serverData);

    setLoading(false);

    // UPDATE CACHE WITH TRUE SERVER DATA FOR NEXT TIME
    const dataWasStored = await replaceLocalCache(serverData, db, preferences);

    if (!dataWasStored) {
      setTimeout(() => {
        // TRY SAVE ATTEMPT ONE MORE TIME
      }, 5000);
    }
  };

  const getFreshServerData = async (token) => {
    try {
      console.log("Right before getUserData call");
      const response = await getUserData(token);
      console.log("Right after getUserData call");

      const data = response.data.data;

      if (data) {
        console.log("Data exits from get User Data");
        return data;
      }

      console.log("Returning null. No server data exists");
      return null;
    } catch (err) {
      console.log("Error from server when fetching users data: ");
      console.log(err);
      return null;
    }
  };

  const updatePageState = (data = allData) => {
    // SEARCH AND FIND USERS INFORMATION BASED ON FOLDER LOCATION
    const folderId = folder?.folderid ?? null;

    const subfolders = data.folders.filter(
      (fold) => fold.parentFolderId === folderId,
    );

    const nestedNotes = data.notes.filter((note) => note.folderId === folderId);

    // SET CURRENT PAGE STATE
    setNotes(nestedNotes);
    setFolders(subfolders);
    setMainTitle(folder ? folder.title : "Folders");

    if (saveLocation) {
      setNewLocation(folder ? folder.folderid : null);
    }
  };

  const findLastFolderLocationAndRoute = (currentLocation, data = allData) => {
    let lastKnownLocation = currentLocation;

    // APP HAS NOT OFFICIALLY INITIALIZED QUITE YET
    if (!data) {
      lastKnownLocation = null;
    }

    // IF THE USER HAS OPT OUT OF SAVING LAST KNOWN FOLDER LOCATION THEN SET IT TO HOME/NULL
    if (!saveLocation) {
      lastKnownLocation = null;
    }

    const folderFound = allData?.folders
      ? allData.folders.find((f) => f.folderid === lastKnownLocation)
      : null;

    setFolder(folderFound);
  };

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

  const authenticateUser = async () => {
    return LocalAuthentication.authenticateAsync({})
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
            console.log("Lockout app");
          }
          authenticateUser();
          setTries((prev) => prev + 1);
        }
        if (res.success) {
          return true;
        }
        return false;
      })
      .catch((err) => {
        console.log(err);
        return false;
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
      if (db) {
        db.runAsync(
          `
          UPDATE user SET preferences = ? WHERE userId = ?
          `,
          [JSON.stringify(newPreferences), user.userId],
        );
      }

      setLocation(id);
    } catch (err) {
      console.log(err);
    }
  };

  // HANDLE NAVIGATING BACK IN APP ---------------
  const goBack = () => {
    // DO NOT NEED TO CHECK IF NOTE EXISTS IN THIS METHOD. /states/NewNote.js already handles "goBack"

    // CLOSING ALL MODALS BEFORE (IF ANY) FOLDER NAVIGATION LOGIC
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

    if (systemFolder !== "main") {
      setSystemFolder("main");
      return true;
    }
    // ALL MODALS ARE NOW CLOSED AND USER IS HOME

    const parentId = folder ? folder.parentFolderId : null;

    // CLOSE THE APPLICATION IF USER IS ALL THE WAY HOME AND REQUESTING BACK HANDLER
    if (parentId === null && folder === null) {
      return false;
    }

    // USER IS NAVIGATING BACK TO MAIN ENTRY
    if (parentId === null) {
      setFolder(null);
      return true;
    }

    // USER IS NAVIGATING BACK TO CUSTOM FOLDER
    if (parentId !== null) {
      const parentFolder =
        allData.folders.find((fold) => fold.folderid === parentId) ?? null;
      setFolder(parentFolder);
      return true;
    }
  };

  return (
    <NativeRouter>
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
                element={<Signup setSystemNotifs={setSystemNotifs} />}
              />
              <Route
                path="/"
                element={
                  !user ? (
                    loading ? (
                      <Spinner visible={loading} />
                    ) : (
                      <Login
                        setToken={setToken}
                        setUser={setUser}
                        setSystemNotifs={setSystemNotifs}
                        findLastFolderLocationAndRoute={
                          findLastFolderLocationAndRoute
                        }
                        continueServerWork={continueServerWork}
                      />
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
                      onPress={() => setPickFolder(false)}
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
                key={notif.id}
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
