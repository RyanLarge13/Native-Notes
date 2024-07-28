import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  Switch,
  Linking,
  ScrollView,
} from "react-native";
import { v4 as uuidv4 } from "uuid";
import Colors from "./Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

const UserSettings = ({
  open,
  setOpen,
  darkMode,
  setDarkMode,
  setSystemNotifs,
  setMenuOpen,
  setUser,
  deleteDatabase,
  view,
  setView,
  order,
  setOrder,
  theme,
  setTheme,
  appLock,
  setAppLock,
  autoSave,
  setAutoSave,
  sort,
  setSort,
  saveLocation,
  setSaveLocation,
  db,
  user,
}) => {
  const [color, setColor] = useState("bg-amber-300");

  const transXAni = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (open) {
      Animated.spring(transXAni, {
        toValue: 0,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }
    if (!open) {
      Animated.spring(transXAni, {
        toValue: 500,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }
  }, [open]);

  const openIssue = () => {
    const repoOwner = "RyanLarge13";
    const repoName = "Native-Notes";
    const issueTitle = "New Issue";
    const issueBody = "What bug did you find with the app?";
    const url = `https://github.com/${repoOwner}/${repoName}/issues/new?title=${encodeURIComponent(
      issueTitle
    )}&body=${encodeURIComponent(issueBody)}`;
    Linking.openURL(url).catch((err) =>
      console.error("Couldn't load page", err)
    );
  };

  const confirmLogout = () => {
    const newNotifs = [
      {
        id: uuidv4(),
        color: "#fde047",
        title: "Logout",
        text: "Are you sure you want to logout?",
        actions: [
          { text: "cancel", func: () => setSystemNotifs([]) },
          { text: "logout", func: () => logout() },
        ],
      },
    ];
    setSystemNotifs(newNotifs);
  };

  const logout = async () => {
    setOpen(false);
    setMenuOpen(false);
    setUser(null);
    await AsyncStorage.removeItem("authToken")
      .then(() => {
        console.log("Stored token removed");
      })
      .catch((err) => {
        console.log("Error removing stored token: ", err);
      })
      .finally(() => {
        console.log("Stored token removal attempt complete");
      });
    deleteDatabase();
    const newNotifs = {
      id: uuidv4(),
      title: "Logged Out",
      color: "#55ff55",
      text: "You successfully have been logged out",
      actions: [{ text: "closed", func: () => setSystemNotifs([]) }],
    };
    setSystemNotifs(newNotifs);
  };

  const confirmDeleteAccount = () => {
    const newNotifs = [
      {
        id: uuidv4(),
        color: "#ff5555",
        title: "Delete Account",
        text: "Are you sure you want to delete your account? Once you delete your account your data will be lost forever and you cannot get it back",
        actions: [
          { text: "cancel", func: () => setSystemNotifs([]) },
          { text: "delete", func: () => deleteAccount() },
        ],
      },
    ];
    setSystemNotifs(newNotifs);
  };

  const setSortAndUpdateDb = async (sortTitle) => {
    setSort(sortTitle);
    const newPreferences = {
      order: order,
      appLock: appLock,
      autoSave: autoSave,
      darkMode: darkMode,
      theme: theme,
      view: view,
      sort: sortTitle,
      saveLocation: !saveLocation,
      location: null,
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

  const setColorAndPreferences = async (newColor, trigger) => {
    setColor(newColor ? newColor : color);
    const newPreferences = {
      order: order,
      appLock: appLock,
      autoSave: autoSave,
      darkMode: darkMode,
      theme: { on: trigger, color: newColor },
      view: view,
      sort: sort,
      saveLocation: !saveLocation,
      location: null,
    };
    setTheme({ on: trigger, color: newColor ? newColor : color });
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

  const deleteAccount = () => {};

  return (
    <>
      {open ? (
        <Pressable
          onPress={() => setOpen(false)}
          style={styles.backdrop}
        ></Pressable>
      ) : null}
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: darkMode ? "#000" : "#eee",
            translateX: transXAni,
          },
        ]}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[0, 5]}
        >
          <View
            style={[
              styles.stickyHeader,
              { backgroundColor: darkMode ? "#000" : "#eee" },
            ]}
          >
            <Text
              style={[darkMode ? styles.white : styles.black, styles.heading]}
            >
              Theme & Style
            </Text>
          </View>
          <View
            style={[
              styles.switchBtn,
              { backgroundColor: darkMode ? "rgba(255,255,255,0.1)" : "#fff" },
            ]}
          >
            <Text style={darkMode ? styles.white : styles.black}>
              Dark Mode beta
            </Text>
            <Switch
              trackColor={{ false: "#fda4af", true: "#6ee7b7" }}
              thumbColor={darkMode ? "#5effa7" : "#ff808d"}
              ios_backgroundColor="#000000"
              onValueChange={async () => {
                setDarkMode((prev) => !prev);
                const newPreferences = {
                  order: order,
                  appLock: appLock,
                  autoSave: autoSave,
                  darkMode: !darkMode,
                  theme: theme,
                  view: view,
                  sort: sort,
                  saveLocation: !saveLocation,
                  location: null,
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
              }}
              value={darkMode}
            />
          </View>
          <View
            style={[
              styles.switchBtn,
              { backgroundColor: darkMode ? "rgba(255,255,255,0.1)" : "#fff" },
            ]}
          >
            <Text style={darkMode ? styles.white : styles.black}>
              Theme beta
            </Text>
            <Switch
              trackColor={{ false: "#fda4af", true: color }}
              thumbColor={theme.on ? "#5effa7" : "#ff808d"}
              ios_backgroundColor="#000000"
              onValueChange={() => setColorAndPreferences(null, !theme.on)}
              value={theme.on}
            />
          </View>
          {theme.on ? (
            <>
              <View
                style={[styles.colorBar, { backgroundColor: theme.on ?
                theme.color : "transparent"}]}
              ></View>
              <Colors
                setColor={(newColor) => setColorAndPreferences(newColor, true)}
                selectedColor={color}
              />
            </>
          ) : null}
          <View style={styles.hr}></View>
          <View
            style={[
              styles.stickyHeader,
              { backgroundColor: darkMode ? "#000" : "#eee" },
            ]}
          >
            <Text
              style={[darkMode ? styles.white : styles.black, styles.heading]}
            >
              View & Order
            </Text>
          </View>
          <View
            style={[
              styles.switchBtn,
              { backgroundColor: darkMode ? "rgba(255,255,255,0.1)" : "#fff" },
            ]}
          >
            <Text style={darkMode ? styles.white : styles.black}>
              Grid View
            </Text>
            <Switch
              trackColor={{ false: "#fda4af", true: "#6ee7b7" }}
              thumbColor={view ? "#5effa7" : "#ff808d"}
              ios_backgroundColor="#000000"
              onValueChange={async () => {
                setView((prev) => !prev);
                const newPreferences = {
                  order: order,
                  appLock: appLock,
                  autoSave: autoSave,
                  darkMode: darkMode,
                  theme: theme,
                  view: !view,
                  sort: sort,
                  saveLocation: !saveLocation,
                  location: null,
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
              }}
              value={view}
            />
          </View>
          <View
            style={[
              styles.switchBtn,
              { backgroundColor: darkMode ? "rgba(255,255,255,0.1)" : "#fff" },
            ]}
          >
            <Text style={darkMode ? styles.white : styles.black}>Order</Text>
            <Switch
              trackColor={{ false: "#fda4af", true: "#6ee7b7" }}
              thumbColor={order ? "#5effa7" : "#ff808d"}
              ios_backgroundColor="#000000"
              onValueChange={async () => {
                setOrder((prev) => !prev);
                const newPreferences = {
                  order: !order,
                  appLock: appLock,
                  autoSave: autoSave,
                  darkMode: darkMode,
                  theme: theme,
                  view: view,
                  sort: sort,
                  saveLocation: !saveLocation,
                  location: null,
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
              }}
              value={order}
            />
          </View>
          <View>
            <View style={styles.hr}></View>
            <Text
              style={[darkMode ? styles.white : styles.black, styles.heading]}
            >
              Sort By
            </Text>
            <View
              style={[
                styles.switchBtn,
                {
                  backgroundColor: darkMode ? "rgba(255,255,255,0.1)" : "#fff",
                },
              ]}
            >
              <Text style={darkMode ? styles.white : styles.black}>Title</Text>
              <Switch
                trackColor={{ false: "#fda4af", true: "#6ee7b7" }}
                thumbColor={sort === "Title" ? "#5effa7" : "#ff808d"}
                ios_backgroundColor="#000000"
                onValueChange={() => setSortAndUpdateDb("Title")}
                value={sort === "Title"}
              />
            </View>
            <View
              style={[
                styles.switchBtn,
                {
                  backgroundColor: darkMode ? "rgba(255,255,255,0.1)" : "#fff",
                },
              ]}
            >
              <Text style={darkMode ? styles.white : styles.black}>Date</Text>
              <Switch
                trackColor={{ false: "#fda4af", true: "#6ee7b7" }}
                thumbColor={sort === "Date" ? "#5effa7" : "#ff808d"}
                ios_backgroundColor="#000000"
                onValueChange={() => setSortAndUpdateDb("Date")}
                value={sort === "Date"}
              />
            </View>
            <View
              style={[
                styles.switchBtn,
                {
                  backgroundColor: darkMode ? "rgba(255,255,255,0.1)" : "#fff",
                },
              ]}
            >
              <Text style={darkMode ? styles.white : styles.black}>
                Updated
              </Text>
              <Switch
                trackColor={{ false: "#fda4af", true: "#6ee7b7" }}
                thumbColor={sort === "Update" ? "#5effa7" : "#ff808d"}
                ios_backgroundColor="#000000"
                onValueChange={() => setSortAndUpdateDb("Update")}
                value={sort === "Update"}
              />
            </View>
          </View>
          <View style={styles.hr}></View>
          <View>
            <Text
              style={[styles.heading, darkMode ? styles.white : styles.black]}
            >
              System
            </Text>
            <View
              style={[
                styles.switchBtn,
                {
                  backgroundColor: darkMode ? "rgba(255,255,255,0.1)" : "#fff",
                },
              ]}
            >
              <Text style={darkMode ? styles.white : styles.black}>
                Auto Save Notes
              </Text>
              <Switch
                trackColor={{ false: "#fda4af", true: "#6ee7b7" }}
                thumbColor={autoSave ? "#5effa7" : "#ff808d"}
                ios_backgroundColor="#000000"
                onValueChange={async () => {
                  setAutoSave((prev) => !prev);
                  const newPreferences = {
                    order: order,
                    appLock: appLock,
                    autoSave: !autoSave,
                    darkMode: darkMode,
                    theme: theme,
                    view: view,
                    sort: sort,
                    saveLocation: !saveLocation,
                    location: null,
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
                }}
                value={autoSave}
              />
            </View>
            <View
              style={[
                styles.switchBtn,
                {
                  backgroundColor: darkMode ? "rgba(255,255,255,0.1)" : "#fff",
                },
              ]}
            >
              <Text style={darkMode ? styles.white : styles.black}>
                Lock App
              </Text>
              <Switch
                trackColor={{ false: "#fda4af", true: "#6ee7b7" }}
                thumbColor={appLock ? "#5effa7" : "#ff808d"}
                ios_backgroundColor="#000000"
                onValueChange={async () => {
                  setAppLock((prev) => !prev);
                  const newPreferences = {
                    order: order,
                    appLock: !appLock,
                    autoSave: autoSave,
                    darkMode: darkMode,
                    theme: theme,
                    view: view,
                    sort: sort,
                    saveLocation: !saveLocation,
                    location: null,
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
                }}
                value={appLock}
              />
            </View>
            <View
              style={[
                styles.switchBtn,
                {
                  backgroundColor: darkMode ? "rgba(255,255,255,0.1)" : "#fff",
                },
              ]}
            >
              <Text style={darkMode ? styles.white : styles.black}>
                Save Location
              </Text>
              <Switch
                trackColor={{ false: "#fda4af", true: "#6ee7b7" }}
                thumbColor={saveLocation ? "#5effa7" : "#ff808d"}
                ios_backgroundColor="#000000"
                onValueChange={async () => {
                  setSaveLocation((prev) => !prev);
                  const newPreferences = {
                    order: order,
                    appLock: appLock,
                    autoSave: autoSave,
                    darkMode: darkMode,
                    theme: theme,
                    view: view,
                    sort: sort,
                    saveLocation: !saveLocation,
                    location: null,
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
                }}
                value={saveLocation}
              />
            </View>
          </View>
          <View style={styles.hr}></View>
          <View>
            <Pressable
              onPress={() => confirmLogout()}
              style={[
                styles.logout,
                { backgroundColor: theme.on ? theme.color : "#fcd34d" },
              ]}
            >
              <Text>Logout &rarr;</Text>
            </Pressable>
            <Pressable onPress={() => openIssue()} style={styles.bug}>
              <Text>Report A Bug</Text>
            </Pressable>
            <Pressable
              onPress={() => confirmDeleteAccount()}
              style={styles.delete}
            >
              <Text style={styles.deleteColor}>Delete Account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Animated.View>
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
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  container: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "90%",
    padding: 15,
    paddingTop: 50,
    justifyContent: "space-between",
    flex: 1,
  },
  switchBtn: {
    marginVertical: 8,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    // borderBottomWidth: 2,
    // borderBottomColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  colorBar: {
    width: "100%",
    height: 4,
    borderRadius: 10,
  },
  heading: {
    fontSize: 20,
    marginTop: 20,
  },
  white: {
    color: "#fff",
  },
  black: {
    color: "#000",
  },
  logout: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  bug: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: "#9f9",
    marginTop: 10,
  },
  delete: {
    paddingVertical: 10,
    marginTop: 10,
  },
  deleteColor: {
    color: "#f55",
    textAlign: "center",
  },
  stickyHeader: {
    paddingBottom: 10,
  },
  hr: {
    marginVertical: 20,
    borderTopWidth: 2,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
});

export default UserSettings;
