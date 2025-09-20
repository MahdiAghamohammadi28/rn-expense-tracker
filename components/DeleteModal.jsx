import React from "react";
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../constants/theme";

const { width } = Dimensions.get("window");

export default function DeleteModal({
  visible,
  onClose,
  onConfirm,
  transaction,
  loading = false,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Delete Transaction</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.message}>
              Are you sure you want to delete "{transaction?.title}"? This
              action cannot be undone.
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={onConfirm}
              disabled={loading}
            >
              <Text style={styles.deleteButtonText}>
                {loading ? "Deleting..." : "Delete"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: width * 0.9,
    maxWidth: 400,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 20,
    fontFamily: "poppins-bold",
    color: COLORS.black,
    textAlign: "center",
  },
  content: {
    padding: 20,
    paddingVertical: 16,
  },
  message: {
    fontSize: 16,
    fontFamily: "poppins-regular",
    color: COLORS.black,
    textAlign: "center",
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    padding: 20,
    paddingTop: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: "poppins-medium",
    color: COLORS.black,
  },
  deleteButton: {
    backgroundColor: "#ff4444",
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: "poppins-medium",
    color: COLORS.white,
  },
});
