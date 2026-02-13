import axios from 'axios';
import { getApiClient } from '@/config/api';
import { resolveStoreContext } from '@/utils/storeContext';
import {
  InventoryItem,
  CreateInventoryItem,
  UpdateInventoryItem,
  DocsResponse,
  BarcodeParseRequest,
  ParsedProductResponse,
  Category,
  Brand,
  MeasurementUnit,
  Subcategory,
  CreateSubcategory,
  UpdateSubcategory,
  EnrichRequest,
  EnrichResponse,
  UpcItemDbResponse,
  MasterInventoryItem,
  StoreProfile,
} from '@/types/inventory';

interface CategoryFilters {
  storeType?: 'GROCERY' | 'CONVENIENCE';
  storeEthnicity?: 'INDIAN' | 'AMERICAN';
}

interface StoreInventoryRequestDTO {
  inventoryItemId?: number;
  itemName?: string;
  productName?: string;
  sku?: string;
  brandName?: string;
  categoryDisplayName?: string;
  subCategoryDisplayName?: string;
  description?: string;
  imageUrl?: string;
  price: number;
  stockQuantity: number;
  taxEnabled: boolean;
  active?: boolean;
  seasonal?: boolean;
  discontinued?: boolean;
}

function normalizeInventoryItem(payload: Record<string, unknown>): InventoryItem {
  const itemName = (payload.itemName ?? payload.productName ?? payload.name ?? '') as string;
  const productCode = (payload.productCode ?? payload.sku ?? payload.itemCode ?? '') as string;
  const rawId = payload.id ?? payload.storeInventoryId ?? payload.inventoryId ?? payload.itemId ?? '';

  return {
    id: String(rawId),
    inventoryItemId: payload.inventoryItemId ? Number(payload.inventoryItemId) : undefined,
    itemName,
    productName: (payload.productName as string) || undefined,
    productCode,
    sku: String(payload.sku ?? ''),
    price: Number(payload.price ?? 0),
    stockQuantity: Number(payload.stockQuantity ?? 0),
    categories:
      (payload.categories as string) ||
      (payload.categoryDisplayName as string) ||
      (payload.category as string) ||
      undefined,
    subCategory:
      (payload.subCategory as string) ||
      (payload.subCategoryDisplayName as string) ||
      (payload.subcategory as string) ||
      undefined,
    brand: (payload.brand as string) || (payload.brandName as string) || undefined,
    taxRate: payload.taxRate ? Number(payload.taxRate) : undefined,
    taxEnabled: Boolean(payload.taxEnabled),
    description: (payload.description as string) || undefined,
    imageUrl: (payload.imageUrl as string) || undefined,
    active: payload.active === undefined ? undefined : Boolean(payload.active),
    seasonal: payload.seasonal === undefined ? undefined : Boolean(payload.seasonal),
    discontinued: payload.discontinued === undefined ? undefined : Boolean(payload.discontinued),
    modifiers: (payload.modifiers as string) || undefined,
    labels: (payload.labels as string) || undefined,
    fees: (payload.fees as string) || undefined,
    calories: payload.calories ? Number(payload.calories) : undefined,
    weight: payload.weight ? Number(payload.weight) : undefined,
    weightUnit: (payload.weightUnit as string) || undefined,
    popularityScore: payload.popularityScore ? Number(payload.popularityScore) : undefined,
  };
}

function normalizeMasterInventoryItem(payload: Record<string, unknown>): MasterInventoryItem {
  return {
    id: Number(payload.id ?? 0),
    itemName: String(payload.itemName ?? ''),
    sku: String(payload.sku ?? ''),
    productId: payload.productId ? Number(payload.productId) : undefined,
    productName: (payload.productName as string) || undefined,
    categoryId: payload.categoryId ? Number(payload.categoryId) : undefined,
    categoryCode: (payload.categoryCode as string) || undefined,
    categoryDisplayName: (payload.categoryDisplayName as string) || undefined,
    subCategoryId: payload.subCategoryId ? Number(payload.subCategoryId) : undefined,
    subCategoryCode: (payload.subCategoryCode as string) || undefined,
    subCategoryDisplayName: (payload.subCategoryDisplayName as string) || undefined,
    brandId: payload.brandId ? Number(payload.brandId) : undefined,
    brandName: (payload.brandName as string) || undefined,
    modifiers: (payload.modifiers as string) || undefined,
    labels: (payload.labels as string) || undefined,
    description: (payload.description as string) || undefined,
    imageUrl: (payload.imageUrl as string) || undefined,
    calories: payload.calories ? Number(payload.calories) : undefined,
    weight: payload.weight ? Number(payload.weight) : undefined,
    weightUnit: (payload.weightUnit as string) || undefined,
  };
}

function normalizeStoreProfile(payload: Record<string, unknown>): StoreProfile {
  return {
    id: Number(payload.id ?? 0),
    displayName: String(payload.displayName ?? ''),
    email: (payload.email as string) || undefined,
    storeType:
      payload.storeType === 'GROCERY' || payload.storeType === 'CONVENIENCE'
        ? payload.storeType
        : undefined,
    storeEthnicity:
      payload.storeEthnicity === 'INDIAN' || payload.storeEthnicity === 'AMERICAN'
        ? payload.storeEthnicity
        : undefined,
    createdAt: (payload.createdAt as string) || undefined,
    updatedAt: (payload.updatedAt as string) || undefined,
  };
}

function normalizeBrand(payload: Record<string, unknown>): Brand {
  return {
    id: Number(payload.id ?? 0),
    name: String(payload.name ?? ''),
    slug: String(payload.slug ?? ''),
    createdAt: (payload.createdAt as string) || undefined,
    updatedAt: (payload.updatedAt as string) || undefined,
  };
}

function toStoreInventoryRequest(data: CreateInventoryItem | UpdateInventoryItem): StoreInventoryRequestDTO {
  const fallbackSubcategoryCode =
    'subcategoryCode' in data ? data.subcategoryCode : undefined;

  const payload: StoreInventoryRequestDTO = {
    inventoryItemId: data.inventoryItemId,
    itemName: data.itemName,
    productName: data.productName || data.itemName,
    sku: data.sku,
    brandName: data.brand,
    categoryDisplayName: data.categories,
    subCategoryDisplayName: data.subCategory || fallbackSubcategoryCode,
    description: data.description,
    imageUrl: data.imageUrl,
    price: Number(data.price ?? 0),
    stockQuantity: Number(data.stockQuantity ?? 0),
    taxEnabled: Boolean(data.taxEnabled),
    active: data.active ?? true,
    seasonal: data.seasonal ?? false,
    discontinued: data.discontinued ?? false,
  };

  return Object.entries(payload).reduce((accumulator, [key, value]) => {
    if (value === undefined || value === '') return accumulator;
    return {
      ...accumulator,
      [key]: value,
    };
  }, {} as StoreInventoryRequestDTO);
}

export const inventoryService = {
  async getOwnerStores(ownerId?: string): Promise<StoreProfile[]> {
    const client = await getApiClient();
    const resolvedContext = ownerId ? null : await resolveStoreContext();
    const resolvedOwnerId = ownerId ?? resolvedContext?.internalUserId;
    if (!resolvedOwnerId) return [];

    const response = await client.get('/api/stores/by-owner', {
      params: { ownerId: resolvedOwnerId },
    });
    const stores = Array.isArray(response.data)
      ? response.data
      : Array.isArray((response.data as { stores?: unknown[] })?.stores)
        ? (response.data as { stores: unknown[] }).stores
        : [];
    return stores.map((entry) => normalizeStoreProfile((entry ?? {}) as Record<string, unknown>));
  },

  async getSelectedStoreProfile(): Promise<StoreProfile> {
    const { internalUserId, storeId } = await resolveStoreContext();
    const ownerStores = await inventoryService.getOwnerStores(internalUserId);

    const selectedStore = ownerStores.find((store) => String(store.id) === String(storeId));
    if (selectedStore) return selectedStore;
    if (ownerStores.length > 0) return ownerStores[0];
    throw new Error('Unable to resolve selected store profile.');
  },

  async getInventory(): Promise<InventoryItem[]> {
    const client = await getApiClient();
    const { storeId } = await resolveStoreContext();
    const response = await client.get(`/api/stores/${encodeURIComponent(storeId)}/inventory`);
    const rawItems = Array.isArray(response.data) ? response.data : [];
    return rawItems.map((entry) => normalizeInventoryItem((entry ?? {}) as Record<string, unknown>));
  },

  async createInventory(data: CreateInventoryItem): Promise<InventoryItem> {
    const client = await getApiClient();
    const { storeId } = await resolveStoreContext();
    const response = await client.post(
      `/api/stores/${encodeURIComponent(storeId)}/inventory`,
      toStoreInventoryRequest(data)
    );
    return normalizeInventoryItem((response.data ?? {}) as Record<string, unknown>);
  },

  async getInventoryById(id: string): Promise<InventoryItem> {
    const client = await getApiClient();
    const { storeId } = await resolveStoreContext();

    try {
      const response = await client.get(
        `/api/stores/${encodeURIComponent(storeId)}/inventory/${encodeURIComponent(id)}`
      );
      return normalizeInventoryItem((response.data ?? {}) as Record<string, unknown>);
    } catch {
      const items = await this.getInventory();
      const matchingItem = items.find((entry) => entry.id === id);
      if (!matchingItem) throw new Error('Item not found');
      return matchingItem;
    }
  },

  async updateInventory(id: string, data: UpdateInventoryItem): Promise<InventoryItem> {
    const client = await getApiClient();
    const { storeId } = await resolveStoreContext();
    const response = await client.put(
      `/api/stores/${encodeURIComponent(storeId)}/inventory/${encodeURIComponent(id)}`,
      toStoreInventoryRequest(data)
    );
    return normalizeInventoryItem((response.data ?? {}) as Record<string, unknown>);
  },

  async deleteInventory(id: string): Promise<void> {
    const client = await getApiClient();
    await client.delete(`/api/inventory/${id}`);
  },

  async enableTax(id: string): Promise<InventoryItem> {
    const client = await getApiClient();
    const response = await client.put(`/api/inventory/${id}/enable-tax`);
    return response.data;
  },

  async disableTax(id: string): Promise<InventoryItem> {
    const client = await getApiClient();
    const response = await client.put(`/api/inventory/${id}/disable-tax`);
    return response.data;
  },

  async addStock(id: string, quantity: number): Promise<InventoryItem> {
    const client = await getApiClient();
    const response = await client.put(`/api/inventory/${id}/add-stock/${quantity}`);
    return response.data;
  },

  async reduceStock(id: string, quantity: number): Promise<InventoryItem> {
    const client = await getApiClient();
    const response = await client.put(`/api/inventory/${id}/reduce-stock/${quantity}`);
    return response.data;
  },

  async getLowStock(threshold: number = 10): Promise<InventoryItem[]> {
    const items = await this.getInventory();
    return items.filter((item) => item.stockQuantity <= threshold);
  },

  async getByCategory(name: string): Promise<InventoryItem[]> {
    const items = await this.getInventory();
    const query = name.toLowerCase();
    return items.filter((item) => item.categories?.toLowerCase().includes(query));
  },

  async getBySubcategory(name: string): Promise<InventoryItem[]> {
    const items = await this.getInventory();
    const query = name.toLowerCase();
    return items.filter((item) => item.subCategory?.toLowerCase().includes(query));
  },

  async getByBrand(name: string): Promise<InventoryItem[]> {
    const items = await this.getInventory();
    const query = name.toLowerCase();
    return items.filter((item) => item.brand?.toLowerCase().includes(query));
  },

  async getMasterInventoryByCategory(code: string): Promise<MasterInventoryItem[]> {
    const client = await getApiClient();
    const response = await client.get(`/api/inventory/category/${encodeURIComponent(code)}`);
    const items = Array.isArray(response.data) ? response.data : [];
    return items.map((entry) => normalizeMasterInventoryItem((entry ?? {}) as Record<string, unknown>));
  },

  async getMasterInventoryBySubcategory(code: string): Promise<MasterInventoryItem[]> {
    const client = await getApiClient();
    const response = await client.get(`/api/inventory/subcategory/${encodeURIComponent(code)}`);
    const items = Array.isArray(response.data) ? response.data : [];
    return items.map((entry) => normalizeMasterInventoryItem((entry ?? {}) as Record<string, unknown>));
  },

  async getMasterInventoryByBrand(name: string): Promise<MasterInventoryItem[]> {
    const client = await getApiClient();
    const response = await client.get(`/api/inventory/brand/${encodeURIComponent(name)}`);
    const items = Array.isArray(response.data) ? response.data : [];
    return items.map((entry) => normalizeMasterInventoryItem((entry ?? {}) as Record<string, unknown>));
  },

  async getBrands(): Promise<Brand[]> {
    const client = await getApiClient();
    const response = await client.get('/api/brands');
    const brands = Array.isArray(response.data) ? response.data : [];
    return brands.map((entry) => normalizeBrand((entry ?? {}) as Record<string, unknown>));
  },

  async getDocs(): Promise<DocsResponse> {
    const client = await getApiClient();
    const response = await client.get('/api/docs');
    return response.data;
  },

  async parseBarcodeAi(payload: BarcodeParseRequest): Promise<ParsedProductResponse> {
    const client = await getApiClient();
    const response = await client.post('/api/inventory/ai/barcode/parse', payload);
    return response.data;
  },

  async enrichItem(payload: EnrichRequest): Promise<EnrichResponse> {
    const client = await getApiClient();
    const response = await client.post('/api/inventory/ai/enrich', payload);
    return response.data;
  },

  async getCategories(filters?: CategoryFilters): Promise<Category[]> {
    const client = await getApiClient();
    const params = {
      storeType: filters?.storeType,
      storeEthnicity: filters?.storeEthnicity,
    };
    const response = await client.get('/api/categories', { params });
    return response.data;
  },

  async getMeasurementUnits(): Promise<MeasurementUnit[]> {
    const client = await getApiClient();
    const response = await client.get('/api/measurement-units');
    return response.data;
  },

  // Subcategories
  async getSubcategories(categoryCode?: string): Promise<Subcategory[]> {
    const client = await getApiClient();
    const url = categoryCode
      ? `/api/subcategories?categoryCode=${encodeURIComponent(categoryCode)}`
      : '/api/subcategories';
    const response = await client.get(url);
    return response.data;
  },

  async getSubcategoryById(id: number): Promise<Subcategory> {
    const client = await getApiClient();
    const response = await client.get(`/api/subcategories/${id}`);
    return response.data;
  },

  async createSubcategory(data: CreateSubcategory): Promise<Subcategory> {
    const client = await getApiClient();
    const response = await client.post('/api/subcategories', data);
    return response.data;
  },

  async updateSubcategory(id: number, data: UpdateSubcategory): Promise<Subcategory> {
    const client = await getApiClient();
    const response = await client.put(`/api/subcategories/${id}`, data);
    return response.data;
  },

  async deleteSubcategory(id: number): Promise<void> {
    const client = await getApiClient();
    await client.delete(`/api/subcategories/${id}`);
  },

  async lookupUpcItem(productCode: string): Promise<UpcItemDbResponse> {
    const requestStartedAt = Date.now();
    const requestUrl = `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(productCode)}`;

    console.log('[API][REQUEST]', {
      requestId: `upc-${requestStartedAt}`,
      service: 'external-upc',
      method: 'GET',
      url: requestUrl,
      params: { upc: productCode },
    });

    try {
      const response = await axios.get<UpcItemDbResponse>(
        requestUrl,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[API][RESPONSE]', {
        requestId: `upc-${requestStartedAt}`,
        service: 'external-upc',
        method: 'GET',
        url: requestUrl,
        status: response.status,
        durationMs: Date.now() - requestStartedAt,
      });
      
      // Check if the API returned an error code in the response data
      if (response.data.code !== 'OK') {
        const errorCode = response.data.code;
        console.error('[UPC Item DB] API Error:', {
          code: errorCode,
          productCode,
          response: response.data,
        });
        
        switch (errorCode) {
          case 'INVALID_QUERY':
            throw new Error('Invalid query: missing required parameters. Please check the product code format.');
          case 'NOT_FOUND':
            throw new Error('Product not found. Please check the UPC code and try again.');
          case 'EXCEED_LIMIT':
            throw new Error('Request limit exceeded. Please try again later.');
          case 'SERVER_ERR':
            throw new Error('Server error. Please try again later.');
          default:
            console.error('[UPC Item DB] Unknown error code:', errorCode);
            throw new Error('Failed to fetch product details. Please try again.');
        }
      }
      
      // Also check if total is 0 (no items found)
      if (response.data.total === 0) {
        console.error('[UPC Item DB] No items found:', {
          productCode,
          response: response.data,
        });
        throw new Error('Product not found. Please check the UPC code and try again.');
      }
      
      return response.data;
    } catch (error) {
      console.log('[API][ERROR]', {
        requestId: `upc-${requestStartedAt}`,
        service: 'external-upc',
        method: 'GET',
        url: requestUrl,
        durationMs: Date.now() - requestStartedAt,
        message: error instanceof Error ? error.message : 'Unknown error',
      });

      // Re-throw if it's already an Error (from our code above)
      if (error instanceof Error && (
          error.message.includes('Invalid query') || 
          error.message.includes('Product not found') ||
          error.message.includes('Request limit exceeded') ||
          error.message.includes('Server error') ||
          error.message.includes('Failed to fetch')
        )) {
        console.error('[UPC Item DB] Error (already handled):', {
          message: error.message,
          productCode,
          error,
        });
        throw error;
      }
      
      // Handle axios errors
      if (axios.isAxiosError(error)) {
        console.error('[UPC Item DB] Axios Error:', {
          productCode,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          code: error.code,
          config: {
            url: error.config?.url,
            method: error.config?.method,
          },
        });
        
        // Check HTTP status codes
        if (error.response?.status === 400) {
          throw new Error('Invalid query: missing required parameters. Please check the product code format.');
        }
        if (error.response?.status === 404) {
          throw new Error('Product not found. Please check the UPC code and try again.');
        }
        if (error.response?.status === 429) {
          throw new Error('Request limit exceeded. Please try again later.');
        }
        if (error.response?.status === 500) {
          throw new Error('Server error. Please try again later.');
        }
        
        // Check response data code if available
        if (error.response?.data?.code) {
          const errorCode = error.response.data.code;
          console.error('[UPC Item DB] Response data error code:', errorCode);
          
          switch (errorCode) {
            case 'INVALID_QUERY':
              throw new Error('Invalid query: missing required parameters. Please check the product code format.');
            case 'NOT_FOUND':
              throw new Error('Product not found. Please check the UPC code and try again.');
            case 'EXCEED_LIMIT':
              throw new Error('Request limit exceeded. Please try again later.');
            case 'SERVER_ERR':
              throw new Error('Server error. Please try again later.');
            default:
              console.error('[UPC Item DB] Unknown response data error code:', errorCode);
              throw new Error(error.response.data.message || 'Failed to fetch product details. Please try again.');
          }
        }
        
        throw new Error(error.response?.data?.message || 'Failed to fetch product details. Please try again.');
      }
      
      // Handle network/timeout errors
      if (error instanceof Error) {
        console.error('[UPC Item DB] Network/Timeout Error:', {
          productCode,
          message: error.message,
          error,
        });
        
        if (error.message.includes('timeout')) {
          throw new Error('Request timed out. Please check your connection and try again.');
        }
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      // Unknown error type
      console.error('[UPC Item DB] Unknown Error:', {
        productCode,
        error,
        errorType: typeof error,
      });
      throw new Error('An unexpected error occurred. Please try again.');
    }
  },
};
