import { useState, useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet, Pressable } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";

const Sorter = ({
 filter,
 setFilter,
 order,
 setOrder,
 sortOptions,
 setSortOptions
}) => {
 const opacityAni = useRef(new Animated.Value(0)).current;
 const scaleAni = useRef(new Animated.Value(0)).current;

 useEffect(() => {
  if (sortOptions) {
   Animated.parallel([
    Animated.timing(opacityAni, {
     toValue: 1,
     duration: 100,
     useNativeDriver: true
    }),
    Animated.spring(scaleAni, {
     toValue: 1,
     tension: 100,
     friction: 10,
     useNativeDriver: true
    })
   ]).start();
  } else {
   Animated.parallel([
    Animated.timing(opacityAni, {
     toValue: 0,
     duration: 75,
     useNativeDriver: true
    }),
    Animated.spring(scaleAni, {
     toValue: 0,
     tension: 125,
     friction: 10,
     useNativeDriver: true
    })
   ]).start();
  }
 }, [sortOptions]);

 return (
  <View style={styles.container}>
   <Pressable onPress={() => setSortOptions(prev => !prev)} style={styles.flexRow}>
    <Icon name="sort-amount-desc" style={styles.white} />
    <Text style={styles.name}>{filter}</Text>
   </Pressable>
   <Pressable style={styles.btn} onPress={() => setOrder(prev => !prev)}>
    {order ? (
     <Icon name="long-arrow-up" style={styles.white} />
    ) : (
     <Icon name="long-arrow-down" style={styles.white} />
    )}
   </Pressable>
   <Animated.View
    style={[
     styles.options,
     { opacity: opacityAni, scaleX: scaleAni, scaleY: scaleAni }
    ]}
   >
    <Pressable
     onPress={() => {
      setSortOptions(false);
      setFilter("Title");
     }}
     style={[styles.typeBtn, filter === "Title" && { backgroundColor: "#222" }]}
    >
     <Text style={styles.white}>Title</Text>
    </Pressable>
    <Pressable
     onPress={() => {
      setSortOptions(false);
      setFilter("Date");
     }}
     style={[styles.typeBtn, filter === "Date" && { backgroundColor: "#222" }]}
    >
     <Text style={styles.white}>Date</Text>
    </Pressable>
    <Pressable
     onPress={() => {
      setSortOptions(false);
      setFilter("Update");
     }}
     style={[
      styles.typeBtn,
      filter === "Update" && { backgroundColor: "#222" }
     ]}
    >
     <Text style={styles.white}>Updated</Text>
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
  marginVertical: 15
 },
 flexRow: {
  flexDirection: "row",
  justifyContent: "flex-end",
  alignItems: "center",
  columnGap: 10
 },
 white: {
  color: "#aaa",
  fontSize: 15
 },
 name: {
  color: "#aaa",
  fontSize: 15,
  marginRight: 10
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
  alignItems: "flex-start"
 },
 typeBtn: {
  borderRadius: 10,
  width: "100%",
  paddingHorizontal: 15,
  paddingVertical: 10
 },
 btn: {
  padding: 10
 }
});

export default Sorter;
