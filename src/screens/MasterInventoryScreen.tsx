import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import styled from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import { theme } from '@/config/theme';
import { RootStackParamList } from '@/navigation/types';

interface MasterInventoryItem {
  id: string;
  name: string;
  variant: string;
}

interface SelectionEntry {
  id: string;
  price: string;
  quantity: string;
  isSelected: boolean;
}

interface SelectionState {
  [key: string]: SelectionEntry;
}

interface NavigationProp extends NativeStackNavigationProp<RootStackParamList, 'MasterInventory'> {}

function getMockMasterItems(): MasterInventoryItem[] {
  return [
    { id: 'sku-1', name: 'Coca-Cola', variant: '12 oz can (6 pack)' },
    { id: 'sku-2', name: 'Coca-Cola', variant: '20 oz bottle' },
    { id: 'sku-3', name: 'Coca-Cola', variant: '2L bottle' },
    { id: 'sku-4', name: 'Pepsi', variant: '12 oz can (12 pack)' },
    { id: 'sku-5', name: 'Pepsi', variant: '1.25L bottle' },
    { id: 'sku-6', name: 'Sprite', variant: '12 oz can (6 pack)' },
    { id: 'sku-7', name: 'Sprite', variant: '20 oz bottle' },
    { id: 'sku-8', name: 'Fanta', variant: '16 oz bottle' },
  ];
}

function getDefaultSelection(items: MasterInventoryItem[]): SelectionState {
  const nextState: SelectionState = {};
  items.forEach(item => {
    nextState[item.id] = {
      id: item.id,
      price: '',
      quantity: '',
      isSelected: false,
    };
  });
  return nextState;
}

export function MasterInventoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { width } = useWindowDimensions();
  const isWide = width >= 880;
  const items = useMemo(() => getMockMasterItems(), []);
  const [searchText, setSearchText] = useState('');
  const [selectionState, setSelectionState] = useState<SelectionState>(() =>
    getDefaultSelection(items)
  );

  const filteredItems = useMemo(() => {
    if (!searchText.trim()) return items;
    const query = searchText.trim().toLowerCase();
    return items.filter(item =>
      `${item.name} ${item.variant}`.toLowerCase().includes(query)
    );
  }, [items, searchText]);

  function handleToggle(itemId: string) {
    setSelectionState(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        isSelected: !prev[itemId]?.isSelected,
      },
    }));
  }

  function handleValueChange(itemId: string, field: 'price' | 'quantity', value: string) {
    setSelectionState(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  }

  function getSelectedItems() {
    return items
      .map(item => ({
        id: item.id,
        name: item.name,
        variant: item.variant,
        price: selectionState[item.id]?.price ?? '',
        quantity: selectionState[item.id]?.quantity ?? '',
        isSelected: selectionState[item.id]?.isSelected ?? false,
      }))
      .filter(entry => entry.isSelected);
  }

  function handleReview() {
    const selectedItems = getSelectedItems();
    if (!selectedItems.length) {
      Toast.show({
        type: 'info',
        text1: 'Select at least one item',
        text2: 'Choose products to add to your inventory.',
      });
      return;
    }
    navigation.navigate('MasterInventoryReview', { selectedItems });
  }

  const selectedItems = getSelectedItems();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <Header>
          <Title>Master Inventory</Title>
          <Subtitle>Search catalog items and add them in bulk.</Subtitle>
        </Header>

        <SearchRow>
          <Ionicons name="search" size={18} color="#0b0b0b" />
          <SearchInput
            placeholder="Search products"
            placeholderTextColor="rgba(11, 11, 11, 0.45)"
            value={searchText}
            onChangeText={setSearchText}
          />
        </SearchRow>

        <PaneRow
          style={{
            flexDirection: isWide ? 'row' : 'column',
          }}
        >
          <Pane
            style={{
              width: isWide ? undefined : '100%',
              flex: isWide ? 1 : undefined,
              marginRight: isWide ? theme.spacing.lg : 0,
              marginBottom: isWide ? 0 : theme.spacing.lg,
            }}
          >
            <SectionLabel>Catalog</SectionLabel>
            <List>
              {filteredItems.map(item => {
                const entry = selectionState[item.id];
                return (
                  <ListRow key={item.id}>
                    <RowHeader>
                      <RowText>
                        <ItemName>{item.name}</ItemName>
                        <ItemVariant>{item.variant}</ItemVariant>
                      </RowText>
                      <RowRight>
                        <Pressable
                          accessibilityRole="checkbox"
                          accessibilityLabel={`Select ${item.name} ${item.variant}`}
                          onPress={() => handleToggle(item.id)}
                        >
                          <Checkbox
                            style={{
                              backgroundColor: entry?.isSelected ? '#0b0b0b' : '#ffffff',
                            }}
                          >
                            {entry?.isSelected ? (
                              <Ionicons name="checkmark" size={14} color="#ffffff" />
                            ) : null}
                          </Checkbox>
                        </Pressable>
                      </RowRight>
                    </RowHeader>
                  </ListRow>
                );
              })}
            </List>
          </Pane>

          <Pane style={{ width: isWide ? undefined : '100%', flex: isWide ? 1 : undefined }}>
            <SectionLabel>Selected</SectionLabel>
            <SelectedSummary>{selectedItems.length} selected</SelectedSummary>
            {selectedItems.length === 0 ? (
              <EmptyState>
                <EmptyTitle>No items selected</EmptyTitle>
                <EmptySubtitle>Select products to set price and quantity.</EmptySubtitle>
              </EmptyState>
            ) : (
              <List>
                {selectedItems.map(item => (
                  <ListRow key={item.id}>
                    <RowHeader>
                      <RowText>
                        <ItemName>{item.name}</ItemName>
                        <ItemVariant>{item.variant}</ItemVariant>
                      </RowText>
                      <RowRight>
                        <Pressable
                          accessibilityRole="checkbox"
                          accessibilityLabel={`Remove ${item.name} ${item.variant}`}
                          onPress={() => handleToggle(item.id)}
                        >
                          <Checkbox style={{ backgroundColor: '#0b0b0b' }}>
                            <Ionicons name="checkmark" size={14} color="#ffffff" />
                          </Checkbox>
                        </Pressable>
                      </RowRight>
                    </RowHeader>
                    <InputRow>
                      <InputGroup>
                        <InputLabel>Price</InputLabel>
                        <InlineInput
                          value={item.price}
                          onChangeText={(value: string) =>
                            handleValueChange(item.id, 'price', value)
                          }
                          placeholder="$0.00"
                          keyboardType="decimal-pad"
                          placeholderTextColor="rgba(11, 11, 11, 0.4)"
                        />
                      </InputGroup>
                      <InputGroup>
                        <InputLabel>Qty</InputLabel>
                        <InlineInput
                          value={item.quantity}
                          onChangeText={(value: string) =>
                            handleValueChange(item.id, 'quantity', value)
                          }
                          placeholder="0"
                          keyboardType="number-pad"
                          placeholderTextColor="rgba(11, 11, 11, 0.4)"
                        />
                      </InputGroup>
                    </InputRow>
                  </ListRow>
                ))}
              </List>
            )}
            <PrimaryButton accessibilityRole="button" onPress={handleReview}>
              <PrimaryButtonText>Review Selected</PrimaryButtonText>
            </PrimaryButton>
          </Pane>
        </PaneRow>
      </ScrollView>
    </SafeAreaView>
  );
}

const Header = styled(View)`
  margin-bottom: ${theme.spacing.lg}px;
`;

const Title = styled(Text)`
  font-size: 28px;
  font-weight: 800;
  color: #0b0b0b;
  margin-bottom: 6px;
`;

const Subtitle = styled(Text)`
  font-size: ${theme.typography.body.fontSize}px;
  font-weight: ${theme.typography.body.fontWeight};
  color: rgba(11, 11, 11, 0.7);
`;

const SearchRow = styled(View)`
  flex-direction: row;
  align-items: center;
  padding: ${theme.spacing.md}px;
  border-radius: ${theme.borderRadius.lg}px;
  border-width: 1px;
  border-color: rgba(11, 11, 11, 0.12);
  margin-bottom: ${theme.spacing.lg}px;
  background-color: #ffffff;
`;

const SearchInput = styled(TextInput)`
  flex: 1;
  margin-left: ${theme.spacing.sm}px;
  font-size: 15px;
  color: #0b0b0b;
`;

const SectionLabel = styled(Text)`
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: rgba(11, 11, 11, 0.6);
  margin-bottom: ${theme.spacing.sm}px;
`;

const PaneRow = styled(View)`
  width: 100%;
`;

const Pane = styled(View)`
  flex: 1;
`;

const List = styled(View)`
  gap: ${theme.spacing.md}px;
  margin-bottom: ${theme.spacing.xl}px;
`;

const ListRow = styled(View)`
  border-radius: ${theme.borderRadius.lg}px;
  border-width: 1px;
  border-color: rgba(11, 11, 11, 0.08);
  padding: ${theme.spacing.md}px;
  background-color: #ffffff;
  ${theme.shadows.sm};
`;

const RowHeader = styled(View)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.md}px;
  margin-bottom: ${theme.spacing.sm}px;
`;

const Checkbox = styled(View)`
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border-width: 1px;
  border-color: rgba(11, 11, 11, 0.4);
  background-color: #ffffff;
  align-items: center;
  justify-content: center;
`;

const RowText = styled(View)`
  flex: 1;
`;

const RowRight = styled(View)`
  align-items: flex-end;
  justify-content: center;
`;

const ItemName = styled(Text)`
  font-size: 16px;
  font-weight: 700;
  color: #0b0b0b;
`;

const ItemVariant = styled(Text)`
  font-size: 13px;
  color: rgba(11, 11, 11, 0.6);
  margin-top: 2px;
`;

const InputRow = styled(View)`
  flex-direction: row;
  gap: ${theme.spacing.md}px;
  justify-content: flex-end;
  align-self: flex-end;
  min-width: 200px;
  max-width: 280px;
`;

const InputGroup = styled(View)`
  flex: 1;
`;

const InputLabel = styled(Text)`
  font-size: 12px;
  font-weight: 600;
  color: rgba(11, 11, 11, 0.6);
  margin-bottom: 6px;
`;

const InlineInput = styled(TextInput)`
  border-width: 1px;
  border-color: rgba(11, 11, 11, 0.12);
  border-radius: ${theme.borderRadius.md}px;
  padding-vertical: 8px;
  padding-horizontal: ${theme.spacing.sm}px;
  font-size: 14px;
  color: #0b0b0b;
`;

const SelectedSummary = styled(Text)`
  font-size: 12px;
  font-weight: 600;
  color: rgba(11, 11, 11, 0.6);
  margin-bottom: ${theme.spacing.sm}px;
`;

const EmptyState = styled(View)`
  border-width: 1px;
  border-color: rgba(11, 11, 11, 0.08);
  border-radius: ${theme.borderRadius.lg}px;
  padding: ${theme.spacing.md}px;
  margin-bottom: ${theme.spacing.lg}px;
  background-color: #ffffff;
  ${theme.shadows.sm};
`;

const EmptyTitle = styled(Text)`
  font-size: 14px;
  font-weight: 700;
  color: #0b0b0b;
  margin-bottom: 6px;
`;

const EmptySubtitle = styled(Text)`
  font-size: 12px;
  font-weight: 500;
  color: rgba(11, 11, 11, 0.6);
`;

const PrimaryButton = styled(Pressable)`
  background-color: #0b0b0b;
  border-radius: ${theme.borderRadius.lg}px;
  padding-vertical: ${theme.spacing.md}px;
  align-items: center;
  ${theme.shadows.sm};
`;

const PrimaryButtonText = styled(Text)`
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
`;
