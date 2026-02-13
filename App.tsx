import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
import { clearAccessToken, setAccessToken } from '@/utils/auth';

const Stack = createNativeStackNavigator<RootStackParamList>();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

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
    backgroundColor: '#3b82f6',
  },
  headerTintColor: '#ffffff',
  headerTitleStyle: {
    fontWeight: 'bold' as const,
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

  useEffect(() => {
    let isMounted = true;

    async function syncSession() {
      setIsReady(false);

      if (!user) {
        await clearAccessToken();
        if (isMounted) setIsReady(true);
        return;
      }

      try {
        const credentials = await getCredentials();
        if (credentials?.accessToken) await setAccessToken(credentials.accessToken);
      } catch (error) {
        console.warn('Failed to load credentials:', error);
      } finally {
        if (isMounted) setIsReady(true);
      }
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
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
