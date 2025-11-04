import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '@/navigation/types';
import { useInventoryList, useLowStock } from '@/hooks/useInventory';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorView } from '@/components/ErrorView';
import { EmptyState } from '@/components/EmptyState';
import { ItemCard } from '@/components/ItemCard';
import { theme } from '@/config/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'InventoryList'>;
type InventoryListRouteProp = RouteProp<RootStackParamList, 'InventoryList'>;

export default function InventoryListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<InventoryListRouteProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  const { data: inventory, isLoading, error, refetch } = useInventoryList();
  const { data: lowStockItems, isLoading: isLoadingLowStock } = useLowStock(10);

  const filteredInventory = useMemo(() => {
    if (!inventory) return [];

    let items = showLowStock ? lowStockItems || [] : inventory;

    if (searchQuery.trim()) {
      items = items.filter(item =>
        item.categories?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.productCode.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return items;
  }, [inventory, lowStockItems, searchQuery, showLowStock]);

  const handleItemPress = (itemId: string) => {
    navigation.navigate('ItemDetail', { itemId });
  };

  const handleAddItem = () => {
    navigation.navigate('ItemForm', {});
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  useEffect(() => {
    const scannedBarcode = route.params?.scannedBarcode;
    if (scannedBarcode) {
      setSearchQuery(scannedBarcode);
      navigation.setParams({ scannedBarcode: undefined });
    }
  }, [navigation, route.params?.scannedBarcode]);

  const openBarcodeScanner = () => {
    navigation.navigate('BarcodeScanner', {
      source: 'list',
    });
  };

  if (isLoading || (showLowStock && isLoadingLowStock)) {
    return <LoadingSpinner text="Loading inventory..." />;
  }

  if (error) {
    return <ErrorView error={error} onRetry={() => refetch()} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by category, name, or code..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.textSecondary}
        />
        
        <TouchableOpacity
          style={[styles.filterButton, showLowStock && styles.filterButtonActive]}
          onPress={() => setShowLowStock(!showLowStock)}
        >
          <Text style={[styles.filterText, showLowStock && styles.filterTextActive]}>
            Low Stock
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.scannerButton} onPress={openBarcodeScanner}>
          <Ionicons name="scan" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
          <Text style={styles.settingsText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {filteredInventory.length === 0 ? (
        <EmptyState
          title={showLowStock ? "No low stock items" : "No inventory items"}
          message={searchQuery ? "Try adjusting your search" : "Add your first item to get started"}
        />
      ) : (
        <FlatList
          data={filteredInventory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onPress={() => handleItemPress(item.id)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              colors={[theme.colors.primary]}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={handleAddItem}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    backgroundColor: theme.colors.surface,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: theme.colors.background,
  },
  scannerButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  settingsButton: {
    padding: theme.spacing.sm,
  },
  settingsText: {
    fontSize: 20,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    right: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  fabText: {
    fontSize: 32,
    color: theme.colors.background,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
