import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { RootStackParamList } from '@/navigation/types';
import InventoryListScreen from '@/screens/InventoryListScreen';
import ItemDetailScreen from '@/screens/ItemDetailScreen';
import ItemFormScreen from '@/screens/ItemFormScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import BarcodeScannerScreen from '@/screens/BarcodeScannerScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="InventoryList"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#3b82f6',
              },
              headerTintColor: '#ffffff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen
              name="InventoryList"
              component={InventoryListScreen}
              options={{ title: 'Inventory' }}
            />
            <Stack.Screen
              name="ItemDetail"
              component={ItemDetailScreen}
              options={{ title: 'Item Details' }}
            />
            <Stack.Screen
              name="ItemForm"
              component={ItemFormScreen}
              options={({ route }) => ({
                title: route.params?.itemId ? 'Edit Item' : 'Add Item',
              })}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ title: 'Settings' }}
            />
            <Stack.Screen
              name="BarcodeScanner"
              component={BarcodeScannerScreen}
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <Toast />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

