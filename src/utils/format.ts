export function formatCurrency(amount: number): string {
  // Ensure amount is a valid number
  const validAmount = isNaN(amount) ? 0 : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(validAmount);
}

export function formatStock(quantity: number): string {
  // Ensure quantity is a valid number
  const validQuantity = isNaN(quantity) ? 0 : quantity;
  if (validQuantity === 0) return 'Out of Stock';
  if (validQuantity <= 10) return `Low Stock (${validQuantity})`;
  return `In Stock (${validQuantity})`;
}

export function getStockBadgeColor(quantity: number): string {
  // Ensure quantity is a valid number
  const validQuantity = isNaN(quantity) ? 0 : quantity;
  if (validQuantity === 0) return '#ef4444'; // red
  if (validQuantity <= 10) return '#f97316'; // orange
  return '#22c55e'; // green
}



