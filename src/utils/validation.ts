import { z } from 'zod';

export const inventoryItemSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  productCode: z.string().min(1, 'Product code is required'),
  sku: z.string().min(1, 'SKU is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  stockQuantity: z.number().min(0, 'Stock quantity must be non-negative'),
  categories: z.string().min(1, 'Category is required'),
  subCategory: z.string().min(1, 'Subcategory is required'),
  brand: z.string().min(1, 'Brand is required'),
  modifiers: z.string().optional(),
  labels: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  taxEnabled: z.boolean(),
  fees: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  calories: z.number().min(0, 'Calories must be non-negative').optional().nullable(),
  weight: z.number().min(0, 'Weight must be non-negative').optional().nullable(),
  weightUnit: z.string().max(32, 'Weight unit must be 32 characters or less').optional(),
  popularityScore: z.number().min(0, 'Popularity score must be non-negative').optional().nullable(),
});

export const createInventoryItemSchema = inventoryItemSchema;

export const updateInventoryItemSchema = inventoryItemSchema.partial();

export type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;
export type CreateInventoryItemFormData = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemFormData = z.infer<typeof updateInventoryItemSchema>;


