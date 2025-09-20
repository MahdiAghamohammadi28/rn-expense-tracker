import BalanceCard from "@/components/BalanceCard";
import MainHeader from "@/components/MainHeader";
import RecentTransactions from "@/components/RecentTransactions";
import { COLORS } from "@/constants/theme";
import React from "react";
import { StyleSheet, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <MainHeader title={"home"} notification />
      <View style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.wrapper}>
          <BalanceCard />
          <RecentTransactions />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  wrapper: {
    paddingTop: 12,
  },
});
