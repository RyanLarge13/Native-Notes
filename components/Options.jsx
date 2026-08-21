import { useEffect, useRef } from "react";

import { StyleSheet, Text, Animated, Pressable, View } from "react-native";

import { Feather } from "@expo/vector-icons";
import { useNavigate } from "react-router-native";

const Options = ({ setOptions, options, darkMode, theme }) => {
  const navigate = useNavigate();

  const animation = useRef(new Animated.Value(0)).current;

  /*
   * App.js currently passes theme.color
   * rather than the entire theme object,
   * so theme here is already the accent
   * color string.
   */
  const accent = theme || "#f59e0b";

  const colors = darkMode
    ? {
        surface: "#18181b",
        surfacePressed: "#202023",

        text: "#f4f4f5",
        secondary: "#a1a1aa",

        border: "#27272a",
      }
    : {
        surface: "#ffffff",
        surfacePressed: "#f4f4f5",

        text: "#18181b",
        secondary: "#71717a",

        border: "#e4e4e7",
      };

  useEffect(() => {
    if (options) {
      Animated.spring(animation, {
        toValue: 1,

        tension: 140,
        friction: 12,

        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animation, {
        toValue: 0,

        duration: 120,

        useNativeDriver: true,
      }).start();
    }
  }, [options]);

  const opacity = animation;

  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  const open = (route) => {
    setOptions(false);
    navigate(route);
  };

  return (
    <Animated.View
      pointerEvents={options ? "auto" : "none"}
      style={[
        styles.container,

        {
          backgroundColor: colors.surface,
          borderColor: colors.border,

          opacity,

          transform: [{ scale }, { translateY }],
        },
      ]}
    >
      <OptionButton
        icon="folder-plus"
        title="New folder"
        description="Organize your notes"
        accent={accent}
        colors={colors}
        onPress={() => open("/newfolder")}
      />

      <View
        style={[
          styles.divider,
          {
            backgroundColor: colors.border,
          },
        ]}
      />

      <OptionButton
        icon="file-plus"
        title="New note"
        description="Start writing"
        accent={accent}
        colors={colors}
        onPress={() => open("/newnote")}
      />
    </Animated.View>
  );
};

const OptionButton = ({ icon, title, description, accent, colors, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,

        pressed && {
          backgroundColor: colors.surfacePressed,
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,

          {
            backgroundColor: `${accent}16`,
          },
        ]}
      >
        <Feather name={icon} size={18} color={accent} />
      </View>

      <View style={styles.optionText}>
        <Text
          style={[
            styles.title,

            {
              color: colors.text,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.description,

            {
              color: colors.secondary,
            },
          ]}
        >
          {description}
        </Text>
      </View>

      <Feather name="chevron-right" size={14} color={colors.secondary} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",

    /*
     * Account's FAB:
     *
     * bottom: 20
     * height: 56
     *
     * So this places Options just
     * above the FAB.
     */
    bottom: 86,
    right: 18,

    width: 230,

    padding: 6,

    borderRadius: 16,

    borderWidth: StyleSheet.hairlineWidth,

    elevation: 16,

    zIndex: 60,
  },

  option: {
    minHeight: 62,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 9,

    borderRadius: 11,
  },

  iconContainer: {
    width: 38,
    height: 38,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 11,
  },

  optionText: {
    flex: 1,

    marginLeft: 11,
  },

  title: {
    fontSize: 14,
    fontWeight: "600",
  },

  description: {
    marginTop: 2,

    fontSize: 10,
  },

  divider: {
    height: StyleSheet.hairlineWidth,

    marginHorizontal: 10,
    marginVertical: 2,
  },
});

export default Options;
