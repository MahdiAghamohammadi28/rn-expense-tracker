import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import SvgIcons from "../constants/SvgIcons";
import { COLORS } from "../constants/theme";

const SortDropdown = ({ visible, onClose, onSortSelect, currentSort }) => {
  const sortOptions = [
    { key: "date-desc", label: "Date (Newest First)", icon: "calendar" },
    { key: "date-asc", label: "Date (Oldest First)", icon: "calendar" },
    { key: "amount-desc", label: "Amount (Highest First)", icon: "arrow-up" },
    { key: "amount-asc", label: "Amount (Lowest First)", icon: "arrow-down" },
  ];

  const handleSortSelect = (sortKey) => {
    onSortSelect(sortKey);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.dropdownContainer}>
          <View style={styles.dropdown}>
            <View style={styles.header}>
              <Text style={styles.headerText}>Sort By</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <SvgIcons name="close" size={20} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.option,
                  currentSort === option.key && styles.selectedOption,
                ]}
                onPress={() => handleSortSelect(option.key)}
              >
                <View style={styles.optionContent}>
                  <SvgIcons
                    name={option.icon}
                    size={20}
                    color={
                      currentSort === option.key
                        ? COLORS.secondary
                        : COLORS.black
                    }
                  />
                  <Text
                    style={[
                      styles.optionText,
                      currentSort === option.key && styles.selectedText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
                {currentSort === option.key && (
                  <SvgIcons
                    name="check"
                    size={20}
                    color={COLORS.secondary}
                    stroke={2}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownContainer: {
    width: "80%",
    maxWidth: 300,
  },
  dropdown: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerText: {
    fontFamily: "poppins-bold",
    fontSize: 16,
    color: COLORS.black,
  },
  closeBtn: {
    padding: 4,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionText: {
    fontFamily: "poppins-regular",
    fontSize: 14,
    color: COLORS.black,
    marginLeft: 12,
  },
  selectedText: {
    color: COLORS.secondary,
    fontFamily: "poppins-medium",
  },
});

export default SortDropdown;
