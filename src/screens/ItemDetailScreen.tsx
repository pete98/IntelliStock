import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';

import { RootStackParamList } from '@/navigation/types';
import { useInventoryItem, useDeleteInventory, useToggleTax, useStockOperations } from '@/hooks/useInventory';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorView } from '@/components/ErrorView';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Badge } from '@/components/Badge';
import { formatCurrency, formatStock, getStockBadgeColor } from '@/utils/format';
import { getResponsiveLayout } from '@/utils/layout';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ItemDetail'>;
type ItemDetailRouteProp = RouteProp<RootStackParamList, 'ItemDetail'>;

export default function ItemDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ItemDetailRouteProp>();
  const { width } = useWindowDimensions();
  const responsiveLayout = getResponsiveLayout(width);
  const { itemId } = route.params;

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockQuantity, setStockQuantity] = useState('');
  const [stockOperation, setStockOperation] = useState<'add' | 'reduce'>('add');

  const { data: item, isLoading, error } = useInventoryItem(itemId);
  const deleteMutation = useDeleteInventory();
  const toggleTaxMutation = useToggleTax();
  const stockMutation = useStockOperations();

  function handleEdit() {
    navigation.navigate('ItemForm', { itemId });
  }

  function handleDelete() {
    setShowDeleteDialog(true);
  }

  function confirmDelete() {
    deleteMutation.mutate(itemId, {
      onSuccess: () => {
        navigation.navigate('InventoryList');
      },
    });
    setShowDeleteDialog(false);
  }

  function handleToggleTax() {
    if (!item) return;

    toggleTaxMutation.mutate({
      id: itemId,
      enabled: !item.taxEnabled,
    });
  }

  function handleStockOperation(operation: 'add' | 'reduce') {
    setStockOperation(operation);
    setStockQuantity('');
    setShowStockModal(true);
  }

  function confirmStockOperation() {
    const quantity = parseInt(stockQuantity, 10);
    if (Number.isNaN(quantity) || quantity <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid positive number');
      return;
    }

    stockMutation.mutate({
      id: itemId,
      operation: stockOperation,
      quantity,
    });
    setShowStockModal(false);
  }

  if (isLoading && !item) return <LoadingSpinner text="Loading item details..." />;
  if ((error || !item) && !item) return <ErrorView error={error} onRetry={() => {}} />;

  const stockColor = getStockBadgeColor(item.stockQuantity);
  const stockText = formatStock(item.stockQuantity);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        alignItems: 'center',
        paddingHorizontal: responsiveLayout.horizontalPadding,
        paddingTop: 20,
        paddingBottom: 40,
      }}
    >
      <View style={{ width: responsiveLayout.contentWidth }}>
        <View style={styles.heroCard}>
          {item.imageUrl ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.image}
                contentFit="cover"
              />
            </View>
          ) : null}

          <View style={styles.header}>
            <Text style={styles.name}>{item.itemName}</Text>
            <Text style={styles.code}>{item.productCode}</Text>
            <Text style={styles.sku}>SKU: {item.sku}</Text>
          </View>
        </View>

        <View style={styles.badges}>
          <Badge text={stockText} color="#ffffff" backgroundColor={stockColor} />
          {item.taxEnabled ? <Badge text="Tax Enabled" color="#ffffff" backgroundColor="#0b0b0b" /> : null}
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Price:</Text>
            <Text style={styles.value}>{formatCurrency(item.price)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Stock Quantity:</Text>
            <Text style={styles.value}>{item.stockQuantity}</Text>
          </View>

          {item.categories ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Categories:</Text>
              <Text style={styles.value}>{item.categories}</Text>
            </View>
          ) : null}

          {item.subCategory ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Subcategory:</Text>
              <Text style={styles.value}>{item.subCategory}</Text>
            </View>
          ) : null}

          {item.brand ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Brand:</Text>
              <Text style={styles.value}>{item.brand}</Text>
            </View>
          ) : null}

          {item.popularityScore !== undefined && item.popularityScore !== null ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Popularity Score:</Text>
              <Text style={styles.value}>{item.popularityScore}</Text>
            </View>
          ) : null}

          {item.modifiers ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Modifiers:</Text>
              <Text style={styles.value}>{item.modifiers}</Text>
            </View>
          ) : null}

          {item.labels ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Labels:</Text>
              <Text style={styles.value}>{item.labels}</Text>
            </View>
          ) : null}

          {item.taxRate !== undefined ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Tax Rate:</Text>
              <Text style={styles.value}>{item.taxRate}%</Text>
            </View>
          ) : null}

          {item.fees ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Fees:</Text>
              <Text style={styles.value}>{item.fees}</Text>
            </View>
          ) : null}

          {item.description ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Description:</Text>
              <Text style={styles.value}>{item.description}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionButton, styles.primaryActionButton]} onPress={handleEdit}>
            <Text style={styles.actionTextLight}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.outlineActionButton]}
            onPress={handleToggleTax}
            disabled={toggleTaxMutation.isPending}
          >
            <Text style={styles.actionTextDark}>{item.taxEnabled ? 'Disable Tax' : 'Enable Tax'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.outlineActionButton]}
            onPress={() => handleStockOperation('add')}
          >
            <Text style={styles.actionTextDark}>Add Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.outlineActionButton]}
            onPress={() => handleStockOperation('reduce')}
          >
            <Text style={styles.actionTextDark}>Reduce Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
            <Text style={styles.actionTextLight}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Item"
        message={`Are you sure you want to delete "${item.itemName}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />

      <Modal
        visible={showStockModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStockModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: responsiveLayout.isTablet ? 480 : 400 }]}>
            <Text style={styles.modalTitle}>{stockOperation === 'add' ? 'Add Stock' : 'Reduce Stock'}</Text>

            <TextInput
              style={styles.quantityInput}
              placeholder="Enter quantity"
              value={stockQuantity}
              onChangeText={setStockQuantity}
              keyboardType="numeric"
              placeholderTextColor="rgba(11, 11, 11, 0.45)"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setShowStockModal(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalButton, styles.modalConfirmButton]} onPress={confirmStockOperation}>
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.08)',
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 12,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  header: {
    marginBottom: 4,
  },
  name: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0b0b0b',
    marginBottom: 4,
  },
  code: {
    fontSize: 15,
    color: 'rgba(11, 11, 11, 0.62)',
    marginBottom: 4,
  },
  sku: {
    fontSize: 12,
    color: 'rgba(11, 11, 11, 0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  details: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.08)',
    padding: 16,
    marginBottom: 18,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0b0b0b',
    flex: 1,
  },
  value: {
    fontSize: 15,
    color: 'rgba(11, 11, 11, 0.72)',
    flex: 2,
    textAlign: 'right',
  },
  actions: {
    gap: 10,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  primaryActionButton: {
    backgroundColor: '#0b0b0b',
    borderColor: '#0b0b0b',
  },
  outlineActionButton: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(11, 11, 11, 0.2)',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  actionTextLight: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  actionTextDark: {
    color: '#0b0b0b',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.08)',
    padding: 20,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0b0b0b',
    marginBottom: 20,
    textAlign: 'center',
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.12)',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 20,
    backgroundColor: '#ffffff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.15)',
    alignItems: 'center',
  },
  modalConfirmButton: {
    backgroundColor: '#0b0b0b',
    borderColor: '#0b0b0b',
  },
  modalButtonText: {
    fontSize: 14,
    color: '#0b0b0b',
    fontWeight: '600',
  },
  modalConfirmText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
});
