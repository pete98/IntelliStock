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

const cardColors = {
  cardBackground: '#FFFFFF',
  cardBorder: '#D1D5DB',
  cardAccent: '#111111',
  textOnCard: '#111111',
  metaOnCard: '#4B5563',
};

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
              backgroundColor={cardColors.cardAccent}
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
    backgroundColor: cardColors.cardBackground,
    borderWidth: 1,
    borderColor: cardColors.cardBorder,
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
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: theme.typography.small.fontSize,
    color: cardColors.metaOnCard,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: cardColors.textOnCard,
    marginBottom: theme.spacing.xs,
  },
  code: {
    fontSize: theme.typography.caption.fontSize,
    color: cardColors.metaOnCard,
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
    color: cardColors.textOnCard,
  },
});

