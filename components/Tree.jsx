import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";

import { FontAwesome5 } from "@expo/vector-icons";

import formatColor from "../utils/helpers/formatColor";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Tree = ({
  moving,
  setPickFolder,
  setSelectedFolder,
  setFolder,
  folders,
  parentId,
  level = 0,
  open,
  setMenuOpen,
  darkMode,
}) => {
  const [folderStates, setFolderStates] = useState({});

  const topFolders = folders.filter(
    (folder) => folder.parentFolderId === parentId,
  );

  const colors = darkMode
    ? {
        text: "#f5f5f5",
        muted: "#8e8e93",
        rowPressed: "#ffffff0d",
        selected: "#ffffff12",
        selectedPressed: "#ffffff18",
      }
    : {
        text: "#18181b",
        muted: "#8a8a8e",
        rowPressed: "#00000008",
        selected: "#0000000a",
        selectedPressed: "#00000010",
      };

  const toggleNested = (folderId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setFolderStates((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleFolderPress = (folder) => {
    if (moving) {
      if (open?.item?.folderid !== folder.folderid) {
        setSelectedFolder(folder);
      }

      return;
    }

    setFolder(folder);
    setMenuOpen(false);
  };

  return (
    <View>
      {topFolders.map((folder) => {
        const expanded = !!folderStates[folder.folderid];

        const selected = open?.item?.folderid === folder.folderid;

        const hasChildren = folders.some(
          (item) => item.parentFolderId === folder.folderid,
        );

        const folderColor = formatColor(folder.color);

        return (
          <View key={folder.folderid}>
            <Pressable
              onPress={() => handleFolderPress(folder)}
              disabled={moving && selected}
              style={({ pressed }) => [
                styles.folderRow,

                {
                  marginLeft: level * 14,

                  backgroundColor: selected
                    ? colors.selected
                    : pressed
                      ? colors.rowPressed
                      : "transparent",
                },

                pressed &&
                  selected && {
                    backgroundColor: colors.selectedPressed,
                  },

                moving && selected && styles.disabled,
              ]}
            >
              <View style={styles.folderIconContainer}>
                <FontAwesome5
                  name={expanded ? "folder-open" : "folder"}
                  size={18}
                  color={folderColor}
                  solid
                />
              </View>

              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.folderTitle,
                  {
                    color: colors.text,
                    fontWeight: selected ? "600" : "400",
                  },
                ]}
              >
                {folder.title}
              </Text>

              {hasChildren && !selected ? (
                <Pressable
                  hitSlop={10}
                  onPress={(event) => {
                    event.stopPropagation?.();
                    toggleNested(folder.folderid);
                  }}
                  style={({ pressed }) => [
                    styles.chevronButton,
                    pressed && styles.chevronPressed,
                  ]}
                >
                  <FontAwesome5
                    name={expanded ? "chevron-down" : "chevron-right"}
                    size={12}
                    color={colors.muted}
                  />
                </Pressable>
              ) : (
                <View style={styles.chevronPlaceholder} />
              )}
            </Pressable>

            {expanded && hasChildren ? (
              <Tree
                moving={moving}
                setPickFolder={setPickFolder}
                setSelectedFolder={setSelectedFolder}
                setFolder={setFolder}
                folders={folders}
                parentId={folder.folderid}
                level={level + 1}
                open={open}
                setMenuOpen={setMenuOpen}
                darkMode={darkMode}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  folderRow: {
    minHeight: 46,

    flexDirection: "row",
    alignItems: "center",

    marginHorizontal: 6,
    marginVertical: 1,

    paddingLeft: 10,
    paddingRight: 6,

    borderRadius: 10,
  },

  folderIconContainer: {
    width: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  folderTitle: {
    flex: 1,

    marginLeft: 5,

    fontSize: 15,
    lineHeight: 20,
  },

  chevronButton: {
    width: 36,
    height: 36,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 18,
  },

  chevronPressed: {
    opacity: 0.5,
  },

  chevronPlaceholder: {
    width: 36,
  },

  disabled: {
    opacity: 0.4,
  },
});

export default Tree;
