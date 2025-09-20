import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CategoryDeleteModal from "../../components/CategoryDeleteModal";
import CategoryModal from "../../components/CategoryModal";
import MainHeader from "../../components/MainHeader";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setModalVisible(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setModalVisible(true);
  };

  const handleDeleteCategory = (category) => {
    setCategoryToDelete(category);
    setDeleteModalVisible(true);
  };

  const deleteCategory = async () => {
    if (!categoryToDelete) return;

    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryToDelete.id);

      if (error) throw error;

      Alert.alert("Success", "Category deleted successfully!");
      fetchCategories();
      setDeleteModalVisible(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error("Error deleting category:", error);
      Alert.alert("Error", "Failed to delete category");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteModalClose = () => {
    setDeleteModalVisible(false);
    setCategoryToDelete(null);
    setDeleteLoading(false);
  };

  const handleCategoryCreated = (category) => {
    fetchCategories();
  };

  const handleCategoryUpdated = (category) => {
    fetchCategories();
  };

  const renderCategoryCard = ({ item }) => (
    <View style={styles.categoryCard}>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categoryDate}>
          Created: {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.categoryActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditCategory(item)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteCategory(item)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No Categories Yet</Text>
      <Text style={styles.emptyStateText}>
        Create your first category to organize your transactions
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <MainHeader title="Categories" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MainHeader title="Categories" />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>All Categories</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCreateCategory}
          >
            <Text style={styles.addButtonText}>+ Add Category</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={categories}
          renderItem={renderCategoryCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      </View>

      <CategoryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCategoryCreated={handleCategoryCreated}
        onCategoryUpdated={handleCategoryUpdated}
        editingCategory={editingCategory}
      />

      <CategoryDeleteModal
        visible={deleteModalVisible}
        onClose={handleDeleteModalClose}
        onConfirm={deleteCategory}
        category={categoryToDelete}
        loading={deleteLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "poppins-bold",
    color: COLORS.black,
  },
  addButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: "poppins-medium",
  },
  listContainer: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  categoryCard: {
    backgroundColor: COLORS.white,
    borderColor: "#888",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontFamily: "poppins-bold",
    color: COLORS.black,
    marginBottom: 4,
  },
  categoryDate: {
    fontSize: 12,
    fontFamily: "poppins-regular",
    color: "#666",
  },
  categoryActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: "poppins-medium",
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: "poppins-medium",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: "poppins-regular",
    color: COLORS.black,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: "poppins-bold",
    color: COLORS.black,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: "poppins-regular",
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});
