import { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated } from "react-native";

const UserSettings = () => {
 const transXAni = useRef(new Animated.value(200)).current;

 useEffect(() => {
  Animated.spring(transXAni, {
   toValue: 0,
   tension: 100,
   friction: 10,
   useNativeDriver: true
  }).start();
 }, []);

 return <Animated.View style={[styles.container, {translateX: transXAni}]}></Animated.View>;
};

const styles = StyleSheet.create({
 container: {
  
 }
})

export default UserSettings;
