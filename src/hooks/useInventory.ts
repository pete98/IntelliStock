import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '@/api/inventory.service';
import {
  CreateInventoryItem,
  UpdateInventoryItem,
  CreateSubcategory,
  UpdateSubcategory,
} from '@/types/inventory';
import { showSuccessToast } from '@/utils/errorHandler';

// Query keys
export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...inventoryKeys.lists(), { filters }] as const,
  details: () => [...inventoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...inventoryKeys.details(), id] as const,
  lowStock: (threshold: number) => [...inventoryKeys.all, 'lowStock', threshold] as const,
  category: (name: string) => [...inventoryKeys.all, 'category', name] as const,
  categories: () => [...inventoryKeys.all, 'categories'] as const,
  measurementUnits: () => [...inventoryKeys.all, 'measurementUnits'] as const,
  docs: () => [...inventoryKeys.all, 'docs'] as const,
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
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: inventoryKeys.detail(id),
    queryFn: () => inventoryService.getInventoryById(id),
    enabled: !!id,
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
  });
}

export function useCategories() {
  return useQuery({
    queryKey: inventoryKeys.categories(),
    queryFn: inventoryService.getCategories,
  });
}

export function useMeasurementUnits() {
  return useQuery({
    queryKey: inventoryKeys.measurementUnits(),
    queryFn: inventoryService.getMeasurementUnits,
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



