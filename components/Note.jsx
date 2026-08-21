import React, { useState, useMemo, useCallback } from "react";

import { View, Text, StyleSheet, Animated, Pressable } from "react-native";

import Ripple from "react-native-material-ripple";
import RenderHTML from "react-native-render-html";

import { useNavigate } from "react-router-native";

import * as LocalAuthentication from "expo-local-authentication";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import truncate from "html-truncate";

const Note = React.memo(({ note, setOpen, setNote, view, index, width, darkMode, theme }) => {
  const [contentWidth, setContentWidth] = useState(0);

  const navigate = useNavigate();

  const accent = theme.on ? theme.color : "#f59e0b";

  const colors = darkMode
    ? {
        surface: "#18181b",
        surfacePressed: "#202023",

        text: "#f4f4f5",
        secondary: "#a1a1aa",
        muted: "#71717a",

        border: "#27272a",

        lockBackground: "#fc534d18",
        lock: "#fc534d",
      }
    : {
        surface: "#ffffff",
        surfacePressed: "#f7f7f8",

        text: "#18181b",
        secondary: "#71717a",
        muted: "#a1a1aa",

        border: "#e4e4e7",

        lockBackground: "#fc534d12",
        lock: "#e5484d",
      };

  /*
   * Keep the preview shorter in grid view.
   *
   * You may want to tune these numbers depending
   * on how much HTML you want visible.
   */
  const htmlToRender = useMemo(() => {
    if (!note?.htmlText || note.locked) {
      return "";
    }

    return truncate(note.htmlText, view ? 80 : 180);
  }, [note?.htmlText, note?.locked, view]);

  const htmlSource = useMemo(
    () => ({
      html: htmlToRender,
    }),
    [htmlToRender]
  );

  const tagStyles = useMemo(
    () => ({
      body: {
        margin: 0,
        padding: 0,
      },

      p: {
        marginTop: 0,
        marginBottom: 5,
      },

      div: {
        margin: 0,
        padding: 0,
      },

      strong: {
        fontWeight: "700",
      },

      b: {
        fontWeight: "700",
      },

      em: {
        fontStyle: "italic",
      },

      i: {
        fontStyle: "italic",
      },

      u: {
        textDecorationLine: "underline",
      },

      s: {
        textDecorationLine: "line-through",
      },

      strike: {
        textDecorationLine: "line-through",
      },

      ul: {
        marginVertical: 3,
        paddingLeft: 15,
      },

      ol: {
        marginVertical: 3,
        paddingLeft: 15,
      },

      li: {
        marginVertical: 1,
      },

      h1: {
        fontSize: view ? 14 : 16,
        marginVertical: 3,
      },

      h2: {
        fontSize: view ? 14 : 16,
        marginVertical: 3,
      },

      h3: {
        fontSize: view ? 13 : 15,
        marginVertical: 3,
      },
    }),
    [view]
  );

  const openNote = useCallback(async () => {
    if (note.locked) {
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Unlock note",
          cancelLabel: "Cancel",
        });

        if (!result.success) {
          return;
        }
      } catch (error) {
        console.log("Authentication error:", error);

        return;
      }
    }

    setNote(note);
    navigate("/newnote");
  }, [note, navigate, setNote]);

  const openSettings = useCallback(() => {
    setOpen({
      show: true,
      item: note,
      type: "note",
    });
  }, [note, setOpen]);

  const date = useMemo(() => {
    const value = note.updatedAt || note.modifiedAt || note.createdAt;

    if (!value) {
      return "";
    }

    return new Date(value).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [note.updatedAt, note.modifiedAt, note.createdAt]);

  return (
    <Animated.View
      style={[
        styles.wrapper,

        {
          width: view ? "48%" : "100%",
          minHeight: view ? 150 : 175,
        },
      ]}
    >
      <Ripple
        onPress={openNote}
        onLongPress={openSettings}
        rippleColor={accent}
        rippleOpacity={0.06}
        rippleDuration={250}
        style={[
          styles.note,

          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text
              numberOfLines={view ? 2 : 1}
              ellipsizeMode="tail"
              style={[
                styles.title,

                {
                  color: colors.text,
                  fontSize: view ? 15 : 17,
                },
              ]}
            >
              {note.title || "Untitled"}
            </Text>

            <Text
              style={[
                styles.date,
                {
                  color: colors.muted,
                },
              ]}
            >
              {date}
            </Text>
          </View>

          <Pressable
            hitSlop={10}
            onPress={(event) => {
              event.stopPropagation?.();
              openSettings();
            }}
            style={({ pressed }) => [
              styles.moreButton,

              pressed && {
                backgroundColor: colors.surfacePressed,
              },
            ]}
          >
            <MaterialCommunityIcons name="dots-horizontal" size={20} color={colors.secondary} />
          </Pressable>
        </View>

        {/* NOTE CONTENT */}

        {!note.locked ? (
          <View
            style={styles.preview}
            onLayout={(event) => {
              const newWidth = event.nativeEvent.layout.width;

              if (newWidth !== contentWidth) {
                setContentWidth(newWidth);
              }
            }}
          >
            {contentWidth > 0 && htmlToRender ? (
              <RenderHTML
                contentWidth={contentWidth}
                source={htmlSource}
                enableCSSInlineProcessing
                baseStyle={{
                  color: colors.secondary,

                  fontSize: view ? 12 : 13,
                  lineHeight: view ? 17 : 19,
                }}
                tagsStyles={tagStyles}
              />
            ) : (
              <Text
                style={[
                  styles.emptyPreview,

                  {
                    color: colors.muted,
                  },
                ]}
              >
                No additional text
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.lockedPreview}>
            <View
              style={[
                styles.lockIcon,

                {
                  backgroundColor: colors.lockBackground,
                },
              ]}
            >
              <MaterialCommunityIcons name="lock" size={18} color={colors.lock} />
            </View>

            <Text
              style={[
                styles.lockedText,

                {
                  color: colors.secondary,
                },
              ]}
            >
              Locked note
            </Text>
          </View>
        )}

        {/* FOOTER */}

        <View style={styles.footer}>
          <View style={styles.footerMeta}>
            {note.locked ? (
              <MaterialCommunityIcons name="lock-outline" size={13} color={colors.lock} />
            ) : null}
          </View>

          <View
            style={[
              styles.accentDot,

              {
                backgroundColor: accent,
              },
            ]}
          />
        </View>
      </Ripple>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
  },

  note: {
    flex: 1,

    minHeight: 150,

    padding: 14,

    borderRadius: 15,

    borderWidth: StyleSheet.hairlineWidth,

    overflow: "hidden",

    elevation: 2,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",

    marginBottom: 10,
  },

  titleContainer: {
    flex: 1,

    paddingRight: 5,
  },

  title: {
    fontWeight: "600",

    lineHeight: 21,
  },

  date: {
    marginTop: 4,

    fontSize: 10,
    fontWeight: "400",
  },

  moreButton: {
    width: 32,
    height: 32,

    alignItems: "center",
    justifyContent: "center",

    marginTop: -5,
    marginRight: -5,

    borderRadius: 16,
  },

  preview: {
    flex: 1,

    overflow: "hidden",
  },

  emptyPreview: {
    fontSize: 12,
    fontStyle: "italic",
  },

  lockedPreview: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    paddingVertical: 10,
  },

  lockIcon: {
    width: 38,
    height: 38,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 12,

    marginBottom: 7,
  },

  lockedText: {
    fontSize: 11,
    fontWeight: "500",
  },

  footer: {
    minHeight: 16,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginTop: 8,
  },

  footerMeta: {
    minHeight: 14,

    flexDirection: "row",
    alignItems: "center",
  },

  accentDot: {
    width: 5,
    height: 5,

    borderRadius: 3,

    opacity: 0.65,
  },
});

export default Note;
