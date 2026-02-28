import { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Text, Pressable } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import Tree from "./Tree";

const Menu = ({
  menuOpen,
  setMenuOpen,
  setFolder,
  allData,
  setSystemFolder,
  setPickFolder,
  setUserSettingsOpen,
  darkMode,
  theme,
}) => {
  const animation = useRef(new Animated.Value(-500)).current;
  const animationOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (menuOpen) {
      Animated.spring(animation, {
        toValue: 0,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }).start();
      Animated.spring(animationOpacity, {
        toValue: 1,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }
    if (!menuOpen) {
      Animated.spring(animation, {
        toValue: -500,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }).start();
      Animated.spring(animationOpacity, {
        toValue: 0,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }
  }, [menuOpen]);

  return (
    <>
      {menuOpen ? (
        <Pressable
          onPress={() => setMenuOpen(false)}
          style={[styles.backdrop]}
        ></Pressable>
      ) : null}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        style={[
          styles.container,
          {
            translateX: animation,
            opacity: animationOpacity,
            backgroundColor: darkMode ? "#000" : "#eee",
          },
        ]}
      >
        <View
          style={{
            paddingHorizontal: 25,
            paddingVertical: 50,
          }}
        >
          <View>
            <Text
              style={[darkMode ? styles.white : styles.black, styles.heading]}
            >
              {allData.user.username}
            </Text>
            <View style={styles.notesBtnContainer}>
              <Pressable
                onPress={() => {
                  setSystemFolder("all");
                  setMenuOpen(false);
                }}
                style={[
                  styles.btn,
                  { backgroundColor: darkMode ? "#111" : "#fff" },
                ]}
              >
                <Text style={darkMode ? styles.white : styles.black}>
                  All Notes{" "}
                  <Text style={styles.slate}>
                    {"   " + allData.notes.length}
                  </Text>
                </Text>
                <FontAwesome5
                  name="sticky-note"
                  style={{
                    color: theme.on
                      ? theme.color
                      : darkMode
                        ? styles.white
                        : styles.black,
                  }}
                />
              </Pressable>
              <Pressable
                onPress={() => {
                  setSystemFolder("locked");
                  setMenuOpen(false);
                }}
                style={[
                  styles.btn,
                  { backgroundColor: darkMode ? "#111" : "#fff" },
                ]}
              >
                <Text style={darkMode ? styles.white : styles.black}>
                  Locked Notes{" "}
                  <Text style={styles.slate}>
                    {" "}
                    {allData.notes.filter((note) => note.locked).length}
                  </Text>
                </Text>
                <FontAwesome5
                  name="lock"
                  style={{
                    color: theme.on
                      ? theme.color
                      : darkMode
                        ? styles.white
                        : styles.black,
                  }}
                />
              </Pressable>
              <Pressable
                style={[
                  styles.btn,
                  { backgroundColor: darkMode ? "#111" : "#fff" },
                ]}
              >
                <Text style={darkMode ? styles.white : styles.black}>
                  Shared Notes{" "}
                  <Text
                    style={{
                      color: theme.on ? theme.color : styles.amber,
                    }}
                  >
                    {" "}
                    Beta
                  </Text>
                </Text>
                <FontAwesome5
                  name="share-alt"
                  style={{
                    color: theme.on
                      ? theme.color
                      : darkMode
                        ? styles.white
                        : styles.black,
                  }}
                />
              </Pressable>
              <Pressable
                onPress={() => {
                  setSystemFolder("trash");
                  setMenuOpen(false);
                }}
                style={[
                  styles.btn,
                  { backgroundColor: darkMode ? "#111" : "#fff" },
                ]}
              >
                <Text style={darkMode ? styles.white : styles.black}>
                  Trash <Text style={styles.slate}> 0</Text>
                </Text>
                <FontAwesome5
                  name="trash"
                  style={{
                    color: theme.on
                      ? theme.color
                      : darkMode
                        ? styles.white
                        : styles.black,
                  }}
                />
              </Pressable>
            </View>
            <Text
              style={[
                darkMode ? styles.white : styles.black,
                { marginTop: 25, fontSize: 20 },
              ]}
            >
              Folders{" "}
              <Text style={styles.slate}> {allData.folders.length}</Text>
            </Text>
            <View style={styles.folderContainer}>
              <Tree
                moving={false}
                setPickFolder={setPickFolder}
                setSelectedFolder={null}
                setFolder={setFolder}
                folders={allData.folders}
                parentId={null}
                level={0}
                open={{ item: { title: null } }}
                setMenuOpen={setMenuOpen}
                darkMode={darkMode}
              />
            </View>
            <Pressable
              onPress={() => setUserSettingsOpen(true)}
              style={[
                styles.settings,
                { backgroundColor: theme.on ? theme.color : "#fcd34d" },
              ]}
            >
              <Text>Settings</Text>
            </Pressable>
          </View>
        </View>
      </Animated.ScrollView>
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
    left: 0,
    top: 0,
    bottom: 0,
    width: "90%",
  },
  notesBtnContainer: {
    marginTop: 25,
  },
  folderContainer: {
    marginTop: 25,
    flexDirection: "column",
  },
  folder: {
    marginVertical: 5,
    paddingVertical: 10,
    paddingRight: 10,
    paddingLeft: 15,
    backgroundColor: "#111",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
  },
  folderColor: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
    borderRadius: 10,
  },
  white: {
    color: "#fff",
  },
  black: {
    color: "#000",
  },
  slate: {
    color: "#aaa",
  },
  amber: {
    color: "#fcd34d",
  },
  heading: {
    fontSize: 25,
  },
  btn: {
    marginVertical: 5,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logout: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: "#fcd34d",
    marginTop: 10,
  },
  settings: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 15,
  },
  delete: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: "#f55",
    marginTop: 10,
  },
});

export default Menu;
