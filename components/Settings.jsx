import { useState, useEffect, useRef } from "react";

import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import {
  createNewNote,
  deleteAFolder,
  deleteANote,
  updateFolder,
  updateNote,
} from "../utils/api";

import { unFormatColor, formatColor } from "../utils/helpers/formatColor.js";

import { v4 as uuidv4 } from "uuid";

import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

import Colors from "./Colors";

const Settings = ({
  pickFolder,
  item,
  type,
  setOpen,
  token,
  setAllData,
  setPickFolder,
  selectedFolder,
  setSelectedFolder,
  db,
  setSystemNotifs,
  darkMode,
  theme,
}) => {
  const [newTitle, setNewTitle] = useState("");

  const [newColor, setNewColor] = useState(formatColor(item.color));

  const [isLocked, setIsLocked] = useState(
    item.locked === 1 || item.locked === true,
  );

  /*
   * ANIMATION
   */

  const animation = useRef(new Animated.Value(0)).current;

  const pickerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pickerAnimation, {
      toValue: pickFolder ? 1 : 0,
      tension: 100,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [pickFolder]);

  useEffect(() => {
    Animated.spring(animation, {
      toValue: 1,
      tension: 110,
      friction: 11,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [350, 0],
  });

  const sheetScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1],
  });

  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const pickerTranslateY = pickerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 500],
  });

  const pickerOpacity = pickerAnimation.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 0.5, 0],
  });

  const combinedTranslateY = Animated.add(translateY, pickerTranslateY);

  const combinedBackdropOpacity = Animated.multiply(
    backdropOpacity,
    pickerOpacity,
  );

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
        dangerSurface: "rgba(248,113,113,0.10)",
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
        dangerSurface: "rgba(220,38,38,0.07)",
      };

  /*
   * CLOSE
   *
   * Let the animation finish BEFORE App.js
   * removes this component.
   */

  const closeModal = (callback = null) => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setSelectedFolder(null);
      setOpen({ show: false });

      // callback?.();
    });
  };

  /*
   * FOLDER
   */

  const updateAFolder = async () => {
    const newFolder = {
      parentFolderId: selectedFolder
        ? selectedFolder.folderid
        : item.parentFolderId,

      title: newTitle.trim() || item.title,

      color: unFormatColor(newColor),

      folderId: item.folderid,
    };

    setAllData((prevData) => {
      const newFolders = prevData.folders.filter(
        (fold) => fold.folderid !== newFolder.folderId,
      );

      newFolders.push({
        ...newFolder,
        folderid: item.folderid,
      });

      return {
        ...prevData,
        folders: newFolders,
      };
    });

    try {
      await db.runAsync(
        `
          UPDATE folders
          SET title = ?,
              color = ?,
              parentFolderId = ?
          WHERE folderid = ?
        `,
        [
          newFolder.title,
          newFolder.color,
          newFolder.parentFolderId,
          newFolder.folderId,
        ],
      );
    } catch (err) {
      console.log("Error updating local folder:", err);
    }

    closeModal();

    updateFolder(token, newFolder)
      .then(() => {
        console.log("Folder updated");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const confirmDeleteFolder = () => {
    setSystemNotifs([
      {
        id: uuidv4(),

        color: "#f33",

        title: `Delete Folder ${item.title}`,

        text: "Are you sure you want to delete this folder?",

        actions: [
          {
            text: "close",

            func: () => setSystemNotifs([]),
          },

          {
            text: "delete",

            func: () => {
              setSystemNotifs([]);
              deleteFolder();
            },
          },
        ],
      },
    ]);
  };

  const deleteFolder = async () => {
    const folderId = item.folderid;

    setAllData((prevData) => ({
      ...prevData,

      folders: prevData.folders.filter((fold) => fold.folderid !== folderId),
    }));

    await db.runAsync(
      `
        DELETE FROM folders
        WHERE folderid = $deleteId
      `,
      {
        $deleteId: folderId,
      },
    );

    closeModal();

    deleteAFolder(token, folderId)
      .then(() => {
        console.log("Folder delete request complete");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  /*
   * NOTE
   */

  const confirmDeleteNote = () => {
    setSystemNotifs([
      {
        id: uuidv4(),

        color: "#f33",

        title: `Delete Note ${item.title}`,

        text: "Are you sure you want to delete this note?",

        actions: [
          {
            text: "close",

            func: () => setSystemNotifs([]),
          },

          {
            text: "delete",

            func: () => {
              setSystemNotifs([]);
              deleteNote();
            },
          },
        ],
      },
    ]);
  };

  const deleteNote = async () => {
    const noteId = item.noteid;

    setAllData((prevData) => ({
      ...prevData,

      notes: prevData.notes.filter((note) => note.noteid !== noteId),
    }));

    await db.runAsync(
      `
        DELETE FROM notes
        WHERE noteid = $deleteId
      `,
      {
        $deleteId: noteId,
      },
    );

    closeModal();

    deleteANote(token, noteId)
      .then(() => {
        console.log("Note delete request complete");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const updateNoteTitleOrLocked = async () => {
    const updatedNote = {
      notesId: item.noteid,

      title: newTitle.trim() || item.title,

      htmlNotes: item.htmlText,

      locked: isLocked,

      folderId: item.folderId,

      updated: new Date(),
    };

    updateNote(token, updatedNote)
      .then(async (res) => {
        const resNote = res.data.data[0];

        const noteToPush = {
          title: resNote.title,

          createdAt: resNote.createdat,

          noteid: resNote.notesid,

          htmlText: resNote.htmlnotes,

          locked: resNote.locked,

          folderId: resNote.folderid,

          updated: resNote.updated,
        };

        setAllData((prevUser) => {
          const newNotes = prevUser.notes.filter(
            (note) => note.noteid !== resNote.notesid,
          );

          newNotes.push(noteToPush);

          return {
            ...prevUser,
            notes: newNotes,
          };
        });

        try {
          await db.runAsync(
            `
                UPDATE notes
                SET title = ?,
                    locked = ?,
                    htmlText = ?,
                    folderId = ?,
                    updated = ?
                WHERE noteid = ?
              `,
            [
              resNote.title,
              resNote.locked,
              resNote.htmlnotes,
              resNote.folderid,
              resNote.updated,
              resNote.notesid,
            ],
          );
        } catch (err) {
          console.log("Error updating local note:", err);
        }

        closeModal();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  /*
   * MOVE FOLDER
   */

  const openFolderTree = () => {
    setPickFolder(true);
  };

  /*
   * SHARED SHEET
   */

  const Sheet = ({ children }) => (
    <>
      <Animated.View
        pointerEvents={pickFolder ? "none" : "auto"}
        style={[
          styles.backdrop,
          {
            opacity: combinedBackdropOpacity,
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
      </Animated.View>

      <KeyboardAvoidingView
        pointerEvents={pickFolder ? "none" : "box-none"}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardContainer}
      >
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,

              opacity: pickerOpacity,

              transform: [
                {
                  translateY: combinedTranslateY,
                },
                {
                  scale: sheetScale,
                },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.handle,
              {
                backgroundColor: colors.border,
              },
            ]}
          />

          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </>
  );

  /*
   * FOLDER UI
   */

  if (type === "folder") {
    return (
      <Sheet>
        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text
              style={[
                styles.eyebrow,

                {
                  color: colors.secondary,
                },
              ]}
            >
              FOLDER
            </Text>

            <Text
              style={[
                styles.heading,

                {
                  color: colors.text,
                },
              ]}
              numberOfLines={1}
            >
              Folder options
            </Text>
          </View>

          <Pressable
            hitSlop={8}
            onPress={closeModal}
            style={({ pressed }) => [
              styles.closeButton,

              {
                backgroundColor: pressed ? colors.pressed : colors.surface,
              },
            ]}
          >
            <Feather name="x" size={18} color={colors.secondary} />
          </Pressable>
        </View>

        {/* TITLE */}

        <Text
          style={[
            styles.label,
            {
              color: colors.secondary,
            },
          ]}
        >
          NAME
        </Text>

        <View
          style={[
            styles.inputContainer,

            {
              backgroundColor: colors.surface,

              borderColor: colors.border,
            },
          ]}
        >
          <Feather name="folder" size={17} color={newColor} />

          <TextInput
            style={[
              styles.input,

              {
                color: colors.text,
              },
            ]}
            placeholder={item.title}
            placeholderTextColor={colors.muted}
            value={newTitle}
            onChangeText={setNewTitle}
            selectionColor={accent}
          />
        </View>

        {/* COLOR */}

        <View style={styles.sectionHeader}>
          <View>
            <Text
              style={[
                styles.sectionTitle,

                {
                  color: colors.text,
                },
              ]}
            >
              Folder color
            </Text>

            <Text
              style={[
                styles.sectionDescription,

                {
                  color: colors.secondary,
                },
              ]}
            >
              Choose a color to identify this folder
            </Text>
          </View>

          <View
            style={[
              styles.colorPreview,
              {
                backgroundColor: newColor,
              },
            ]}
          />
        </View>

        <View
          style={[
            styles.colorContainer,

            {
              backgroundColor: colors.surface,

              borderColor: colors.border,
            },
          ]}
        >
          <Colors setColor={setNewColor} selectedColor={newColor} />
        </View>

        {/* LOCATION */}

        <Text
          style={[
            styles.label,

            {
              color: colors.secondary,
            },
          ]}
        >
          LOCATION
        </Text>

        <Pressable
          onPress={openFolderTree}
          style={({ pressed }) => [
            styles.actionRow,

            {
              backgroundColor: pressed ? colors.pressed : colors.surface,

              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.actionIcon,

              {
                backgroundColor: `${accent}14`,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="folder-move-outline"
              size={20}
              color={accent}
            />
          </View>

          <View style={styles.actionText}>
            <Text
              style={[
                styles.actionTitle,

                {
                  color: colors.text,
                },
              ]}
            >
              Move folder
            </Text>

            <Text
              style={[
                styles.actionDescription,

                {
                  color: selectedFolder ? accent : colors.secondary,
                },
              ]}
              numberOfLines={1}
            >
              {selectedFolder
                ? `${item.title} → ${selectedFolder.title}`
                : "Choose another folder or top level"}
            </Text>
          </View>

          <Feather name="chevron-right" size={18} color={colors.muted} />
        </Pressable>

        {/* SAVE */}

        <Pressable
          onPress={updateAFolder}
          style={({ pressed }) => [
            styles.saveButton,

            {
              backgroundColor: accent,

              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Feather name="check" size={18} color="#18181b" />

          <Text style={styles.saveButtonText}>Save changes</Text>
        </Pressable>

        {/* DELETE */}

        <Pressable
          onPress={confirmDeleteFolder}
          style={({ pressed }) => [
            styles.deleteButton,

            {
              backgroundColor: pressed ? colors.dangerSurface : "transparent",
            },
          ]}
        >
          <Feather name="trash-2" size={16} color={colors.danger} />

          <Text
            style={[
              styles.deleteText,

              {
                color: colors.danger,
              },
            ]}
          >
            Delete folder
          </Text>
        </Pressable>
      </Sheet>
    );
  }

  // Copy note
  const confirmCopy = () => {
    const newNotification = [
      {
        id: uuidv4(),
        color: "#fde047",
        title: "Duplicate Note",
        text: "Are you sure you want to duplicate this note and its contents?",
        actions: [{ text: "close", func: () => handleCopyNote() }],
      },
    ];

    setSystemNotifs((prev) => [...prev, newNotification]);
  };

  const handleCopyNote = async () => {
    const copiedNote = {
      title: item.title || "",
      htmlNotes: item.htmlText || "",
      folderId: item?.parentFolderId || null,
      locked: item.locked ?? false,
    };

    try {
      const res = await createNewNote(token, copiedNote);
      const resNote = res.data.data[0];

      const savedNote = {
        title: resNote.title,
        createdAt: resNote.createdat,
        noteid: resNote.notesid,
        htmlText: resNote.htmlnotes,
        locked: resNote.locked,
        folderId: resNote.folderid,
        updated: resNote.updated,
      };

      setAllData((prev) => ({
        ...prev,
        notes: [...prev.notes, savedNote],
      }));
    } catch (err) {
      console.log("Error copying note from server inside handleCopyNote");
      console.log(err);
    }
  };

  /*
   * NOTE UI
   */

  return (
    <Sheet>
      {/* HEADER */}

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text
            style={[
              styles.eyebrow,

              {
                color: colors.secondary,
              },
            ]}
          >
            NOTE
          </Text>

          <Text
            style={[
              styles.heading,

              {
                color: colors.text,
              },
            ]}
          >
            Note options
          </Text>
        </View>

        <Pressable
          hitSlop={8}
          onPress={closeModal}
          style={({ pressed }) => [
            styles.closeButton,

            {
              backgroundColor: pressed ? colors.pressed : colors.surface,
            },
          ]}
        >
          <Feather name="x" size={18} color={colors.secondary} />
        </Pressable>
      </View>

      {/* TITLE */}

      <Text
        style={[
          styles.label,

          {
            color: colors.secondary,
          },
        ]}
      >
        TITLE
      </Text>

      <View
        style={[
          styles.inputContainer,

          {
            backgroundColor: colors.surface,

            borderColor: colors.border,
          },
        ]}
      >
        <Feather name="file-text" size={17} color={colors.muted} />

        <TextInput
          style={[
            styles.input,

            {
              color: colors.text,
            },
          ]}
          placeholder={item.title}
          placeholderTextColor={colors.muted}
          value={newTitle}
          onChangeText={setNewTitle}
          selectionColor={accent}
        />
      </View>

      {/* SECURITY */}

      <Text
        style={[
          styles.label,

          {
            color: colors.secondary,
          },
        ]}
      >
        PRIVACY
      </Text>

      <View
        style={[
          styles.lockContainer,

          {
            backgroundColor: colors.surface,

            borderColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.actionIcon,

            {
              backgroundColor: isLocked
                ? `${accent}14`
                : colors.surfaceSecondary,
            },
          ]}
        >
          <Feather
            name="lock"
            size={17}
            color={isLocked ? accent : colors.secondary}
          />
        </View>

        <View style={styles.actionText}>
          <Text
            style={[
              styles.actionTitle,

              {
                color: colors.text,
              },
            ]}
          >
            Lock note
          </Text>

          <Text
            style={[
              styles.actionDescription,

              {
                color: colors.secondary,
              },
            ]}
          >
            Require authentication before opening
          </Text>
        </View>

        <Switch
          value={isLocked}
          onValueChange={setIsLocked}
          trackColor={{
            false: colors.border,
            true: accent,
          }}
          thumbColor="#ffffff"
          ios_backgroundColor={colors.border}
        />
      </View>

      {/* QUICK ACTIONS */}

      <Text
        style={[
          styles.label,

          {
            color: colors.secondary,
          },
        ]}
      >
        Quick Actions
      </Text>

      <Pressable
        onPress={confirmCopy}
        style={[
          styles.lockContainer,

          {
            backgroundColor: colors.surface,

            borderColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.actionIcon,

            {
              backgroundColor: isLocked
                ? `${accent}14`
                : colors.surfaceSecondary,
            },
          ]}
        >
          <Feather name="copy" size={17} color={colors.secondary} />
        </View>

        <View style={styles.actionText}>
          <Text
            style={[
              styles.actionTitle,

              {
                color: colors.text,
              },
            ]}
          >
            Copy Note
          </Text>

          <Text
            style={[
              styles.actionDescription,

              {
                color: colors.secondary,
              },
            ]}
          >
            Create a duplicate of this note
          </Text>
        </View>
      </Pressable>

      {/* METADATA */}

      <View
        style={[
          styles.metadata,

          {
            borderColor: colors.border,
          },
        ]}
      >
        <Feather name="calendar" size={14} color={colors.muted} />

        <Text
          style={[
            styles.metadataText,

            {
              color: colors.secondary,
            },
          ]}
        >
          Created{" "}
          {new Date(item.createdAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </Text>
      </View>

      {/* SAVE */}

      <Pressable
        onPress={updateNoteTitleOrLocked}
        style={({ pressed }) => [
          styles.saveButton,

          {
            backgroundColor: accent,

            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Feather name="check" size={18} color="#18181b" />

        <Text style={styles.saveButtonText}>Save changes</Text>
      </Pressable>

      {/* DELETE */}

      <Pressable
        onPress={confirmDeleteNote}
        style={({ pressed }) => [
          styles.deleteButton,

          {
            backgroundColor: pressed ? colors.dangerSurface : "transparent",
          },
        ]}
      >
        <Feather name="trash-2" size={16} color={colors.danger} />

        <Text
          style={[
            styles.deleteText,

            {
              color: colors.danger,
            },
          ]}
        >
          Delete note
        </Text>
      </Pressable>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  /*
   * BACKDROP
   */

  backdrop: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor: "rgba(0,0,0,0.55)",

    zIndex: 200,
  },

  /*
   * POSITIONING
   */

  keyboardContainer: {
    position: "absolute",

    top: 0,
    right: 0,
    bottom: 0,
    left: 0,

    justifyContent: "flex-end",

    pointerEvents: "box-none",

    zIndex: 201,
  },

  container: {
    width: "100%",

    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,

    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,

    borderWidth: StyleSheet.hairlineWidth,

    elevation: 24,
  },

  /*
   * HANDLE
   */

  handle: {
    width: 38,
    height: 4,

    alignSelf: "center",

    borderRadius: 10,

    marginBottom: 16,
  },

  /*
   * HEADER
   */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 22,
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 9,
    fontWeight: "700",

    letterSpacing: 1.2,

    marginBottom: 3,
  },

  heading: {
    fontSize: 22,
    fontWeight: "700",

    letterSpacing: -0.4,
  },

  closeButton: {
    width: 40,
    height: 40,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 12,
  },

  /*
   * INPUT
   */

  label: {
    marginLeft: 2,
    marginBottom: 7,
    marginTop: 5,

    fontSize: 9,
    fontWeight: "700",

    letterSpacing: 0.8,
  },

  inputContainer: {
    minHeight: 52,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 14,

    borderRadius: 14,

    borderWidth: StyleSheet.hairlineWidth,

    marginBottom: 20,
  },

  input: {
    flex: 1,

    height: 50,

    marginLeft: 11,

    paddingVertical: 0,

    fontSize: 14,
    fontWeight: "500",
  },

  /*
   * COLOR
   */

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
  },

  sectionDescription: {
    marginTop: 3,

    fontSize: 10,
  },

  colorPreview: {
    width: 30,
    height: 30,

    borderRadius: 9,
  },

  colorContainer: {
    paddingHorizontal: 10,
    paddingVertical: 12,

    borderRadius: 14,

    borderWidth: StyleSheet.hairlineWidth,

    marginBottom: 20,
  },

  /*
   * ACTION ROW
   */

  actionRow: {
    minHeight: 68,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 12,
    paddingVertical: 10,

    borderRadius: 14,

    borderWidth: StyleSheet.hairlineWidth,

    marginBottom: 20,
  },

  actionIcon: {
    width: 38,
    height: 38,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 11,
  },

  actionText: {
    flex: 1,

    marginLeft: 11,
    marginRight: 8,
  },

  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
  },

  actionDescription: {
    marginTop: 3,

    fontSize: 10,
    lineHeight: 14,
  },

  /*
   * LOCK
   */

  lockContainer: {
    minHeight: 68,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 12,
    paddingVertical: 10,

    borderRadius: 14,

    borderWidth: StyleSheet.hairlineWidth,

    marginBottom: 14,
  },

  /*
   * METADATA
   */

  metadata: {
    flexDirection: "row",
    alignItems: "center",

    gap: 7,

    paddingTop: 12,
    marginBottom: 20,

    borderTopWidth: StyleSheet.hairlineWidth,
  },

  metadataText: {
    fontSize: 10,
  },

  /*
   * SAVE
   */

  saveButton: {
    minHeight: 52,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 8,

    borderRadius: 14,

    elevation: 3,
  },

  saveButtonText: {
    color: "#18181b",

    fontSize: 14,
    fontWeight: "700",
  },

  /*
   * DELETE
   */

  deleteButton: {
    minHeight: 46,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 7,

    marginTop: 8,

    borderRadius: 12,
  },

  deleteText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default Settings;
