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
import { theme } from '@/config/theme';
import { formatCurrency, formatStock, getStockBadgeColor } from '@/utils/format';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ItemDetail'>;
type ItemDetailRouteProp = RouteProp<RootStackParamList, 'ItemDetail'>;

export default function ItemDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ItemDetailRouteProp>();
  const { itemId } = route.params;

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockQuantity, setStockQuantity] = useState('');
  const [stockOperation, setStockOperation] = useState<'add' | 'reduce'>('add');

  const { data: item, isLoading, error } = useInventoryItem(itemId);
  const deleteMutation = useDeleteInventory();
  const toggleTaxMutation = useToggleTax();
  const stockMutation = useStockOperations();

  const handleEdit = () => {
    navigation.navigate('ItemForm', { itemId });
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate(itemId, {
      onSuccess: () => {
        navigation.navigate('InventoryList');
      },
    });
    setShowDeleteDialog(false);
  };

  const handleToggleTax = () => {
    if (item) {
      toggleTaxMutation.mutate({
        id: itemId,
        enabled: !item.taxEnabled,
      });
    }
  };

  const handleStockOperation = (operation: 'add' | 'reduce') => {
    setStockOperation(operation);
    setStockQuantity('');
    setShowStockModal(true);
  };

  const confirmStockOperation = () => {
    const quantity = parseInt(stockQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid positive number');
      return;
    }

    stockMutation.mutate({
      id: itemId,
      operation: stockOperation,
      quantity,
    });
    setShowStockModal(false);
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading item details..." />;
  }

  if (error || !item) {
    return <ErrorView error={error} onRetry={() => {}} />;
  }

  const stockColor = getStockBadgeColor(item.stockQuantity);
  const stockText = formatStock(item.stockQuantity);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {item.imageUrl && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.image}
              contentFit="cover"
            />
          </View>
        )}

        <View style={styles.header}>
          <Text style={styles.name}>{item.itemName}</Text>
          <Text style={styles.code}>{item.productCode}</Text>
          <Text style={styles.sku}>SKU: {item.sku}</Text>
        </View>

        <View style={styles.badges}>
          <Badge
            text={stockText}
            color="#ffffff"
            backgroundColor={stockColor}
          />
          {item.taxEnabled && (
            <Badge
              text="Tax Enabled"
              color="#ffffff"
              backgroundColor={theme.colors.secondary}
            />
          )}
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

          {item.categories && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Categories:</Text>
              <Text style={styles.value}>{item.categories}</Text>
            </View>
          )}

          {item.subCategory && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Subcategory:</Text>
              <Text style={styles.value}>{item.subCategory}</Text>
            </View>
          )}

          {item.brand && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Brand:</Text>
              <Text style={styles.value}>{item.brand}</Text>
            </View>
          )}

          {item.popularityScore !== undefined && item.popularityScore !== null && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Popularity Score:</Text>
              <Text style={styles.value}>{item.popularityScore}</Text>
            </View>
          )}

          {item.modifiers && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Modifiers:</Text>
              <Text style={styles.value}>{item.modifiers}</Text>
            </View>
          )}

          {item.labels && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Labels:</Text>
              <Text style={styles.value}>{item.labels}</Text>
            </View>
          )}

          {item.taxRate !== undefined && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Tax Rate:</Text>
              <Text style={styles.value}>{item.taxRate}%</Text>
            </View>
          )}

          {item.fees && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Fees:</Text>
              <Text style={styles.value}>{item.fees}</Text>
            </View>
          )}

          {item.description && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Description:</Text>
              <Text style={styles.value}>{item.description}</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.taxButton]}
            onPress={handleToggleTax}
            disabled={toggleTaxMutation.isPending}
          >
            <Text style={styles.actionText}>
              {item.taxEnabled ? 'Disable Tax' : 'Enable Tax'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.stockButton]}
            onPress={() => handleStockOperation('add')}
          >
            <Text style={styles.actionText}>Add Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.stockButton]}
            onPress={() => handleStockOperation('reduce')}
          >
            <Text style={styles.actionText}>Reduce Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Text style={styles.actionText}>Delete</Text>
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {stockOperation === 'add' ? 'Add Stock' : 'Reduce Stock'}
            </Text>
            
            <TextInput
              style={styles.quantityInput}
              placeholder="Enter quantity"
              value={stockQuantity}
              onChangeText={setStockQuantity}
              keyboardType="numeric"
              placeholderTextColor={theme.colors.textSecondary}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowStockModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={confirmStockOperation}
              >
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
    backgroundColor: theme.colors.surface,
  },
  content: {
    padding: theme.spacing.md,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  header: {
    marginBottom: theme.spacing.md,
  },
  name: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  code: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  sku: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  badges: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  details: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  label: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  value: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    flex: 2,
    textAlign: 'right',
  },
  actions: {
    gap: theme.spacing.md,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  taxButton: {
    backgroundColor: theme.colors.secondary,
  },
  stockButton: {
    backgroundColor: theme.colors.warning,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
  },
  actionText: {
    color: theme.colors.background,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  modalConfirmButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  modalButtonText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  modalConfirmText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.background,
    fontWeight: '600',
  },
});
