import { Text, StyleSheet, View, ScrollView, Pressable } from "react-native";
import React from "react";

const FontSizePicker = ({ setFontSize }) => {
 const fontSizes = new Array(60).fill(null);
 return (
  <View style={styles.container}>
   <ScrollView>
    {fontSizes.map((_, index) => {
     if (index < 5) return;
     return (
      <Pressable
       key={index}
       style={styles.btn}
       onPress={() => setFontSize(index)}
      >
       <Text
        style={[
         styles.white,
         index === 59 ? { marginBottom: 25 } : { marginBottom: 0 }
        ]}
       >
        {index}
       </Text>
      </Pressable>
     );
    })}
   </ScrollView>
  </View>
 );
};

const styles = StyleSheet.create({
 container: {
  height: 200,
  width: 100,
  backgroundColor: "#222",
  borderRadius: 10,
  elevation: 3
 },
 white: {
  color: "#fff",
  fontSize: 16
 },
 btn: {
  padding: 15,
  width: "100%"
 }
});

export default FontSizePicker;
