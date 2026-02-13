export interface InventoryItem {
  id: string;
  itemName: string;
  productCode: string;
  sku: string;
  price: number;
  stockQuantity: number;
  categories?: string;
  subCategory?: string;
  brand?: string;
  modifiers?: string;
  labels?: string;
  taxRate?: number;
  taxEnabled: boolean;
  fees?: string;
  description?: string;
  imageUrl?: string;
  calories?: number;
  weight?: number;
  weightUnit?: string;
  popularityScore?: number;
}

export interface CreateInventoryItem {
  itemName: string;
  productCode: string;
  sku: string;
  price: number;
  stockQuantity: number;
  categories?: string;
  subCategory?: string;
  brand?: string;
  modifiers?: string;
  labels?: string;
  taxRate?: number;
  taxEnabled: boolean;
  fees?: string;
  description?: string;
  imageUrl?: string;
  calories?: number;
  weight?: number;
  weightUnit?: string;
  popularityScore?: number;
}

export interface UpdateInventoryItem {
  itemName?: string;
  productCode?: string;
  sku?: string;
  price?: number;
  stockQuantity?: number;
  categories?: string;
  subcategoryCode?: string;
  modifiers?: string;
  labels?: string;
  taxRate?: number;
  taxEnabled?: boolean;
  fees?: string;
  description?: string;
  imageUrl?: string;
  calories?: number;
  weight?: number;
  weightUnit?: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export interface DocsResponse {
  links: Array<{
    name: string;
    url: string;
  }>;
}

export interface StockOperation {
  id: string;
  quantity: number;
}

export interface CategoryFilter {
  name: string;
}

export interface BarcodeParseRequest {
  barcode: string;
  merchantContext?: string;
  forceRefresh?: boolean;
}

export interface ParsedProductResponse {
  itemName?: string;
  productCode?: string;
  sku?: string;
  price?: number;
  stockQuantity?: number;
  categories?: string;
  modifiers?: string;
  labels?: string;
  taxRate?: number;
  taxEnabled?: boolean;
  fees?: string;
  description?: string;
  imageUrl?: string;
  calories?: number;
  weight?: number;
  weightUnit?: string;
  warnings?: string[];
}

export interface EnrichRequest {
  itemName: string;
  category: string;
  subCategory?: string;
  brand?: string;
}

export interface EnrichResponse {
  labels?: string;
  description?: string;
  confidence?: number;
  warnings?: string[];
}

export interface Category {
  id: number;
  code: string;
  displayName: string;
}

export interface MeasurementUnit {
  id: number;
  code: string;
  displayName: string;
  unitType: 'WEIGHT' | 'VOLUME' | 'COUNT';
}

export interface Subcategory {
  id: number;
  code: string;
  displayName: string;
  description?: string;
  categoryId: number;
  categoryCode: string;
  categoryDisplayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubcategory {
  code: string;
  displayName: string;
  description?: string;
  categoryCode: string;
}

export interface UpdateSubcategory {
  code?: string;
  displayName?: string;
  description?: string;
  categoryCode?: string;
}

// UPC Item DB API Types
export interface UpcItemDbOffer {
  merchant: string;
  domain: string;
  title: string;
  currency: string;
  list_price: string;
  price: number;
  shipping: string;
  condition: string;
  availability: string;
  link: string;
  updated_t: number;
}

export interface UpcItemDbItem {
  ean: string;
  title: string;
  description: string;
  upc: string;
  brand: string;
  model: string;
  color: string;
  size: string;
  dimension: string;
  weight: string;
  category: string;
  currency: string;
  lowest_recorded_price: number;
  highest_recorded_price: number;
  images: string[];
  offers: UpcItemDbOffer[];
  asin: string;
  elid: string;
}

export interface UpcItemDbResponse {
  code: string;
  total: number;
  offset: number;
  items: UpcItemDbItem[];
}


