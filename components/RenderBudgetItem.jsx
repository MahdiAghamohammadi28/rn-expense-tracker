import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { COLORS } from "../constants/theme";
import { supabase } from "../lib/supabase";

export default function RenderBudgetItem({ budget, onEdit, onDelete }) {
  const [spentAmount, setSpentAmount] = useState(0);

  const fetchBudgetData = useCallback(async () => {
    try {
      // Fetch transactions for this category to calculate spent amount
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("User not authenticated");
        return;
      }

      const { data: transactions, error: transactionError } = await supabase
        .from("transactions")
        .select("amount, type")
        .eq("user_id", user.id)
        .eq("category_id", budget.category_id);

      if (transactionError) {
        console.error("Error fetching transactions:", transactionError);
      } else {
        const totalSpent =
          transactions?.reduce((sum, transaction) => {
            return sum + (parseFloat(transaction.amount) || 0);
          }, 0) || 0;

        setSpentAmount(totalSpent);
      }
    } catch (error) {
      console.error("Error fetching budget data:", error);
    }
  }, [budget.category_id]);

  useEffect(() => {
    fetchBudgetData();

    const channel = supabase
      .channel("transactions-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // listen for INSERT, UPDATE, DELETE
          schema: "public",
          table: "transactions",
          filter: `category_id=eq.${budget.category_id}`,
        },
        (payload) => {
          console.log("Transaction changed:", payload);
          fetchBudgetData(); // re-fetch when data changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBudgetData]);

  const calculateProgress = () => {
    if (budget.amount <= 0) return 0;
    const progress = (spentAmount / budget.amount) * 100;
    return Math.min(progress, 100); // Cap at 100%
  };

  const getProgressColor = () => {
    const progress = calculateProgress();
    if (progress >= 100) return COLORS.error; // Red when over budget
    if (progress >= 80) return "#FFA500"; // Orange when close to limit
    return COLORS.primary; // Green/blue for normal progress
  };

  const formatAmount = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const formatPeriod = (createdAt) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const progress = calculateProgress();
  const remainingAmount = Math.max(0, budget.amount - spentAmount);

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <View style={styles.budgetInfo}>
          <Text style={styles.budgetName}>
            {budget.name || "Unknown"} Budget
          </Text>
          <Text style={styles.budgetAmount}>{formatAmount(budget.amount)}</Text>
          <Text style={styles.periodText}>
            Created {formatPeriod(budget.created_at)}
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <AnimatedCircularProgress
          size={80}
          width={8}
          fill={progress}
          tintColor={getProgressColor()}
          backgroundColor="#f0f0f0"
          rotation={0}
          lineCap="round"
        >
          {() => (
            <View style={styles.progressContent}>
              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>
          )}
        </AnimatedCircularProgress>

        <View style={styles.amountInfo}>
          <Text style={styles.spentAmount}>
            Spent: {formatAmount(spentAmount)}
          </Text>
          <Text style={styles.remainingAmount}>
            Remaining: {formatAmount(remainingAmount)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#888",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  leftSection: {
    flex: 1,
    marginRight: 16,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetName: {
    fontSize: 18,
    fontFamily: "poppins-bold",
    color: COLORS.black,
    marginBottom: 4,
  },
  budgetAmount: {
    fontSize: 16,
    fontFamily: "poppins-medium",
    color: COLORS.primary,
    marginBottom: 4,
  },
  periodText: {
    fontSize: 12,
    fontFamily: "poppins-regular",
    color: "#888",
  },
  rightSection: {
    alignItems: "center",
  },
  progressContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    fontSize: 12,
    fontFamily: "poppins-bold",
    color: COLORS.black,
  },
  amountInfo: {
    marginTop: 8,
    alignItems: "center",
  },
  spentAmount: {
    fontSize: 12,
    fontFamily: "poppins-medium",
    color: COLORS.error,
    marginBottom: 2,
  },
  remainingAmount: {
    fontSize: 12,
    fontFamily: "poppins-regular",
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "poppins-regular",
    color: "#888",
  },
});
