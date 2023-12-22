import { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";

const Sorter = ({ filter, setFilter, order, setOrder }) => {
  const [options, setOptions] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setOptions((prev) => !prev)}
        style={styles.flexRow}
      >
        <Icon name="sort-amount-desc" style={styles.white} />
        <Text style={styles.name}>{filter}</Text>
      </Pressable>
      <Pressable style={styles.btn} onPress={() => setOrder((prev) => !prev)}>
        {order ? (
          <Icon name="long-arrow-up" style={styles.white} />
        ) : (
          <Icon name="long-arrow-down" style={styles.white} />
        )}
      </Pressable>
      {options && (
        <View style={styles.options}>
          <Pressable
            onPress={() => {
              setOptions(false);
              setFilter("Title");
            }}
            style={[
              styles.typeBtn,
              filter === "Title" && { backgroundColor: "#222" },
            ]}
          >
            <Text style={styles.white}>Title</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setOptions(false);
              setFilter("Date");
            }}
            style={[
              styles.typeBtn,
              filter === "Date" && { backgroundColor: "#222" },
            ]}
          >
            <Text style={styles.white}>Date</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setOptions(false);
              setFilter("Update");
            }}
            style={[
              styles.typeBtn,
              filter === "Update" && { backgroundColor: "#222" },
            ]}
          >
            <Text style={styles.white}>Updated</Text>
          </Pressable>
        </View>
      )}
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
    color: "#aaa",
    fontSize: 15,
  },
  name: {
    color: "#aaa",
    fontSize: 15,
    marginRight: 10,
  },
  options: {
    zIndex: 100,
    position: "absolute",
    bottom: 0,
    right: 0,
    borderRadius: 10,
    backgroundColor: "#111",
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
