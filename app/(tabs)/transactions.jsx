import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DeleteModal from "../../components/DeleteModal";
import MainHeader from "../../components/MainHeader";
import SortDropdown from "../../components/SortDropdown";
import TransactionItem from "../../components/TransactionItem";
import TransactionModal from "../../components/TransactionModal";
import SvgIcons from "../../constants/SvgIcons";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [sortBy, setSortBy] = useState("date-desc");

  useEffect(() => {
    fetchTransactions();

    const channel = supabase
      .channel("transactions-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
        },
        (payload) => {
          console.log("Change received!", payload);

          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTransactions]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("User not authenticated:", userError);
        setTransactions([]);
        return;
      }

      // Fetch transactions for the current user
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching transactions:", error);
        setTransactions([]);
      } else {
        const transactionsData = data || [];
        setTransactions(transactionsData);
        const sorted = sortTransactions(transactionsData, sortBy);
        setFilteredTransactions(sorted);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
      setFilteredTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  const handleTransactionCreated = (newTransaction) => {
    // Refresh transactions list
    fetchTransactions();
  };

  const handleTransactionUpdated = (updatedTransaction) => {
    // Refresh transactions list
    fetchTransactions();
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setTransactionToDelete(null);
    setDeleteLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;

    try {
      setDeleteLoading(true);

      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transactionToDelete.id);

      if (error) {
        console.error("Error deleting transaction:", error);
        Alert.alert("Error", "Failed to delete transaction");
        return;
      }

      Alert.alert("Success", "Transaction deleted successfully!");

      // Refresh the transactions list
      fetchTransactions();

      // Close the delete modal
      handleCloseDeleteModal();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      Alert.alert("Error", "Failed to delete transaction");
    } finally {
      setDeleteLoading(false);
    }
  };

  const sortTransactions = (transactionsToSort, sortKey) => {
    const sorted = [...transactionsToSort].sort((a, b) => {
      switch (sortKey) {
        case "date-desc":
          return new Date(b.created_at) - new Date(a.created_at);
        case "date-asc":
          return new Date(a.created_at) - new Date(b.created_at);
        case "amount-desc":
          return parseFloat(b.amount) - parseFloat(a.amount);
        case "amount-asc":
          return parseFloat(a.amount) - parseFloat(b.amount);
        default:
          return 0;
      }
    });
    return sorted;
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    let filtered = transactions;

    if (query.trim() !== "") {
      filtered = transactions.filter(
        (transaction) =>
          transaction.title.toLowerCase().includes(query.toLowerCase()) ||
          transaction.description.toLowerCase().includes(query.toLowerCase()) ||
          transaction.type.toLowerCase().includes(query.toLowerCase())
      );
    }

    const sorted = sortTransactions(filtered, sortBy);
    setFilteredTransactions(sorted);
  };

  const handleSortSelect = (sortKey) => {
    setSortBy(sortKey);
    const sorted = sortTransactions(filteredTransactions, sortKey);
    setFilteredTransactions(sorted);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <MainHeader title="Transactions" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: "#fff", flex: 1 }}>
      <MainHeader title={"Transactions"} />
      <View style={styles.wrapper}>
        <View style={styles.header}>
          <Text style={styles.title}>All Transactions</Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => {
              setEditingTransaction(null);
              setShowModal(true);
            }}
          >
            <Text style={styles.createBtnText}>Create</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actions}>
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
          <TouchableOpacity
            style={styles.sortBtn}
            onPress={() => setShowSortDropdown(true)}
          >
            <SvgIcons name={"sort"} size={24} color={COLORS.black} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View
            style={{
              flex: 1,
              height: "100%",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="large" color={COLORS.secondary} />
          </View>
        ) : (
          <FlatList
            data={filteredTransactions}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            style={{ height: "66%" }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TransactionItem
                transaction={item}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
              />
            )}
            ListEmptyComponent={() => (
              <View style={{ alignItems: "center", marginTop: 50 }}>
                <Text
                  style={{ fontFamily: "poppins-regular", color: COLORS.black }}
                >
                  {searchQuery
                    ? "No transactions found matching your search"
                    : "No transactions found"}
                </Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Transaction Modal */}
      <TransactionModal
        visible={showModal}
        onClose={handleCloseModal}
        onTransactionCreated={handleTransactionCreated}
        onTransactionUpdated={handleTransactionUpdated}
        editingTransaction={editingTransaction}
      />

      {/* Delete Modal */}
      <DeleteModal
        visible={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        transaction={transactionToDelete}
        loading={deleteLoading}
      />

      {/* Sort Dropdown */}
      <SortDropdown
        visible={showSortDropdown}
        onClose={() => setShowSortDropdown(false)}
        onSortSelect={handleSortSelect}
        currentSort={sortBy}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  wrapper: {
    padding: 12,
  },
  header: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: "poppins-bold",
    fontSize: 24,
    color: COLORS.black,
  },
  createBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  createBtnText: {
    fontFamily: "poppins-regular",
    color: COLORS.white,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
    paddingVertical: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#888",
    borderRadius: 1000,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    elevation: 2,
  },
  input: {
    width: Dimensions.get("window").width * 0.65,
    fontFamily: "poppins-regular",
  },
  sortBtn: {
    backgroundColor: "#e9e9e9",
    height: 50,
    width: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 1000,
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
});
