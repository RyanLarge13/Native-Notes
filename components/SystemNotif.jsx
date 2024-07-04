import { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, StyleSheet } from "react-native";

const SystemNotif = ({ setSystemNotifs, systemNotifs, notif, index }) => {
  const transYAni = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.spring(transYAni, {
      toValue: 0,
      tension: 100,
      friction: 10,
      delay: index * 200,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.notif,
        { translateY: transYAni, top: 50 * (index * 1.5 + 1) },
      ]}
    >
      <View style={[styles.color, { backgroundColor: notif.color }]}></View>
      <Text style={[styles.white, styles.title]}>{notif.title}</Text>
      <Text style={[styles.white]}>{notif.text}</Text>
      <View style={styles.actionContainer}>
        {notif.actions.map((action) => (
          <Pressable
            style={styles.action}
            onPress={() => action.func(notif.id)}
          >
            <Text style={[styles.white, styles.small]}>{action.text}</Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  notif: {
    position: "absolute",
    paddingVertical: 5,
    paddingHorizontal: 10,
    paddingTop: 15,
    right: 25,
    left: 25,
    backgroundColor: "#222",
    elevation: 10,
    borderRadius: 8,
  },
  color: {
    position: "absolute",
    top: 0,
    right: 0,
    borderBottomLeftRadius: 10,
    height: 8,
    width: "45%",
    elevation: 3,
  },
  actionContainer: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 5,
  },
  white: {
    color: "#fff",
  },
  center: {
    textAlign: "center",
  },
  small: {
    fontSize: 12,
  },
  title: {
    fontSize: 17,
    marginBottom: 8,
  },
  action: {
    paddingVertical: 3,
    paddingHorizontal: 3,
    borderRadius: 8,
  },
});

export default SystemNotif;
