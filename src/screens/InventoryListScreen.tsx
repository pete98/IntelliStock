import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { RootStackParamList } from '@/navigation/types';
import { inventoryKeys, useInventoryList } from '@/hooks/useInventory';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorView } from '@/components/ErrorView';
import { EmptyState } from '@/components/EmptyState';
import { ItemCard } from '@/components/ItemCard';
import { inventoryService } from '@/api/inventory.service';
import { theme } from '@/config/theme';
import { getResponsiveLayout } from '@/utils/layout';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'InventoryList'>;
type InventoryListRouteProp = RouteProp<RootStackParamList, 'InventoryList'>;

export default function InventoryListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const route = useRoute<InventoryListRouteProp>();
  const { width } = useWindowDimensions();
  const responsiveLayout = getResponsiveLayout(width);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  const { data: inventory, isLoading, isFetching, error, refetch } = useInventoryList();

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
    void queryClient.prefetchQuery({
      queryKey: inventoryKeys.detail(itemId),
      queryFn: () => inventoryService.getInventoryById(itemId),
      staleTime: 10 * 60 * 1000,
    });
    navigation.navigate('ItemDetail', { itemId });
  };

  const handleAddItem = () => {
    void Promise.all([
      queryClient.prefetchQuery({
        queryKey: inventoryKeys.categories(),
        queryFn: () => inventoryService.getCategories(),
        staleTime: 60 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: inventoryKeys.measurementUnits(),
        queryFn: () => inventoryService.getMeasurementUnits(),
        staleTime: 60 * 60 * 1000,
      }),
    ]);

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

  if (isLoading && !inventory) {
    return <LoadingSpinner text="Loading inventory..." />;
  }

  if (error && !inventory) {
    return <ErrorView error={error} onRetry={() => refetch()} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { paddingHorizontal: responsiveLayout.horizontalPadding }]}>
        <View style={[styles.headerContent, { width: responsiveLayout.contentWidth }]}>
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
      </View>

      <View style={[styles.body, { paddingHorizontal: responsiveLayout.horizontalPadding }]}>
        <View style={[styles.bodyContent, { width: responsiveLayout.contentWidth }]}>
          {filteredInventory.length === 0 ? (
            <EmptyState
              title={showLowStock ? 'No low stock items' : 'No inventory items'}
              message={searchQuery ? 'Try adjusting your search' : 'Add your first item to get started'}
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
                  refreshing={isFetching}
                  onRefresh={refetch}
                  colors={['#0b0b0b']}
                  tintColor="#0b0b0b"
                />
              }
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.fab,
          {
            right: Math.max(
              responsiveLayout.horizontalPadding,
              (width - responsiveLayout.contentWidth) / 2 + theme.spacing.lg
            ),
          },
        ]}
        onPress={handleAddItem}
      >
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
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  headerContent: {
    maxWidth: '100%',
  },
  body: {
    flex: 1,
    alignItems: 'center',
  },
  bodyContent: {
    flex: 1,
    maxWidth: '100%',
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
    paddingTop: theme.spacing.xs,
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
