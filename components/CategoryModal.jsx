import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../constants/theme";
import { supabase } from "../lib/supabase";

const { height } = Dimensions.get("window");

export default function CategoryModal({
  visible,
  onClose,
  onCategoryCreated,
  onCategoryUpdated,
  editingCategory = null,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
  });
  const [errors, setErrors] = useState({});

  // Populate form if editing
  useEffect(() => {
    if (visible) {
      if (editingCategory) {
        setFormData({
          name: editingCategory.name,
        });
      } else {
        setFormData({
          name: "",
        });
      }
      setErrors({});
    }
  }, [visible, editingCategory]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Category name must be at least 2 characters";
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
        setLoading(false);
        return;
      }

      if (editingCategory) {
        const { data, error } = await supabase
          .from("categories")
          .update({
            name: formData.name.trim(),
          })
          .eq("id", editingCategory.id)
          .select()
          .single();

        if (error) throw error;
        onCategoryUpdated?.(data);
      } else {
        const { data, error } = await supabase
          .from("categories")
          .insert({
            user_id: user.id,
            name: formData.name.trim(),
          })
          .select()
          .single();

        if (error) throw error;

        onCategoryCreated?.(data);
      }

      resetForm();
      onClose();
    } catch (error) {
      console.error("Error with category:", error);

      // Provide more specific error messages
      let errorMessage = "Failed to process category";
      if (error.message) {
        if (error.message.includes("duplicate key")) {
          errorMessage = "A category with this name already exists";
        } else if (error.message.includes("permission denied")) {
          errorMessage = "You don't have permission to perform this action";
        } else if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your connection";
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
              {editingCategory ? "Edit Category" : "Create Category"}
            </Text>
          </View>

          <View style={styles.content}>
            {/* Category Name */}
            <View style={styles.section}>
              <Text style={styles.label}>Category Name</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Enter category name"
                placeholderTextColor="#888"
                value={formData.name}
                onChangeText={(text) => handleInputChange("name", text)}
                autoFocus
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>
          </View>

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
                  {editingCategory ? "Update Category" : "Create Category"}
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
