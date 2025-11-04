import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '@/config/theme';
import { InventoryItem } from '@/types/inventory';
import { Badge } from './Badge';
import { formatCurrency, formatStock, getStockBadgeColor } from '@/utils/format';

interface ItemCardProps {
  item: InventoryItem;
  onPress: () => void;
}

export function ItemCard({ item, onPress }: ItemCardProps) {
  const stockColor = getStockBadgeColor(item.stockQuantity);
  const stockText = formatStock(item.stockQuantity);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            contentFit="cover"
            placeholder="Loading..."
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {item.itemName}
        </Text>
        <Text style={styles.code}>{item.productCode}</Text>
        
        <View style={styles.badges}>
          <Badge
            text={stockText}
            color="#ffffff"
            backgroundColor={stockColor}
          />
          {item.taxEnabled && (
            <Badge
              text="Tax"
              color="#ffffff"
              backgroundColor={theme.colors.secondary}
            />
          )}
        </View>
        
        <Text style={styles.price}>{formatCurrency(item.price)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    marginRight: theme.spacing.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.textSecondary,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  code: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  price: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});



