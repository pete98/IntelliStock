import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config/theme';
import { MeasurementUnit } from '@/types/inventory';

interface WeightUnitPickerProps {
  selectedUnit?: string;
  onUnitSelect: (unitCode: string) => void;
  units: MeasurementUnit[];
  isLoading?: boolean;
  error?: string;
}

export function WeightUnitPicker({
  selectedUnit,
  onUnitSelect,
  units,
  isLoading = false,
  error,
}: WeightUnitPickerProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const selectedUnitData = units.find(
    (unit) => unit.code === selectedUnit
  );

  const handleUnitSelect = (unitCode: string) => {
    onUnitSelect(unitCode);
    setIsModalVisible(false);
  };

  // Group units by unitType
  const groupedUnits = units.reduce((acc, unit) => {
    if (!acc[unit.unitType]) {
      acc[unit.unitType] = [];
    }
    acc[unit.unitType].push(unit);
    return acc;
  }, {} as Record<string, MeasurementUnit[]>);

  const renderUnitItem = ({ item }: { item: MeasurementUnit }) => (
    <TouchableOpacity
      style={[
        styles.unitItem,
        selectedUnit === item.code && styles.selectedUnitItem,
      ]}
      onPress={() => handleUnitSelect(item.code)}
    >
      <Text
        style={[
          styles.unitText,
          selectedUnit === item.code && styles.selectedUnitText,
        ]}
      >
        {item.displayName}
      </Text>
      {selectedUnit === item.code && (
        <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  const renderGroup = ({ item }: { item: { title: string; data: MeasurementUnit[] } }) => (
    <View style={styles.groupContainer}>
      <Text style={styles.groupTitle}>{item.title}</Text>
      {item.data.map((unit) => (
        <View key={unit.id}>
          {renderUnitItem({ item: unit })}
        </View>
      ))}
    </View>
  );

  const groupedData = Object.entries(groupedUnits).map(([unitType, unitList]) => ({
    title: unitType,
    data: unitList,
  }));

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.pickerButton,
          error && styles.pickerButtonError,
        ]}
        onPress={() => setIsModalVisible(true)}
        disabled={isLoading}
      >
        <Text
          style={[
            styles.pickerText,
            !selectedUnitData && styles.placeholderText,
          ]}
        >
          {selectedUnitData?.displayName || 'Select weight unit'}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Weight Unit</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={groupedData}
            keyExtractor={(item) => item.title}
            renderItem={renderGroup}
            style={styles.unitList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  pickerButtonError: {
    borderColor: theme.colors.error,
  },
  pickerText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    flex: 1,
  },
  placeholderText: {
    color: theme.colors.textSecondary,
  },
  errorText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  modalTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  unitList: {
    flex: 1,
    padding: theme.spacing.md,
  },
  groupContainer: {
    marginBottom: theme.spacing.lg,
  },
  groupTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  unitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedUnitItem: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
  },
  unitText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    flex: 1,
  },
  selectedUnitText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
