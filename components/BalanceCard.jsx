import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const subscriptionRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchAllTransactions();
    setupRealtimeSubscription();

    // Set up interval to refetch every 3 seconds
    intervalRef.current = setInterval(() => {
      fetchAllTransactions(false); // Don't show loading for interval refetches
    }, 3000);

    // Cleanup subscription and interval on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [setupRealtimeSubscription]);

  const fetchAllTransactions = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      // Get the current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Please log in to view balance");
        return;
      }

      // Fetch all transactions for the current user
      const { data, error: fetchError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching transactions:", fetchError);
        setError("Failed to load balance");
        return;
      }

      setTransactions(data || []);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Something went wrong");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const setupRealtimeSubscription = useCallback(async () => {
    try {
      // Get the current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("User not authenticated for real-time subscription");
        return;
      }

      // Subscribe to changes in the transactions table
      const subscription = supabase
        .channel("balance_transactions_changes")
        .on(
          "postgres_changes",
          {
            event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
            schema: "public",
            table: "transactions",
            filter: `user_id=eq.${user.id}`, // Only listen to changes for current user
          },
          (payload) => {
            console.log("Balance real-time update received:", payload);
            handleRealtimeUpdate(payload);
          }
        )
        .subscribe();

      subscriptionRef.current = subscription;
    } catch (err) {
      console.error("Error setting up real-time subscription:", err);
    }
  }, []);

  const handleRealtimeUpdate = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case "INSERT":
        // Add new transaction
        setTransactions((prevTransactions) => {
          return [newRecord, ...prevTransactions];
        });
        break;

      case "UPDATE":
        // Update existing transaction
        setTransactions((prevTransactions) => {
          return prevTransactions.map((transaction) =>
            transaction.id === newRecord.id ? newRecord : transaction
          );
        });
        break;

      case "DELETE":
        // Remove deleted transaction
        setTransactions((prevTransactions) => {
          return prevTransactions.filter(
            (transaction) => transaction.id !== oldRecord.id
          );
        });
        break;

      default:
        console.log("Unhandled event type:", eventType);
    }
  };

  // Calculate totals from transactions
  const calculateTotals = () => {
    const totals = transactions.reduce(
      (acc, transaction) => {
        const amount = parseFloat(transaction.amount) || 0;
        if (transaction.type === "income") {
          acc.income += amount;
        } else if (transaction.type === "expense") {
          acc.expense += amount;
        }
        return acc;
      },
      { income: 0, expense: 0 }
    );

    const balance = totals.income - totals.expense;
    return {
      balance,
      income: totals.income,
      expense: totals.expense,
    };
  };

  const { balance, income, expense } = calculateTotals();

  // Format currency
  const formatCurrency = (amount) => {
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
          {formatCurrency(balance)}
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
          <Text style={styles.infoItemValue}>{formatCurrency(income)}</Text>
        </View>
        <View style={styles.infoItem}>
          <View style={styles.infoItemLabel}>
            <View style={styles.infoItemIconWrapper}>
              <SvgIcons name={"arrow-up"} size={18} color={COLORS.white} />
            </View>
            <Text style={styles.infoItemLabelText}>Expenses</Text>
          </View>
          <Text style={styles.infoItemValue}>{formatCurrency(expense)}</Text>
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
