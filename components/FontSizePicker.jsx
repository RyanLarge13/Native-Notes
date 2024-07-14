import { View, Text, StyleSheet, ScrollView } from "react-native";
import React from "react";

const FontSizePicker = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.subContainer}>
        <Text style={styles.white}>10</Text>
        <Text style={styles.white}>12</Text>
        <Text style={styles.white}>14</Text>
        <Text style={styles.white}>16</Text>
        <Text style={styles.white}>18</Text>
        <Text style={styles.white}>20</Text>
        <Text style={styles.white}>22</Text>
        <Text style={styles.white}>24</Text>
        <Text style={styles.white}>24</Text>
        <Text style={styles.white}>24</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 50,
    left: 0,
    padding: 15,
    height: 150,
  },
  subContainer: {
    elevation: 3,
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#222",
  },
  white: {
    color: "#fff",
  },
});

export default FontSizePicker;
