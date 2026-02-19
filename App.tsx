import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import Toast from 'react-native-toast-message';
import {
  Auth0Provider,
  LocalAuthenticationLevel,
  LocalAuthenticationStrategy,
  useAuth0,
} from 'react-native-auth0';

import { RootStackParamList } from '@/navigation/types';
import { HomeScreen } from '@/screens/HomeScreen';
import InventoryListScreen from '@/screens/InventoryListScreen';
import { LiveOrdersScreen } from '@/screens/LiveOrdersScreen';
import { OrdersScreen } from '@/screens/OrdersScreen';
import { MasterInventoryScreen } from '@/screens/MasterInventoryScreen';
import { MasterInventoryReviewScreen } from '@/screens/MasterInventoryReviewScreen';
import { OrderApprovalScreen } from '@/screens/OrderApprovalScreen';
import ItemDetailScreen from '@/screens/ItemDetailScreen';
import ItemFormScreen from '@/screens/ItemFormScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import BarcodeScannerScreen from '@/screens/BarcodeScannerScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { auth0Config } from '@/config/auth0';
import { queryClient, persistOptions } from '@/config/queryClient';
import { clearAccessToken, setAccessToken, setAuth0Id } from '@/utils/auth';
import { resolveStoreContext } from '@/utils/storeContext';
import { inventoryService } from '@/api/inventory.service';
import { inventoryKeys } from '@/hooks/useInventory';

const Stack = createNativeStackNavigator<RootStackParamList>();

function createLocalAuthOptions() {
  return {
    title: 'Unlock IntelliStock',
    subtitle: 'Confirm your identity',
    description: 'Authenticate to access your inventory',
    cancelTitle: 'Cancel',
    evaluationPolicy: LocalAuthenticationStrategy.deviceOwnerWithBiometrics,
    authenticationLevel: LocalAuthenticationLevel.strong,
    deviceCredentialFallback: true,
  };
}

const screenOptions = {
  headerStyle: {
    backgroundColor: '#ffffff',
  },
  headerTintColor: '#0b0b0b',
  headerTitleStyle: {
    fontWeight: '700' as const,
  },
};

function AuthenticatedStack() {
  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="InventoryList"
        component={InventoryListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LiveOrders"
        component={LiveOrdersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MasterInventory"
        component={MasterInventoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MasterInventoryReview"
        component={MasterInventoryReviewScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OrderApproval"
        component={OrderApprovalScreen}
        options={{ headerShown: false }}
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
  );
}

function UnauthenticatedStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function AuthGate() {
  const { user, isLoading, getCredentials } = useAuth0();
  const [isReady, setIsReady] = useState(false);
  const hasShownStoreContextWarning = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function warmStoreContextAndCache() {
      try {
        await resolveStoreContext();

        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: inventoryKeys.selectedStoreProfile(),
            queryFn: () => inventoryService.getSelectedStoreProfile(),
            staleTime: 30 * 60 * 1000,
          }),
          queryClient.prefetchQuery({
            queryKey: inventoryKeys.lists(),
            queryFn: () => inventoryService.getInventory(),
            staleTime: 2 * 60 * 1000,
          }),
        ]);
      } catch (error) {
        console.warn('Failed to resolve store context after login:', error);
        if (hasShownStoreContextWarning.current) return;

        hasShownStoreContextWarning.current = true;
        Toast.show({
          type: 'error',
          text1: 'Store setup incomplete',
          text2: 'Could not prepare store context. Open Inventory and tap retry.',
        });
      }
    }

    async function syncSession() {
      setIsReady(false);

      if (!user) {
        await clearAccessToken();
        if (isMounted) setIsReady(true);
        return;
      }

      try {
        if (user.sub) await setAuth0Id(user.sub);
        const credentials = await getCredentials();
        if (credentials?.accessToken) await setAccessToken(credentials.accessToken);
      } catch (error) {
        console.warn('Failed to load credentials:', error);
      }

      if (!isMounted) return;
      setIsReady(true);
      void warmStoreContextAndCache();
    }

    syncSession();

    return () => {
      isMounted = false;
    };
  }, [getCredentials, user]);

  if (isLoading || !isReady) return <LoadingSpinner text="Preparing session..." />;
  if (user) return <AuthenticatedStack />;
  return <UnauthenticatedStack />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
        <Auth0Provider
          domain={auth0Config.domain}
          clientId={auth0Config.clientId}
          localAuthenticationOptions={createLocalAuthOptions()}
        >
          <NavigationContainer>
            <AuthGate />
          </NavigationContainer>
        </Auth0Provider>
        <Toast />
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
