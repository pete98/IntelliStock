import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config/theme';
import { Category } from '@/types/inventory';

interface CategoryPickerProps {
  selectedCategory?: string;
  onCategorySelect: (categoryCode: string) => void;
  categories: Category[];
  isLoading?: boolean;
  error?: string;
}

export function CategoryPicker({
  selectedCategory,
  onCategorySelect,
  categories,
  isLoading = false,
  error,
}: CategoryPickerProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const selectedCategoryData = categories.find(
    (cat) => cat.code === selectedCategory
  );

  const handleCategorySelect = (categoryCode: string) => {
    onCategorySelect(categoryCode);
    setIsModalVisible(false);
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.code && styles.selectedCategoryItem,
      ]}
      onPress={() => handleCategorySelect(item.code)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item.code && styles.selectedCategoryText,
        ]}
      >
        {item.displayName}
      </Text>
      {selectedCategory === item.code && (
        <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.pickerButton,
          error && styles.pickerButtonError,
        ]}
        onPress={() => setIsModalVisible(true)}
        disabled={isLoading}
      >
        <Text
          style={[
            styles.pickerText,
            !selectedCategoryData && styles.placeholderText,
          ]}
        >
          {selectedCategoryData?.displayName || 'Select a category'}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={categories}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCategoryItem}
            style={styles.categoryList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  pickerButtonError: {
    borderColor: theme.colors.error,
  },
  pickerText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    flex: 1,
  },
  placeholderText: {
    color: theme.colors.textSecondary,
  },
  errorText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  modalTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  categoryList: {
    flex: 1,
    padding: theme.spacing.md,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedCategoryItem: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
  },
  categoryText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    flex: 1,
  },
  selectedCategoryText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
