import { getInventoryApiClient, getUserApiClient } from '@/config/api';
import {
  getAuth0Id,
  getInternalUserId,
  getOwnerStoreIds,
  getSelectedStoreId,
  setInternalUserId,
  setOwnerStoreIds,
  setSelectedStoreId,
} from '@/utils/auth';

interface StoreContext {
  auth0Id: string;
  internalUserId: string;
  ownerStoreIds: string[];
  storeId: string;
}

function extractIdFromUnknown(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const candidateKeys = ['id', 'userId', 'internalUserId', 'storeId', 'store_id'];

  for (const key of candidateKeys) {
    const candidate = record[key];
    if (candidate === null || candidate === undefined) continue;
    if (typeof candidate === 'string' || typeof candidate === 'number') return String(candidate);
  }

  return null;
}

function parseInternalUserId(payload: unknown): string | null {
  if (typeof payload === 'string' || typeof payload === 'number') return String(payload);
  if (typeof payload !== 'object' || payload === null) return null;

  const record = payload as Record<string, unknown>;
  const direct = extractIdFromUnknown(record);
  if (direct) return direct;

  return null;
}

function parseStoreIds(payload: unknown): string[] {
  const payloadArray = Array.isArray(payload)
    ? payload
    : typeof payload === 'object' && payload !== null
      ? ((payload as Record<string, unknown>).stores as unknown[] | undefined) ?? []
      : [];

  return payloadArray
    .map((entry) => extractIdFromUnknown(entry))
    .filter((storeId): storeId is string => Boolean(storeId && storeId.trim()))
    .map((storeId) => storeId.trim());
}

export async function resolveStoreContext(forceRefresh: boolean = false): Promise<StoreContext> {
  const auth0Id = await getAuth0Id();
  if (!auth0Id) throw new Error('Missing Auth0 user id. Please sign in again.');

  let internalUserId = forceRefresh ? null : await getInternalUserId();
  let ownerStoreIds = forceRefresh ? [] : await getOwnerStoreIds();
  const cachedSelectedStoreId = forceRefresh ? null : await getSelectedStoreId();
  const userClient = await getUserApiClient();
  const inventoryClient = await getInventoryApiClient();

  if (!internalUserId) {
    const userResponse = await userClient.get('/api/users/id-by-auth0', {
      params: { auth0Id },
    });
    internalUserId = parseInternalUserId(userResponse.data);
    if (!internalUserId) throw new Error('Unable to resolve internal user id from auth0 id.');

    await setInternalUserId(internalUserId);
  }

  if (ownerStoreIds.length === 0) {
    const storesResponse = await inventoryClient.get('/api/stores/by-owner', {
      params: { ownerId: internalUserId },
    });
    ownerStoreIds = parseStoreIds(storesResponse.data);
    if (ownerStoreIds.length === 0) throw new Error('No stores found for this owner.');

    await setOwnerStoreIds(ownerStoreIds);
  }

  const isSelectedStoreValid =
    cachedSelectedStoreId !== null && ownerStoreIds.includes(cachedSelectedStoreId);
  const selectedStoreId = isSelectedStoreValid ? cachedSelectedStoreId : ownerStoreIds[0];
  await setSelectedStoreId(selectedStoreId);

  return {
    auth0Id,
    internalUserId,
    ownerStoreIds,
    storeId: selectedStoreId,
  };
}
