import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/config/theme';

interface BadgeProps {
  text: string;
  color?: string;
  backgroundColor?: string;
}

export function Badge({ text, color, backgroundColor }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.text, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: theme.typography.small.fontSize,
    fontWeight: '600',
  },
});



