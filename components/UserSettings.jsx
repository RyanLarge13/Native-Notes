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
  useWindowDimensions,
} from "react-native";

import { Feather } from "@expo/vector-icons";
import { v4 as uuidv4 } from "uuid";

import Colors from "./Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { deleteDatabase } from "../utils/sqLite";

const UserSettings = ({
  open,
  setOpen,

  darkMode,
  setDarkMode,

  setSystemNotifs,
  setMenuOpen,
  setUser,

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
  const [color, setColor] = useState(theme?.color || "#f59e0b");

  /*
   * COLORS
   */

  const accent = theme.on ? theme.color : "#f59e0b";

  const colors = darkMode
    ? {
        background: "#111113",
        surface: "#18181b",
        surfaceSecondary: "#202023",
        pressed: "#27272a",

        text: "#f4f4f5",
        secondary: "#a1a1aa",
        muted: "#71717a",

        border: "#27272a",

        danger: "#f87171",
        dangerSurface: "rgba(248, 113, 113, 0.10)",
      }
    : {
        background: "#fafafa",
        surface: "#ffffff",
        surfaceSecondary: "#f4f4f5",
        pressed: "#e4e4e7",

        text: "#18181b",
        secondary: "#71717a",
        muted: "#a1a1aa",

        border: "#e4e4e7",

        danger: "#dc2626",
        dangerSurface: "rgba(220, 38, 38, 0.07)",
      };

  /*
   * OPEN / CLOSE ANIMATION
   */

  const { width } = useWindowDimensions();

  const transXAni = useRef(new Animated.Value(width)).current;

  const opacityAni = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.spring(transXAni, {
          toValue: 0,
          tension: 100,
          friction: 11,
          useNativeDriver: true,
        }),

        Animated.timing(opacityAni, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      console.log("closing animation run");
      Animated.parallel([
        Animated.timing(transXAni, {
          toValue: width,
          duration: 220,
          useNativeDriver: true,
        }),

        Animated.timing(opacityAni, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [open, width]);

  /*
   * SAVE PREFERENCES
   *
   * One function replaces all those repeated
   * UPDATE user queries.
   */

  const savePreferences = async (changes = {}) => {
    const newPreferences = {
      order,
      appLock,
      autoSave,
      darkMode,
      theme,
      view,
      sort,
      saveLocation,

      /*
       * Don't wipe location every time
       * someone changes an unrelated setting.
       *
       * Your current code repeatedly writes
       * location: null.
       */
      location:
        user?.preferences && typeof user.preferences === "string"
          ? (() => {
              try {
                return JSON.parse(user.preferences).location;
              } catch {
                return null;
              }
            })()
          : null,

      ...changes,
    };

    try {
      await db?.runAsync(
        `
          UPDATE user
          SET preferences = ?
          WHERE userId = ?
        `,
        [JSON.stringify(newPreferences), user.userId]
      );
    } catch (err) {
      console.log("Failed saving preferences:", err);
    }
  };

  /*
   * SETTING HANDLERS
   */

  const toggleDarkMode = async () => {
    const next = !darkMode;

    setDarkMode(next);

    await savePreferences({
      darkMode: next,
    });
  };

  const toggleTheme = async () => {
    const nextTheme = {
      on: !theme.on,
      color,
    };

    setTheme(nextTheme);

    await savePreferences({
      theme: nextTheme,
    });
  };

  const changeThemeColor = async (newColor) => {
    setColor(newColor);

    const nextTheme = {
      on: true,
      color: newColor,
    };

    setTheme(nextTheme);

    await savePreferences({
      theme: nextTheme,
    });
  };

  const changeView = async (nextView) => {
    setView(nextView);

    await savePreferences({
      view: nextView,
    });
  };

  const toggleOrder = async () => {
    const next = !order;

    setOrder(next);

    await savePreferences({
      order: next,
    });
  };

  const changeSort = async (nextSort) => {
    setSort(nextSort);

    await savePreferences({
      sort: nextSort,
    });
  };

  const toggleAutoSave = async () => {
    const next = !autoSave;

    setAutoSave(next);

    await savePreferences({
      autoSave: next,
    });
  };

  const toggleAppLock = async () => {
    const next = !appLock;

    setAppLock(next);

    await savePreferences({
      appLock: next,
    });
  };

  const toggleSaveLocation = async () => {
    const next = !saveLocation;

    setSaveLocation(next);

    await savePreferences({
      saveLocation: next,
    });
  };

  /*
   * ACCOUNT ACTIONS
   */

  const openIssue = () => {
    const repoOwner = "RyanLarge13";
    const repoName = "Native-Notes";

    const issueTitle = "New Issue";

    const issueBody = "What bug did you find with the app?";

    const url =
      `https://github.com/${repoOwner}/${repoName}` +
      `/issues/new?title=${encodeURIComponent(issueTitle)}` +
      `&body=${encodeURIComponent(issueBody)}`;

    Linking.openURL(url).catch((err) => console.error("Couldn't load page", err));
  };

  const confirmLogout = () => {
    setSystemNotifs([
      {
        id: uuidv4(),
        color: "#fde047",
        title: "Logout",
        text: "Are you sure you want to logout?",
        actions: [
          {
            text: "Cancel",
            func: () => setSystemNotifs([]),
          },
          {
            text: "Logout",
            func: logout,
          },
        ],
      },
    ]);
  };

  const logout = async () => {
    setOpen(false);
    setMenuOpen(false);
    setUser(null);

    try {
      await AsyncStorage.removeItem("authToken");

      console.log("Stored token removed");
    } catch (err) {
      console.log("Error removing stored token:", err);
    }

    await deleteDatabase();

    setSystemNotifs([
      {
        id: uuidv4(),
        title: "Logged Out",
        color: "#55ff55",
        text: "You successfully logged out.",
        actions: [
          {
            text: "Close",
            func: () => setSystemNotifs([]),
          },
        ],
      },
    ]);
  };

  const confirmDeleteAccount = () => {
    setSystemNotifs([
      {
        id: uuidv4(),
        color: "#ff5555",
        title: "Delete Account",
        text:
          "Are you sure you want to delete your account? " +
          "Once deleted, your data cannot be recovered.",
        actions: [
          {
            text: "Cancel",
            func: () => setSystemNotifs([]),
          },
          {
            text: "Delete",
            func: deleteAccount,
          },
        ],
      },
    ]);
  };

  const deleteAccount = () => {
    /*
     * Your existing implementation
     * was empty, so intentionally
     * leaving account deletion logic
     * untouched.
     */
  };

  return (
    <>
      <Animated.View
        pointerEvents={open ? "auto" : "none"}
        style={[
          styles.backdrop,
          {
            opacity: opacityAni,
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
      </Animated.View>

      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,

            transform: [
              {
                translateX: transXAni,
              },
            ],
          },
        ]}
      >
        {/* HEADER */}

        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,

              borderBottomColor: colors.border,
            },
          ]}
        >
          <View>
            <Text
              style={[
                styles.headerTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Settings
            </Text>

            <Text
              style={[
                styles.headerSubtitle,
                {
                  color: colors.secondary,
                },
              ]}
            >
              Customize Native Notes
            </Text>
          </View>

          <Pressable
            onPress={() => setOpen(false)}
            hitSlop={8}
            style={({ pressed }) => [
              styles.closeButton,

              {
                backgroundColor: pressed ? colors.pressed : colors.surface,
              },
            ]}
          >
            <Feather name="x" size={19} color={colors.secondary} />
          </Pressable>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* APPEARANCE */}

          <SettingsSection
            title="Appearance"
            description="Make Native Notes feel like yours"
            icon="sliders"
            accent={accent}
            colors={colors}
          >
            <SettingsRow
              icon={darkMode ? "moon" : "sun"}
              title="Dark mode"
              description={darkMode ? "Using dark appearance" : "Using light appearance"}
              colors={colors}
            >
              <SettingsSwitch
                value={darkMode}
                onValueChange={toggleDarkMode}
                accent={accent}
                colors={colors}
              />
            </SettingsRow>

            <RowDivider colors={colors} />

            <SettingsRow
              icon="droplet"
              title="Accent color"
              description="Use a custom color throughout the app"
              colors={colors}
            >
              <SettingsSwitch
                value={theme.on}
                onValueChange={toggleTheme}
                accent={accent}
                colors={colors}
              />
            </SettingsRow>

            {theme.on ? (
              <View
                style={[
                  styles.colorPickerArea,
                  {
                    borderTopColor: colors.border,
                  },
                ]}
              >
                <View style={styles.colorPickerHeader}>
                  <View>
                    <Text
                      style={[
                        styles.colorPickerTitle,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      Accent
                    </Text>

                    <Text
                      style={[
                        styles.colorPickerDescription,
                        {
                          color: colors.secondary,
                        },
                      ]}
                    >
                      Choose your highlight color
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.colorPreview,
                      {
                        backgroundColor: accent,
                      },
                    ]}
                  />
                </View>

                <Colors setColor={changeThemeColor} selectedColor={color} />
              </View>
            ) : null}
          </SettingsSection>

          {/* LAYOUT */}

          <SettingsSection
            title="Layout"
            description="Choose how your notes are displayed"
            icon="layout"
            accent={accent}
            colors={colors}
          >
            <View style={styles.segmentContainer}>
              <SegmentButton
                icon="list"
                label="List"
                selected={!view}
                onPress={() => changeView(false)}
                accent={accent}
                colors={colors}
              />

              <SegmentButton
                icon="grid"
                label="Grid"
                selected={view}
                onPress={() => changeView(true)}
                accent={accent}
                colors={colors}
              />
            </View>
          </SettingsSection>

          {/* SORTING */}

          <SettingsSection
            title="Sorting"
            description="Control how notes are ordered"
            icon="filter"
            accent={accent}
            colors={colors}
          >
            <Text
              style={[
                styles.controlLabel,
                {
                  color: colors.secondary,
                },
              ]}
            >
              SORT BY
            </Text>

            <View style={styles.segmentContainer}>
              <SegmentButton
                label="Title"
                selected={sort === "Title"}
                onPress={() => changeSort("Title")}
                accent={accent}
                colors={colors}
              />

              <SegmentButton
                label="Date"
                selected={sort === "Date"}
                onPress={() => changeSort("Date")}
                accent={accent}
                colors={colors}
              />

              <SegmentButton
                label="Updated"
                selected={sort === "Update"}
                onPress={() => changeSort("Update")}
                accent={accent}
                colors={colors}
              />
            </View>

            <View
              style={[
                styles.sortDirection,
                {
                  borderTopColor: colors.border,
                },
              ]}
            >
              <View style={styles.sortDirectionText}>
                <Text
                  style={[
                    styles.rowTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Sort direction
                </Text>

                <Text
                  style={[
                    styles.rowDescription,
                    {
                      color: colors.secondary,
                    },
                  ]}
                >
                  {order ? "Ascending order" : "Descending order"}
                </Text>
              </View>

              <Pressable
                onPress={toggleOrder}
                style={({ pressed }) => [
                  styles.directionButton,

                  {
                    backgroundColor: `${accent}14`,
                  },

                  pressed && {
                    opacity: 0.7,
                  },
                ]}
              >
                <Feather name={order ? "arrow-up" : "arrow-down"} size={17} color={accent} />
              </Pressable>
            </View>
          </SettingsSection>

          {/* BEHAVIOR */}

          <SettingsSection
            title="Behavior"
            description="Control how the app works"
            icon="settings"
            accent={accent}
            colors={colors}
          >
            <SettingsRow
              icon="save"
              title="Auto save"
              description="Save while editing every 10 seconds"
              colors={colors}
            >
              <SettingsSwitch
                value={autoSave}
                onValueChange={toggleAutoSave}
                accent={accent}
                colors={colors}
              />
            </SettingsRow>

            <RowDivider colors={colors} />

            <SettingsRow
              icon="map-pin"
              title="Remember location"
              description="Open the last folder you were viewing"
              colors={colors}
            >
              <SettingsSwitch
                value={saveLocation}
                onValueChange={toggleSaveLocation}
                accent={accent}
                colors={colors}
              />
            </SettingsRow>
          </SettingsSection>

          {/* SECURITY */}

          <SettingsSection
            title="Privacy & Security"
            description="Protect access to your notes"
            icon="shield"
            accent={accent}
            colors={colors}
          >
            <SettingsRow
              icon="lock"
              title="App lock"
              description="Require authentication when opening Native Notes"
              colors={colors}
            >
              <SettingsSwitch
                value={appLock}
                onValueChange={toggleAppLock}
                accent={accent}
                colors={colors}
              />
            </SettingsRow>
          </SettingsSection>

          {/* SUPPORT */}

          <SettingsSection
            title="Support"
            description="Help improve Native Notes"
            icon="help-circle"
            accent={accent}
            colors={colors}
          >
            <ActionRow
              icon="github"
              title="Report a bug"
              description="Open a new GitHub issue"
              onPress={openIssue}
              colors={colors}
            />
          </SettingsSection>

          {/* ACCOUNT */}

          <SettingsSection title="Account" icon="user" accent={accent} colors={colors}>
            <ActionRow
              icon="log-out"
              title="Log out"
              description="Sign out of this device"
              onPress={confirmLogout}
              colors={colors}
            />

            <RowDivider colors={colors} />

            <ActionRow
              icon="trash-2"
              title="Delete account"
              description="Permanently delete your account and data"
              onPress={confirmDeleteAccount}
              colors={colors}
              danger
            />
          </SettingsSection>

          <Text
            style={[
              styles.footer,
              {
                color: colors.muted,
              },
            ]}
          >
            Native Notes
          </Text>
        </ScrollView>
      </Animated.View>
    </>
  );
};

/*
 * SECTION
 */

const SettingsSection = ({ title, description, icon, accent, colors, children }) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <View
          style={[
            styles.sectionIcon,

            {
              backgroundColor: `${accent}14`,
            },
          ]}
        >
          <Feather name={icon} size={15} color={accent} />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            {title}
          </Text>

          {description ? (
            <Text
              style={[
                styles.sectionDescription,
                {
                  color: colors.secondary,
                },
              ]}
            >
              {description}
            </Text>
          ) : null}
        </View>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,

            borderColor: colors.border,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

/*
 * STANDARD SETTING ROW
 */

const SettingsRow = ({ icon, title, description, colors, children }) => {
  return (
    <View style={styles.settingRow}>
      <View
        style={[
          styles.rowIcon,
          {
            backgroundColor: colors.surfaceSecondary,
          },
        ]}
      >
        <Feather name={icon} size={16} color={colors.secondary} />
      </View>

      <View style={styles.rowText}>
        <Text
          style={[
            styles.rowTitle,
            {
              color: colors.text,
            },
          ]}
        >
          {title}
        </Text>

        {description ? (
          <Text
            style={[
              styles.rowDescription,
              {
                color: colors.secondary,
              },
            ]}
          >
            {description}
          </Text>
        ) : null}
      </View>

      <View style={styles.rowControl}>{children}</View>
    </View>
  );
};

/*
 * SWITCH
 */

const SettingsSwitch = ({ value, onValueChange, accent, colors }) => {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{
        false: colors.border,
        true: accent,
      }}
      thumbColor="#ffffff"
      ios_backgroundColor={colors.border}
    />
  );
};

/*
 * SEGMENTED BUTTON
 */

const SegmentButton = ({ icon, label, selected, onPress, accent, colors }) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.segmentButton,

        {
          backgroundColor: selected ? `${accent}18` : "transparent",
        },

        pressed && {
          backgroundColor: colors.pressed,
        },
      ]}
    >
      {icon ? <Feather name={icon} size={14} color={selected ? accent : colors.secondary} /> : null}

      <Text
        style={[
          styles.segmentText,

          {
            color: selected ? accent : colors.secondary,

            fontWeight: selected ? "700" : "500",
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

/*
 * ACTION ROW
 */

const ActionRow = ({ icon, title, description, onPress, colors, danger = false }) => {
  const color = danger ? colors.danger : colors.text;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,

        pressed && {
          backgroundColor: danger ? colors.dangerSurface : colors.pressed,
        },
      ]}
    >
      <View
        style={[
          styles.rowIcon,

          {
            backgroundColor: danger ? colors.dangerSurface : colors.surfaceSecondary,
          },
        ]}
      >
        <Feather name={icon} size={16} color={danger ? colors.danger : colors.secondary} />
      </View>

      <View style={styles.rowText}>
        <Text
          style={[
            styles.rowTitle,
            {
              color,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.rowDescription,
            {
              color: danger ? colors.danger : colors.secondary,
            },
          ]}
        >
          {description}
        </Text>
      </View>

      <Feather name="chevron-right" size={16} color={danger ? colors.danger : colors.muted} />
    </Pressable>
  );
};

const RowDivider = ({ colors }) => (
  <View
    style={[
      styles.divider,
      {
        backgroundColor: colors.border,
      },
    ]}
  />
);

const styles = StyleSheet.create({
  /*
   * PANEL
   */

  backdrop: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor: "rgba(0, 0, 0, 0.48)",

    zIndex: 100,
  },

  container: {
    position: "absolute",

    top: 0,
    right: 0,
    bottom: 0,

    width: "92%",

    zIndex: 101,

    elevation: 20,
  },

  /*
   * HEADER
   */

  header: {
    minHeight: 92,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 18,
    paddingTop: 32,
    paddingBottom: 12,

    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "700",

    letterSpacing: -0.4,
  },

  headerSubtitle: {
    marginTop: 2,

    fontSize: 11,
  },

  closeButton: {
    width: 40,
    height: 40,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 12,
  },

  /*
   * SCROLL
   */

  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 40,
  },

  /*
   * SECTIONS
   */

  section: {
    marginBottom: 24,
  },

  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",

    marginBottom: 9,
    paddingHorizontal: 3,
  },

  sectionIcon: {
    width: 30,
    height: 30,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 9,

    borderRadius: 9,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },

  sectionDescription: {
    marginTop: 1,

    fontSize: 10,
  },

  /*
   * CARD
   */

  card: {
    overflow: "hidden",

    borderRadius: 16,

    borderWidth: StyleSheet.hairlineWidth,
  },

  /*
   * ROW
   */

  settingRow: {
    minHeight: 68,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  actionRow: {
    minHeight: 68,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  rowIcon: {
    width: 36,
    height: 36,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 10,
  },

  rowText: {
    flex: 1,

    marginLeft: 11,
    marginRight: 8,
  },

  rowTitle: {
    fontSize: 14,
    fontWeight: "600",
  },

  rowDescription: {
    marginTop: 3,

    fontSize: 10,
    lineHeight: 14,
  },

  rowControl: {
    alignItems: "flex-end",
  },

  divider: {
    height: StyleSheet.hairlineWidth,

    marginLeft: 59,
  },

  /*
   * COLOR PICKER
   */

  colorPickerArea: {
    paddingHorizontal: 12,
    paddingTop: 13,
    paddingBottom: 14,

    borderTopWidth: StyleSheet.hairlineWidth,
  },

  colorPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 12,
  },

  colorPickerTitle: {
    fontSize: 13,
    fontWeight: "600",
  },

  colorPickerDescription: {
    marginTop: 2,

    fontSize: 10,
  },

  colorPreview: {
    width: 28,
    height: 28,

    borderRadius: 9,
  },

  /*
   * SEGMENT CONTROL
   */

  controlLabel: {
    marginTop: 12,
    marginLeft: 12,
    marginBottom: 7,

    fontSize: 9,
    fontWeight: "700",

    letterSpacing: 0.7,
  },

  segmentContainer: {
    flexDirection: "row",

    gap: 4,

    margin: 7,
    padding: 4,

    borderRadius: 12,
  },

  segmentButton: {
    flex: 1,
    minHeight: 40,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 6,

    paddingHorizontal: 8,

    borderRadius: 9,
  },

  segmentText: {
    fontSize: 12,
  },

  /*
   * SORT DIRECTION
   */

  sortDirection: {
    minHeight: 64,

    flexDirection: "row",
    alignItems: "center",

    marginTop: 5,
    paddingHorizontal: 12,

    borderTopWidth: StyleSheet.hairlineWidth,
  },

  sortDirectionText: {
    flex: 1,
  },

  directionButton: {
    width: 38,
    height: 38,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 11,
  },

  /*
   * FOOTER
   */

  footer: {
    marginTop: 2,

    textAlign: "center",

    fontSize: 10,
  },
});

export default UserSettings;
