import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '@/api/inventory.service';
import {
  CreateInventoryItem,
  UpdateInventoryItem,
  CreateSubcategory,
  UpdateSubcategory,
  MasterSelectionDraft,
  InventoryItem,
} from '@/types/inventory';
import { showSuccessToast } from '@/utils/errorHandler';

const TWO_MINUTES_MS = 2 * 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;
const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const THIRTY_MINUTES_GC_MS = 30 * 60 * 1000;

// Query keys
export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...inventoryKeys.lists(), { filters }] as const,
  details: () => [...inventoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...inventoryKeys.details(), id] as const,
  lowStock: (threshold: number) => [...inventoryKeys.all, 'lowStock', threshold] as const,
  category: (name: string) => [...inventoryKeys.all, 'category', name] as const,
  categories: (filters?: { storeType?: string; storeEthnicity?: string }) =>
    [...inventoryKeys.all, 'categories', filters ?? {}] as const,
  measurementUnits: () => [...inventoryKeys.all, 'measurementUnits'] as const,
  docs: () => [...inventoryKeys.all, 'docs'] as const,
  brands: () => [...inventoryKeys.all, 'brands'] as const,
  masterCategory: (code: string) => [...inventoryKeys.all, 'masterCategory', code] as const,
  masterSubcategory: (code: string) => [...inventoryKeys.all, 'masterSubcategory', code] as const,
  masterBrand: (name: string) => [...inventoryKeys.all, 'masterBrand', name] as const,
  selectedStoreProfile: () => [...inventoryKeys.all, 'selectedStoreProfile'] as const,
  subcategories: () => [...inventoryKeys.all, 'subcategories'] as const,
  subcategoriesByCategory: (categoryCode: string) =>
    [...inventoryKeys.subcategories(), 'category', categoryCode] as const,
  subcategory: (id: number) => [...inventoryKeys.subcategories(), id] as const,
};

// Queries
export function useInventoryList() {
  return useQuery({
    queryKey: inventoryKeys.lists(),
    queryFn: inventoryService.getInventory,
    staleTime: TWO_MINUTES_MS,
    gcTime: THIRTY_MINUTES_GC_MS,
    placeholderData: (previousData) => previousData,
  });
}

export function useInventoryItem(id: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: inventoryKeys.detail(id),
    queryFn: () => inventoryService.getInventoryById(id),
    enabled: !!id,
    staleTime: TEN_MINUTES_MS,
    gcTime: THIRTY_MINUTES_GC_MS,
    placeholderData: () => {
      const cachedInventory = queryClient.getQueryData<InventoryItem[]>(inventoryKeys.lists());
      if (!cachedInventory?.length) return undefined;
      return cachedInventory.find((inventoryItem) => inventoryItem.id === id);
    },
  });
}

export function useLowStock(threshold: number = 10) {
  return useQuery({
    queryKey: inventoryKeys.lowStock(threshold),
    queryFn: () => inventoryService.getLowStock(threshold),
  });
}

export function useCategoryFilter(name: string) {
  return useQuery({
    queryKey: inventoryKeys.category(name),
    queryFn: () => inventoryService.getByCategory(name),
    enabled: !!name,
  });
}

export function useSubcategoryFilter(name: string) {
  return useQuery({
    queryKey: [...inventoryKeys.all, 'subcategory', name] as const,
    queryFn: () => inventoryService.getBySubcategory(name),
    enabled: !!name,
  });
}

export function useBrandFilter(name: string) {
  return useQuery({
    queryKey: [...inventoryKeys.all, 'brand', name] as const,
    queryFn: () => inventoryService.getByBrand(name),
    enabled: !!name,
  });
}

export function useDocs() {
  return useQuery({
    queryKey: inventoryKeys.docs(),
    queryFn: inventoryService.getDocs,
    staleTime: THIRTY_MINUTES_MS,
    gcTime: ONE_DAY_MS,
  });
}

export function useCategories(
  filters?: { storeType?: 'GROCERY' | 'CONVENIENCE'; storeEthnicity?: 'INDIAN' | 'AMERICAN' },
  enabled: boolean = true
) {
  return useQuery({
    queryKey: inventoryKeys.categories(filters),
    queryFn: () => inventoryService.getCategories(filters),
    enabled,
    staleTime: ONE_HOUR_MS,
    gcTime: ONE_DAY_MS,
    placeholderData: (previousData) => previousData,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: inventoryKeys.brands(),
    queryFn: inventoryService.getBrands,
    staleTime: ONE_HOUR_MS,
    gcTime: ONE_DAY_MS,
    placeholderData: (previousData) => previousData,
  });
}

export function useMasterItemsByCategory(code: string, enabled: boolean = true) {
  return useQuery({
    queryKey: inventoryKeys.masterCategory(code),
    queryFn: () => inventoryService.getMasterInventoryByCategory(code),
    enabled: enabled && !!code,
  });
}

export function useMasterItemsBySubcategory(code: string, enabled: boolean = true) {
  return useQuery({
    queryKey: inventoryKeys.masterSubcategory(code),
    queryFn: () => inventoryService.getMasterInventoryBySubcategory(code),
    enabled: enabled && !!code,
  });
}

export function useMasterItemsByBrand(name: string, enabled: boolean = true) {
  return useQuery({
    queryKey: inventoryKeys.masterBrand(name),
    queryFn: () => inventoryService.getMasterInventoryByBrand(name),
    enabled: enabled && !!name,
  });
}

export function useSelectedStoreProfile() {
  return useQuery({
    queryKey: inventoryKeys.selectedStoreProfile(),
    queryFn: () => inventoryService.getSelectedStoreProfile(),
    staleTime: THIRTY_MINUTES_MS,
    gcTime: ONE_DAY_MS,
    retry: 1,
  });
}

export function useMeasurementUnits() {
  return useQuery({
    queryKey: inventoryKeys.measurementUnits(),
    queryFn: inventoryService.getMeasurementUnits,
    staleTime: ONE_HOUR_MS,
    gcTime: ONE_DAY_MS,
    placeholderData: (previousData) => previousData,
  });
}

// Mutations
export function useCreateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInventoryItem) => inventoryService.createInventory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      showSuccessToast('Item created successfully');
    },
  });
}

export function useUpdateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInventoryItem }) =>
      inventoryService.updateInventory(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      showSuccessToast('Item updated successfully');
    },
  });
}

export function useDeleteInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inventoryService.deleteInventory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      showSuccessToast('Item deleted successfully');
    },
  });
}

export function useToggleTax() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      enabled ? inventoryService.enableTax(id) : inventoryService.disableTax(id),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      showSuccessToast('Tax status updated');
    },
  });
}

export function useStockOperations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, operation, quantity }: { id: string; operation: 'add' | 'reduce'; quantity: number }) =>
      operation === 'add' ? inventoryService.addStock(id, quantity) : inventoryService.reduceStock(id, quantity),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      showSuccessToast('Stock updated successfully');
    },
  });
}

interface UpsertFailure {
  item: MasterSelectionDraft;
  message: string;
}

interface UpsertSummary {
  added: number;
  updated: number;
  failed: UpsertFailure[];
}

export function useUpsertStoreInventoryFromMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (selectedItems: MasterSelectionDraft[]): Promise<UpsertSummary> => {
      const existingItems = await inventoryService.getInventory();
      const existingByInventoryItemId = new Map<number, string>();

      existingItems.forEach((item) => {
        if (!item.inventoryItemId) return;
        existingByInventoryItemId.set(item.inventoryItemId, item.id);
      });

      const operations = selectedItems.map(async (selectedItem) => {
        const payload: CreateInventoryItem = {
          inventoryItemId: selectedItem.inventoryItemId,
          itemName: selectedItem.itemName,
          productName: selectedItem.productName ?? selectedItem.itemName,
          productCode: selectedItem.sku,
          sku: selectedItem.sku,
          price: Number(selectedItem.price),
          stockQuantity: Number(selectedItem.stockQuantity),
          categories: selectedItem.categoryDisplayName,
          subCategory: selectedItem.subCategoryDisplayName,
          brand: selectedItem.brandName,
          taxEnabled: selectedItem.taxEnabled,
          active: selectedItem.active,
          seasonal: selectedItem.seasonal,
          discontinued: selectedItem.discontinued,
          description: selectedItem.description,
          imageUrl: selectedItem.imageUrl,
        };

        const existingStoreInventoryId = existingByInventoryItemId.get(selectedItem.inventoryItemId);
        if (!existingStoreInventoryId) {
          await inventoryService.createInventory(payload);
          return { type: 'added' as const };
        }

        await inventoryService.updateInventory(existingStoreInventoryId, payload);
        return { type: 'updated' as const };
      });

      const settledResults = await Promise.allSettled(operations);
      let added = 0;
      let updated = 0;
      const failed: UpsertFailure[] = [];

      settledResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value.type === 'added') added += 1;
          if (result.value.type === 'updated') updated += 1;
          return;
        }

        const reason = result.reason instanceof Error ? result.reason.message : 'Failed to save item.';
        failed.push({
          item: selectedItems[index],
          message: reason,
        });
      });

      return {
        added,
        updated,
        failed,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
}

// Subcategory queries
export function useSubcategories(categoryCode?: string) {
  return useQuery({
    queryKey: categoryCode
      ? inventoryKeys.subcategoriesByCategory(categoryCode)
      : inventoryKeys.subcategories(),
    queryFn: () => inventoryService.getSubcategories(categoryCode),
  });
}

export function useSubcategory(id: number) {
  return useQuery({
    queryKey: inventoryKeys.subcategory(id),
    queryFn: () => inventoryService.getSubcategoryById(id),
    enabled: !!id,
  });
}

// Subcategory mutations
export function useCreateSubcategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSubcategory) => inventoryService.createSubcategory(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.subcategories() });
      if (variables.categoryCode) {
        queryClient.invalidateQueries({
          queryKey: inventoryKeys.subcategoriesByCategory(variables.categoryCode),
        });
      }
      showSuccessToast('Subcategory created successfully');
    },
  });
}

export function useUpdateSubcategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSubcategory }) =>
      inventoryService.updateSubcategory(id, data),
    onSuccess: (_, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.subcategory(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.subcategories() });
      if (data.categoryCode) {
        queryClient.invalidateQueries({
          queryKey: inventoryKeys.subcategoriesByCategory(data.categoryCode),
        });
      }
      showSuccessToast('Subcategory updated successfully');
    },
  });
}

export function useDeleteSubcategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => inventoryService.deleteSubcategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.subcategories() });
      showSuccessToast('Subcategory deleted successfully');
    },
  });
}
