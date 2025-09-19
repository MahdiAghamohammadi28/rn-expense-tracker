import { COLORS } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import TransactionItem from "./TransactionItem";

export default function RecentTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const subscriptionRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchRecentTransactions();
    setupRealtimeSubscription();

    // Set up interval to refetch every 3 seconds
    intervalRef.current = setInterval(() => {
      fetchRecentTransactions(false); // Don't show loading for interval refetches
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

  const fetchRecentTransactions = async (showLoading = true) => {
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
        setError("Please log in to view transactions");
        return;
      }

      // Fetch the last 5 transactions for the current user
      const { data, error: fetchError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (fetchError) {
        console.error("Error fetching transactions:", fetchError);
        setError("Failed to load transactions");
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
        .channel("transactions_changes")
        .on(
          "postgres_changes",
          {
            event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
            schema: "public",
            table: "transactions",
            filter: `user_id=eq.${user.id}`, // Only listen to changes for current user
          },
          (payload) => {
            console.log("Real-time update received:", payload);
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
        // Add new transaction to the beginning of the list
        setTransactions((prevTransactions) => {
          const updated = [newRecord, ...prevTransactions];
          // Keep only the latest 5 transactions
          return updated.slice(0, 5);
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

  const renderTransaction = ({ item }) => (
    <TransactionItem transaction={item} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No transactions yet</Text>
      <Text style={styles.emptyStateSubtext}>
        Start adding your expenses and income to see them here
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Recent Transactions</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Recent Transactions</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Transactions</Text>
      </View>

      {transactions.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    padding: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 1.5,
    height: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: "poppins-bold",
    color: COLORS.black,
  },
  viewAllText: {
    fontSize: 14,
    color: "#888",
    fontFamily: "poppins-medium",
  },
  listContainer: {
    paddingBottom: 10,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray,
    fontFamily: "poppins-bold",
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: "center",
    fontFamily: "poppins-regular",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 8,
    fontFamily: "poppins-bold",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    lineHeight: 20,
    fontFamily: "poppins-regular",
  },
});
