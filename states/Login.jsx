import { useState } from "react";

import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";

import { Feather, Ionicons } from "@expo/vector-icons";

import Spinner from "react-native-loading-spinner-overlay";
import { useNavigate } from "react-router-native";

import { loginUser } from "../utils/api";
import { storeToken } from "../utils/asyncStorage";

import { v4 as uuidv4 } from "uuid";

const Login = ({ setToken, setSystemNotifs, continueServerWork }) => {
  const [username, setUsername] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [passwordHidden, setPasswordHidden] = useState(true);

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  /*
   * Eventually these should come
   * from your global theme system.
   */

  const colors = {
    background: "#0a0a0b",

    surface: "#151517",
    surfacePressed: "#202023",

    text: "#f4f4f5",
    secondary: "#a1a1aa",
    muted: "#71717a",

    border: "#27272a",

    accent: "#f59e0b",
    accentText: "#18181b",

    input: "#18181b",
  };

  const canSubmit =
    username.trim().length > 0 && email.trim().length > 0 && password.length > 0 && !loading;

  const handleLogin = async () => {
    if (!canSubmit) {
      return;
    }

    try {
      setLoading(true);

      const response = await loginUser(username.trim(), email.trim(), password);

      const newToken = response.data.data;

      setToken(newToken);

      await storeToken(newToken);

      continueServerWork(newToken);

      setSystemNotifs([
        {
          id: uuidv4(),
          color: "#55ff55",
          title: "Login Successful",
          text: "Welcome back!",
          actions: [
            {
              text: "close",
              func: () => setSystemNotifs([]),
            },
          ],
        },
      ]);
    } catch (err) {
      setSystemNotifs([
        {
          id: uuidv4(),
          color: "#ff5555",
          title: "Login Error",

          text: err.response?.data?.message ?? "Unable to connect to the server.",

          actions: [
            {
              text: "close",
              func: () => setSystemNotifs([]),
            },
          ],
        },
      ]);

      console.log("Error logging in user:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
        },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Spinner visible={loading} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* BRAND */}

        <View style={styles.brand}>
          <View
            style={[
              styles.logoContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Image source={require("../assets/adaptive-icon.png")} style={styles.logo} />
          </View>

          <Text
            style={[
              styles.appName,
              {
                color: colors.text,
              },
            ]}
          >
            Native Notes
          </Text>

          <Text
            style={[
              styles.tagline,
              {
                color: colors.secondary,
              },
            ]}
          >
            Your notes. Organized your way.
          </Text>
        </View>

        {/* LOGIN */}

        <View style={styles.loginArea}>
          <View style={styles.headingArea}>
            <Text
              style={[
                styles.heading,
                {
                  color: colors.text,
                },
              ]}
            >
              Welcome back
            </Text>

            <Text
              style={[
                styles.description,
                {
                  color: colors.secondary,
                },
              ]}
            >
              Sign in to continue to your notes
            </Text>
          </View>

          <View style={styles.form}>
            {/* USERNAME */}

            <View>
              <Text
                style={[
                  styles.label,
                  {
                    color: colors.secondary,
                  },
                ]}
              >
                Username
              </Text>

              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.input,

                    borderColor: colors.border,
                  },
                ]}
              >
                <Feather name="user" size={17} color={colors.muted} />

                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                    },
                  ]}
                  placeholder="Enter your username"
                  placeholderTextColor={colors.muted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* EMAIL */}

            <View>
              <Text
                style={[
                  styles.label,
                  {
                    color: colors.secondary,
                  },
                ]}
              >
                Email
              </Text>

              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.input,

                    borderColor: colors.border,
                  },
                ]}
              >
                <Feather name="mail" size={17} color={colors.muted} />

                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                    },
                  ]}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* PASSWORD */}

            <View>
              <View style={styles.passwordLabelRow}>
                <Text
                  style={[
                    styles.label,
                    {
                      color: colors.secondary,
                    },
                  ]}
                >
                  Password
                </Text>

                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    /*
                     * Hook your password
                     * recovery screen here
                     * when implemented.
                     */
                  }}
                >
                  <Text
                    style={[
                      styles.forgotPassword,
                      {
                        color: colors.accent,
                      },
                    ]}
                  >
                    Forgot password?
                  </Text>
                </Pressable>
              </View>

              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.input,

                    borderColor: colors.border,
                  },
                ]}
              >
                <Feather name="lock" size={17} color={colors.muted} />

                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                    },
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={passwordHidden}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />

                <Pressable
                  hitSlop={10}
                  onPress={() => setPasswordHidden((prev) => !prev)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={passwordHidden ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>
              </View>
            </View>

            {/* LOGIN BUTTON */}

            <Pressable
              disabled={!canSubmit}
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.submit,

                {
                  backgroundColor: colors.accent,

                  opacity: canSubmit ? (pressed ? 0.8 : 1) : 0.4,
                },
              ]}
            >
              <Text
                style={[
                  styles.submitText,
                  {
                    color: colors.accentText,
                  },
                ]}
              >
                Sign in
              </Text>

              <Feather name="arrow-right" size={18} color={colors.accentText} />
            </Pressable>
          </View>
        </View>

        {/* SIGN UP */}

        <View style={styles.signupArea}>
          <View
            style={[
              styles.divider,
              {
                backgroundColor: colors.border,
              },
            ]}
          />

          <View style={styles.signupRow}>
            <Text
              style={[
                styles.signupText,
                {
                  color: colors.secondary,
                },
              ]}
            >
              Don't have an account?
            </Text>

            <Pressable hitSlop={8} onPress={() => navigate("/signup")}>
              <Text
                style={[
                  styles.signupLink,
                  {
                    color: colors.accent,
                  },
                ]}
              >
                Create one
              </Text>
            </Pressable>
          </View>
        </View>

        {/* FOOTER */}

        <View style={styles.footer}>
          <Feather name="shield" size={12} color={colors.muted} />

          <Text
            style={[
              styles.footerText,
              {
                color: colors.muted,
              },
            ]}
          >
            Your notes stay yours
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,

    paddingHorizontal: 25,
  },

  scrollContent: {
    flexGrow: 1,

    justifyContent: "center",

    paddingVertical: 35,
    paddingHorizontal: 25,
  },

  /*
   * BRAND
   */

  brand: {
    alignItems: "center",

    marginBottom: 40,
  },

  logoContainer: {
    width: 82,
    height: 82,

    justifyContent: "center",
    alignItems: "center",

    borderRadius: 24,

    borderWidth: StyleSheet.hairlineWidth,

    elevation: 3,

    marginBottom: 17,
  },

  logo: {
    width: 66,
    height: 66,

    borderRadius: 18,
  },

  appName: {
    fontSize: 27,
    fontWeight: "700",

    letterSpacing: -0.6,
  },

  tagline: {
    marginTop: 5,

    fontSize: 12,
  },

  /*
   * LOGIN
   */

  loginArea: {
    width: "100%",

    maxWidth: 500,

    alignSelf: "center",
  },

  headingArea: {
    marginBottom: 24,
  },

  heading: {
    fontSize: 23,
    fontWeight: "700",

    letterSpacing: -0.4,
  },

  description: {
    marginTop: 5,

    fontSize: 12,
  },

  /*
   * FORM
   */

  form: {
    gap: 17,
  },

  label: {
    marginBottom: 7,
    marginLeft: 2,

    fontSize: 11,
    fontWeight: "600",
  },

  inputContainer: {
    minHeight: 52,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 14,

    borderRadius: 14,

    borderWidth: StyleSheet.hairlineWidth,
  },

  input: {
    flex: 1,

    height: 50,

    marginLeft: 11,

    paddingVertical: 0,

    fontSize: 14,
  },

  passwordLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  forgotPassword: {
    marginBottom: 7,

    fontSize: 10,
    fontWeight: "600",
  },

  eyeButton: {
    width: 36,
    height: 40,

    alignItems: "flex-end",
    justifyContent: "center",
  },

  /*
   * SUBMIT
   */

  submit: {
    minHeight: 52,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 9,

    marginTop: 5,

    borderRadius: 14,

    elevation: 3,
  },

  submitText: {
    fontSize: 14,
    fontWeight: "700",
  },

  /*
   * SIGNUP
   */

  signupArea: {
    width: "100%",

    maxWidth: 500,

    alignSelf: "center",

    marginTop: 34,
  },

  divider: {
    width: "100%",
    height: StyleSheet.hairlineWidth,

    marginBottom: 23,
  },

  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    gap: 5,
  },

  signupText: {
    fontSize: 12,
  },

  signupLink: {
    fontSize: 12,
    fontWeight: "700",
  },

  /*
   * FOOTER
   */

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 5,

    marginTop: 35,
  },

  footerText: {
    fontSize: 9,
  },
});

export default Login;
