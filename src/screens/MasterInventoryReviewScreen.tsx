import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import { theme } from '@/config/theme';
import { useUpsertStoreInventoryFromMaster } from '@/hooks/useInventory';
import { RootStackParamList } from '@/navigation/types';
import { MasterSelectionDraft } from '@/types/inventory';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type MasterInventoryReviewRouteProp = RouteProp<RootStackParamList, 'MasterInventoryReview'>;

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

function validateDraftItems(items: MasterSelectionDraft[]): string | null {
  if (items.length === 0) return 'No items selected.';

  const invalidItem = items.find(
    (item) => !isNonNegativeDecimal(item.price) || !isNonNegativeInteger(item.stockQuantity)
  );

  if (!invalidItem) return null;
  return `${invalidItem.itemName}: price must be non-negative and quantity must be a whole number.`;
}

function buildFailureMap(failedItems: Array<{ item: MasterSelectionDraft; message: string }>) {
  return failedItems.reduce<Record<number, string>>((accumulator, failedItem) => {
    accumulator[failedItem.item.inventoryItemId] = failedItem.message;
    return accumulator;
  }, {});
}

export function MasterInventoryReviewScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<MasterInventoryReviewRouteProp>();
  const upsertMutation = useUpsertStoreInventoryFromMaster();

  const [draftItems, setDraftItems] = useState<MasterSelectionDraft[]>(route.params?.selectedItems ?? []);
  const [failedByInventoryItemId, setFailedByInventoryItemId] = useState<Record<number, string>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const totalInventoryValue = useMemo(
    () =>
      draftItems.reduce((totalValue, item) => {
        const price = Number(item.price);
        const quantity = Number(item.stockQuantity);
        if (Number.isNaN(price) || Number.isNaN(quantity)) return totalValue;
        return totalValue + price * quantity;
      }, 0),
    [draftItems]
  );

  const failedItems = useMemo(
    () =>
      draftItems.filter((item) => Boolean(failedByInventoryItemId[item.inventoryItemId])),
    [draftItems, failedByInventoryItemId]
  );

  function updateDraftItem(
    inventoryItemId: number,
    field: keyof Pick<MasterSelectionDraft, 'price' | 'stockQuantity' | 'taxEnabled'>,
    value: string | boolean
  ) {
    setDraftItems((previousItems) =>
      previousItems.map((item) => {
        if (item.inventoryItemId !== inventoryItemId) return item;

        return {
          ...item,
          [field]: value,
        };
      })
    );

    if (failedByInventoryItemId[inventoryItemId]) {
      setFailedByInventoryItemId((previousFailures) => {
        const nextFailures = { ...previousFailures };
        delete nextFailures[inventoryItemId];
        return nextFailures;
      });
    }
  }

  async function saveDraftItems(itemsToSave: MasterSelectionDraft[]) {
    const validationError = validateDraftItems(itemsToSave);
    if (validationError) {
      Toast.show({
        type: 'error',
        text1: 'Validation failed',
        text2: validationError,
      });
      return;
    }

    try {
      const saveSummary = await upsertMutation.mutateAsync(itemsToSave);
      setHasSubmitted(true);

      if (saveSummary.failed.length > 0) {
        setFailedByInventoryItemId(buildFailureMap(saveSummary.failed));
        Toast.show({
          type: 'error',
          text1: 'Some items failed to save',
          text2: `${saveSummary.added} added, ${saveSummary.updated} updated, ${saveSummary.failed.length} failed.`,
          visibilityTime: 5000,
        });
        return;
      }

      setFailedByInventoryItemId({});
      Toast.show({
        type: 'success',
        text1: 'Inventory updated',
        text2: `${saveSummary.added} added, ${saveSummary.updated} updated.`,
      });

      navigation.reset({
        index: 0,
        routes: [{ name: 'InventoryList' }],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save items.';
      Toast.show({
        type: 'error',
        text1: 'Save failed',
        text2: message,
      });
    }
  }

  function handleSaveAll() {
    void saveDraftItems(draftItems);
  }

  function handleRetryFailed() {
    if (failedItems.length === 0) return;
    void saveDraftItems(failedItems);
  }

  function handleBackToEdit() {
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Review Items</Text>
          <Text style={styles.subtitle}>{draftItems.length} items ready to save</Text>
          <Text style={styles.summaryText}>Estimated value: ${totalInventoryValue.toFixed(2)}</Text>
        </View>

        <View style={styles.listStack}>
          {draftItems.map((item) => {
            const failureMessage = failedByInventoryItemId[item.inventoryItemId];
            const showSavedStatus = hasSubmitted && !failureMessage;

            return (
              <View
                key={item.inventoryItemId}
                style={[styles.listRow, Boolean(failureMessage) && styles.listRowFailed]}
              >
                <View style={styles.rowHeader}>
                  <View style={styles.rowTitleContainer}>
                    <Text style={styles.itemName}>{item.itemName}</Text>
                    <Text style={styles.itemMeta}>{item.sku}</Text>
                  </View>

                  {failureMessage ? <Text style={styles.failedStatus}>Failed</Text> : null}
                  {showSavedStatus ? <Text style={styles.savedStatus}>Saved</Text> : null}
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Price</Text>
                    <TextInput
                      style={styles.input}
                      value={item.price}
                      onChangeText={(value) => updateDraftItem(item.inventoryItemId, 'price', value)}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor="rgba(11, 11, 11, 0.4)"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Qty</Text>
                    <TextInput
                      style={styles.input}
                      value={item.stockQuantity}
                      onChangeText={(value) =>
                        updateDraftItem(item.inventoryItemId, 'stockQuantity', value)
                      }
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor="rgba(11, 11, 11, 0.4)"
                    />
                  </View>
                </View>

                <View style={styles.taxRow}>
                  <Text style={styles.inputLabel}>Tax enabled</Text>
                  <Switch
                    value={item.taxEnabled}
                    onValueChange={(value) => updateDraftItem(item.inventoryItemId, 'taxEnabled', value)}
                    trackColor={{ false: 'rgba(11, 11, 11, 0.2)', true: '#0b0b0b' }}
                    thumbColor="#ffffff"
                  />
                </View>

                {failureMessage ? <Text style={styles.failureMessage}>{failureMessage}</Text> : null}
              </View>
            );
          })}
        </View>

        {failedItems.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={handleRetryFailed}
            style={styles.retryButton}
            disabled={upsertMutation.isPending}
          >
            <Text style={styles.retryButtonText}>
              {upsertMutation.isPending ? 'Retrying...' : `Retry Failed (${failedItems.length})`}
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={handleSaveAll}
          style={styles.primaryButton}
          disabled={upsertMutation.isPending}
        >
          <Text style={styles.primaryButtonText}>
            {upsertMutation.isPending ? 'Saving...' : 'Confirm and Save'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={handleBackToEdit}
          style={styles.secondaryButton}
          disabled={upsertMutation.isPending}
        >
          <Text style={styles.secondaryButtonText}>Back to Edit</Text>
        </Pressable>
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
    marginBottom: 6,
  },
  subtitle: {
    fontSize: theme.typography.body.fontSize,
    color: 'rgba(11, 11, 11, 0.72)',
  },
  summaryText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(11, 11, 11, 0.62)',
  },
  listStack: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  listRow: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.08)',
    padding: theme.spacing.md,
    backgroundColor: '#ffffff',
    ...theme.shadows.sm,
  },
  listRowFailed: {
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  rowTitleContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0b0b0b',
  },
  itemMeta: {
    fontSize: 13,
    marginTop: 2,
    color: 'rgba(11, 11, 11, 0.6)',
  },
  failedStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ef4444',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  savedStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(11, 11, 11, 0.62)',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.12)',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0b0b0b',
  },
  taxRow: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  failureMessage: {
    marginTop: theme.spacing.xs,
    fontSize: 12,
    color: '#dc2626',
  },
  primaryButton: {
    backgroundColor: '#0b0b0b',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  retryButton: {
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.45)',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    backgroundColor: '#fff5f5',
  },
  retryButtonText: {
    color: '#b91c1c',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.2)',
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0b0b0b',
    fontSize: 16,
    fontWeight: '700',
  },
});
