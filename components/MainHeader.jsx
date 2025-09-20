import SvgIcons from "@/constants/SvgIcons";
import { COLORS } from "@/constants/theme";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MainHeader({ title, back }) {
  const { top } = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      {back && (
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <SvgIcons
            name={"left-caret"}
            size={24}
            color={COLORS.black}
            stroke={2}
          />
        </TouchableOpacity>
      )}
      <View style={styles.titleWrapper}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <TouchableOpacity style={styles.settingsBtn}>
        <SvgIcons
          name={"settings"}
          size={24}
          color={COLORS.black}
          stroke={1.5}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 85,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.secondary,
    elevation: 4,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 10,
    position: "relative",
  },
  title: {
    fontFamily: "poppins-bold",
    textAlign: "center",
    textTransform: "uppercase",
    fontSize: 18,
  },
  backBtn: {
    position: "absolute",
    top: "75%",
    left: 15,
  },
  settingsBtn: {
    position: "absolute",
    top: "75%",
    right: 15,
  },
});
