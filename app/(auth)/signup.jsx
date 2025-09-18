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
import SvgIcons from "../../constants/SvgIcons";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

export default function SignUp() {
  const router = useRouter();
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [message, setMessage] = useState("");
  const [showPass, setShowPass] = useState(false);

  async function handleSignup() {
    const cleanedName = String(fullname).trim();
    const cleanedEmail = String(email).trim();
    const cleanedPassword = String(password).trim();

    if (!cleanedName || !cleanedEmail || !cleanedPassword) {
      setErrorMessage("Name, email and password are required");
      return;
    }

    const namePattern = /^[a-zA-Z0-9_]{3,20}$/;
    if (!namePattern.test(cleanedName)) {
      setErrorMessage(
        "Name must be 3-20 chars, letters/numbers/underscores only"
      );
      return;
    }

    const emailPattern = /^(?:[^\s@]+)@(?:[^\s@]+)\.[^\s@]{2,}$/i;
    if (!emailPattern.test(cleanedEmail)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    const { error } = await supabase.auth.signUp({
      email: cleanedEmail,
      password: cleanedPassword,
      options: {
        data: {
          displayName: cleanedName,
        },
      },
    });

    if (error) {
      const msg = String(error.message || "").toLowerCase();
      if (
        msg.includes("already registered") ||
        msg.includes("already exists")
      ) {
        setErrorMessage("This email already exists, try logging in.");
      } else if (error.status === 422) {
        setErrorMessage(
          "Unable to sign up with this email. Please try another."
        );
      } else if (error.status === 400 && msg.includes("password")) {
        setErrorMessage("Password does not meet requirements.");
      } else {
        setErrorMessage(error.message);
      }
    } else {
      setMessage("Signup successful. Redirecting to login...");
      await supabase.auth.signOut();
      setTimeout(() => {
        router.replace("/signin");
      }, 1000);
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {message ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={styles.info}>{message}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.title}>Get Started</Text>
          <Text style={styles.subtitle}>
            Sign up to manage your income, expenses, and savings in one place
          </Text>
          <TextInput
            style={styles.input}
            inputMode="text"
            placeholder="Fullname"
            placeholderTextColor={"#888"}
            autoCapitalize="none"
            value={fullname}
            onChangeText={setFullname}
          />
          <TextInput
            style={styles.input}
            inputMode="email"
            placeholder="Email"
            placeholderTextColor={"#888"}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
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

          {errorMessage ? (
            <Text style={styles.error}>{errorMessage}</Text>
          ) : null}
          <TouchableOpacity
            style={styles.btn}
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Create account</Text>
            )}
          </TouchableOpacity>
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.replace("/signin")}>
              <Text style={styles.link}> Log in</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#faf0dd",
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
    width: 180,
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
  info: {
    color: COLORS.black,
    marginBottom: 8,
    textAlign: "center",
  },
});
