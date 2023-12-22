import { View, StyleSheet, Text, Pressable } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigate } from "react-router-native";

const Options = ({setOptions }) => {
  const navigate = useNavigate();

  return (
    <View style={styles.container}>
      <Pressable onPress={() => { 
      setOptions(false)
      navigate("/newfolder")}} style={styles.btn}>
        <Text style={styles.btnColor}>New folder</Text>
        <Icon name="folder-plus" style={styles.btnColor} />
      </Pressable>
      <Pressable onPress={() => {
      setOptions(false)
      navigate("/newnote")
   }} style={styles.btn}>
        <Text style={styles.btnColor}>New note</Text>
        <Icon name="file-plus" style={styles.btnColor} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 50,
    right: 50,
    borderRadius: 10,
    backgroundColor: "#111",
    elevation: 20,
  },
  btn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 20,
  },
  btnColor: {
    color: "#fff",
    marginHorizontal: 12,
  },
});

export default Options;
