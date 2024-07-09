import { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import Spinner from "react-native-loading-spinner-overlay";

const Login = ({ handleLogin }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordShow, setPasswordShow] = useState(true);
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  return (
    <>
      <View style={styles.imgContainer}>
        <Image
          source={require("../assets/adaptive-icon.png")}
          style={styles.logo}
        />
      </View>
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
              <Icon name="eye" style={styles.icon}></Icon>
            ) : (
              <Icon name="eye-off" style={styles.icon}></Icon>
            )}
          </Pressable>
        </View>
        <Pressable
          onPress={async () => {
            setSignUpLoading(true);
            await handleLogin(username, email, password);
            setSignUpLoading(false);
          }}
          style={[styles.submit, { backgroundColor: "#fcd34d" }]}
        >
          <Text>{signUpLoading ? <Spinner /> : "Sign up"}</Text>
        </Pressable>
        <Pressable
          onPress={async () => {
            setLoginLoading(true);
            await handleLogin(username, email, password);
            setLoginLoading(true);
          }}
          style={[styles.submit, { backgroundColor: "#ffef9f" }]}
        >
          <Text>{loginLoading ? <Spinner /> : "Login"}</Text>
        </Pressable>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  form: {
    padding: 10,
    marginTop: 25,
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
  },
  title: {
    fontSize: 25,
    color: "#ddd",
    textAlign: "center",
    marginVertical: 75,
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
});

export default Login;
