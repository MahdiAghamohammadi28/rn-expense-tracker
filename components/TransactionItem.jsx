import { usePathname } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import SvgIcons from "../constants/SvgIcons";
import { COLORS } from "../constants/theme";

export default function TransactionItem({ transaction, onEdit, onDelete }) {
  const path = usePathname();
  const isExpense = transaction.type === "expense";
  const amountColor = isExpense ? COLORS.error : COLORS.primary;
  const iconName = isExpense ? "arrow-up" : "arrow-down";

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Format amount
  const formatAmount = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: isExpense ? "#fff5f5" : "#ebfbee",
            },
          ]}
        >
          <SvgIcons name={iconName} size={20} color={amountColor} />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.title}>{transaction.title}</Text>
          <Text style={styles.description}>{transaction.description}</Text>
          <Text style={styles.category}>
            <Text style={styles.categoryLabel}>Category: </Text>
            {transaction.category_name || "Unknown"}
          </Text>
        </View>
      </View>
      <View style={styles.rightSection}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {isExpense ? "-" : "+"}
          {formatAmount(transaction.amount)}
        </Text>
        <Text style={styles.date}>{formatDate(transaction.created_at)}</Text>
        <View style={styles.actionButtons}>
          {onEdit && path === "/transactions" && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onEdit(transaction)}
            >
              <SvgIcons name="edit" size={16} color={COLORS.black} />
            </TouchableOpacity>
          )}
          {onDelete && path === "/transactions" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => onDelete(transaction)}
            >
              <SvgIcons name="delete" size={16} color={COLORS.error} />
            </TouchableOpacity>
          )}
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    marginBottom: 8,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 2,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 1000,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  title: {
    fontFamily: "poppins-bold",
    fontSize: 14,
  },
  description: {
    fontSize: 18,
    fontFamily: "poppins-regular",
    color: COLORS.black,
    marginBottom: 2,
  },
  category: {
    fontSize: 14,
    color: "#8a8a8a",
    fontFamily: "poppins-regular",
  },
  categoryLabel: {
    fontFamily: "poppins-medium",
  },
  rightSection: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: "#f5f5f5",
  },
  deleteButton: {
    backgroundColor: "#fff5f5",
  },
});
