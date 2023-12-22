import { useState } from "react";
import { View, TextInput, Text, StyleSheet, Pressable } from "react-native";

const Login = ({ handleLogin }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <>
      <Text style={styles.title}>Notes</Text>
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
        <TextInput
          type="password"
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={(text) => setPassword(text)}
        />
        <View style={styles.btns}>
          <Pressable
            onPress={() => handleLogin(username, email, password)}
            style={[styles.submit, { backgroundColor: "#fcd34d" }]}
          >
            <Text>Signup &rarr;</Text>
          </Pressable>
          <Pressable
            onPress={() => handleLogin(username, email, password)}
            style={[
              styles.submit,
              {
                backgroundColor: "#fff",
                borderWidth: 3,
                borderColor: "#aaa",
              },
            ]}
          >
            <Text>Login &rarr;</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  form: {
    padding: 20,
    backgroundColor: "#222",
    borderRadius: 10,
    elevation: 2,
    marginTop: 25,
    width: "100%",
  },
  title: {
    fontSize: 50,
    color: "#ddd",
    textAlign: "center",
    marginVertical: 75,
  },
  input: {
    padding: 10,
    marginVertical: 10,
    borderRadius: 10,
    elevation: 2,
    backgroundColor: "#fff",
  },
  btns: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    columnGap: 5,
  },
  submit: {
    padding: 10,
    borderRadius: 8,
    elevation: 2,
    flex: 1,
    marginTop: 10,
    width: 100,
  },
  signup: {
    marginTop: 50,
  },
  signupBtn: {
    marginTop: 25,
    backgroundColor: "#000",
    border: 2,
    borderColor: "#fff",
    padding: 10,
    paddingHorizontal: 25,
  },
  text: {
    color: "#fff",
    textAlign: "center",
  },
});

export default Login;
