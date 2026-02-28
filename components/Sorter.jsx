import { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet, Pressable } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const Sorter = ({
  filter,
  setFilter,
  order,
  setOrder,
  sortOptions,
  setSortOptions,
  db,
  darkMode,
  theme,
}) => {
  const opacityAni = useRef(new Animated.Value(0)).current;
  const scaleAni = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (sortOptions) {
      Animated.parallel([
        Animated.timing(opacityAni, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAni, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAni, {
          toValue: 0,
          duration: 75,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAni, {
          toValue: 0,
          tension: 125,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [sortOptions]);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={async () => setSortOptions((prev) => !prev)}
        style={styles.flexRow}
      >
        <FontAwesome
          name="sort-amount-desc"
          style={{
            color: theme.on
              ? theme.color
              : darkMode
                ? styles.white
                : styles.black,
          }}
        />
        <Text style={darkMode ? styles.name : styles.nameBlack}>{filter}</Text>
      </Pressable>
      <Pressable style={styles.btn} onPress={() => setOrder((prev) => !prev)}>
        {order ? (
          <FontAwesome
            name="long-arrow-up"
            style={{
              color: theme.on
                ? theme.color
                : darkMode
                  ? styles.white
                  : styles.black,
            }}
          />
        ) : (
          <FontAwesome
            name="long-arrow-down"
            style={{
              color: theme.on
                ? theme.color
                : darkMode
                  ? styles.white
                  : styles.black,
            }}
          />
        )}
      </Pressable>
      <Animated.View
        style={[
          styles.options,
          {
            backgroundColor: darkMode ? "#111" : "#fff",
            opacity: opacityAni,
            scaleX: scaleAni,
            scaleY: scaleAni,
          },
        ]}
      >
        <Pressable
          onPress={() => {
            setSortOptions(false);
            setFilter("Title");
          }}
          style={[
            styles.typeBtn,
            filter === "Title" && {
              backgroundColor: darkMode ? "#222" : "#aaa",
            },
          ]}
        >
          <Text style={darkMode ? styles.white : styles.black}>Title</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setSortOptions(false);
            setFilter("Date");
          }}
          style={[
            styles.typeBtn,
            filter === "Date" && {
              backgroundColor: darkMode ? "#222" : "#aaa",
            },
          ]}
        >
          <Text style={darkMode ? styles.white : styles.black}>Date</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setSortOptions(false);
            setFilter("Update");
          }}
          style={[
            styles.typeBtn,
            filter === "Update" && {
              backgroundColor: darkMode ? "#222" : "#aaa",
            },
          ]}
        >
          <Text style={darkMode ? styles.white : styles.black}>Updated</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    columnGap: 10,
    marginVertical: 15,
  },
  flexRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    columnGap: 10,
  },
  white: {
    color: "#fff",
    fontSize: 15,
  },
  black: {
    color: "#000",
    fontSize: 15,
  },
  name: {
    color: "#fff",
    fontSize: 15,
    marginRight: 10,
  },
  nameBlack: {
    color: "#000",
    fontSize: 15,
    marginRight: 10,
  },
  options: {
    zIndex: 100,
    position: "absolute",
    bottom: 0,
    right: 0,
    borderRadius: 10,
    elevation: 2,
    padding: 8,
    justifyContent: "space-around",
    alignItems: "flex-start",
  },
  typeBtn: {
    borderRadius: 10,
    width: "100%",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  btn: {
    padding: 10,
  },
});

export default Sorter;
