import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config/theme';
import { Subcategory } from '@/types/inventory';
import { useSubcategories } from '@/hooks/useInventory';

interface SubcategoryPickerProps {
  selectedSubcategory?: string;
  onSubcategorySelect: (subcategoryCode: string) => void;
  categoryCode?: string;
  isLoading?: boolean;
  error?: string;
}

export function SubcategoryPicker({
  selectedSubcategory,
  onSubcategorySelect,
  categoryCode,
  isLoading: externalLoading = false,
  error,
}: SubcategoryPickerProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const {
    data: subcategories = [],
    isLoading: isLoadingSubcategories,
    error: subcategoriesError,
  } = useSubcategories(categoryCode);

  const isLoading = externalLoading || isLoadingSubcategories;
  const displayError = error || subcategoriesError?.message;

  const selectedSubcategoryData = subcategories.find(
    (sub) => sub.code === selectedSubcategory
  );

  const handleSubcategorySelect = (subcategoryCode: string) => {
    onSubcategorySelect(subcategoryCode);
    setIsModalVisible(false);
  };

  const renderSubcategoryItem = ({ item }: { item: Subcategory }) => (
    <TouchableOpacity
      style={[
        styles.subcategoryItem,
        selectedSubcategory === item.code && styles.selectedSubcategoryItem,
      ]}
      onPress={() => handleSubcategorySelect(item.code)}
    >
      <View style={styles.subcategoryInfo}>
        <Text
          style={[
            styles.subcategoryText,
            selectedSubcategory === item.code && styles.selectedSubcategoryText,
          ]}
        >
          {item.displayName}
        </Text>
        {item.description && (
          <Text style={styles.subcategoryDescription}>{item.description}</Text>
        )}
      </View>
      {selectedSubcategory === item.code && (
        <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="albums-outline" size={48} color={theme.colors.textSecondary} />
      <Text style={styles.emptyText}>
        {categoryCode
          ? 'No subcategories available for this category'
          : 'Select a category first to see subcategories'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.pickerButton,
          displayError && styles.pickerButtonError,
          !categoryCode && styles.pickerButtonDisabled,
        ]}
        onPress={() => setIsModalVisible(true)}
        disabled={isLoading || !categoryCode}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <>
            <Text
              style={[
                styles.pickerText,
                !selectedSubcategoryData && styles.placeholderText,
              ]}
            >
              {selectedSubcategoryData?.displayName || 
               (categoryCode ? 'Select a subcategory' : 'Select category first')}
            </Text>
            <Ionicons
              name="chevron-down"
              size={20}
              color={theme.colors.textSecondary}
            />
          </>
        )}
      </TouchableOpacity>

      {displayError && <Text style={styles.errorText}>{displayError}</Text>}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Subcategory</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <FlatList
              data={subcategories}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderSubcategoryItem}
              style={styles.subcategoryList}
              contentContainerStyle={
                subcategories.length === 0 ? styles.emptyListContainer : undefined
              }
              ListEmptyComponent={renderEmptyState}
              showsVerticalScrollIndicator={false}
            />
          )}
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
  pickerButtonDisabled: {
    opacity: 0.5,
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
  subcategoryList: {
    flex: 1,
    padding: theme.spacing.md,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  subcategoryItem: {
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
  selectedSubcategoryItem: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
  },
  subcategoryInfo: {
    flex: 1,
  },
  subcategoryText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    fontWeight: '500',
  },
  selectedSubcategoryText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  subcategoryDescription: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
});

