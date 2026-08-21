import { useState } from "react";

import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Text,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";

import { Feather, Ionicons } from "@expo/vector-icons";

import { useNavigate } from "react-router-native";

import Spinner from "react-native-loading-spinner-overlay";

import { signupUser } from "../utils/api";

import { v4 as uuidv4 } from "uuid";

const Signup = ({ setSystemNotifs }) => {
  const [loading, setLoading] = useState(false);

  const [passwordHidden, setPasswordHidden] = useState(true);

  const [confirmPasswordHidden, setConfirmPasswordHidden] = useState(true);

  const [username, setUsername] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

  /*
   * Temporary local colors.
   *
   * These can move into your centralized
   * theme once the styling pass is finished.
   */

  const colors = {
    background: "#0a0a0b",

    surface: "#151517",
    input: "#18181b",

    text: "#f4f4f5",
    secondary: "#a1a1aa",
    muted: "#71717a",

    border: "#27272a",

    accent: "#f59e0b",
    accentText: "#18181b",

    success: "#4ade80",
    danger: "#f87171",
  };

  /*
   * FORM STATE
   */

  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const canSubmit =
    username.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    passwordsMatch &&
    !loading;

  /*
   * SIGNUP
   */

  const handleSignup = async () => {
    if (!canSubmit) {
      return;
    }

    try {
      setLoading(true);

      await signupUser(username.trim(), email.trim(), password);

      setSystemNotifs([
        {
          id: uuidv4(),
          color: "#55ff55",
          title: "Successful Signup!",
          text: "Welcome! Your account has been created. Please sign in to continue.",
          actions: [
            {
              text: "close",
              func: () => setSystemNotifs([]),
            },
          ],
        },
      ]);

      navigate("/");
    } catch (err) {
      setSystemNotifs([
        {
          id: uuidv4(),
          color: "#ff5555",
          title: "Error Signing Up",

          text:
            err.response?.data?.message ??
            "Unable to create your account. Please check your connection and try again.",

          actions: [
            {
              text: "close",
              func: () => setSystemNotifs([]),
            },
          ],
        },
      ]);

      console.log("Error signing up user:", err);
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

        {/* SIGNUP AREA */}

        <View style={styles.signupArea}>
          <View style={styles.headingArea}>
            <Text
              style={[
                styles.heading,
                {
                  color: colors.text,
                },
              ]}
            >
              Create your account
            </Text>

            <Text
              style={[
                styles.description,
                {
                  color: colors.secondary,
                },
              ]}
            >
              Get started with Native Notes
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
                  placeholder="Choose a username"
                  placeholderTextColor={colors.muted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username-new"
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
                  placeholder="Create a password"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={passwordHidden}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  returnKeyType="next"
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

            {/* CONFIRM PASSWORD */}

            <View>
              <View style={styles.labelRow}>
                <Text
                  style={[
                    styles.label,
                    {
                      color: colors.secondary,
                    },
                  ]}
                >
                  Confirm password
                </Text>

                {confirmPassword.length > 0 ? (
                  <View style={styles.matchIndicator}>
                    <Feather
                      name={passwordsMatch ? "check" : "x"}
                      size={11}
                      color={passwordsMatch ? colors.success : colors.danger}
                    />

                    <Text
                      style={[
                        styles.matchText,
                        {
                          color: passwordsMatch ? colors.success : colors.danger,
                        },
                      ]}
                    >
                      {passwordsMatch ? "Passwords match" : "Doesn't match"}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.input,

                    borderColor:
                      confirmPassword.length > 0 && !passwordsMatch ? colors.danger : colors.border,
                  },
                ]}
              >
                <Feather
                  name="shield"
                  size={17}
                  color={
                    confirmPassword.length > 0 && !passwordsMatch ? colors.danger : colors.muted
                  }
                />

                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                    },
                  ]}
                  placeholder="Enter your password again"
                  placeholderTextColor={colors.muted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={confirmPasswordHidden}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                />

                <Pressable
                  hitSlop={10}
                  onPress={() => setConfirmPasswordHidden((prev) => !prev)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={confirmPasswordHidden ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>
              </View>
            </View>

            {/* CREATE ACCOUNT */}

            <Pressable
              disabled={!canSubmit}
              onPress={handleSignup}
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
                Create account
              </Text>

              <Feather name="arrow-right" size={18} color={colors.accentText} />
            </Pressable>
          </View>
        </View>

        {/* LOGIN LINK */}

        <View style={styles.loginArea}>
          <View
            style={[
              styles.divider,
              {
                backgroundColor: colors.border,
              },
            ]}
          />

          <View style={styles.loginRow}>
            <Text
              style={[
                styles.loginText,
                {
                  color: colors.secondary,
                },
              ]}
            >
              Already have an account?
            </Text>

            <Pressable hitSlop={8} onPress={() => navigate("/")}>
              <Text
                style={[
                  styles.loginLink,
                  {
                    color: colors.accent,
                  },
                ]}
              >
                Sign in
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
  /*
   * SCREEN
   */

  screen: {
    flex: 1,

    /*
     * Explicitly here since the
     * App.js padding didn't propagate.
     */
    paddingHorizontal: 25,
  },

  scrollContent: {
    flexGrow: 1,

    justifyContent: "center",

    paddingTop: 35,
    paddingBottom: 35,
  },

  /*
   * BRAND
   */

  brand: {
    alignItems: "center",

    marginBottom: 32,
  },

  logoContainer: {
    width: 78,
    height: 78,

    justifyContent: "center",
    alignItems: "center",

    borderRadius: 23,

    borderWidth: StyleSheet.hairlineWidth,

    elevation: 3,

    marginBottom: 15,
  },

  logo: {
    width: 62,
    height: 62,

    borderRadius: 17,
  },

  appName: {
    fontSize: 26,
    fontWeight: "700",

    letterSpacing: -0.6,
  },

  tagline: {
    marginTop: 4,

    fontSize: 11,
  },

  /*
   * SIGNUP
   */

  signupArea: {
    width: "100%",

    maxWidth: 500,

    alignSelf: "center",
  },

  headingArea: {
    marginBottom: 22,
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
    gap: 15,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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

  eyeButton: {
    width: 36,
    height: 40,

    alignItems: "flex-end",
    justifyContent: "center",
  },

  /*
   * PASSWORD MATCH
   */

  matchIndicator: {
    flexDirection: "row",
    alignItems: "center",

    gap: 4,

    marginBottom: 7,
  },

  matchText: {
    fontSize: 9,
    fontWeight: "600",
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

    marginTop: 6,

    borderRadius: 14,

    elevation: 3,
  },

  submitText: {
    fontSize: 14,
    fontWeight: "700",
  },

  /*
   * LOGIN
   */

  loginArea: {
    width: "100%",

    maxWidth: 500,

    alignSelf: "center",

    marginTop: 30,
  },

  divider: {
    width: "100%",

    height: StyleSheet.hairlineWidth,

    marginBottom: 22,
  },

  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 5,
  },

  loginText: {
    fontSize: 12,
  },

  loginLink: {
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

    marginTop: 30,
  },

  footerText: {
    fontSize: 9,
  },
});

export default Signup;
