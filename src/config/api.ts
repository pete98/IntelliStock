import axios, { AxiosHeaders, AxiosInstance } from 'axios';
import {
  getBaseUrl,
  getInventoryServiceBaseUrl,
  getUserServiceBaseUrl,
} from '@/utils/storage';
import { handleApiError } from '@/utils/errorHandler';
import { getAccessToken, getInternalUserId } from '@/utils/auth';

type ApiService = 'inventory' | 'user';
const apiClients: Partial<Record<ApiService, AxiosInstance>> = {};

async function resolveBaseUrl(service: ApiService): Promise<string> {
  if (service === 'user') return getUserServiceBaseUrl();
  if (service === 'inventory') return getInventoryServiceBaseUrl();
  return getBaseUrl();
}

export async function createApiClient(service: ApiService = 'inventory'): Promise<AxiosInstance> {
  const baseURL = await resolveBaseUrl(service);
  
  const client = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  client.interceptors.request.use(
    async (config) => {
      const accessToken = await getAccessToken();
      const ownerId = await getInternalUserId();

      if (accessToken) {
        const headers = AxiosHeaders.from(config.headers);
        headers.set('Authorization', `Bearer ${accessToken}`);
        config.headers = headers;
      }

      console.log(`[API] ownerId=${ownerId ?? 'not-set'}`);
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

export async function getApiClient(service: ApiService = 'inventory'): Promise<AxiosInstance> {
  if (!apiClients[service]) {
    apiClients[service] = await createApiClient(service);
  }
  return apiClients[service] as AxiosInstance;
}

export async function getInventoryApiClient(): Promise<AxiosInstance> {
  return getApiClient('inventory');
}

export async function getUserApiClient(): Promise<AxiosInstance> {
  return getApiClient('user');
}

export async function updateApiClientBaseUrl(service?: ApiService): Promise<void> {
  if (service) {
    apiClients[service] = await createApiClient(service);
    return;
  }

  apiClients.inventory = await createApiClient('inventory');
  apiClients.user = await createApiClient('user');
}
