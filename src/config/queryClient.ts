import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Query, QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

const TWO_MINUTES_MS = 2 * 60 * 1000;
const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const QUERY_CACHE_KEY = 'INTELLISTOCK_QUERY_CACHE';

function shouldPersistQuery(query: Query): boolean {
  return query.state.status === 'success';
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: TWO_MINUTES_MS,
      gcTime: THIRTY_MINUTES_MS,
      retry: 1,
    },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: QUERY_CACHE_KEY,
  throttleTime: 1000,
});

export const persistOptions = {
  persister: queryPersister,
  maxAge: ONE_DAY_MS,
  buster: Constants.expoConfig?.version ?? 'dev',
  dehydrateOptions: {
    shouldDehydrateMutation: () => false,
    shouldDehydrateQuery: shouldPersistQuery,
  },
};

