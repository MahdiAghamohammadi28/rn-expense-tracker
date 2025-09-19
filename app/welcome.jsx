import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/theme";

export default function Welcome() {
  const router = useRouter();

  const handleGetStarted = async () => {
    try {
      // Mark that user has seen the welcome screen
      await AsyncStorage.setItem("isFirstTime", "false");
      router.push("/onboarding");
    } catch (error) {
      console.error("Error saving welcome state:", error);
      // Still navigate even if there's an error
      router.push("/onboarding");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Image
          resizeMode="contain"
          style={styles.img}
          source={require("../assets/images/wallet.png")}
        />
      </View>
      <Text style={styles.title}>Welcome to Expense Tracker</Text>
      <Text style={styles.subtitle}>
        Track your spending, manage budgets, and stay in control of your money.
      </Text>
      <TouchableOpacity style={styles.btn} onPress={handleGetStarted}>
        <Text style={styles.btnText}>Get Started</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bg,
  },
  img: {
    height: 150,
    marginBottom: 24,
  },
  title: {
    fontFamily: "poppins-bold",
    fontSize: 24,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "poppins-light",
    fontSize: 16,
    textAlign: "center",
    width: "80%",
    marginBottom: 32,
  },
  btn: {
    width: 150,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
    alignSelf: "center",
  },
  btnText: {
    color: COLORS.white,
    fontFamily: "poppins-regular",
    fontSize: 20,
  },
});
