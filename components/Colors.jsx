import { View, StyleSheet, Pressable } from "react-native";
import { tailwindValues } from "../constants/colors";

const Colors = ({ setColor, selectedColor }) => {
  return (
    <View style={styles.container}>
      {tailwindValues.map((color) => (
        <Pressable
          key={color}
          onPress={() => setColor(color)}
          style={[
            styles.color,
            selectedColor === color ? styles.big : styles.normal,
            { backgroundColor: color },
          ]}
        ></Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 10,
    marginVertical: 10,
    width: "100%",
  },
  color: {
    borderRadius: 1000,
    elevation: 2,
  },
  big: {
    width: 23,
    height: 23,
  },
  normal: {
    width: 20,
    height: 20,
  },
});

export default Colors;
