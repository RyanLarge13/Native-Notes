import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  Switch,
} from "react-native";
import { useNavigate } from "react-router-native";
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
  setAllData,
  setUser,
  deleteDatabase,
}) => {
  const [color, setColor] = useState("bg-amber-300");
  const [theme, setTheme] = useState(false);

  const transXAni = useRef(new Animated.Value(500)).current;
  const navigate = useNavigate();

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
        id: 1,
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
    setMenuOpen(false);
    navigate("/login");
    setUser(null);
    setAllData(null);
    deleteDatabase();
  };

  const confirmDeleteAccount = () => {
    const newNotifs = [
      {
        id: 1,
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
        <View style={styles.switch}>
          <Text style={styles.white}>Dark Mode</Text>
          <Switch
            trackColor={{ false: "#fda4af", true: "#6ee7b7" }}
            thumbColor={darkMode ? "#6ee7b7" : "#fda4af"}
            ios_backgroundColor="#000000"
            onValueChange={() => setDarkMode((prev) => !prev)}
            value={darkMode}
          />
        </View>
        <View style={styles.switch}>
          <Text style={styles.white}>Theme</Text>
          <Switch
            trackColor={{ false: "#fda4af", true: formatColor(color) }}
            thumbColor={theme ? formatColor(color) : "#fda4af"}
            ios_backgroundColor="#000000"
            onValueChange={() => setTheme((prev) => !prev)}
            value={theme}
          />
        </View>
        <View
          style={[styles.colorBar, { backgroundColor: formatColor(color) }]}
        ></View>
        <Colors setColor={setColor} selectedColor={color} />
        <Pressable onPress={() => confirmLogout()} style={styles.logout}>
          <Text>Logout &rarr;</Text>
        </Pressable>
        <Pressable style={styles.bug}>
          <Text>Report A Bug</Text>
        </Pressable>
        <Pressable onPress={() => confirmDeleteAccount()} style={styles.delete}>
          <Text style={styles.white}>Delete Account</Text>
        </Pressable>
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
    padding: 10,
    paddingTop: 50,
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
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: "#f55",
    marginTop: 10,
  },
});

export default UserSettings;
