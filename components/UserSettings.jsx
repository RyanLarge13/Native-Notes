import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  Switch,
} from "react-native";
import { v4 as uuidv4 } from "uuid";
import Colors from "./Colors";
import formatColor from "../utils/helpers/formatColor";
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

  const setColorAndPreferences = async (color) => {
    setColor(color);
    setTheme({ on: true, color: color });
    const newPreferences = {
      order: order,
      appLock: appLock,
      autoSave: autoSave,
      darkMode: darkMode,
      theme: { ...theme, color: color },
      view: view,
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

  const deleteAccount = () => {};

  return (
    <>
      {open ? (
        <Pressable
          onPress={() => setOpen(false)}
          style={styles.backdrop}
        ></Pressable>
      ) : null}
      <Animated.View style={[styles.container, { translateX: transXAni }]}>
        <View>
          <View style={styles.switch}>
            <Text style={styles.white}>Theme</Text>
            <Switch
              trackColor={{ false: "#fda4af", true: formatColor(color) }}
              thumbColor={theme.on ? formatColor(theme.color) : "#ff808d"}
              ios_backgroundColor="#000000"
              onValueChange={async () => {
                setTheme((prev) => {
                  return { on: !theme.on, ...prev };
                });
                const newPreferences = {
                  order: order,
                  appLock: appLock,
                  autoSave: autoSave,
                  darkMode: darkMode,
                  theme: { ...theme, on: !theme.on },
                  view: view,
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
              value={theme.on}
            />
          </View>
          <View
            style={[styles.colorBar, { backgroundColor: formatColor(color) }]}
          ></View>
          <Colors
            setColor={(newColor) => setColorAndPreferences(newColor)}
            selectedColor={color}
          />
          <View style={styles.switch}>
            <Text style={styles.white}>Dark Mode</Text>
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
          <View style={styles.switch}>
            <Text style={styles.white}>Grid View</Text>
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
          <View style={styles.switch}>
            <Text style={styles.white}>Order</Text>
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
          <View style={styles.switch}>
            <Text style={styles.white}>Auto Save Notes</Text>
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
          <View style={styles.switch}>
            <Text style={styles.white}>Lock App</Text>
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
          <View>
            <Text style={[styles.white, styles.heading]}>Sort By</Text>
            <View style={styles.switch}>
              <Text style={styles.white}>Title</Text>
              <Switch
                trackColor={{ false: "#fda4af", true: "#6ee7b7" }}
                thumbColor={sort === "Title" ? "#5effa7" : "#ff808d"}
                ios_backgroundColor="#000000"
                onValueChange={() => setSortAndUpdateDb("Title")}
                value={sort === "Title"}
              />
            </View>
            <View style={styles.switch}>
              <Text style={styles.white}>Date</Text>
              <Switch
                trackColor={{ false: "#fda4af", true: "#6ee7b7" }}
                thumbColor={sort === "Date" ? "#5effa7" : "#ff808d"}
                ios_backgroundColor="#000000"
                onValueChange={() => setSortAndUpdateDb("Date")}
                value={sort === "Date"}
              />
            </View>
            <View style={styles.switch}>
              <Text style={styles.white}>Updated</Text>
              <Switch
                trackColor={{ false: "#fda4af", true: "#6ee7b7" }}
                thumbColor={sort === "Update" ? "#5effa7" : "#ff808d"}
                ios_backgroundColor="#000000"
                onValueChange={() => setSortAndUpdateDb("Update")}
                value={sort === "Update"}
              />
            </View>
          </View>
        </View>
        <View>
          <Pressable onPress={() => confirmLogout()} style={styles.logout}>
            <Text>Logout &rarr;</Text>
          </Pressable>
          <Pressable style={styles.bug}>
            <Text>Report A Bug</Text>
          </Pressable>
          <Pressable
            onPress={() => confirmDeleteAccount()}
            style={styles.delete}
          >
            <Text style={styles.deleteColor}>Delete Account</Text>
          </Pressable>
        </View>
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
    backgroundColor: "#000",
    padding: 15,
    paddingTop: 50,
    justifyContent: "space-between",
    flex: 1,
  },
  switch: {
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
  },
  colorBar: {
    width: "100%",
    height: 4,
    borderRadius: 10,
  },
  heading: {
    fontSize: 20,
    marginTop: 10,
  },
  white: {
    color: "#fff",
  },
  logout: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: "#fcd34d",
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
});

export default UserSettings;
