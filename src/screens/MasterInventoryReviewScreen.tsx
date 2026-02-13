import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { theme } from '@/config/theme';
import { RootStackParamList } from '@/navigation/types';

type RouteProp = {
  key: string;
  name: 'MasterInventoryReview';
  params: RootStackParamList['MasterInventoryReview'];
};

export function MasterInventoryReviewScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp>();
  const selectedItems = route.params?.selectedItems ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <Header>
          <Title>Review Items</Title>
          <Subtitle>{selectedItems.length} items ready to add</Subtitle>
        </Header>

        <List>
          {selectedItems.map(item => (
            <ListRow key={item.id}>
              <RowText>
                <ItemName>{item.name}</ItemName>
                <ItemVariant>{item.variant}</ItemVariant>
              </RowText>
              <RowMeta>
                <MetaLabel>Price</MetaLabel>
                <MetaValue>{item.price || '--'}</MetaValue>
              </RowMeta>
              <RowMeta>
                <MetaLabel>Qty</MetaLabel>
                <MetaValue>{item.quantity || '--'}</MetaValue>
              </RowMeta>
            </ListRow>
          ))}
        </List>

        <PrimaryButton accessibilityRole="button" onPress={() => navigation.goBack()}>
          <PrimaryButtonText>Confirm and Save</PrimaryButtonText>
        </PrimaryButton>
        <SecondaryButton accessibilityRole="button" onPress={() => navigation.goBack()}>
          <SecondaryButtonText>Back to Edit</SecondaryButtonText>
        </SecondaryButton>
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
`;

const RowText = styled(View)`
  margin-bottom: ${theme.spacing.sm}px;
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

const RowMeta = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 6px;
`;

const MetaLabel = styled(Text)`
  font-size: 12px;
  font-weight: 600;
  color: rgba(11, 11, 11, 0.6);
`;

const MetaValue = styled(Text)`
  font-size: 14px;
  font-weight: 700;
  color: #0b0b0b;
`;

const PrimaryButton = styled(Pressable)`
  background-color: #0b0b0b;
  border-radius: ${theme.borderRadius.lg}px;
  padding-vertical: ${theme.spacing.md}px;
  align-items: center;
  margin-bottom: ${theme.spacing.sm}px;
  ${theme.shadows.sm};
`;

const PrimaryButtonText = styled(Text)`
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
`;

const SecondaryButton = styled(Pressable)`
  border-radius: ${theme.borderRadius.lg}px;
  border-width: 1px;
  border-color: rgba(11, 11, 11, 0.2);
  padding-vertical: ${theme.spacing.md}px;
  align-items: center;
`;

const SecondaryButtonText = styled(Text)`
  color: #0b0b0b;
  font-size: 16px;
  font-weight: 700;
`;
