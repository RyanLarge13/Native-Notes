import { View, StyleSheet, Text } from "react-native";
import React from "react";

const ColorPicker = ({ setState }) => {
  return (
    <View style={styles.container}>
      <Text>Color Picker</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    position: "absolute",
    bottom: 50,
    right: 5,
    left: 5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#222",
    borderRadius: 10,
    elevation: 5,
  },
});

export default ColorPicker;
