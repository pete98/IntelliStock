## IntelliStock Project Snapshot

- Purpose: Expo-managed React Native (SDK 54) inventory manager targeting mobile and web via React Navigation.
- Architecture: `App.tsx` wraps the stack navigator with React Query, Toast notifications, and Safe Area support.
- Entry Point: `index.js` registers the root `App` component for Expo; new architecture toggled on in `app.json`.
- Tooling: TypeScript-first setup (`tsconfig.json`), Metro bundler config, and Expo scripts (`start`, `android`, `ios`, `web`).

## Key Product Flows
- `src/screens/InventoryListScreen.tsx`: searchable list view with low-stock filter, pull-to-refresh, and barcode shortcut.
- `src/screens/ItemDetailScreen.tsx`: rich detail view with stock/tax actions, confirmation dialogs, and formatting helpers.
- `src/screens/ItemFormScreen.tsx`: barcode-aware CRUD form powered by `react-hook-form` + Zod validation.
- `src/screens/BarcodeScannerScreen.tsx` and `src/screens/SettingsScreen.tsx`: modal scanning workflow and base URL settings.

## Data + Hooks
- `src/api/inventory.service.ts`: axios client calls (`getApiClient`) for CRUD, stock ops, tax toggles, docs endpoint.
- `src/config/api.ts`: lazy axios instance creation with base URL persistence, interceptors, and shared error handling.
- `src/hooks/useInventory.ts`: React Query hooks (list/detail/low-stock/category/docs) plus mutations that invalidate caches and surface toasts.
- `src/utils/format.ts`, `src/utils/errorHandler.ts`, `src/utils/validation.ts`: currency/stock helpers, toast-based error reporting, and schema validation.

## UI Toolkit
- Components (`src/components/*.tsx`): reusable badge, confirm dialog, empty/error states, item cards, and loading spinner wired to theme tokens.
- Theme tokens (`src/config/theme.ts`): centralized colors, typography, spacing, shadows reused across screens.

## Housekeeping
- Removed stray duplicate directories (`src/api 3`, `src/components 3`, `src/config 3`, `src/hooks 3`, `src/screens 3`, `src/types 3`, `src/utils 3`).
- `node_modules`: quick sweep found no duplicate-suffixed entries after cleanup; no action required.
- Recommend rerunning `npx expo start --clear` if Metro caches were pointing at removed folders.
