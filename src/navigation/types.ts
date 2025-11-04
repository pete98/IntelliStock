export type RootStackParamList = {
  InventoryList: { scannedBarcode?: string } | undefined;
  ItemDetail: { itemId: string };
  ItemForm: { itemId?: string; scannedBarcode?: string };
  Settings: undefined;
  BarcodeScanner: { 
    source: 'form' | 'list';
    itemId?: string;
  };
};
