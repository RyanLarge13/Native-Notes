import { useEffect, useRef } from "react";
import { StyleSheet, Text, Animated, Pressable } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigate } from "react-router-native";

const Options = ({ setOptions, options, darkMode, theme }) => {
  const navigate = useNavigate();

  const opacityAni = useRef(new Animated.Value(0.0)).current;
  const scaleAni = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (options) {
      Animated.parallel([
        Animated.timing(opacityAni, {
          toValue: 1.0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAni, {
          toValue: 1,
          friction: 10,
          tension: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAni, {
          toValue: 0.0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAni, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [options]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: darkMode ? "#111" : "#fff",
          opacity: opacityAni,
          transform: [
            { scaleX: scaleAni },
            { scaleY: scaleAni },
            {
              translateX: scaleAni.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0], // Adjust as needed
              }),
            },
            {
              translateY: scaleAni.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0], // Adjust as needed
              }),
            },
          ],
        },
      ]}
    >
      <Pressable
        onPress={() => {
          setOptions(false);
          navigate("/newfolder");
        }}
        style={styles.btn}
      >
        <Text
          style={[
            darkMode ? styles.white : styles.black,
            { marginHorizontal: 20 },
          ]}
        >
          New folder
        </Text>
        <Icon
          name="folder-plus"
          style={
            theme ? { color: theme } : darkMode ? styles.white : styles.black
          }
        />
      </Pressable>
      <Pressable
        onPress={() => {
          setOptions(false);
          navigate("/newnote");
        }}
        style={styles.btn}
      >
        <Text
          style={[
            darkMode ? styles.white : styles.black,
            { marginHorizontal: 20 },
          ]}
        >
          New note
        </Text>
        <Icon
          name="file-plus"
          style={
            theme ? { color: theme } : darkMode ? styles.white : styles.black
          }
        />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 50,
    right: 50,
    borderRadius: 10,
    elevation: 20,
  },
  btn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 20,
  },
  white: {
    color: "#fff",
  },
  black: {
    color: "#000",
  },
});

export default Options;
