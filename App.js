import { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, Pressable, ScrollView, View } from "react-native";
import { TRenderEngineProvider, RenderHTMLConfigProvider } from "react-native-render-html";
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
import { Feather } from "@expo/vector-icons";

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
      const { cachedUser, cachedFolders = [], cachedNotes = [] } = await grabFromDatabase(db);

      // IF USER DOES NOT EXIST IN CACHE DELETE TOKEN DATA AND FORCE LOGIN
      // KEEP DB OPEN
      if (!cachedUser) {
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
        findLastFolderLocationAndRoute(currentPreferences.location, cachedAllData);
      }
      setLoading(false);

      // GRAB SERVER DATA --------
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
    const serverData = await getFreshServerData(token);

    if (!serverData) {
      //  WHY WAS THERE NO GOOD SERVER DATA
      // EITHER ERROR OR DATA FIELD MISSING
      // WHAT TO DO THEN?????
      // UPDATE RESETAPPSTATEANDFORCELOGIN METHOD
      // await //resetAppStateAndForceLogin();
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
      const response = await getUserData(token);

      const data = response.data.data;

      if (data) {
        return data;
      }
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

    const subfolders = data.folders.filter((fold) => fold.parentFolderId === folderId);

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

    if (!data) {
      lastKnownLocation = null;
    }

    if (!saveLocation) {
      lastKnownLocation = null;
    }

    const folderFound =
      data?.folders?.find((folder) => folder.folderid === lastKnownLocation) ?? null;

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
          [JSON.stringify(newPreferences), user.userId]
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
      const parentFolder = allData.folders.find((fold) => fold.folderid === parentId) ?? null;
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
              {
                backgroundColor: darkMode ? "#111113" : "#fafafa",
              },
            ]}
          >
            <StatusBar style={darkMode ? "light" : "dark"} />
            <Spinner visible={loading} />
            <Routes>
              <Route path="/signup" element={<Signup setSystemNotifs={setSystemNotifs} />} />
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
                        findLastFolderLocationAndRoute={findLastFolderLocationAndRoute}
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
                pickFolder={pickFolder}
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
              <MoveFolderModal
                open={open}
                folders={allData.folders}
                selectedFolder={selectedFolder}
                setSelectedFolder={setSelectedFolder}
                setPickFolder={setPickFolder}
                setFolder={setFolder}
                setMenuOpen={setMenuOpen}
                darkMode={darkMode}
                theme={theme}
              />
            ) : null}
            {/* SYSTEM NOTIFICATIONS */}
            {systemNotifs.map((notif, index) => (
              <SystemNotif key={notif.id} notif={notif} index={index} darkMode={darkMode} />
            ))}
          </View>
        </RenderHTMLConfigProvider>
      </TRenderEngineProvider>
    </NativeRouter>
  );
};

const MoveFolderModal = ({
  open,
  folders,
  selectedFolder,
  setSelectedFolder,
  setPickFolder,
  setFolder,
  setMenuOpen,
  darkMode,
  theme,
}) => {
  const accent = theme.on ? theme.color : "#f59e0b";

  const colors = darkMode
    ? {
        surface: "#18181b",
        surfaceSecondary: "#202023",
        pressed: "#27272a",

        text: "#f4f4f5",
        secondary: "#a1a1aa",
        muted: "#71717a",

        border: "#27272a",
      }
    : {
        surface: "#ffffff",
        surfaceSecondary: "#f4f4f5",
        pressed: "#e4e4e7",

        text: "#18181b",
        secondary: "#71717a",
        muted: "#a1a1aa",

        border: "#e4e4e7",
      };

  const close = () => {
    setSelectedFolder(null);
    setPickFolder(false);
  };

  const sourceTitle = open?.item?.title || "Item";

  return (
    <View style={styles.modalLayer}>
      <Pressable style={styles.modalBackdrop} onPress={close} />

      <View
        style={[
          styles.moveModal,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        {/* HANDLE */}

        <View
          style={[
            styles.modalHandle,
            {
              backgroundColor: colors.muted,
            },
          ]}
        />

        {/* HEADER */}

        <View style={styles.moveHeader}>
          <View style={styles.moveHeaderText}>
            <Text
              style={[
                styles.moveTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Move to folder
            </Text>

            <Text
              numberOfLines={1}
              style={[
                styles.moveSubtitle,
                {
                  color: colors.secondary,
                },
              ]}
            >
              Choose a destination for {sourceTitle}
            </Text>
          </View>

          <Pressable
            onPress={close}
            hitSlop={8}
            style={({ pressed }) => [
              styles.modalClose,

              pressed && {
                backgroundColor: colors.surfaceSecondary,
              },
            ]}
          >
            <Feather name="x" size={19} color={colors.secondary} />
          </Pressable>
        </View>

        {/* TREE */}

        <ScrollView
          style={styles.treeScroll}
          contentContainerStyle={styles.treeContent}
          showsVerticalScrollIndicator={false}
        >
          {/* TOP LEVEL */}

          <Pressable
            onPress={() => {
              setSelectedFolder({
                folderid: null,
                title: "Top level",
              });
            }}
            style={({ pressed }) => [
              styles.topLevelRow,

              {
                backgroundColor: selectedFolder?.folderid === null ? `${accent}14` : "transparent",
              },

              pressed && {
                backgroundColor: colors.surfaceSecondary,
              },
            ]}
          >
            <View
              style={[
                styles.topLevelIcon,
                {
                  backgroundColor: `${accent}18`,
                },
              ]}
            >
              <Feather name="home" size={16} color={accent} />
            </View>

            <View style={styles.topLevelText}>
              <Text
                style={[
                  styles.destinationTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Top level
              </Text>

              <Text
                style={[
                  styles.destinationDescription,
                  {
                    color: colors.secondary,
                  },
                ]}
              >
                Move outside all folders
              </Text>
            </View>

            {selectedFolder?.folderid === null ? (
              <Feather name="check" size={17} color={accent} />
            ) : null}
          </Pressable>

          <View
            style={[
              styles.treeDivider,
              {
                backgroundColor: colors.border,
              },
            ]}
          />

          <Tree
            moving
            setPickFolder={setPickFolder}
            setSelectedFolder={setSelectedFolder}
            setFolder={setFolder}
            folders={folders}
            parentId={null}
            level={0}
            open={open}
            setMenuOpen={setMenuOpen}
            darkMode={darkMode}
          />
        </ScrollView>

        {/* CURRENT DESTINATION */}

        <View
          style={[
            styles.destination,
            {
              backgroundColor: colors.surfaceSecondary,
            },
          ]}
        >
          <View style={styles.destinationInfo}>
            <Text
              style={[
                styles.destinationLabel,
                {
                  color: colors.muted,
                },
              ]}
            >
              DESTINATION
            </Text>

            <Text
              numberOfLines={1}
              style={[
                styles.selectedDestination,
                {
                  color: colors.text,
                },
              ]}
            >
              {selectedFolder ? selectedFolder.title : "Choose a folder"}
            </Text>
          </View>

          {selectedFolder ? (
            <View
              style={[
                styles.selectedCheck,
                {
                  backgroundColor: `${accent}18`,
                },
              ]}
            >
              <Feather name="check" size={15} color={accent} />
            </View>
          ) : null}
        </View>

        {/* ACTIONS */}

        <View style={styles.moveActions}>
          <Pressable
            onPress={close}
            style={({ pressed }) => [
              styles.cancelButton,

              {
                borderColor: colors.border,
              },

              pressed && {
                backgroundColor: colors.surfaceSecondary,
              },
            ]}
          >
            <Text
              style={[
                styles.cancelText,
                {
                  color: colors.text,
                },
              ]}
            >
              Cancel
            </Text>
          </Pressable>

          <Pressable
            disabled={!selectedFolder}
            onPress={() => setPickFolder(false)}
            style={({ pressed }) => [
              styles.moveButton,

              {
                backgroundColor: accent,
              },

              !selectedFolder && styles.moveButtonDisabled,

              pressed && selectedFolder && styles.moveButtonPressed,
            ]}
          >
            <Text style={styles.moveButtonText}>Move here</Text>

            <Feather name="arrow-right" size={15} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /*
   * MOVE FOLDER MODAL
   */

  modalLayer: {
    ...StyleSheet.absoluteFillObject,

    justifyContent: "flex-end",

    zIndex: 200,
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },

  moveModal: {
    maxHeight: "82%",
    minHeight: "55%",

    paddingTop: 8,

    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,

    borderWidth: StyleSheet.hairlineWidth,

    elevation: 20,
  },

  modalHandle: {
    width: 38,
    height: 4,

    alignSelf: "center",

    marginBottom: 8,

    borderRadius: 2,

    opacity: 0.45,
  },

  moveHeader: {
    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 18,
    paddingVertical: 12,
  },

  moveHeaderText: {
    flex: 1,
  },

  moveTitle: {
    fontSize: 19,
    fontWeight: "700",
  },

  moveSubtitle: {
    marginTop: 3,

    fontSize: 12,
  },

  modalClose: {
    width: 38,
    height: 38,

    alignItems: "center",
    justifyContent: "center",

    marginLeft: 10,

    borderRadius: 19,
  },

  /*
   * TREE
   */

  treeScroll: {
    flex: 1,
  },

  treeContent: {
    paddingHorizontal: 12,
    paddingBottom: 15,
  },

  topLevelRow: {
    minHeight: 58,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 10,

    borderRadius: 12,
  },

  topLevelIcon: {
    width: 36,
    height: 36,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 10,
  },

  topLevelText: {
    flex: 1,

    marginLeft: 11,
  },

  destinationTitle: {
    fontSize: 14,
    fontWeight: "600",
  },

  destinationDescription: {
    marginTop: 2,

    fontSize: 10,
  },

  treeDivider: {
    height: StyleSheet.hairlineWidth,

    marginVertical: 9,
    marginHorizontal: 8,
  },

  /*
   * DESTINATION
   */

  destination: {
    flexDirection: "row",
    alignItems: "center",

    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 13,
    paddingVertical: 10,

    borderRadius: 12,
  },

  destinationInfo: {
    flex: 1,
  },

  destinationLabel: {
    fontSize: 9,
    fontWeight: "700",

    letterSpacing: 0.7,
  },

  selectedDestination: {
    marginTop: 3,

    fontSize: 13,
    fontWeight: "500",
  },

  selectedCheck: {
    width: 30,
    height: 30,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 9,
  },

  /*
   * BUTTONS
   */

  moveActions: {
    flexDirection: "row",

    gap: 10,

    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
  },

  cancelButton: {
    height: 48,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 20,

    borderRadius: 13,

    borderWidth: StyleSheet.hairlineWidth,
  },

  cancelText: {
    fontSize: 14,
    fontWeight: "600",
  },

  moveButton: {
    flex: 1,
    height: 48,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 8,

    borderRadius: 13,

    elevation: 2,
  },

  moveButtonDisabled: {
    opacity: 0.35,
  },

  moveButtonPressed: {
    opacity: 0.85,

    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  moveButtonText: {
    color: "#fff",

    fontSize: 14,
    fontWeight: "700",
  },
});

export default App;
