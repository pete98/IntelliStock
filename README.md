# IntelliStock - Inventory Management App

A TypeScript Expo React Native app for managing inventory with a backend API.

## Features

- **Inventory Management**: Full CRUD operations for inventory items
- **Stock Tracking**: Add/reduce stock quantities with real-time updates
- **Tax Management**: Enable/disable tax for individual items
- **Low Stock Alerts**: Filter items with stock below threshold (default: 10)
- **Category Search**: Search items by category, name, or product code
- **Image Support**: Display item images using Expo Image
- **Form Validation**: Comprehensive form validation with Zod
- **Offline Storage**: Secure storage for API configuration
- **Documentation Links**: Access to API documentation

## API Endpoints

The app connects to a backend API at `http://localhost:8080` with the following endpoints:

- `GET /api/inventory` - List all items
- `POST /api/inventory` - Create new item
- `GET /api/inventory/{id}` - Get item details
- `PUT /api/inventory/{id}` - Update item
- `DELETE /api/inventory/{id}` - Delete item
- `PUT /api/inventory/{id}/enable-tax` - Enable tax for item
- `PUT /api/inventory/{id}/disable-tax` - Disable tax for item
- `PUT /api/inventory/{id}/add-stock/{qty}` - Add stock
- `PUT /api/inventory/{id}/reduce-stock/{qty}` - Reduce stock
- `GET /api/inventory/low-stock?threshold=10` - Get low stock items
- `GET /api/inventory/category/{name}` - Get items by category
- `GET /api/docs` - Get documentation links

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run on your preferred platform:
   ```bash
   npm run ios     # iOS simulator
   npm run android # Android emulator
   npm run web     # Web browser
   ```

## Configuration

- **API Base URL**: Configure in Settings screen (default: http://localhost:8080)
- **Low Stock Threshold**: Fixed at 10 units (configurable in API)
- **Storage**: Uses Expo Secure Store for sensitive data

## Tech Stack

- **Expo SDK 54** - React Native framework
- **TypeScript** - Type safety
- **React Navigation** - Navigation
- **React Query** - Data fetching and caching
- **React Hook Form + Zod** - Form handling and validation
- **Expo Image** - Optimized image display
- **Expo Secure Store** - Secure local storage
- **React Native Toast Message** - Notifications

## Project Structure

```
src/
├── api/           # API service layer
├── components/    # Reusable UI components
├── config/        # App configuration (API, theme)
├── hooks/         # React Query hooks
├── screens/       # App screens
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```

## Screens

1. **Inventory List** - Main screen with item cards, search, and filters
2. **Item Detail** - Detailed view with actions (edit, delete, stock operations)
3. **Item Form** - Create/edit items with validation
4. **Settings** - API configuration and documentation links

## Development

The app uses strict TypeScript configuration and follows React Native best practices:

- Functional components with hooks
- Proper error handling and loading states
- Responsive design with theme system
- Accessibility considerations
- Performance optimizations with React Query



