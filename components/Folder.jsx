import { View, Text, StyleSheet } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import Ripple from "react-native-material-ripple";

import formatColor from "../utils/helpers/formatColor";

const Folder = ({ folder, setFolder, setOpen, allNotes, saveLocation, darkMode }) => {
  const folderColor = formatColor(folder.color);

  const notesLen = allNotes.filter((note) => note.folderId === folder.folderid).length;

  const colors = darkMode
    ? {
        surface: "#18181b",
        border: "#27272a",
        text: "#f4f4f5",
        secondary: "#a1a1aa",
      }
    : {
        surface: "#ffffff",
        border: "#e4e4e7",
        text: "#18181b",
        secondary: "#71717a",
      };

  const openFolderSettings = () => {
    setOpen({
      show: true,
      item: folder,
      type: "folder",
    });
  };

  return (
    <Ripple
      rippleColor={folderColor}
      rippleOpacity={0.08}
      rippleDuration={250}
      onLongPress={openFolderSettings}
      onPress={() => {
        setFolder(folder);
        saveLocation(folder.folderid);
      }}
      style={[
        styles.folder,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Colored accent */}

      <View
        style={[
          styles.accent,
          {
            backgroundColor: folderColor,
          },
        ]}
      />

      {/* Folder icon */}

      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: `${folderColor}18`,
          },
        ]}
      >
        <FontAwesome5 name="folder" solid size={21} color={folderColor} />
      </View>

      {/* Folder information */}

      <View style={styles.info}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          {folder.title}
        </Text>

        <Text
          style={[
            styles.noteCount,
            {
              color: colors.secondary,
            },
          ]}
        >
          {notesLen === 0 ? "Empty" : `${notesLen} ${notesLen === 1 ? "note" : "notes"}`}
        </Text>
      </View>
    </Ripple>
  );
};

const styles = StyleSheet.create({
  folder: {
    width: "47%",
    height: 125,

    padding: 12,

    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,

    overflow: "hidden",

    elevation: 2,
  },

  accent: {
    position: "absolute",

    top: 0,
    left: 0,
    right: 0,

    height: 3,
  },

  iconContainer: {
    width: 38,
    height: 38,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 10,

    marginTop: 2,
    marginBottom: 3,
  },

  info: {
    flex: 1,

    justifyContent: "flex-end",
  },

  title: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 0,
    marginBottom: 3,
  },

  noteCount: {
    fontSize: 11,
    fontWeight: "400",
  },
});

export default Folder;
