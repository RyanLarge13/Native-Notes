import { useState, useEffect, useRef, useMemo, useCallback } from "react";

import {
  ScrollView,
  StyleSheet,
  Pressable,
  View,
  Text,
  Animated,
  useWindowDimensions,
  BackHandler,
} from "react-native";

import { Outlet, useLocation, useNavigate } from "react-router-native";

import { Feather } from "@expo/vector-icons";

import Header from "../components/Header";
import Sorter from "../components/Sorter";
import Folder from "../components/Folder";
import Note from "../components/Note";

import formatColor from "../utils/helpers/formatColor";

const Account = ({
  mainTitle,
  folders,
  notes,
  setNotes,
  folder,
  setFolder,
  goBack,
  setOpen,
  pickFolder,
  open,
  menuOpen,
  options,
  setOptions,
  note,
  setNote,
  allNotes,
  setMenuOpen,
  systemFolder,
  layoutOptions,
  setLayoutOptions,
  userSettingsOpen,
  view,
  setView,
  order,
  setOrder,
  sort,
  setSort,
  saveLocation,
  autoSave,
  darkMode,
  theme,
  appLock,
  user,
  db,
}) => {
  const [sortOptions, setSortOptions] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  const navigate = useNavigate();
  const location = useLocation();

  const { width } = useWindowDimensions();

  const accent = theme.on ? theme.color : "#f59e0b";

  const colors = darkMode
    ? {
        background: "#111113",
        surface: "#18181b",
        surfacePressed: "#202023",

        text: "#f4f4f5",
        secondary: "#a1a1aa",
        muted: "#71717a",

        border: "#27272a",
      }
    : {
        background: "#fafafa",
        surface: "#ffffff",
        surfacePressed: "#f4f4f5",

        text: "#18181b",
        secondary: "#71717a",
        muted: "#a1a1aa",

        border: "#e4e4e7",
      };

  /*
   * Sort/filter notes without storing derived
   * data in another state variable.
   */
  const notesToRender = useMemo(() => {
    const filtered =
      mainTitle === "Trashed"
        ? notes.filter((item) => item.trashed)
        : notes.filter((item) => !item.trashed);

    return [...filtered].sort((a, b) => {
      let comparison = 0;

      if (sort === "Title") {
        comparison = (a.title || "").localeCompare(b.title || "");
      } else if (sort === "Date") {
        comparison = +new Date(a.createdAt) - +new Date(b.createdAt);
      } else {
        comparison = +new Date(a.updated) - +new Date(b.updated);
      }

      return order ? comparison : -comparison;
    });
  }, [notes, mainTitle, sort, order]);

  /*
   * Scroll animations.
   *
   * Instead of measuring the title on every scroll
   * event, derive the animation directly from
   * scroll position.
   */
  const titleOpacity = scrollY.interpolate({
    inputRange: [20, 110],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, 110],
    outputRange: [0, -15],
    extrapolate: "clamp",
  });

  const miniTitleOpacity = scrollY.interpolate({
    inputRange: [80, 130],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const nestedGoBack = useCallback(() => {
    if (location.pathname === "/newnote") {
      return false;
    }

    if (location.pathname !== "/") {
      navigate("/");
      return true;
    }

    if (sortOptions) {
      setSortOptions(false);
      return true;
    }

    return goBack();
  }, [location.pathname, navigate, sortOptions, goBack]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", nestedGoBack);

    return () => subscription.remove();
  }, [nestedGoBack]);

  const toggleOptions = () => {
    setOptions((prev) => !prev);
  };

  const saveNewLocation = async (id) => {
    if (!saveLocation) {
      return;
    }

    const newPreferences = {
      order,
      appLock,
      autoSave,
      darkMode,
      theme,
      view,
      sort,
      saveLocation: true,
      location: id,
    };

    try {
      await db.runAsync(
        `
          UPDATE user
          SET preferences = ?
          WHERE userId = ?
        `,
        [JSON.stringify(newPreferences), user.userId]
      );
    } catch (err) {
      console.log(err);
    }
  };

  const folderAccent = folder ? formatColor(folder.color) : accent;

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        stickyHeaderIndices={[1]}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [
            {
              nativeEvent: {
                contentOffset: {
                  y: scrollY,
                },
              },
            },
          ],
          {
            useNativeDriver: true,
          }
        )}
      >
        {/* PAGE TITLE */}

        <Animated.View
          style={[
            styles.hero,
            {
              opacity: titleOpacity,

              transform: [
                {
                  translateY: titleTranslateY,
                },
              ],
            },
          ]}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.mainTitle,
              {
                color: colors.text,
              },
            ]}
          >
            {mainTitle}
          </Text>

          <Text
            style={[
              styles.pageMeta,
              {
                color: colors.secondary,
              },
            ]}
          >
            {folders.length} {folders.length === 1 ? "folder" : "folders"}
            {"  ·  "}
            {notesToRender.length} {notesToRender.length === 1 ? "note" : "notes"}
          </Text>

          <View
            style={[
              styles.titleAccent,
              {
                backgroundColor: folderAccent,
              },
            ]}
          />
        </Animated.View>

        {/* STICKY HEADER */}

        <View
          style={[
            styles.headerContainer,
            {
              backgroundColor: colors.background,

              borderBottomColor: colors.border,
            },
          ]}
        >
          <Animated.Text
            numberOfLines={1}
            style={[
              styles.miniTitle,
              {
                color: colors.text,
                opacity: miniTitleOpacity,
              },
            ]}
          >
            {mainTitle}
          </Animated.Text>

          <Header
            folder={folder}
            setFolder={setFolder}
            goBack={goBack}
            notes={notes}
            setNotes={setNotes}
            allNotes={allNotes}
            setMenuOpen={setMenuOpen}
            view={view}
            setView={setView}
            layoutOptions={layoutOptions}
            setLayoutOptions={setLayoutOptions}
            darkMode={darkMode}
            theme={theme}
          />
        </View>

        {/* MAIN CONTENT */}

        <View style={styles.content}>
          {/* FOLDERS */}

          {folders.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Folders" count={folders.length} colors={colors} />

              <View style={styles.folderContainer}>
                {folders.map((fold) => (
                  <Folder
                    key={fold.folderid}
                    folder={fold}
                    setFolder={setFolder}
                    setOpen={setOpen}
                    allNotes={allNotes}
                    saveLocation={saveNewLocation}
                    darkMode={darkMode}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {/* NOTES */}

          <View style={styles.notesSection}>
            <SectionHeader title="Notes" count={notesToRender.length} colors={colors} />

            <Sorter
              filter={sort}
              setFilter={setSort}
              order={order}
              setOrder={setOrder}
              sortOptions={sortOptions}
              setSortOptions={setSortOptions}
              db={db}
              darkMode={darkMode}
              theme={theme}
            />

            {notesToRender.length > 0 ? (
              <View style={[styles.notesContainer, view ? styles.notesGrid : styles.notesList]}>
                {notesToRender.map((aNote, index) => (
                  <Note
                    key={aNote.noteid}
                    note={aNote}
                    setOpen={setOpen}
                    setNote={setNote}
                    view={view}
                    index={index}
                    width={width}
                    darkMode={darkMode}
                    theme={theme}
                  />
                ))}
              </View>
            ) : (
              <EmptyNotes colors={colors} accent={accent} trashed={mainTitle === "Trashed"} />
            )}
          </View>
        </View>
      </Animated.ScrollView>

      {/* SORT / LAYOUT BACKDROP */}

      {layoutOptions || sortOptions ? (
        <Pressable
          style={styles.backdropLayout}
          onPress={() => {
            setLayoutOptions(false);
            setSortOptions(false);
          }}
        />
      ) : null}

      {/* CREATE NOTE */}

      {!note ? (
        <>
          {options ? <Pressable style={styles.backdrop} onPress={() => setOptions(false)} /> : null}

          <Pressable
            onPress={toggleOptions}
            style={({ pressed }) => [
              styles.addButton,

              {
                backgroundColor: accent,
              },

              pressed && styles.addButtonPressed,
            ]}
          >
            <Feather
              name={options ? "x" : "edit-3"}
              size={21}
              color={darkMode ? "#18181b" : "#ffffff"}
            />
          </Pressable>
        </>
      ) : null}

      <Outlet />
    </View>
  );
};

/*
 * Reusable section heading
 */
const SectionHeader = ({ title, count, colors }) => {
  return (
    <View style={styles.sectionHeader}>
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

      <View
        style={[
          styles.countBadge,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.countText,
            {
              color: colors.secondary,
            },
          ]}
        >
          {count}
        </Text>
      </View>
    </View>
  );
};

/*
 * Empty state
 */
const EmptyNotes = ({ colors, accent, trashed }) => {
  return (
    <View style={styles.emptyState}>
      <View
        style={[
          styles.emptyIcon,
          {
            backgroundColor: `${accent}14`,
          },
        ]}
      >
        <Feather name={trashed ? "trash-2" : "file-text"} size={23} color={accent} />
      </View>

      <Text
        style={[
          styles.emptyTitle,
          {
            color: colors.text,
          },
        ]}
      >
        {trashed ? "Trash is empty" : "No notes yet"}
      </Text>

      <Text
        style={[
          styles.emptyDescription,
          {
            color: colors.secondary,
          },
        ]}
      >
        {trashed ? "Deleted notes will appear here." : "Create a note to get started."}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 110,
  },

  /*
   * TITLE / HERO
   */

  hero: {
    paddingTop: 95,
    paddingHorizontal: 18,
    paddingBottom: 28,

    alignItems: "flex-start",
  },

  mainTitle: {
    fontSize: 30,
    fontWeight: "700",

    letterSpacing: -0.5,
  },

  pageMeta: {
    marginTop: 5,

    fontSize: 12,
  },

  titleAccent: {
    width: 32,
    height: 3,

    marginTop: 14,

    borderRadius: 2,
  },

  /*
   * HEADER
   */

  headerContainer: {
    paddingTop: 4,
    paddingBottom: 8,

    borderBottomWidth: StyleSheet.hairlineWidth,

    zIndex: 20,
  },

  miniTitle: {
    marginLeft: 18,
    marginTop: 3,
    marginBottom: -2,

    fontSize: 11,
    fontWeight: "600",
  },

  /*
   * CONTENT
   */

  content: {
    paddingHorizontal: 14,
    paddingTop: 20,
  },

  section: {
    marginBottom: 30,
  },

  notesSection: {
    marginBottom: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",

    marginHorizontal: 4,
    marginBottom: 13,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "650",
  },

  countBadge: {
    minWidth: 25,
    height: 22,

    alignItems: "center",
    justifyContent: "center",

    marginLeft: 8,
    paddingHorizontal: 7,

    borderRadius: 7,

    borderWidth: StyleSheet.hairlineWidth,
  },

  countText: {
    fontSize: 11,
    fontWeight: "600",
  },

  /*
   * FOLDERS
   */

  folderContainer: {
    flexDirection: "row",
    flexWrap: "wrap",

    alignItems: "stretch",

    gap: 10,
  },

  /*
   * NOTES
   */

  notesContainer: {
    marginTop: 14,
  },

  notesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",

    justifyContent: "space-between",

    gap: 10,
  },

  notesList: {
    flexDirection: "column",

    gap: 10,
  },

  /*
   * EMPTY STATE
   */

  emptyState: {
    alignItems: "center",

    paddingTop: 55,
    paddingBottom: 80,
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 52,
    height: 52,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 13,

    borderRadius: 16,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },

  emptyDescription: {
    marginTop: 5,

    fontSize: 12,
    textAlign: "center",
  },

  /*
   * FLOATING ACTION BUTTON
   */

  addButton: {
    position: "absolute",

    right: 18,
    bottom: 20,

    width: 56,
    height: 56,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 18,

    elevation: 8,

    zIndex: 50,
  },

  addButtonPressed: {
    transform: [
      {
        scale: 0.94,
      },
    ],

    opacity: 0.9,
  },

  /*
   * OVERLAYS
   */

  backdrop: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor: "rgba(0, 0, 0, 0.35)",

    zIndex: 40,
  },

  backdropLayout: {
    ...StyleSheet.absoluteFillObject,

    zIndex: 10,
  },
});

export default Account;
