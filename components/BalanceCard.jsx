import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";
import SvgIcons from "../constants/SvgIcons";
import { COLORS } from "../constants/theme";
import { supabase } from "../lib/supabase";

const { width } = Dimensions.get("window");

export default function BalanceCard() {
  const [balance, setBalance] = useState(0);
  const [incomes, setIncomes] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTransactionData();

    // Set up real-time subscription for transaction changes
    const channel = supabase
      .channel("balance-card-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
        },
        (payload) => {
          console.log("Transaction change received in BalanceCard:", payload);
          fetchTransactionData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTransactionData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("User not authenticated:", userError);
        setBalance(0);
        setIncomes(0);
        setExpenses(0);
        return;
      }

      // Fetch all transactions for the current user
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching transactions:", error);
        setError("Failed to fetch transaction data");
        return;
      }

      // Calculate totals
      let totalIncomes = 0;
      let totalExpenses = 0;

      if (transactions && transactions.length > 0) {
        transactions.forEach((transaction) => {
          const amount = parseFloat(transaction.amount) || 0;
          if (transaction.type === "income") {
            totalIncomes += amount;
          } else if (transaction.type === "expense") {
            totalExpenses += amount;
          }
        });
      }

      const calculatedBalance = totalIncomes - totalExpenses;

      setIncomes(totalIncomes);
      setExpenses(totalExpenses);
      setBalance(calculatedBalance);
    } catch (error) {
      console.error("Error calculating transaction data:", error);
      setError("Failed to calculate balance");
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return `$${Math.abs(amount).toFixed(2)}`;
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.card}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.white} />
          <Text style={styles.loadingText}>Loading balance...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.card}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary]}
      style={styles.card}
    >
      <View style={styles.balanceWrapper}>
        <Text style={styles.balanceLabel}>Your Balance</Text>
        <Text style={styles.balanceValue}>
          {balance >= 0 ? "+" : "-"}
          {formatAmount(balance)}
        </Text>
      </View>
      <View style={styles.info}>
        <View style={styles.infoItem}>
          <View style={styles.infoItemLabel}>
            <View style={styles.infoItemIconWrapper}>
              <SvgIcons name={"arrow-down"} size={18} color={COLORS.white} />
            </View>
            <Text style={styles.infoItemLabelText}>Incomes</Text>
          </View>
          <Text style={styles.infoItemValue}>+{formatAmount(incomes)}</Text>
        </View>
        <View style={styles.infoItem}>
          <View style={styles.infoItemLabel}>
            <View style={styles.infoItemIconWrapper}>
              <SvgIcons name={"arrow-up"} size={18} color={COLORS.white} />
            </View>
            <Text style={styles.infoItemLabelText}>Expenses</Text>
          </View>
          <Text style={styles.infoItemValue}>-{formatAmount(expenses)}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 200,
    width: width * 0.8,
    alignSelf: "center",
    borderRadius: 32,
    marginTop: 12,
    padding: 24,
    justifyContent: "space-between",
  },
  balanceLabel: {
    fontFamily: "poppins-bold",
    color: COLORS.white,
  },
  balanceValue: {
    fontFamily: "poppins-bold",
    fontSize: 32,
    color: COLORS.white,
  },
  info: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoItemLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  infoItemIconWrapper: {
    backgroundColor: "rgba(136, 136, 136, 0.5)",
    padding: 4,
    borderRadius: 1000,
  },
  infoItemLabelText: {
    fontFamily: "poppins-medium",
    color: COLORS.white,
    fontSize: 16,
  },
  infoItemValue: {
    fontFamily: "poppins-bold",
    fontSize: 14,
    textAlign: "center",
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: "poppins-medium",
    color: COLORS.white,
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontFamily: "poppins-medium",
    color: COLORS.white,
    textAlign: "center",
    fontSize: 16,
  },
});
