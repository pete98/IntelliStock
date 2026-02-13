export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  InventoryList: { scannedBarcode?: string } | undefined;
  LiveOrders: undefined;
  MasterInventory: undefined;
  MasterInventoryReview: { selectedItems: Array<{
    id: string;
    name: string;
    variant: string;
    price: string;
    quantity: string;
  }> };
  OrderApproval: undefined;
  ItemDetail: { itemId: string };
  ItemForm: { itemId?: string; scannedBarcode?: string };
  Settings: undefined;
  BarcodeScanner: { 
    source: 'form' | 'list';
    itemId?: string;
  };
};
