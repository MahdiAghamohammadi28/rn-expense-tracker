import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SvgIcons from "../../constants/SvgIcons";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPass, setShowPass] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setErrorMessage("Email and Password are required.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
    }
    setIsLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={styles.title}>Hey, welcome back</Text>
      <Text style={styles.subtitle}>
        Log in to track your expenses and stay on budget
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.passInput}
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry={showPass ? false : true}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPass((show) => !show)}>
          <SvgIcons
            name={showPass ? "eye-slash" : "eye"}
            size={20}
            color={"#888"}
          />
        </TouchableOpacity>
      </View>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <TouchableOpacity
        style={styles.btn}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={"#fff"} />
        ) : (
          <Text style={styles.btnText}>Login</Text>
        )}
      </TouchableOpacity>

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>Don't have an account?</Text>
        <TouchableOpacity onPress={() => router.replace("/signup")}>
          <Text style={styles.link}> Sign up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 18,
    alignItems: "stretch",
    justifyContent: "center",
  },
  title: {
    fontFamily: "poppins-bold",
    fontSize: 28,
    color: "#282828",
    textAlign: "left",
  },
  subtitle: {
    fontFamily: "poppins-regular",
    color: "rgba(40, 40, 40, 0.5)",
    fontSize: 16,
    textAlign: "left",
    marginBottom: 24,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    color: COLORS.black,
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    fontFamily: "poppins-regular",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    height: 50,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    color: COLORS.black,
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  passInput: {
    width: "90%",
    fontFamily: "poppins-regular",
  },
  btn: {
    width: 150,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 24,
    alignSelf: "center",
  },
  btnText: {
    color: COLORS.white,
    fontFamily: "poppins-regular",
    fontSize: 20,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  switchText: {
    color: COLORS.black,
    fontFamily: "poppins-regular",
  },
  link: {
    color: COLORS.primary,
    fontFamily: "poppins-regular",
  },
  error: {
    color: COLORS.error,
    marginBottom: 8,
    textAlign: "center",
  },
});
