import axios, { AxiosInstance } from 'axios';
import { getBaseUrl } from '@/utils/storage';
import { handleApiError } from '@/utils/errorHandler';

let apiClient: AxiosInstance | null = null;

export async function createApiClient(): Promise<AxiosInstance> {
  const baseURL = await getBaseUrl();
  
  const client = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  client.interceptors.request.use(
    (config) => {
      console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      handleApiError(error);
      return Promise.reject(error);
    }
  );

  return client;
}

export async function getApiClient(): Promise<AxiosInstance> {
  if (!apiClient) {
    apiClient = await createApiClient();
  }
  return apiClient;
}

export async function updateApiClientBaseUrl(): Promise<void> {
  apiClient = await createApiClient();
}



