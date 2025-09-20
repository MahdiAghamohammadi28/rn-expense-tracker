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
import { COLORS } from "../constants/theme";
import { supabase } from "../lib/supabase";

const { height } = Dimensions.get("window");

export default function BudgetModal({
  visible,
  onClose,
  onBudgetCreated,
  onBudgetUpdated,
  editingBudget = null,
}) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    amount: "",
    category_id: "",
  });
  const [errors, setErrors] = useState({});
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Populate form if editing
  useEffect(() => {
    if (visible) {
      fetchCategories();
      if (editingBudget) {
        setFormData({
          amount: editingBudget.amount.toString(),
          category_id: editingBudget.category_id,
        });
      } else {
        setFormData({
          amount: "",
          category_id: "",
        });
      }
      setErrors({});
    }
  }, [visible, editingBudget]);

  const fetchCategories = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert("Error", "Please log in to view categories");
        return;
      }

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (error) throw error;

      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      Alert.alert("Error", "Failed to fetch categories");
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

    if (!formData.amount.trim()) {
      newErrors.amount = "Budget amount is required";
    } else if (
      isNaN(parseFloat(formData.amount)) ||
      parseFloat(formData.amount) <= 0
    ) {
      newErrors.amount = "Budget amount must be a positive number";
    }

    if (!formData.category_id) {
      newErrors.category_id = "Please select a category";
    }

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

      const budgetData = {
        user_id: user.id,
        amount: parseFloat(formData.amount),
        category_id: formData.category_id,
      };

      if (editingBudget) {
        const { data, error } = await supabase
          .from("budgets")
          .update(budgetData)
          .eq("id", editingBudget.id)
          .select()
          .single();

        if (error) throw error;

        Alert.alert("Success", "Budget updated successfully!");
        onBudgetUpdated?.(data);
      } else {
        const { data, error } = await supabase
          .from("budgets")
          .insert(budgetData)
          .select()
          .single();

        if (error) throw error;

        Alert.alert("Success", "Budget created successfully!");
        onBudgetCreated?.(data);
      }

      resetForm();
      onClose();
    } catch (error) {
      console.error("Error with budget:", error);
      Alert.alert("Error", "Failed to process budget");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: "",
      category_id: "",
    });
    setErrors({});
    setShowCategoryDropdown(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCategorySelect = (category) => {
    setFormData((prev) => ({ ...prev, category_id: category.id }));
    setShowCategoryDropdown(false);
    if (errors.category_id) {
      setErrors((prev) => ({ ...prev, category_id: null }));
    }
  };

  const getSelectedCategoryName = () => {
    const selectedCategory = categories.find(
      (cat) => cat.id === formData.category_id
    );
    return selectedCategory?.name || "Select a category";
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
              {editingBudget ? "Edit Budget" : "Create Budget"}
            </Text>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Budget Amount */}
            <View style={styles.section}>
              <Text style={styles.label}>Budget Amount *</Text>
              <TextInput
                style={[styles.input, errors.amount && styles.inputError]}
                placeholder="Enter budget amount"
                placeholderTextColor="#888"
                value={formData.amount}
                onChangeText={(text) => handleInputChange("amount", text)}
                keyboardType="numeric"
                autoFocus
              />
              {errors.amount && (
                <Text style={styles.errorText}>{errors.amount}</Text>
              )}
            </View>

            {/* Category Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Category *</Text>
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  errors.category_id && styles.inputError,
                ]}
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <Text
                  style={[
                    styles.dropdownButtonText,
                    formData.category_id === "" && styles.placeholderText,
                  ]}
                >
                  {getSelectedCategoryName()}
                </Text>
                <Text style={styles.dropdownArrow}>
                  {showCategoryDropdown ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>
              {errors.category_id && (
                <Text style={styles.errorText}>{errors.category_id}</Text>
              )}

              {/* Category Dropdown */}
              {showCategoryDropdown && (
                <View style={styles.dropdown}>
                  <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.dropdownItem,
                          formData.category_id === category.id &&
                            styles.dropdownItemSelected,
                        ]}
                        onPress={() => handleCategorySelect(category)}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            formData.category_id === category.id &&
                              styles.dropdownItemTextSelected,
                          ]}
                        >
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {categories.length === 0 && (
                      <View style={styles.dropdownItem}>
                        <Text style={styles.dropdownItemText}>
                          No categories available
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
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
                  {editingBudget ? "Update Budget" : "Create Budget"}
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
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    width: "90%",
    maxWidth: 400,
    maxHeight: height * 0.8,
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
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
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
  errorText: {
    fontSize: 12,
    fontFamily: "poppins-regular",
    color: COLORS.error,
    marginTop: 4,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  dropdownButtonText: {
    fontSize: 16,
    fontFamily: "poppins-regular",
    color: COLORS.black,
    flex: 1,
  },
  placeholderText: {
    color: "#888",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    zIndex: 1000,
    maxHeight: 200,
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemSelected: {
    backgroundColor: COLORS.primary + "20",
  },
  dropdownItemText: {
    fontSize: 16,
    fontFamily: "poppins-regular",
    color: COLORS.black,
  },
  dropdownItemTextSelected: {
    color: COLORS.primary,
    fontFamily: "poppins-medium",
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
