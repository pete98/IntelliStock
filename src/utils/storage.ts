import * as SecureStore from 'expo-secure-store';

const BASE_URL_KEY = 'BASE_URL';
const DEFAULT_BASE_URL = 'https://cd7ba7c78881.ngrok-free.app/';

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

