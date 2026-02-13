import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'AUTH0_ACCESS_TOKEN';

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

export async function clearAccessToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.warn('Failed to clear access token:', error);
  }
}
