import { Pressable, View, Text, StyleSheet } from "react-native";
import Ripple from "react-native-material-ripple";
import formatColor from "../utils/helpers/formatColor";

const Folder = ({ folder, setFolder, setOpen }) => {
  const openFolderSettings = (event) => {
    setOpen({ show: true, item: folder, type: "folder" });
  };

  return (
    <Ripple
      rippleColor="#fff"
      rippleOpacity={0}
      onLongPress={(e) => openFolderSettings(e)}
      onPress={() => setFolder(folder)}
      style={styles.folder}
    >
      <View
        style={[
          styles.color,
          { backgroundColor: `${formatColor(folder.color)}` },
        ]}
      ></View>
      <Text style={styles.white}>{folder.title}</Text>
    </Ripple>
  );
};

const styles = StyleSheet.create({
  folder: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#112",
    elevation: 2,
    width: 100,
    height: 65,
    position: "relative ",
  },
  color: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "50%",
    height: 6,
    borderBottomLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  white: {
    color: "#fff",
    fontSize: 10,
  },
});

export default Folder;
