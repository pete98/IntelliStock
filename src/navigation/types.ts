import { MasterSelectionDraft } from '@/types/inventory';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  InventoryList: { scannedBarcode?: string } | undefined;
  Orders: undefined;
  LiveOrders: undefined;
  MasterInventory: undefined;
  MasterInventoryReview: { selectedItems: MasterSelectionDraft[] };
  OrderApproval: { orderId: string };
  ItemDetail: { itemId: string };
  ItemForm: { itemId?: string; scannedBarcode?: string };
  Settings: undefined;
  BarcodeScanner: { 
    source: 'form' | 'list';
    itemId?: string;
  };
};
