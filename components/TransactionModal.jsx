import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import SvgIcons from "../constants/SvgIcons";
import { COLORS } from "../constants/theme";
import { supabase } from "../lib/supabase";

const { height } = Dimensions.get("window");

export default function TransactionModal({
  visible,
  onClose,
  onTransactionCreated,
  onTransactionUpdated,
  editingTransaction = null,
}) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState({
    type: "expense",
    title: "",
    description: "",
    amount: "",
    category_id: null,
    category_name: "",
    date: new Date(),
  });
  const [errors, setErrors] = useState({});

  // Fetch categories and populate form if editing
  useEffect(() => {
    if (visible) {
      fetchCategories();

      if (editingTransaction) {
        setFormData({
          type: editingTransaction.type,
          title: editingTransaction.title,
          description: editingTransaction.description,
          amount: editingTransaction.amount.toString(),
          category_id: editingTransaction.category_id,
          category_name: editingTransaction.category_name,
          date: new Date(editingTransaction.date),
        });
      } else {
        setFormData({
          type: "expense",
          title: "",
          description: "",
          amount: "",
          category_id: null,
          category_name: "",
          date: new Date(),
        });
      }
    }
  }, [visible, editingTransaction]);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      console.log("Categories data:", data);

      if (error) throw error;

      const categoryOptions =
        data?.map((category) => ({
          label: category.name,
          value: category.id,
        })) || [];

      setCategories(categoryOptions);
    } catch (error) {
      console.error("Error fetching categories:", error);
      Alert.alert("Error", "Failed to fetch categories");
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.amount.trim()) {
      newErrors.amount = "Amount is required";
    } else if (
      isNaN(parseFloat(formData.amount)) ||
      parseFloat(formData.amount) <= 0
    ) {
      newErrors.amount = "Please enter a valid amount";
    }
    if (!formData.category_id)
      newErrors.category_id = "Please select a category";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert("Error", "Please log in to perform this action");
        return;
      }

      if (editingTransaction) {
        const { data, error } = await supabase
          .from("transactions")
          .update({
            type: formData.type,
            title: formData.title.trim(),
            description: formData.description.trim(),
            amount: parseFloat(formData.amount),
            category_id: formData.category_id,
            category_name: formData.category_name,
            date: formData.date.toISOString(),
          })
          .eq("id", editingTransaction.id)
          .select()
          .single();

        if (error) throw error;

        Alert.alert("Success", "Transaction updated successfully!");
        onTransactionUpdated?.(data);
      } else {
        const { data, error } = await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            type: formData.type,
            title: formData.title.trim(),
            description: formData.description.trim(),
            amount: parseFloat(formData.amount),
            category_id: formData.category_id,
            category_name: formData.category_name,
            date: formData.date.toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        Alert.alert("Success", "Transaction created successfully!");
        onTransactionCreated?.(data);
      }

      resetForm();
      onClose();
    } catch (error) {
      console.error("Error with transaction:", error);
      Alert.alert("Error", "Failed to process transaction");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: "expense",
      title: "",
      description: "",
      amount: "",
      category_id: null,
      category_name: "",
      date: new Date(),
    });
    setErrors({});
    setOpen(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {editingTransaction ? "Edit Transaction" : "Create Transaction"}
            </Text>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Type */}
            <View style={styles.section}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === "expense" && styles.typeButtonActive,
                  ]}
                  onPress={() => handleInputChange("type", "expense")}
                >
                  <SvgIcons
                    name="arrow-up"
                    size={20}
                    color={
                      formData.type === "expense" ? COLORS.white : COLORS.error
                    }
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.type === "expense" &&
                        styles.typeButtonTextActive,
                    ]}
                  >
                    Expense
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === "income" && styles.typeButtonActive,
                  ]}
                  onPress={() => handleInputChange("type", "income")}
                >
                  <SvgIcons
                    name="arrow-down"
                    size={20}
                    color={
                      formData.type === "income" ? COLORS.white : COLORS.primary
                    }
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.type === "income" && styles.typeButtonTextActive,
                    ]}
                  >
                    Income
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Title */}
            <View style={styles.section}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="Enter transaction title"
                placeholderTextColor="#888"
                value={formData.title}
                onChangeText={(text) => handleInputChange("title", text)}
              />
              {errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, errors.description && styles.inputError]}
                placeholder="Enter transaction description"
                placeholderTextColor="#888"
                value={formData.description}
                onChangeText={(text) => handleInputChange("description", text)}
                multiline
                numberOfLines={3}
              />
              {errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
            </View>

            {/* Amount */}
            <View style={styles.section}>
              <Text style={styles.label}>Amount *</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={[
                    styles.amountInput,
                    errors.amount && styles.inputError,
                  ]}
                  placeholder="0.00"
                  placeholderTextColor="#888"
                  value={formData.amount}
                  onChangeText={(text) => handleInputChange("amount", text)}
                  keyboardType="numeric"
                />
              </View>
              {errors.amount && (
                <Text style={styles.errorText}>{errors.amount}</Text>
              )}
            </View>

            {/* Category */}
            <View style={styles.section}>
              <Text style={styles.label}>Category *</Text>
              {categoriesLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Loading categories...</Text>
                </View>
              ) : (
                <DropDownPicker
                  items={categories}
                  value={formData.category_id}
                  setValue={(callback) => {
                    const newValue = callback(formData.category_id);
                    const selected = categories.find(
                      (c) => c.value === newValue
                    );
                    setFormData((prev) => ({
                      ...prev,
                      category_id: newValue,
                      category_name: selected?.label || "",
                    }));
                  }}
                  placeholder="Select a category"
                  containerStyle={styles.dropdownContainer}
                  style={[
                    styles.dropdown,
                    errors.category_id && styles.inputError,
                  ]}
                  zIndex={3000}
                  zIndexInverse={1000}
                  open={open}
                  setOpen={setOpen}
                />
              )}
              {errors.category_id && (
                <Text style={styles.errorText}>{errors.category_id}</Text>
              )}
            </View>

            {/* Date */}
            <View style={styles.section}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>{formatDate(formData.date)}</Text>
                <SvgIcons name="left-caret" size={20} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={formData.date}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    handleInputChange("date", selectedDate);
                  }
                }}
              />
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {editingTransaction
                    ? "Update Transaction"
                    : "Create Transaction"}
                </Text>
              )}
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
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 20,
    fontFamily: "poppins-bold",
    color: COLORS.black,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 12,
  },
  label: {
    fontSize: 16,
    fontFamily: "poppins-medium",
    color: COLORS.black,
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    backgroundColor: COLORS.white,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeButtonText: {
    fontSize: 16,
    fontFamily: "poppins-medium",
    color: COLORS.black,
    marginLeft: 8,
  },
  typeButtonTextActive: {
    color: COLORS.white,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "poppins-regular",
    backgroundColor: COLORS.white,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  currencySymbol: {
    fontSize: 18,
    fontFamily: "poppins-medium",
    color: COLORS.black,
    paddingHorizontal: 16,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 16,
    fontSize: 16,
    fontFamily: "poppins-regular",
  },
  dropdownContainer: {
    height: 50,
  },
  dropdown: {
    backgroundColor: COLORS.white,
    borderColor: "#e0e0e0",
    borderRadius: 12,
  },
  dropdownItem: {
    justifyContent: "flex-start",
  },
  dropdownList: {
    backgroundColor: COLORS.white,
    borderColor: "#e0e0e0",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  dateText: {
    fontSize: 16,
    fontFamily: "poppins-regular",
    color: COLORS.black,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "poppins-regular",
    color: COLORS.black,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "poppins-regular",
    color: COLORS.error,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: "poppins-medium",
    color: COLORS.black,
  },
  submitButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: "poppins-medium",
    color: COLORS.white,
  },
});
