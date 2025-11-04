import { getApiClient } from '@/config/api';
import {
  InventoryItem,
  CreateInventoryItem,
  UpdateInventoryItem,
  DocsResponse,
  StockOperation,
  CategoryFilter,
  BarcodeParseRequest,
  ParsedProductResponse,
  Category,
  MeasurementUnit,
  Subcategory,
  CreateSubcategory,
  UpdateSubcategory,
  EnrichRequest,
  EnrichResponse,
} from '@/types/inventory';

export const inventoryService = {
  async getInventory(): Promise<InventoryItem[]> {
    const client = await getApiClient();
    const response = await client.get('/api/inventory');
    return response.data;
  },

  async createInventory(data: CreateInventoryItem): Promise<InventoryItem> {
    const client = await getApiClient();
    const response = await client.post('/api/inventory', data);
    return response.data;
  },

  async getInventoryById(id: string): Promise<InventoryItem> {
    const client = await getApiClient();
    const response = await client.get(`/api/inventory/${id}`);
    return response.data;
  },

  async updateInventory(id: string, data: UpdateInventoryItem): Promise<InventoryItem> {
    const client = await getApiClient();
    const response = await client.put(`/api/inventory/${id}`, data);
    return response.data;
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
    const client = await getApiClient();
    const response = await client.get(`/api/inventory/low-stock?threshold=${threshold}`);
    return response.data;
  },

  async getByCategory(name: string): Promise<InventoryItem[]> {
    const client = await getApiClient();
    const response = await client.get(`/api/inventory/category/${encodeURIComponent(name)}`);
    return response.data;
  },

  async getBySubcategory(name: string): Promise<InventoryItem[]> {
    const client = await getApiClient();
    const response = await client.get(`/api/inventory/subcategory/${encodeURIComponent(name)}`);
    return response.data;
  },

  async getByBrand(name: string): Promise<InventoryItem[]> {
    const client = await getApiClient();
    const response = await client.get(`/api/inventory/brand/${encodeURIComponent(name)}`);
    return response.data;
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

  async getCategories(): Promise<Category[]> {
    const client = await getApiClient();
    const response = await client.get('/api/categories');
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
};


