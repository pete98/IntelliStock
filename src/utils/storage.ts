import * as SecureStore from 'expo-secure-store';

const BASE_URL_KEY = 'BASE_URL';
const USER_SERVICE_BASE_URL_KEY = 'USER_SERVICE_BASE_URL';
const INVENTORY_SERVICE_BASE_URL_KEY = 'INVENTORY_SERVICE_BASE_URL';
const DEFAULT_BASE_URL = 'https://cd7ba7c78881.ngrok-free.app/';
const DEFAULT_USER_SERVICE_BASE_URL = 'https://ujndmzdbevx2.share.zrok.io';

export async function getBaseUrl(): Promise<string> {
  try {
    const storedUrl = await SecureStore.getItemAsync(BASE_URL_KEY);
    return storedUrl || DEFAULT_BASE_URL;
  } catch (error) {
    console.warn('Failed to get base URL from storage:', error);
    return DEFAULT_BASE_URL;
  }
}

export async function setBaseUrl(url: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(BASE_URL_KEY, url);
  } catch (error) {
    console.error('Failed to save base URL to storage:', error);
    throw error;
  }
}

export async function resetBaseUrl(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(BASE_URL_KEY);
  } catch (error) {
    console.error('Failed to reset base URL in storage:', error);
    throw error;
  }
}

export async function getUserServiceBaseUrl(): Promise<string> {
  try {
    const storedUrl = await SecureStore.getItemAsync(USER_SERVICE_BASE_URL_KEY);
    if (storedUrl) return storedUrl;

    return DEFAULT_USER_SERVICE_BASE_URL;
  } catch (error) {
    console.warn('Failed to get user service base URL from storage:', error);
    return DEFAULT_USER_SERVICE_BASE_URL;
  }
}

export async function setUserServiceBaseUrl(url: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(USER_SERVICE_BASE_URL_KEY, url);
  } catch (error) {
    console.error('Failed to save user service base URL to storage:', error);
    throw error;
  }
}

export async function resetUserServiceBaseUrl(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(USER_SERVICE_BASE_URL_KEY);
  } catch (error) {
    console.error('Failed to reset user service base URL in storage:', error);
    throw error;
  }
}

export async function getInventoryServiceBaseUrl(): Promise<string> {
  try {
    const storedUrl = await SecureStore.getItemAsync(INVENTORY_SERVICE_BASE_URL_KEY);
    if (storedUrl) return storedUrl;

    const legacyBaseUrl = await getBaseUrl();
    return legacyBaseUrl;
  } catch (error) {
    console.warn('Failed to get inventory service base URL from storage:', error);
    return DEFAULT_BASE_URL;
  }
}

export async function setInventoryServiceBaseUrl(url: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(INVENTORY_SERVICE_BASE_URL_KEY, url);
  } catch (error) {
    console.error('Failed to save inventory service base URL to storage:', error);
    throw error;
  }
}

export async function resetInventoryServiceBaseUrl(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(INVENTORY_SERVICE_BASE_URL_KEY);
  } catch (error) {
    console.error('Failed to reset inventory service base URL in storage:', error);
    throw error;
  }
}
