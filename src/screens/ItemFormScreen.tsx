import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { inventoryService } from '@/api/inventory.service';
import { RootStackParamList } from '@/navigation/types';
import { useInventoryItem, useCreateInventory, useUpdateInventory, useCategories, useMeasurementUnits, useSubcategories } from '@/hooks/useInventory';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorView } from '@/components/ErrorView';
import { CategoryPicker } from '@/components/CategoryPicker';
import { SubcategoryPicker } from '@/components/SubcategoryPicker';
import { WeightUnitPicker } from '@/components/WeightUnitPicker';
import { theme } from '@/config/theme';
import { handleApiError, showSuccessToast } from '@/utils/errorHandler';
import { inventoryItemSchema, InventoryItemFormData } from '@/utils/validation';
import { parseWeight, mapCategoryToCode, extractLabels } from '@/utils/upcMapping';
import { getResponsiveLayout } from '@/utils/layout';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ItemForm'>;
type RouteParams = RouteProp<RootStackParamList, 'ItemForm'>;

export default function ItemFormScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const { width } = useWindowDimensions();
  const responsiveLayout = getResponsiveLayout(width);
  const itemId = route.params?.itemId;
  const isEdit = !!itemId;

  // Local state for display values to handle partial input
  const [priceDisplay, setPriceDisplay] = useState('');
  const [stockDisplay, setStockDisplay] = useState('');
  const [taxRateDisplay, setTaxRateDisplay] = useState('6.625');
  const [caloriesDisplay, setCaloriesDisplay] = useState('');
  const [weightDisplay, setWeightDisplay] = useState('');
  const [popularityScoreDisplay, setPopularityScoreDisplay] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const { data: existingItem, isLoading: isLoadingItem } = useInventoryItem(itemId || '');
  const { data: categories, isLoading: isLoadingCategories, error: categoriesError } = useCategories();
  const { data: measurementUnits, isLoading: isLoadingUnits, error: unitsError } = useMeasurementUnits();
  const createMutation = useCreateInventory();
  const updateMutation = useUpdateInventory();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues,
    setError,
    watch,
  } = useForm<InventoryItemFormData>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      itemName: '',
      productCode: '',
      sku: '',
      price: 0,
      stockQuantity: 0,
      categories: '',
      subCategory: '',
      brand: '',
      modifiers: '',
      labels: '',
      taxRate: 6.625,
      taxEnabled: true,
      fees: '',
      description: '',
      imageUrl: '',
      calories: null,
      weight: null,
      weightUnit: '',
      popularityScore: null,
    },
  });

  // Watch category to load subcategories for AI enrichment
  const selectedCategory = watch('categories');
  const { data: subcategories } = useSubcategories(selectedCategory);

  useEffect(() => {
    if (existingItem) {
      reset({
        itemName: existingItem.itemName,
        productCode: existingItem.productCode,
        sku: existingItem.sku,
        price: existingItem.price,
        stockQuantity: existingItem.stockQuantity,
        categories: existingItem.categories || '',
        subCategory: existingItem.subCategory || '',
        brand: existingItem.brand || '',
        modifiers: existingItem.modifiers || '',
        labels: existingItem.labels || '',
        taxRate: existingItem.taxRate || 0,
        taxEnabled: existingItem.taxEnabled,
        fees: existingItem.fees || '',
        description: existingItem.description || '',
        imageUrl: existingItem.imageUrl || '',
        calories: existingItem.calories || null,
        weight: existingItem.weight || null,
        weightUnit: existingItem.weightUnit || '',
        popularityScore: existingItem.popularityScore || null,
      });
      
      // Initialize display values
      setPriceDisplay(existingItem.price === 0 ? '' : existingItem.price.toString());
      setStockDisplay(existingItem.stockQuantity === 0 ? '' : existingItem.stockQuantity.toString());
      setTaxRateDisplay((existingItem.taxRate || 0) === 0 ? '6.625' : (existingItem.taxRate || 0).toString());
      setCaloriesDisplay(existingItem.calories ? existingItem.calories.toString() : '');
      setWeightDisplay(existingItem.weight ? existingItem.weight.toString() : '');
      setPopularityScoreDisplay(existingItem.popularityScore ? existingItem.popularityScore.toString() : '');
    }
  }, [existingItem, reset]);

  useEffect(() => {
    const scannedBarcode = route.params?.scannedBarcode;
    if (scannedBarcode) {
      setValue('productCode', scannedBarcode, { shouldDirty: true, shouldTouch: true });
      setValue('sku', scannedBarcode, { shouldDirty: true, shouldTouch: true });
      navigation.setParams({ scannedBarcode: undefined });
    }
  }, [navigation, route.params?.scannedBarcode, setValue]);

  // Watch category changes and clear subcategory when category changes
  const prevCategoryRef = React.useRef<string | undefined>(selectedCategory);
  
  useEffect(() => {
    // Only clear subcategory if category actually changed (not on initial load)
    if (prevCategoryRef.current !== undefined && prevCategoryRef.current !== selectedCategory) {
      setValue('subCategory', '', { shouldDirty: true });
    }
    prevCategoryRef.current = selectedCategory;
  }, [selectedCategory, setValue]);

  const onSubmit = (data: InventoryItemFormData) => {
    const categoryDisplayName =
      categories?.find((category) => category.code === data.categories)?.displayName || data.categories;
    const subCategoryDisplayName =
      subcategories?.find((subcategory) => subcategory.code === data.subCategory)?.displayName ||
      data.subCategory;

    // Prepare the payload, omitting null values for calories and weight
    const payload = {
      ...data,
      categories: categoryDisplayName,
      subCategory: subCategoryDisplayName,
      calories: data.calories || undefined,
      weight: data.weight || undefined,
      weightUnit: data.weightUnit || undefined,
      popularityScore: data.popularityScore ?? undefined,
    };

    if (isEdit && itemId) {
      updateMutation.mutate(
        { id: itemId, data: payload },
        {
          onSuccess: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'InventoryList' }],
            });
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'InventoryList' }],
          });
        },
      });
    }
  };

  const openBarcodeScanner = () => {
    navigation.navigate('BarcodeScanner', {
      source: 'form',
      itemId,
    });
  };

  const handleAiAssist = async () => {
    const currentValues = getValues();
    const productCode = currentValues.productCode?.trim();

    // Validate required field
    if (!productCode) {
      setError('productCode', {
        type: 'manual',
        message: 'Product code (UPC) is required for AI enrichment',
      });
      Toast.show({
        type: 'error',
        text1: 'Product Code Required',
        text2: 'Please enter or scan a product code (UPC) before using AI assist',
      });
      return;
    }

    setIsAiLoading(true);
    try {
      // Call UPC Item DB API
      const response = await inventoryService.lookupUpcItem(productCode);

      // Check if we got results
      if (!response.items || response.items.length === 0) {
        Toast.show({
          type: 'error',
          text1: 'Product Not Found',
          text2: 'No product information found for this UPC code',
        });
        return;
      }

      const item = response.items[0];
      let fieldsPopulated = 0;

      // Map title to itemName
      if (item.title) {
        setValue('itemName', item.title, { shouldDirty: true });
        fieldsPopulated++;
      }

      // Map brand
      if (item.brand) {
        setValue('brand', item.brand, { shouldDirty: true });
        fieldsPopulated++;
      }

      // Map description
      if (item.description) {
        setValue('description', item.description, { shouldDirty: true });
        fieldsPopulated++;
      }

      // Map first image URL
      if (item.images && item.images.length > 0) {
        setValue('imageUrl', item.images[0], { shouldDirty: true });
        fieldsPopulated++;
      }

      // Map category (auto-select if match found)
      if (item.category && categories && categories.length > 0) {
        const matchedCategoryCode = mapCategoryToCode(item.category, categories);
        if (matchedCategoryCode) {
          setValue('categories', matchedCategoryCode, { shouldDirty: true });
          fieldsPopulated++;
        }
      }

      // Extract labels from description
      if (item.description) {
        const extractedLabels = extractLabels(item.description);
        if (extractedLabels) {
          setValue('labels', extractedLabels, { shouldDirty: true });
          fieldsPopulated++;
        }
      }

      // Show success message
      Toast.show({
        type: 'success',
        text1: 'Product Details Loaded',
        text2: `Successfully populated ${fieldsPopulated} field(s) from product database`,
        visibilityTime: 3000,
      });
    } catch (error) {
      // Error handling is done in the service, but we can show a more specific message
      if (error instanceof Error) {
        Toast.show({
          type: 'error',
          text1: 'Failed to Load Product',
          text2: error.message,
          visibilityTime: 4000,
        });
      } else {
        handleApiError(error);
      }
    } finally {
      setIsAiLoading(false);
    }
  };


  const isLoading = isLoadingItem || isLoadingCategories || isLoadingUnits || createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoadingItem) {
    return <LoadingSpinner text="Loading item..." />;
  }

  if (isEdit && !existingItem) {
    return <ErrorView error="Item not found" onRetry={() => navigation.navigate('InventoryList')} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.form,
            {
              paddingHorizontal: responsiveLayout.horizontalPadding,
            },
          ]}
        >
          <View style={[styles.formContent, { width: responsiveLayout.contentWidth }]}>
          <View style={styles.field}>
            <Text style={styles.label}>Item Name *</Text>
            <Controller
              control={control}
              name="itemName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.itemName && styles.inputError]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="Enter item name"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              )}
            />
            {errors.itemName && (
              <Text style={styles.errorText}>{errors.itemName.message}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Product Code *</Text>
            <View style={styles.inputWithButton}>
              <Controller
                control={control}
                name="productCode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, styles.inputWithButtonText, errors.productCode && styles.inputError]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="Enter product code"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                )}
              />
              <TouchableOpacity
                style={styles.scanButton}
                onPress={openBarcodeScanner}
                disabled={isLoading}
              >
                <Ionicons name="scan" size={20} color="#0b0b0b" />
              </TouchableOpacity>
            </View>
            {errors.productCode && (
              <Text style={styles.errorText}>{errors.productCode.message}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>SKU *</Text>
            <Controller
              control={control}
              name="sku"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.sku && styles.inputError]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="Enter SKU"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              )}
            />
            {errors.sku && (
              <Text style={styles.errorText}>{errors.sku.message}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Price *</Text>
            <Controller
              control={control}
              name="price"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.price && styles.inputError]}
                  onBlur={(e) => {
                    onBlur();
                    // Convert display value to number on blur
                    const num = parseFloat(priceDisplay);
                    onChange(isNaN(num) ? 0 : num);
                  }}
                  onChangeText={(text) => {
                    setPriceDisplay(text);
                    // Only update form value if it's a complete number
                    if (text === '') {
                      onChange(0);
                    } else if (!text.endsWith('.') && text !== '.') {
                      const num = parseFloat(text);
                      onChange(isNaN(num) ? 0 : num);
                    }
                  }}
                  value={priceDisplay}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              )}
            />
            {errors.price && (
              <Text style={styles.errorText}>{errors.price.message}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Stock Quantity *</Text>
            <Controller
              control={control}
              name="stockQuantity"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.stockQuantity && styles.inputError]}
                  onBlur={(e) => {
                    onBlur();
                    // Convert display value to number on blur
                    const num = parseInt(stockDisplay, 10);
                    onChange(isNaN(num) ? 0 : num);
                  }}
                  onChangeText={(text) => {
                    setStockDisplay(text);
                    // Only update form value if it's a complete number
                    if (text === '') {
                      onChange(0);
                    } else {
                      const num = parseInt(text, 10);
                      onChange(isNaN(num) ? 0 : num);
                    }
                  }}
                  value={stockDisplay}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              )}
            />
            {errors.stockQuantity && (
              <Text style={styles.errorText}>{errors.stockQuantity.message}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Category *</Text>
            <Controller
              control={control}
              name="categories"
              render={({ field: { onChange, value } }) => (
                <CategoryPicker
                  selectedCategory={value}
                  onCategorySelect={onChange}
                  categories={categories || []}
                  isLoading={isLoadingCategories}
                  error={categoriesError?.message}
                />
              )}
            />
            {errors.categories && (
              <Text style={styles.errorText}>{errors.categories.message}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Subcategory *</Text>
            <Controller
              control={control}
              name="subCategory"
              render={({ field: { onChange, value } }) => (
                <SubcategoryPicker
                  selectedSubcategory={value}
                  onSubcategorySelect={onChange}
                  categoryCode={selectedCategory}
                  isLoading={isLoadingCategories}
                />
              )}
            />
            {errors.subCategory && (
              <Text style={styles.errorText}>{errors.subCategory.message}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Brand *</Text>
            <Controller
              control={control}
              name="brand"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.brand && styles.inputError]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="Enter brand name"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              )}
            />
            {errors.brand && (
              <Text style={styles.errorText}>{errors.brand.message}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Modifiers</Text>
            <Controller
              control={control}
              name="modifiers"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="Enter modifiers"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              )}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Labels</Text>
            <Controller
              control={control}
              name="labels"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="Enter labels"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              )}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tax Rate (%)</Text>
            <Controller
              control={control}
              name="taxRate"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  onBlur={(e) => {
                    onBlur();
                    // Convert display value to number on blur
                    const num = parseFloat(taxRateDisplay);
                    onChange(isNaN(num) ? 0 : num);
                  }}
                  onChangeText={(text) => {
                    setTaxRateDisplay(text);
                    // Only update form value if it's a complete number
                    if (text === '') {
                      onChange(0);
                    } else if (!text.endsWith('.') && text !== '.') {
                      const num = parseFloat(text);
                      onChange(isNaN(num) ? 0 : num);
                    }
                  }}
                  value={taxRateDisplay}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              )}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tax Enabled</Text>
            <Controller
              control={control}
              name="taxEnabled"
              render={({ field: { onChange, value } }) => (
                <Switch
                  value={value}
                  onValueChange={onChange}
                  trackColor={{ false: 'rgba(11, 11, 11, 0.2)', true: '#0b0b0b' }}
                  thumbColor={value ? theme.colors.background : theme.colors.textSecondary}
                />
              )}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Fees</Text>
            <Controller
              control={control}
              name="fees"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="Enter fees"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              )}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="Enter description"
                  multiline
                  numberOfLines={4}
                  placeholderTextColor={theme.colors.textSecondary}
                />
              )}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Calories</Text>
            <Controller
              control={control}
              name="calories"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.calories && styles.inputError]}
                  onBlur={(e) => {
                    onBlur();
                    // Convert display value to number on blur
                    const num = parseInt(caloriesDisplay, 10);
                    onChange(isNaN(num) ? null : num);
                  }}
                  onChangeText={(text) => {
                    setCaloriesDisplay(text);
                    // Only update form value if it's a complete number
                    if (text === '') {
                      onChange(null);
                    } else {
                      const num = parseInt(text, 10);
                      onChange(isNaN(num) ? null : num);
                    }
                  }}
                  value={caloriesDisplay}
                  placeholder="Enter calories (optional)"
                  keyboardType="numeric"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              )}
            />
            {errors.calories && (
              <Text style={styles.errorText}>{errors.calories.message}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Weight</Text>
            <Controller
              control={control}
              name="weight"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.weight && styles.inputError]}
                  onBlur={(e) => {
                    onBlur();
                    // Convert display value to number on blur
                    const num = parseFloat(weightDisplay);
                    onChange(isNaN(num) ? null : num);
                  }}
                  onChangeText={(text) => {
                    setWeightDisplay(text);
                    // Only update form value if it's a complete number
                    if (text === '') {
                      onChange(null);
                    } else if (!text.endsWith('.') && text !== '.') {
                      const num = parseFloat(text);
                      onChange(isNaN(num) ? null : num);
                    }
                  }}
                  value={weightDisplay}
                  placeholder="Enter weight (optional)"
                  keyboardType="numeric"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              )}
            />
            {errors.weight && (
              <Text style={styles.errorText}>{errors.weight.message}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Weight Unit</Text>
            <Controller
              control={control}
              name="weightUnit"
              render={({ field: { onChange, value } }) => (
                <WeightUnitPicker
                  selectedUnit={value}
                  onUnitSelect={onChange}
                  units={measurementUnits || []}
                  isLoading={isLoadingUnits}
                  error={unitsError?.message}
                />
              )}
            />
            {errors.weightUnit && (
              <Text style={styles.errorText}>{errors.weightUnit.message}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Popularity Score</Text>
            <Controller
              control={control}
              name="popularityScore"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.popularityScore && styles.inputError]}
                  onBlur={(e) => {
                    onBlur();
                    const numValue = popularityScoreDisplay ? parseInt(popularityScoreDisplay, 10) : null;
                    if (numValue !== null && !isNaN(numValue)) {
                      setValue('popularityScore', numValue);
                    } else {
                      setValue('popularityScore', null);
                    }
                  }}
                  onChangeText={(text) => {
                    setPopularityScoreDisplay(text);
                  }}
                  value={popularityScoreDisplay}
                  placeholder="Enter popularity score (optional)"
                  keyboardType="numeric"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              )}
            />
            {errors.popularityScore && (
              <Text style={styles.errorText}>{errors.popularityScore.message}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Image URL</Text>
            <Controller
              control={control}
              name="imageUrl"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.imageUrl && styles.inputError]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="https://example.com/image.jpg"
                  keyboardType="url"
                  autoCapitalize="none"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              )}
            />
            {errors.imageUrl && (
              <Text style={styles.errorText}>{errors.imageUrl.message}</Text>
            )}
          </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingHorizontal: responsiveLayout.horizontalPadding }]}>
        <View style={[styles.footerContent, { width: responsiveLayout.contentWidth }]}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            <Text style={styles.submitText}>
              {isLoading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Floating AI Button */}
      <TouchableOpacity
        style={[styles.floatingAiButton, (isLoading || isAiLoading) && styles.floatingAiButtonDisabled]}
        onPress={handleAiAssist}
        disabled={isLoading || isAiLoading}
        activeOpacity={0.8}
      >
        {isAiLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Ionicons name="sparkles" size={24} color="white" />
        )}
      </TouchableOpacity>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  formContent: {
    maxWidth: '100%',
  },
  field: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.12)',
    borderRadius: 12,
    padding: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    backgroundColor: '#ffffff',
    color: '#0b0b0b',
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  footer: {
    paddingVertical: theme.spacing.md,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(11, 11, 11, 0.1)',
    alignItems: 'center',
  },
  footerContent: {
    maxWidth: '100%',
  },
  submitButton: {
    paddingVertical: theme.spacing.md,
    borderRadius: 12,
    backgroundColor: '#0b0b0b',
    alignItems: 'center',
  },
  submitText: {
    fontSize: theme.typography.body.fontSize,
    color: '#ffffff',
    fontWeight: '600',
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.12)',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  inputWithButtonText: {
    flex: 1,
    borderWidth: 0,
    margin: 0,
  },
  scanButton: {
    padding: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingAiButton: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0b0b0b',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  floatingAiButtonDisabled: {
    opacity: 0.6,
  },
});
