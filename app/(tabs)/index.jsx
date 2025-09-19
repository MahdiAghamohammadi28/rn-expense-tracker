import MainHeader from "@/components/MainHeader";
import { COLORS } from "@/constants/theme";
import React from "react";
import { StyleSheet, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <MainHeader title={"home"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
});
