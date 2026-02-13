import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'AUTH0_ACCESS_TOKEN';
const AUTH0_USER_ID_KEY = 'AUTH0_USER_ID';
const INTERNAL_USER_ID_KEY = 'INTERNAL_USER_ID';
const OWNER_STORE_IDS_KEY = 'OWNER_STORE_IDS';
const SELECTED_STORE_ID_KEY = 'SELECTED_STORE_ID';

export async function getAccessToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    return token ?? null;
  } catch (error) {
    console.warn('Failed to read access token:', error);
    return null;
  }
}

export async function setAccessToken(token: string): Promise<void> {
  if (!token) return;

  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  } catch (error) {
    console.warn('Failed to store access token:', error);
  }
}

export async function getAuth0Id(): Promise<string | null> {
  try {
    const auth0Id = await SecureStore.getItemAsync(AUTH0_USER_ID_KEY);
    return auth0Id ?? null;
  } catch (error) {
    console.warn('Failed to read Auth0 user id:', error);
    return null;
  }
}

export async function setAuth0Id(auth0Id: string): Promise<void> {
  if (!auth0Id) return;

  try {
    await SecureStore.setItemAsync(AUTH0_USER_ID_KEY, auth0Id);
  } catch (error) {
    console.warn('Failed to store Auth0 user id:', error);
  }
}

export async function getInternalUserId(): Promise<string | null> {
  try {
    const internalUserId = await SecureStore.getItemAsync(INTERNAL_USER_ID_KEY);
    return internalUserId ?? null;
  } catch (error) {
    console.warn('Failed to read internal user id:', error);
    return null;
  }
}

export async function setInternalUserId(internalUserId: string): Promise<void> {
  if (!internalUserId) return;

  try {
    await SecureStore.setItemAsync(INTERNAL_USER_ID_KEY, internalUserId);
  } catch (error) {
    console.warn('Failed to store internal user id:', error);
  }
}

export async function getOwnerStoreIds(): Promise<string[]> {
  try {
    const rawStoreIds = await SecureStore.getItemAsync(OWNER_STORE_IDS_KEY);
    if (!rawStoreIds) return [];

    const parsedStoreIds = JSON.parse(rawStoreIds);
    if (!Array.isArray(parsedStoreIds)) return [];

    return parsedStoreIds
      .map((storeId: unknown) => (storeId === null || storeId === undefined ? '' : String(storeId).trim()))
      .filter((storeId: string) => storeId.length > 0);
  } catch (error) {
    console.warn('Failed to read owner store ids:', error);
    return [];
  }
}

export async function setOwnerStoreIds(storeIds: string[]): Promise<void> {
  try {
    await SecureStore.setItemAsync(OWNER_STORE_IDS_KEY, JSON.stringify(storeIds));
  } catch (error) {
    console.warn('Failed to store owner store ids:', error);
  }
}

export async function getSelectedStoreId(): Promise<string | null> {
  try {
    const selectedStoreId = await SecureStore.getItemAsync(SELECTED_STORE_ID_KEY);
    return selectedStoreId ?? null;
  } catch (error) {
    console.warn('Failed to read selected store id:', error);
    return null;
  }
}

export async function setSelectedStoreId(storeId: string): Promise<void> {
  if (!storeId) return;

  try {
    await SecureStore.setItemAsync(SELECTED_STORE_ID_KEY, storeId);
  } catch (error) {
    console.warn('Failed to store selected store id:', error);
  }
}

export async function clearAccessToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(AUTH0_USER_ID_KEY);
    await SecureStore.deleteItemAsync(INTERNAL_USER_ID_KEY);
    await SecureStore.deleteItemAsync(OWNER_STORE_IDS_KEY);
    await SecureStore.deleteItemAsync(SELECTED_STORE_ID_KEY);
  } catch (error) {
    console.warn('Failed to clear access token:', error);
  }
}
