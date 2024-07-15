import { Text, StyleSheet, ScrollView, Pressable } from "react-native";
import React from "react";

const FontSizePicker = ({ setFontSize }) => {
  const fontSizes = new Array(60).fill(null);
  return (
    <ScrollView style={styles.container}>
      {fontSizes.map((_, index) => {
        if (index < 5) return;
        else {
          return (
            <Pressable
              key={index}
              style={styles.btn}
              onPress={() => setFontSize(index)}
            >
              <Text
                style={[
                  styles.white,
                  index === 59 ? { marginBottom: 25 } : { marginBottom: 0 },
                ]}
              >
                {index}
              </Text>
            </Pressable>
          );
        }
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 50,
    // left: 0,
    right: 100,
    height: 200,
    backgroundColor: "#222",
    borderRadius: 10,
    elevation: 3,
    padding: 25,
  },
  white: {
    color: "#fff",
    fontSize: 16,
  },
  btn: {
    padding: 15,
  },
});

export default FontSizePicker;
