import { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";

const SystemNotif = ({ notif, index, darkMode }) => {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 120,
        friction: 11,
        delay: index * 120,
        useNativeDriver: true,
      }),

      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        delay: index * 120,
        useNativeDriver: true,
      }),

      Animated.spring(scale, {
        toValue: 1,
        tension: 140,
        friction: 10,
        delay: index * 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const closeNotification = (action) => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),

      Animated.timing(translateY, {
        toValue: -30,
        duration: 180,
        useNativeDriver: true,
      }),

      Animated.timing(scale, {
        toValue: 0.97,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      action.func(notif.id);
    });
  };

  const getIcon = () => {
    const color = notif.color?.toLowerCase();

    if (
      color === "#ff5555" ||
      color === "#f33" ||
      color === "#ff0000"
    ) {
      return "alert-circle";
    }

    if (
      color === "#55ff55" ||
      color === "#5effa7"
    ) {
      return "check-circle";
    }

    if (
      color === "#fde047" ||
      color === "#fcd34d"
    ) {
      return "alert-triangle";
    }

    return "info";
  };

  const backgroundColor = darkMode ? "#171717" : "#ffffff";
  const textColor = darkMode ? "#f5f5f5" : "#171717";
  const secondaryText = darkMode ? "#a3a3a3" : "#737373";
  const borderColor = darkMode
    ? "rgba(255,255,255,0.08)"
    : "rgba(0,0,0,0.08)";

  return (
    <Animated.View
      style={[
        styles.notif,
        {
          top: 20 + index * 145,
          backgroundColor,
          borderColor,
          opacity,
          transform: [
            { translateY },
            { scale },
          ],
        },
      ]}
    >
      {/* STATUS ACCENT */}
      <View
        style={[
          styles.accent,
          { backgroundColor: notif.color },
        ]}
      />

      {/* CONTENT */}
      <View style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: `${notif.color}18`,
            },
          ]}
        >
          <Feather
            name={getIcon()}
            size={18}
            color={notif.color}
          />
        </View>

        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              { color: textColor },
            ]}
          >
            {notif.title}
          </Text>

          <Text
            style={[
              styles.message,
              { color: secondaryText },
            ]}
          >
            {notif.text}
          </Text>
        </View>
      </View>

      {/* ACTIONS */}
      {notif.actions?.length > 0 && (
        <View
          style={[
            styles.actionContainer,
            { borderTopColor: borderColor },
          ]}
        >
          {notif.actions.map((action, actionIndex) => {
            const destructive =
              action.text?.toLowerCase() === "delete" ||
              action.text?.toLowerCase() === "logout";

            const primary =
              actionIndex === notif.actions.length - 1;

            return (
              <Pressable
                key={`${action.text}-${actionIndex}`}
                onPress={() =>
                  closeNotification(action)
                }
                style={({ pressed }) => [
                  styles.action,
                  primary && {
                    backgroundColor: destructive
                      ? "rgba(255,85,85,0.12)"
                      : `${notif.color}18`,
                  },
                  pressed && styles.actionPressed,
                ]}
              >
                <Text
                  style={[
                    styles.actionText,
                    {
                      color: destructive
                        ? "#ff6b6b"
                        : primary
                          ? notif.color
                          : secondaryText,
                    },
                  ]}
                >
                  {action.text}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  notif: {
    position: "absolute",

    left: 16,
    right: 16,

    borderRadius: 18,

    borderWidth: 1,

    elevation: 30,
    zIndex: 9999,

    overflow: "hidden",

    paddingTop: 16,
  },

  accent: {
    position: "absolute",

    left: 0,
    top: 0,
    bottom: 0,

    width: 4,
  },

  content: {
    flexDirection: "row",
    alignItems: "flex-start",

    paddingHorizontal: 16,
    paddingBottom: 16,

    gap: 12,
  },

  iconContainer: {
    width: 36,
    height: 36,

    borderRadius: 18,

    justifyContent: "center",
    alignItems: "center",

    flexShrink: 0,
  },

  textContainer: {
    flex: 1,
  },

  title: {
    fontSize: 15,
    fontWeight: "700",

    marginBottom: 4,
  },

  message: {
    fontSize: 13,
    lineHeight: 19,
  },

  actionContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",

    borderTopWidth: 1,

    paddingHorizontal: 10,
    paddingVertical: 8,

    gap: 6,
  },

  action: {
    paddingHorizontal: 14,
    paddingVertical: 8,

    borderRadius: 10,
  },

  actionPressed: {
    opacity: 0.6,
  },

  actionText: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});

export default SystemNotif;