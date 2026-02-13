import { Category } from '@/types/inventory';

/**
 * Parse weight string like "1.00lb" or "500g" into numeric value and unit
 * @param weightString - Weight string from UPC Item DB (e.g., "1.00lb", "500g", "16 oz")
 * @returns Object with numeric weight and unit, or null if parsing fails
 */
export function parseWeight(weightString: string): { weight: number; unit: string } | null {
  if (!weightString || typeof weightString !== 'string') {
    return null;
  }

  // Remove extra whitespace
  const trimmed = weightString.trim();
  if (!trimmed) {
    return null;
  }

  // Match pattern: number (with optional decimals) followed by unit
  // Examples: "1.00lb", "500g", "16 oz", "2.5 kg"
  const match = trimmed.match(/^([\d.]+)\s*([a-zA-Z]+)$/);
  if (!match) {
    return null;
  }

  const numericValue = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  if (isNaN(numericValue) || numericValue <= 0) {
    return null;
  }

  return {
    weight: numericValue,
    unit: unit,
  };
}

/**
 * Attempt to match UPC category string to our category codes
 * @param categoryString - Category string from UPC Item DB (e.g., "Food, Beverages & Tobacco > Beverages > Soda")
 * @param availableCategories - List of available categories from our system
 * @returns Category code if match found, null otherwise
 */
export function mapCategoryToCode(
  categoryString: string,
  availableCategories: Category[]
): string | null {
  if (!categoryString || !availableCategories || availableCategories.length === 0) {
    return null;
  }

  // Split category string by ">" to get hierarchy
  const categoryParts = categoryString.split('>').map((part) => part.trim().toLowerCase());

  // Try to find exact match or partial match
  for (const category of availableCategories) {
    const displayNameLower = category.displayName.toLowerCase();
    const codeLower = category.code.toLowerCase();

    // Check if any part of the UPC category matches our category display name or code
    for (const part of categoryParts) {
      if (displayNameLower.includes(part) || part.includes(displayNameLower)) {
        return category.code;
      }
      if (codeLower.includes(part) || part.includes(codeLower)) {
        return category.code;
      }
    }
  }

  return null;
}

/**
 * Extract keywords from description to use as labels
 * @param description - Product description from UPC Item DB
 * @returns Comma-separated string of extracted keywords
 */
export function extractLabels(description: string): string {
  if (!description || typeof description !== 'string') {
    return '';
  }

  // Common stop words to exclude
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'the', 'this', 'but', 'they', 'have',
    'had', 'what', 'said', 'each', 'which', 'their', 'time', 'if',
    'up', 'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her',
    'would', 'make', 'like', 'into', 'him', 'has', 'two', 'more', 'very',
    'after', 'words', 'long', 'than', 'first', 'been', 'call', 'who',
    'oil', 'sit', 'now', 'find', 'down', 'day', 'did', 'get', 'come',
    'made', 'may', 'part', 'one', 'refreshing', 'free', 'crisp', 'beverage',
    'cocktail', 'mixer', 'fluid', 'ounce', 'bottle',
  ]);

  // Split description into words, remove punctuation, convert to lowercase
  const words = description
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  // Remove duplicates and limit to top 5-7 keywords
  const uniqueWords = Array.from(new Set(words)).slice(0, 7);

  // Capitalize first letter of each word for better readability
  const capitalized = uniqueWords.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1)
  );

  return capitalized.join(', ');
}


