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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '@/navigation/types';
import { useInventoryList } from '@/hooks/useInventory';
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

  const filteredInventory = useMemo(() => {
    if (!inventory) return [];

    let items = showLowStock
      ? inventory.filter((item) => item.stockQuantity <= 10)
      : inventory;

    if (searchQuery.trim()) {
      items = items.filter(item =>
        item.categories?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.productCode.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return items;
  }, [inventory, searchQuery, showLowStock]);

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

  if (isLoading) {
    return <LoadingSpinner text="Loading inventory..." />;
  }

  if (error) {
    return <ErrorView error={error} onRetry={() => refetch()} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Inventory</Text>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color="#0b0b0b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by category, name, or code..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="rgba(11, 11, 11, 0.5)"
          />
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.filterButton, showLowStock && styles.filterButtonActive]}
            onPress={() => setShowLowStock(!showLowStock)}
          >
            <Text style={[styles.filterText, showLowStock && styles.filterTextActive]}>
              Low Stock
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={openBarcodeScanner}>
            <Ionicons name="scan" size={18} color="#0b0b0b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleSettings}>
            <Ionicons name="settings-outline" size={18} color="#0b0b0b" />
          </TouchableOpacity>
        </View>
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
              colors={['#0b0b0b']}
              tintColor="#0b0b0b"
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={handleAddItem}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0b0b0b',
    marginBottom: theme.spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.12)',
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    height: 44,
    backgroundColor: '#ffffff',
  },
  searchInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: theme.spacing.sm,
    fontSize: 15,
    color: '#0b0b0b',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.lg,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.12)',
    backgroundColor: '#ffffff',
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#0b0b0b',
    borderColor: '#0b0b0b',
  },
  filterText: {
    fontSize: 12,
    color: '#0b0b0b',
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    right: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0b0b0b',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  fabText: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
