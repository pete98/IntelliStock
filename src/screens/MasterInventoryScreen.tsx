import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { inventoryService } from '@/api/inventory.service';
import { ErrorView } from '@/components/ErrorView';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { theme } from '@/config/theme';
import {
  inventoryKeys,
  useBrands,
  useCategories,
  useSelectedStoreProfile,
} from '@/hooks/useInventory';
import { RootStackParamList } from '@/navigation/types';
import { MasterInventoryItem, MasterSelectionDraft } from '@/types/inventory';
import { handleApiError } from '@/utils/errorHandler';

type ViewMode = 'categories' | 'brands';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MasterInventory'>;

interface GroupedItems {
  key: string;
  displayName: string;
  items: MasterInventoryItem[];
}

function createSelectionDraft(item: MasterInventoryItem): MasterSelectionDraft {
  return {
    inventoryItemId: item.id,
    itemName: item.itemName,
    productName: item.productName,
    sku: item.sku,
    brandName: item.brandName,
    categoryDisplayName: item.categoryDisplayName,
    subCategoryDisplayName: item.subCategoryDisplayName,
    description: item.description,
    imageUrl: item.imageUrl,
    price: '',
    stockQuantity: '',
    taxEnabled: true,
    active: true,
    seasonal: false,
    discontinued: false,
  };
}

function matchesSearchQuery(item: MasterInventoryItem, searchQuery: string): boolean {
  if (!searchQuery.trim()) return true;
  const query = searchQuery.trim().toLowerCase();

  return (
    item.itemName.toLowerCase().includes(query) ||
    item.sku.toLowerCase().includes(query) ||
    (item.productName ?? '').toLowerCase().includes(query) ||
    (item.brandName ?? '').toLowerCase().includes(query) ||
    (item.categoryDisplayName ?? '').toLowerCase().includes(query) ||
    (item.subCategoryDisplayName ?? '').toLowerCase().includes(query)
  );
}

function groupBySubcategory(items: MasterInventoryItem[]): GroupedItems[] {
  const groupedMap = new Map<string, GroupedItems>();

  items.forEach((item) => {
    const key = item.subCategoryCode ?? item.subCategoryDisplayName ?? 'OTHER';
    const displayName = item.subCategoryDisplayName ?? 'Other';

    const existingGroup = groupedMap.get(key);
    if (existingGroup) {
      existingGroup.items.push(item);
      return;
    }

    groupedMap.set(key, {
      key,
      displayName,
      items: [item],
    });
  });

  return Array.from(groupedMap.values()).sort((leftGroup, rightGroup) =>
    leftGroup.displayName.localeCompare(rightGroup.displayName)
  );
}

function groupByCategory(items: MasterInventoryItem[]): GroupedItems[] {
  const groupedMap = new Map<string, GroupedItems>();

  items.forEach((item) => {
    const key = item.categoryCode ?? item.categoryDisplayName ?? 'OTHER';
    const displayName = item.categoryDisplayName ?? 'Other';

    const existingGroup = groupedMap.get(key);
    if (existingGroup) {
      existingGroup.items.push(item);
      return;
    }

    groupedMap.set(key, {
      key,
      displayName,
      items: [item],
    });
  });

  return Array.from(groupedMap.values()).sort((leftGroup, rightGroup) =>
    leftGroup.displayName.localeCompare(rightGroup.displayName)
  );
}

function isNonNegativeDecimal(value: string): boolean {
  if (!value.trim()) return false;
  const parsedValue = Number(value);
  return !Number.isNaN(parsedValue) && parsedValue >= 0;
}

function isNonNegativeInteger(value: string): boolean {
  if (!value.trim()) return false;
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue >= 0;
}

export function MasterInventoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 920;

  const [activeView, setActiveView] = useState<ViewMode>('categories');
  const [searchQuery, setSearchQuery] = useState('');

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedSubcategories, setExpandedSubcategories] = useState<Record<string, boolean>>({});
  const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>({});

  const [categoryItemsByCode, setCategoryItemsByCode] = useState<Record<string, MasterInventoryItem[]>>({});
  const [brandItemsByName, setBrandItemsByName] = useState<Record<string, MasterInventoryItem[]>>({});

  const [loadingCategoryCodes, setLoadingCategoryCodes] = useState<Record<string, boolean>>({});
  const [loadingBrandNames, setLoadingBrandNames] = useState<Record<string, boolean>>({});

  const [selectionState, setSelectionState] = useState<Record<number, MasterSelectionDraft>>({});

  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkQuantity, setBulkQuantity] = useState('');
  const [bulkTaxEnabled, setBulkTaxEnabled] = useState(true);

  const {
    data: selectedStoreProfile,
    isLoading: isLoadingStoreProfile,
    error: storeProfileError,
    refetch: refetchStoreProfile,
  } = useSelectedStoreProfile();

  const categoryFilters = useMemo(
    () => ({
      storeType: selectedStoreProfile?.storeType,
      storeEthnicity: selectedStoreProfile?.storeEthnicity,
    }),
    [selectedStoreProfile?.storeEthnicity, selectedStoreProfile?.storeType]
  );

  const {
    data: categories = [],
    isLoading: isLoadingCategories,
    error: categoriesError,
    refetch: refetchCategories,
  } = useCategories(categoryFilters, Boolean(selectedStoreProfile));

  const {
    data: brands = [],
    isLoading: isLoadingBrands,
    error: brandsError,
    refetch: refetchBrands,
  } = useBrands();

  const selectedItems = useMemo(
    () =>
      Object.values(selectionState).sort((leftItem, rightItem) =>
        leftItem.itemName.localeCompare(rightItem.itemName)
      ),
    [selectionState]
  );

  function setItemSelection(item: MasterInventoryItem, shouldSelect: boolean) {
    setSelectionState((previousState) => {
      if (!shouldSelect) {
        const nextState = { ...previousState };
        delete nextState[item.id];
        return nextState;
      }

      return {
        ...previousState,
        [item.id]: previousState[item.id] ?? createSelectionDraft(item),
      };
    });
  }

  function applySelectionToGroup(items: MasterInventoryItem[], shouldSelect: boolean) {
    setSelectionState((previousState) => {
      const nextState = { ...previousState };

      items.forEach((item) => {
        if (shouldSelect) {
          nextState[item.id] = nextState[item.id] ?? createSelectionDraft(item);
          return;
        }

        delete nextState[item.id];
      });

      return nextState;
    });
  }

  function toggleItemSelection(item: MasterInventoryItem) {
    const isSelected = Boolean(selectionState[item.id]);
    setItemSelection(item, !isSelected);
  }

  function updateSelectedItem(
    inventoryItemId: number,
    field: keyof Pick<MasterSelectionDraft, 'price' | 'stockQuantity' | 'taxEnabled'>,
    value: string | boolean
  ) {
    setSelectionState((previousState) => {
      const selectedItem = previousState[inventoryItemId];
      if (!selectedItem) return previousState;

      return {
        ...previousState,
        [inventoryItemId]: {
          ...selectedItem,
          [field]: value,
        },
      };
    });
  }

  function removeSelectedItem(inventoryItemId: number) {
    setSelectionState((previousState) => {
      const nextState = { ...previousState };
      delete nextState[inventoryItemId];
      return nextState;
    });
  }

  function applyBulkValues() {
    if (selectedItems.length === 0) {
      Toast.show({
        type: 'info',
        text1: 'No items selected',
        text2: 'Select at least one item before applying bulk values.',
      });
      return;
    }

    if (bulkPrice.trim() && !isNonNegativeDecimal(bulkPrice)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid bulk price',
        text2: 'Enter a valid non-negative price.',
      });
      return;
    }

    if (bulkQuantity.trim() && !isNonNegativeInteger(bulkQuantity)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid bulk quantity',
        text2: 'Enter a valid non-negative integer quantity.',
      });
      return;
    }

    setSelectionState((previousState) => {
      const nextState = { ...previousState };

      Object.entries(nextState).forEach(([key, selectedItem]) => {
        nextState[Number(key)] = {
          ...selectedItem,
          price: bulkPrice.trim() ? bulkPrice.trim() : selectedItem.price,
          stockQuantity: bulkQuantity.trim() ? bulkQuantity.trim() : selectedItem.stockQuantity,
          taxEnabled: bulkTaxEnabled,
        };
      });

      return nextState;
    });

    Toast.show({
      type: 'success',
      text1: 'Bulk values applied',
      text2: `Updated ${selectedItems.length} selected items.`,
    });
  }

  async function toggleCategoryExpansion(categoryCode: string) {
    const nextExpandedValue = !expandedCategories[categoryCode];
    setExpandedCategories((previousState) => ({
      ...previousState,
      [categoryCode]: nextExpandedValue,
    }));

    if (!nextExpandedValue || categoryItemsByCode[categoryCode] || loadingCategoryCodes[categoryCode]) return;

    setLoadingCategoryCodes((previousState) => ({
      ...previousState,
      [categoryCode]: true,
    }));

    try {
      const items = await queryClient.fetchQuery({
        queryKey: inventoryKeys.masterCategory(categoryCode),
        queryFn: () => inventoryService.getMasterInventoryByCategory(categoryCode),
      });

      setCategoryItemsByCode((previousState) => ({
        ...previousState,
        [categoryCode]: items,
      }));
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoadingCategoryCodes((previousState) => ({
        ...previousState,
        [categoryCode]: false,
      }));
    }
  }

  function toggleSubcategoryExpansion(groupKey: string) {
    setExpandedSubcategories((previousState) => ({
      ...previousState,
      [groupKey]: !previousState[groupKey],
    }));
  }

  async function toggleBrandExpansion(brandName: string) {
    const nextExpandedValue = !expandedBrands[brandName];
    setExpandedBrands((previousState) => ({
      ...previousState,
      [brandName]: nextExpandedValue,
    }));

    if (!nextExpandedValue || brandItemsByName[brandName] || loadingBrandNames[brandName]) return;

    setLoadingBrandNames((previousState) => ({
      ...previousState,
      [brandName]: true,
    }));

    try {
      const items = await queryClient.fetchQuery({
        queryKey: inventoryKeys.masterBrand(brandName),
        queryFn: () => inventoryService.getMasterInventoryByBrand(brandName),
      });

      setBrandItemsByName((previousState) => ({
        ...previousState,
        [brandName]: items,
      }));
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoadingBrandNames((previousState) => ({
        ...previousState,
        [brandName]: false,
      }));
    }
  }

  function handleContinueToReview() {
    if (selectedItems.length === 0) {
      Toast.show({
        type: 'info',
        text1: 'Select at least one item',
        text2: 'Choose products and enter price/quantity before continuing.',
      });
      return;
    }

    const invalidItem = selectedItems.find(
      (selectedItem) =>
        !isNonNegativeDecimal(selectedItem.price) || !isNonNegativeInteger(selectedItem.stockQuantity)
    );

    if (invalidItem) {
      Toast.show({
        type: 'error',
        text1: 'Price and quantity required',
        text2: `Fix ${invalidItem.itemName}: price must be non-negative and quantity must be a whole number.`,
      });
      return;
    }

    navigation.navigate('MasterInventoryReview', { selectedItems });
  }

  function renderItemRow(item: MasterInventoryItem) {
    const isSelected = Boolean(selectionState[item.id]);

    return (
      <View key={item.id} style={styles.itemRow}>
        <View style={styles.itemBody}>
          <Text style={styles.itemName}>{item.itemName}</Text>
          <Text style={styles.itemMeta}>
            {item.sku} {item.brandName ? `• ${item.brandName}` : ''}
          </Text>
        </View>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel={`Select ${item.itemName}`}
          onPress={() => toggleItemSelection(item)}
          style={[styles.checkbox, isSelected && styles.checkboxSelected]}
        >
          {isSelected ? <Ionicons name="checkmark" size={14} color="#ffffff" /> : null}
        </Pressable>
      </View>
    );
  }

  function renderCategoriesPane() {
    if (isLoadingCategories) {
      return <LoadingSpinner text="Loading categories..." size="small" />;
    }

    if (categoriesError) {
      return <ErrorView error={categoriesError} onRetry={() => refetchCategories()} />;
    }

    return (
      <View style={styles.listStack}>
        {categories.map((category) => {
          const isExpanded = Boolean(expandedCategories[category.code]);
          const items = categoryItemsByCode[category.code] ?? [];
          const isLoadingItems = Boolean(loadingCategoryCodes[category.code]);
          const visibleItems = items.filter((item) => matchesSearchQuery(item, searchQuery));
          const groupedSubcategories = groupBySubcategory(visibleItems);
          const hasVisibleItems = visibleItems.length > 0;
          const allVisibleSelected =
            hasVisibleItems && visibleItems.every((item) => Boolean(selectionState[item.id]));

          return (
            <View key={category.code} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <Pressable
                  style={styles.groupTitleButton}
                  onPress={() => toggleCategoryExpansion(category.code)}
                  accessibilityRole="button"
                  accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} ${category.displayName}`}
                >
                  <Ionicons
                    name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                    size={16}
                    color="#0b0b0b"
                  />
                  <Text style={styles.groupTitle}>{category.displayName}</Text>
                </Pressable>

                {isExpanded && hasVisibleItems ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => applySelectionToGroup(visibleItems, !allVisibleSelected)}
                    style={styles.groupAction}
                  >
                    <Text style={styles.groupActionText}>
                      {allVisibleSelected ? 'Clear all' : 'Select all'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {isExpanded ? (
                <View style={styles.groupContent}>
                  {isLoadingItems ? <LoadingSpinner text="Loading items..." size="small" /> : null}

                  {!isLoadingItems && items.length === 0 ? (
                    <Text style={styles.inlineHint}>No master items found in this category.</Text>
                  ) : null}

                  {!isLoadingItems && items.length > 0 && groupedSubcategories.length === 0 ? (
                    <Text style={styles.inlineHint}>No items match your search.</Text>
                  ) : null}

                  {!isLoadingItems
                    ? groupedSubcategories.map((group) => {
                        const subgroupKey = `${category.code}:${group.key}`;
                        const isSubgroupExpanded =
                          expandedSubcategories[subgroupKey] === undefined
                            ? true
                            : Boolean(expandedSubcategories[subgroupKey]);
                        const subgroupAllSelected =
                          group.items.length > 0 &&
                          group.items.every((entry) => Boolean(selectionState[entry.id]));

                        return (
                          <View key={subgroupKey} style={styles.subgroupCard}>
                            <View style={styles.subgroupHeader}>
                              <Pressable
                                style={styles.subgroupTitleButton}
                                onPress={() => toggleSubcategoryExpansion(subgroupKey)}
                                accessibilityRole="button"
                                accessibilityLabel={`${
                                  isSubgroupExpanded ? 'Collapse' : 'Expand'
                                } ${group.displayName}`}
                              >
                                <Ionicons
                                  name={isSubgroupExpanded ? 'chevron-down' : 'chevron-forward'}
                                  size={14}
                                  color="rgba(11, 11, 11, 0.75)"
                                />
                                <Text style={styles.subgroupTitle}>{group.displayName}</Text>
                                <Text style={styles.subgroupCount}>({group.items.length})</Text>
                              </Pressable>

                              <Pressable
                                accessibilityRole="button"
                                onPress={() =>
                                  applySelectionToGroup(group.items, !subgroupAllSelected)
                                }
                                style={styles.groupAction}
                              >
                                <Text style={styles.groupActionText}>
                                  {subgroupAllSelected ? 'Clear' : 'Select'}
                                </Text>
                              </Pressable>
                            </View>

                            {isSubgroupExpanded ? (
                              <View style={styles.itemsStack}>{group.items.map((item) => renderItemRow(item))}</View>
                            ) : null}
                          </View>
                        );
                      })
                    : null}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    );
  }

  function renderBrandsPane() {
    if (isLoadingBrands) {
      return <LoadingSpinner text="Loading brands..." size="small" />;
    }

    if (brandsError) {
      return <ErrorView error={brandsError} onRetry={() => refetchBrands()} />;
    }

    return (
      <View style={styles.listStack}>
        {brands.map((brand) => {
          const isExpanded = Boolean(expandedBrands[brand.name]);
          const items = brandItemsByName[brand.name] ?? [];
          const isLoadingItems = Boolean(loadingBrandNames[brand.name]);
          const visibleItems = items.filter((item) => matchesSearchQuery(item, searchQuery));
          const groupedByCategory = groupByCategory(visibleItems);
          const hasVisibleItems = visibleItems.length > 0;
          const allVisibleSelected =
            hasVisibleItems && visibleItems.every((item) => Boolean(selectionState[item.id]));

          return (
            <View key={brand.id} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <Pressable
                  style={styles.groupTitleButton}
                  onPress={() => toggleBrandExpansion(brand.name)}
                  accessibilityRole="button"
                  accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} ${brand.name}`}
                >
                  <Ionicons
                    name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                    size={16}
                    color="#0b0b0b"
                  />
                  <Text style={styles.groupTitle}>{brand.name}</Text>
                </Pressable>

                {isExpanded && hasVisibleItems ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => applySelectionToGroup(visibleItems, !allVisibleSelected)}
                    style={styles.groupAction}
                  >
                    <Text style={styles.groupActionText}>
                      {allVisibleSelected ? 'Clear all' : 'Select all'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {isExpanded ? (
                <View style={styles.groupContent}>
                  {isLoadingItems ? <LoadingSpinner text="Loading items..." size="small" /> : null}

                  {!isLoadingItems && items.length === 0 ? (
                    <Text style={styles.inlineHint}>No master items found for this brand.</Text>
                  ) : null}

                  {!isLoadingItems && items.length > 0 && groupedByCategory.length === 0 ? (
                    <Text style={styles.inlineHint}>No items match your search.</Text>
                  ) : null}

                  {!isLoadingItems
                    ? groupedByCategory.map((group) => {
                        const allCategoryItemsSelected =
                          group.items.length > 0 &&
                          group.items.every((entry) => Boolean(selectionState[entry.id]));

                        return (
                          <View key={`${brand.name}:${group.key}`} style={styles.subgroupCard}>
                            <View style={styles.subgroupHeader}>
                              <Text style={styles.subgroupTitle}>{group.displayName}</Text>
                              <Pressable
                                accessibilityRole="button"
                                onPress={() =>
                                  applySelectionToGroup(group.items, !allCategoryItemsSelected)
                                }
                                style={styles.groupAction}
                              >
                                <Text style={styles.groupActionText}>
                                  {allCategoryItemsSelected ? 'Clear' : 'Select'}
                                </Text>
                              </Pressable>
                            </View>

                            <View style={styles.itemsStack}>{group.items.map((item) => renderItemRow(item))}</View>
                          </View>
                        );
                      })
                    : null}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    );
  }

  if (isLoadingStoreProfile) {
    return <LoadingSpinner text="Loading store profile..." />;
  }

  if (storeProfileError) {
    return <ErrorView error={storeProfileError} onRetry={() => refetchStoreProfile()} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Master Inventory</Text>
          <Text style={styles.subtitle}>Browse by category or brand and add products in bulk.</Text>
          <View style={styles.metaRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{selectedStoreProfile?.storeEthnicity ?? 'UNSPECIFIED'}</Text>
            </View>
            <Text style={styles.metaText}>{selectedStoreProfile?.displayName}</Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color="#0b0b0b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, SKU, category, or brand"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="rgba(11, 11, 11, 0.45)"
          />
        </View>

        <View style={styles.viewToggleRow}>
          <Pressable
            onPress={() => setActiveView('categories')}
            style={[styles.toggleButton, activeView === 'categories' && styles.toggleButtonActive]}
            accessibilityRole="button"
            accessibilityLabel="Switch to categories view"
          >
            <Text style={[styles.toggleButtonText, activeView === 'categories' && styles.toggleButtonTextActive]}>
              Categories
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveView('brands')}
            style={[styles.toggleButton, activeView === 'brands' && styles.toggleButtonActive]}
            accessibilityRole="button"
            accessibilityLabel="Switch to brands view"
          >
            <Text style={[styles.toggleButtonText, activeView === 'brands' && styles.toggleButtonTextActive]}>
              Brands
            </Text>
          </Pressable>
        </View>

        <View style={[styles.panesRow, isWideLayout && styles.panesRowWide]}>
          <View style={[styles.catalogPane, isWideLayout && styles.catalogPaneWide]}>
            <Text style={styles.sectionLabel}>Catalog</Text>
            {activeView === 'categories' ? renderCategoriesPane() : renderBrandsPane()}
          </View>

          <View style={[styles.selectedPane, isWideLayout && styles.selectedPaneWide]}>
            <Text style={styles.sectionLabel}>Selected</Text>
            <Text style={styles.selectedSummary}>{selectedItems.length} selected</Text>

            <View style={styles.bulkCard}>
              <Text style={styles.bulkTitle}>Bulk Apply</Text>
              <View style={styles.bulkInputRow}>
                <View style={styles.bulkInputGroup}>
                  <Text style={styles.bulkLabel}>Price</Text>
                  <TextInput
                    style={styles.inlineInput}
                    value={bulkPrice}
                    onChangeText={setBulkPrice}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 2.99"
                    placeholderTextColor="rgba(11, 11, 11, 0.4)"
                  />
                </View>
                <View style={styles.bulkInputGroup}>
                  <Text style={styles.bulkLabel}>Qty</Text>
                  <TextInput
                    style={styles.inlineInput}
                    value={bulkQuantity}
                    onChangeText={setBulkQuantity}
                    keyboardType="number-pad"
                    placeholder="e.g. 20"
                    placeholderTextColor="rgba(11, 11, 11, 0.4)"
                  />
                </View>
              </View>

              <View style={styles.bulkTaxRow}>
                <Text style={styles.bulkLabel}>Tax enabled</Text>
                <Switch
                  value={bulkTaxEnabled}
                  onValueChange={setBulkTaxEnabled}
                  trackColor={{ false: 'rgba(11, 11, 11, 0.2)', true: '#0b0b0b' }}
                  thumbColor="#ffffff"
                />
              </View>

              <Pressable onPress={applyBulkValues} style={styles.bulkApplyButton} accessibilityRole="button">
                <Text style={styles.bulkApplyButtonText}>Apply to selected</Text>
              </Pressable>
            </View>

            {selectedItems.length === 0 ? (
              <View style={styles.emptySelectedCard}>
                <Text style={styles.emptySelectedTitle}>No items selected</Text>
                <Text style={styles.emptySelectedSubtitle}>
                  Select products from the catalog and set price/quantity.
                </Text>
              </View>
            ) : (
              <View style={styles.listStack}>
                {selectedItems.map((selectedItem) => (
                  <View key={selectedItem.inventoryItemId} style={styles.selectedItemCard}>
                    <View style={styles.selectedItemHeader}>
                      <View style={styles.itemBody}>
                        <Text style={styles.itemName}>{selectedItem.itemName}</Text>
                        <Text style={styles.itemMeta}>{selectedItem.sku}</Text>
                      </View>
                      <Pressable
                        onPress={() => removeSelectedItem(selectedItem.inventoryItemId)}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${selectedItem.itemName}`}
                        style={styles.removeButton}
                      >
                        <Ionicons name="close" size={16} color="#0b0b0b" />
                      </Pressable>
                    </View>

                    <View style={styles.inputRow}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.bulkLabel}>Price</Text>
                        <TextInput
                          style={styles.inlineInput}
                          value={selectedItem.price}
                          onChangeText={(value) =>
                            updateSelectedItem(selectedItem.inventoryItemId, 'price', value)
                          }
                          keyboardType="decimal-pad"
                          placeholder="0.00"
                          placeholderTextColor="rgba(11, 11, 11, 0.4)"
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.bulkLabel}>Qty</Text>
                        <TextInput
                          style={styles.inlineInput}
                          value={selectedItem.stockQuantity}
                          onChangeText={(value) =>
                            updateSelectedItem(selectedItem.inventoryItemId, 'stockQuantity', value)
                          }
                          keyboardType="number-pad"
                          placeholder="0"
                          placeholderTextColor="rgba(11, 11, 11, 0.4)"
                        />
                      </View>
                    </View>

                    <View style={styles.bulkTaxRow}>
                      <Text style={styles.bulkLabel}>Tax enabled</Text>
                      <Switch
                        value={selectedItem.taxEnabled}
                        onValueChange={(value) =>
                          updateSelectedItem(selectedItem.inventoryItemId, 'taxEnabled', value)
                        }
                        trackColor={{ false: 'rgba(11, 11, 11, 0.2)', true: '#0b0b0b' }}
                        thumbColor="#ffffff"
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              onPress={handleContinueToReview}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Review Selected</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0b0b0b',
  },
  subtitle: {
    marginTop: 6,
    fontSize: theme.typography.body.fontSize,
    color: 'rgba(11, 11, 11, 0.72)',
  },
  metaRow: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#0b0b0b',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metaText: {
    fontSize: 12,
    color: 'rgba(11, 11, 11, 0.6)',
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.12)',
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: '#ffffff',
    marginBottom: theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: 15,
    color: '#0b0b0b',
    paddingVertical: 12,
  },
  viewToggleRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.12)',
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  toggleButtonActive: {
    backgroundColor: '#0b0b0b',
  },
  toggleButtonText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#0b0b0b',
  },
  toggleButtonTextActive: {
    color: '#ffffff',
  },
  panesRow: {
    flexDirection: 'column',
  },
  panesRowWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  catalogPane: {
    width: '100%',
  },
  catalogPaneWide: {
    flex: 1,
    marginRight: theme.spacing.lg,
  },
  selectedPane: {
    width: '100%',
    marginTop: theme.spacing.lg,
  },
  selectedPaneWide: {
    flex: 1,
    marginTop: 0,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: 'rgba(11, 11, 11, 0.6)',
    marginBottom: theme.spacing.sm,
  },
  selectedSummary: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(11, 11, 11, 0.6)',
    marginBottom: theme.spacing.sm,
  },
  listStack: {
    gap: theme.spacing.md,
  },
  groupCard: {
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.08)',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: '#ffffff',
    ...theme.shadows.sm,
  },
  groupHeader: {
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  groupTitleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0b0b0b',
  },
  groupAction: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.16)',
    borderRadius: 999,
  },
  groupActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0b0b0b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  groupContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  inlineHint: {
    fontSize: 12,
    color: 'rgba(11, 11, 11, 0.58)',
    fontStyle: 'italic',
  },
  subgroupCard: {
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.06)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    backgroundColor: '#fafafa',
  },
  subgroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  subgroupTitleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  subgroupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0b0b0b',
  },
  subgroupCount: {
    fontSize: 12,
    color: 'rgba(11, 11, 11, 0.55)',
  },
  itemsStack: {
    gap: theme.spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.08)',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  itemBody: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0b0b0b',
  },
  itemMeta: {
    marginTop: 2,
    fontSize: 12,
    color: 'rgba(11, 11, 11, 0.6)',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxSelected: {
    backgroundColor: '#0b0b0b',
    borderColor: '#0b0b0b',
  },
  bulkCard: {
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.08)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    backgroundColor: '#ffffff',
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  bulkTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0b0b0b',
    marginBottom: theme.spacing.sm,
  },
  bulkInputRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  bulkInputGroup: {
    flex: 1,
  },
  bulkLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(11, 11, 11, 0.6)',
    marginBottom: 6,
  },
  bulkTaxRow: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bulkApplyButton: {
    marginTop: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.18)',
    paddingVertical: 10,
  },
  bulkApplyButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0b0b0b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  emptySelectedCard: {
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.08)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: '#ffffff',
    ...theme.shadows.sm,
  },
  emptySelectedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0b0b0b',
  },
  emptySelectedSubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: 'rgba(11, 11, 11, 0.6)',
  },
  selectedItemCard: {
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.08)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    backgroundColor: '#ffffff',
    ...theme.shadows.sm,
  },
  selectedItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  removeButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  inputGroup: {
    flex: 1,
  },
  inlineInput: {
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.12)',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0b0b0b',
    backgroundColor: '#ffffff',
  },
  primaryButton: {
    marginTop: theme.spacing.lg,
    backgroundColor: '#0b0b0b',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
