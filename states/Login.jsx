import { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Spinner from "react-native-loading-spinner-overlay";
import { useNavigate } from "react-router-native";
import { loginUser } from "../utils/api";
import { storeToken } from "../utils/asyncStorage";
import { v4 as uuidv4 } from "uuid";

const Login = ({
  setLoading,
  setToken,
  setSystemNotifs,
  findLastFolderLocationAndRoute,
}) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordShow, setPasswordShow] = useState(true);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    // DO NOT NEED TO UPDATE CACHE HERE
    try {
      setLoading(true);
      const response = await loginUser(username, email, password);

      const newToken = response.data.data;
      setToken(newToken);
      storeToken(newToken);
      const newNotifs = [
        {
          id: uuidv4(),
          color: "#55ff55",
          title: "Login Successful",
          text: "Welcome back!",
          actions: [{ text: "close", func: () => setSystemNotifs([]) }],
        },
      ];
      setSystemNotifs(newNotifs);

      findLastFolderLocationAndRoute(null);
    } catch (err) {
      const newNotifs = [
        {
          id: uuidv4(),
          color: "#ff5555",
          title: "Login Error",
          text:
            err.response?.data?.message ?? "Unable to connect to the server.",
          actions: [{ text: "close", func: () => setSystemNotifs([]) }],
        },
      ];
      setSystemNotifs(newNotifs);
      console.log("Error logging in user inside handleLogin: ");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Spinner visible={loading} />
      <View style={styles.imgContainer}>
        <Image
          source={require("../assets/adaptive-icon.png")}
          style={styles.logo}
        />
      </View>
      <Text style={styles.title}>Login To</Text>
      <Text style={styles.title}>Native Notes</Text>
      <View style={styles.form}>
        <TextInput
          type="text"
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={(text) => setUsername(text)}
        />
        <TextInput
          type="email"
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={(text) => setEmail(text)}
        />
        <View style={styles.password}>
          <TextInput
            type="password"
            secureTextEntry={passwordShow}
            style={[styles.input, { flex: 1 }]}
            placeholder="Password"
            value={password}
            onChangeText={(text) => setPassword(text)}
          />
          <Pressable
            onPress={() => setPasswordShow((prev) => !prev)}
            style={styles.eye}
          >
            {passwordShow ? (
              <Ionicons name="eye" style={styles.icon}></Ionicons>
            ) : (
              <Ionicons name="eye-off" style={styles.icon}></Ionicons>
            )}
          </Pressable>
        </View>
        <Pressable
          onPress={async () => {
            setLoading(true);
            await handleLogin(username, email, password);
            setLoading(false);
          }}
          style={[styles.submit, { backgroundColor: "#ffef9f" }]}
        >
          <Text>Log in</Text>
        </Pressable>
      </View>
      <View style={styles.hr}></View>
      <Pressable onPress={() => navigate("/signup")} style={styles.signup}>
        <Text style={styles.text}>Have an account?</Text>
        <Text style={styles.text}>Sign Up</Text>
      </Pressable>
    </>
  );
};

const styles = StyleSheet.create({
  form: {
    padding: 10,
    marginTop: 50,
    width: "100%",
  },
  imgContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 75,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 50,
  },
  title: {
    fontSize: 25,
    color: "#ddd",
    textAlign: "center",
  },
  input: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    elevation: 2,
    backgroundColor: "#fff",
  },
  submit: {
    padding: 10,
    borderRadius: 5,
    elevation: 2,
    marginTop: 10,
    width: "100%",
  },
  text: {
    color: "#fff",
    textAlign: "center",
  },
  password: {
    position: "relative",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eye: {
    position: "absolute",
    right: 10,
  },
  icon: {
    fontSize: 20,
  },
  hr: {
    borderTopWidth: 1,
    borderTopColor: "#fff",
    marginVertical: 50,
  },
  signup: {
    gap: 10,
  },
});

export default Login;
