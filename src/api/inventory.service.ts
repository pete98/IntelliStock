import axios from 'axios';
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
  UpcItemDbResponse,
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

  async lookupUpcItem(productCode: string): Promise<UpcItemDbResponse> {
    try {
      const response = await axios.get<UpcItemDbResponse>(
        `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(productCode)}`,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
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


