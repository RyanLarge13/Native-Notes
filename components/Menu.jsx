import { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, StyleSheet, Dimensions } from "react-native";

import { FontAwesome5 } from "@expo/vector-icons";

import Tree from "./Tree";

const SCREEN_WIDTH = Dimensions.get("window").width;
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.88, 380);

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
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const accent = theme.on ? theme.color : "#f59e0b";

  const colors = darkMode
    ? {
        background: "#111113",
        surface: "#1a1a1d",
        pressed: "#222226",

        text: "#f4f4f5",
        secondary: "#a1a1aa",
        muted: "#71717a",

        border: "#27272a",
      }
    : {
        background: "#fafafa",
        surface: "#ffffff",
        pressed: "#f4f4f5",

        text: "#18181b",
        secondary: "#71717a",
        muted: "#a1a1aa",

        border: "#e4e4e7",
      };

  useEffect(() => {
    if (menuOpen) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          tension: 90,
          friction: 12,
          useNativeDriver: true,
        }),

        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: -DRAWER_WIDTH,
          tension: 90,
          friction: 12,
          useNativeDriver: true,
        }),

        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [menuOpen]);

  const openSystemFolder = (folder) => {
    setSystemFolder(folder);
    setMenuOpen(false);
  };

  const lockedCount = allData.notes.filter((note) => note.locked).length;

  return (
    <>
      <Animated.View
        pointerEvents={menuOpen ? "auto" : "none"}
        style={[
          styles.backdrop,
          {
            opacity: backdropOpacity,
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} />
      </Animated.View>

      <Animated.View
        style={[
          styles.container,
          {
            width: DRAWER_WIDTH,
            backgroundColor: colors.background,
            borderRightColor: colors.border,
            transform: [{ translateX }],
          },
        ]}
      >
        {/* HEADER */}

        <View
          style={[
            styles.header,
            {
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: `${accent}20`,
              },
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                {
                  color: accent,
                },
              ]}
            >
              {allData.user.username?.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.accountInfo}>
            <Text
              numberOfLines={1}
              style={[
                styles.username,
                {
                  color: colors.text,
                },
              ]}
            >
              {allData.user.username}
            </Text>

            <Text
              style={[
                styles.accountLabel,
                {
                  color: colors.secondary,
                },
              ]}
            >
              Native Notes
            </Text>
          </View>

          <Pressable
            hitSlop={8}
            onPress={() => setMenuOpen(false)}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && {
                backgroundColor: colors.pressed,
              },
            ]}
          >
            <FontAwesome5 name="times" size={16} color={colors.secondary} />
          </Pressable>
        </View>

        {/* SCROLLABLE CONTENT */}

        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* LIBRARY */}

          <SectionLabel title="Library" color={colors.secondary} />

          <View style={styles.navigationGroup}>
            <NavigationItem
              icon="sticky-note"
              title="All Notes"
              count={allData.notes.length}
              accent={accent}
              colors={colors}
              onPress={() => openSystemFolder("all")}
            />

            <NavigationItem
              icon="lock"
              title="Locked Notes"
              count={lockedCount}
              accent={accent}
              colors={colors}
              onPress={() => openSystemFolder("locked")}
            />

            <NavigationItem
              icon="share-alt"
              title="Shared Notes"
              accent={accent}
              colors={colors}
              badge="Beta"
            />

            <NavigationItem
              icon="trash"
              title="Trash"
              count={0}
              accent={accent}
              colors={colors}
              onPress={() => openSystemFolder("trash")}
            />
          </View>

          {/* FOLDERS */}

          <View style={styles.folderHeader}>
            <SectionLabel title="Folders" color={colors.secondary} />

            <Text
              style={[
                styles.folderCount,
                {
                  color: colors.muted,
                },
              ]}
            >
              {allData.folders.length}
            </Text>
          </View>

          <View style={styles.folderContainer}>
            <Tree
              moving={false}
              setPickFolder={setPickFolder}
              setSelectedFolder={null}
              setFolder={setFolder}
              folders={allData.folders}
              parentId={null}
              level={0}
              open={{
                item: {
                  folderid: null,
                },
              }}
              setMenuOpen={setMenuOpen}
              darkMode={darkMode}
            />
          </View>
        </Animated.ScrollView>

        {/* FOOTER */}

        <View
          style={[
            styles.footer,
            {
              borderTopColor: colors.border,
            },
          ]}
        >
          <Pressable
            onPress={() => {
              setUserSettingsOpen(true);
              setMenuOpen(false);
            }}
            style={({ pressed }) => [
              styles.settingsButton,

              pressed && {
                backgroundColor: colors.pressed,
              },
            ]}
          >
            <View
              style={[
                styles.settingsIcon,
                {
                  backgroundColor: `${accent}18`,
                },
              ]}
            >
              <FontAwesome5 name="cog" size={15} color={accent} />
            </View>

            <Text
              style={[
                styles.settingsText,
                {
                  color: colors.text,
                },
              ]}
            >
              Settings
            </Text>

            <FontAwesome5 name="chevron-right" size={11} color={colors.muted} />
          </Pressable>
        </View>
      </Animated.View>
    </>
  );
};

const NavigationItem = ({ icon, title, count, badge, accent, colors, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.navigationItem,

        pressed && {
          backgroundColor: colors.pressed,
        },
      ]}
    >
      <View
        style={[
          styles.navigationIcon,
          {
            backgroundColor: `${accent}18`,
          },
        ]}
      >
        <FontAwesome5 name={icon} size={15} color={accent} />
      </View>

      <Text
        numberOfLines={1}
        style={[
          styles.navigationTitle,
          {
            color: colors.text,
          },
        ]}
      >
        {title}
      </Text>

      {badge ? (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: `${accent}18`,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: accent,
              },
            ]}
          >
            {badge}
          </Text>
        </View>
      ) : null}

      {count !== undefined ? (
        <Text
          style={[
            styles.navigationCount,
            {
              color: colors.secondary,
            },
          ]}
        >
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
};

const SectionLabel = ({ title, color }) => (
  <Text
    style={[
      styles.sectionLabel,
      {
        color,
      },
    ]}
  >
    {title.toUpperCase()}
  </Text>
);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor: "rgba(0, 0, 0, 0.45)",

    zIndex: 99,
  },

  container: {
    position: "absolute",

    top: 0,
    bottom: 0,
    left: 0,

    borderRightWidth: StyleSheet.hairlineWidth,

    zIndex: 100,

    elevation: 16,
  },

  header: {
    minHeight: 100,

    flexDirection: "row",
    alignItems: "center",

    paddingTop: 35,
    paddingHorizontal: 18,
    paddingBottom: 15,

    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  avatar: {
    width: 42,
    height: 42,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 13,
  },

  avatarText: {
    fontSize: 18,
    fontWeight: "700",
  },

  accountInfo: {
    flex: 1,

    marginLeft: 12,
  },

  username: {
    fontSize: 16,
    fontWeight: "600",
  },

  accountLabel: {
    marginTop: 2,

    fontSize: 12,
  },

  closeButton: {
    width: 38,
    height: 38,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 19,
  },

  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 12,
    paddingBottom: 30,
  },

  sectionLabel: {
    marginLeft: 10,
    marginBottom: 8,

    fontSize: 11,
    fontWeight: "700",

    letterSpacing: 0.8,
  },

  navigationGroup: {
    marginBottom: 28,
  },

  navigationItem: {
    minHeight: 48,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 8,

    borderRadius: 11,
  },

  navigationIcon: {
    width: 32,
    height: 32,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 9,
  },

  navigationTitle: {
    flex: 1,

    marginLeft: 11,

    fontSize: 15,
    fontWeight: "500",
  },

  navigationCount: {
    marginHorizontal: 10,

    fontSize: 13,
    fontWeight: "500",
  },

  badge: {
    paddingVertical: 3,
    paddingHorizontal: 7,

    borderRadius: 6,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },

  folderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingRight: 10,
  },

  folderCount: {
    marginBottom: 8,

    fontSize: 12,
  },

  folderContainer: {
    marginHorizontal: -6,
  },

  footer: {
    paddingHorizontal: 12,
    paddingVertical: 10,

    borderTopWidth: StyleSheet.hairlineWidth,
  },

  settingsButton: {
    minHeight: 50,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 8,

    borderRadius: 11,
  },

  settingsIcon: {
    width: 32,
    height: 32,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 9,
  },

  settingsText: {
    flex: 1,

    marginLeft: 11,

    fontSize: 15,
    fontWeight: "500",
  },
});

export default Menu;
