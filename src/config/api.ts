import axios, { AxiosError, AxiosHeaders, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import {
  getBaseUrl,
  getInventoryServiceBaseUrl,
  getUserServiceBaseUrl,
} from '@/utils/storage';
import { handleApiError } from '@/utils/errorHandler';
import { getAccessToken, getInternalUserId } from '@/utils/auth';

type ApiService = 'inventory' | 'user';
const apiClients: Partial<Record<ApiService, AxiosInstance>> = {};
let requestCounter = 0;

interface RequestLogMetadata {
  requestId: string;
  startedAt: number;
  service: ApiService;
}

interface RequestConfigWithMetadata extends InternalAxiosRequestConfig {
  _logMetadata?: RequestLogMetadata;
}

function nextRequestId(service: ApiService): string {
  requestCounter += 1;
  return `${service}-${Date.now()}-${requestCounter}`;
}

function buildRequestUrl(config: InternalAxiosRequestConfig): string {
  const baseUrl = config.baseURL ?? '';
  const path = config.url ?? '';
  if (!baseUrl) return path;
  if (!path) return baseUrl;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function sanitizeHeaders(headers: InternalAxiosRequestConfig['headers']): Record<string, string> {
  const axiosHeaders = AxiosHeaders.from(headers);
  const normalizedHeaders = axiosHeaders.toJSON();
  const sanitizedHeaders: Record<string, string> = {};

  Object.entries(normalizedHeaders).forEach(([key, value]) => {
    if (typeof value === 'undefined') return;
    if (key.toLowerCase() === 'authorization') {
      sanitizedHeaders[key] = '[REDACTED]';
      return;
    }
    sanitizedHeaders[key] = String(value);
  });

  return sanitizedHeaders;
}

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
      const configWithMetadata = config as RequestConfigWithMetadata;
      const accessToken = await getAccessToken();
      const ownerId = await getInternalUserId();
      const requestId = nextRequestId(service);

      if (accessToken) {
        const headers = AxiosHeaders.from(config.headers);
        headers.set('Authorization', `Bearer ${accessToken}`);
        config.headers = headers;
      }

      configWithMetadata._logMetadata = {
        requestId,
        startedAt: Date.now(),
        service,
      };

      console.log('[API][REQUEST]', {
        requestId,
        service,
        ownerId: ownerId ?? 'not-set',
        method: config.method?.toUpperCase() ?? 'GET',
        url: buildRequestUrl(config),
        params: config.params ?? null,
        data: config.data ?? null,
        headers: sanitizeHeaders(config.headers),
      });
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response) => {
      const configWithMetadata = response.config as RequestConfigWithMetadata;
      const startedAt = configWithMetadata._logMetadata?.startedAt ?? Date.now();
      const durationMs = Date.now() - startedAt;

      console.log('[API][RESPONSE]', {
        requestId: configWithMetadata._logMetadata?.requestId ?? 'unknown',
        service: configWithMetadata._logMetadata?.service ?? service,
        method: response.config.method?.toUpperCase() ?? 'GET',
        url: buildRequestUrl(response.config),
        status: response.status,
        durationMs,
      });
      return response;
    },
    (error: AxiosError) => {
      const config = (error.config ?? {}) as RequestConfigWithMetadata;
      const startedAt = config._logMetadata?.startedAt ?? Date.now();
      const durationMs = Date.now() - startedAt;

      console.log('[API][ERROR]', {
        requestId: config._logMetadata?.requestId ?? 'unknown',
        service: config._logMetadata?.service ?? service,
        method: config.method?.toUpperCase() ?? 'GET',
        url: buildRequestUrl(config),
        status: error.response?.status ?? null,
        durationMs,
        message: error.message,
        responseData: error.response?.data ?? null,
      });

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
