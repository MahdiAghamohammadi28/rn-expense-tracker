import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MainHeader from "../../components/MainHeader";
import RenderBudgetItem from "../../components/RenderBudgetItem";
import SvgIcons from "../../constants/SvgIcons";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

export default function Budgets() {
  const [budget, setBudget] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
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
        .from("budgets")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      setBudget(data || []);
    } catch (error) {
      console.error("Error fetching budgets:", error);
    } finally {
      setLoading(false);
    }
  };

  function handleSearch() {}

  if (loading) {
    return (
      <View style={styles.container}>
        <MainHeader title="Budgets" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading budgets...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      <MainHeader title={"budgets"} />
      <View style={styles.wrapper}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>All Budgets</Text>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add Budget</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchBox}>
          <TextInput
            inputMode="search"
            placeholder="Search..."
            placeholderTextColor={"#888"}
            style={styles.input}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          <SvgIcons name={"search"} size={24} color={"#888"} />
        </View>
        <FlatList
          data={budget}
          key={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <RenderBudgetItem budget={item} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
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
  wrapper: {
    padding: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 50,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#888",
    borderRadius: 1000,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    elevation: 2,
    marginBottom: 12,
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
});
