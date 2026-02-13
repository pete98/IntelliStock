import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import styled from 'styled-components/native';

import { theme } from '@/config/theme';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: string;
  note?: string;
  isOutOfStock?: boolean;
}

interface OrderApprovalData {
  orderId: string;
  placedAt: string;
  customerName: string;
  fulfillment: string;
  address: string;
  total: string;
  items: OrderItem[];
}

function getMockOrder(): OrderApprovalData {
  return {
    orderId: 'ORD-2049',
    placedAt: 'Placed 4 min ago',
    customerName: 'Maya Patel',
    fulfillment: 'Delivery • 25-35 min',
    address: '1120 Lakeview Ave, San Jose',
    total: '$68.40',
    items: [
      {
        id: 'item-1',
        name: 'Organic Bananas',
        quantity: 3,
        price: '$4.50',
      },
      {
        id: 'item-2',
        name: 'Greek Yogurt 500g',
        quantity: 2,
        price: '$8.20',
        isOutOfStock: true,
        note: 'Customer prefers low-fat if possible',
      },
      {
        id: 'item-3',
        name: 'Whole Wheat Bread',
        quantity: 1,
        price: '$3.90',
      },
      {
        id: 'item-4',
        name: 'Chicken Breast 1kg',
        quantity: 1,
        price: '$12.40',
      },
    ],
  };
}

export function OrderApprovalScreen() {
  const order = getMockOrder();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <Header>
          <Title>Order Approval</Title>
          <StatusPill>
            <StatusDot />
            <StatusText>Awaiting Acceptance</StatusText>
          </StatusPill>
        </Header>

        <MetaRow>
          <MetaBlock>
            <MetaLabel>Order</MetaLabel>
            <MetaValue>{order.orderId}</MetaValue>
          </MetaBlock>
          <MetaBlock>
            <MetaLabel>Placed</MetaLabel>
            <MetaValue>{order.placedAt}</MetaValue>
          </MetaBlock>
        </MetaRow>

        <InfoCard>
          <InfoRow>
            <Ionicons name="person-outline" size={18} color="#0b0b0b" />
            <InfoText>{order.customerName}</InfoText>
          </InfoRow>
          <InfoRow>
            <Ionicons name="car-outline" size={18} color="#0b0b0b" />
            <InfoText>{order.fulfillment}</InfoText>
          </InfoRow>
          <InfoRow>
            <Ionicons name="location-outline" size={18} color="#0b0b0b" />
            <InfoText>{order.address}</InfoText>
          </InfoRow>
        </InfoCard>

        <SectionTitle>Items</SectionTitle>
        <ItemList>
          {order.items.map(item => (
            <ItemCard key={item.id}>
              <ItemHeader>
                <ItemTitle>{item.name}</ItemTitle>
                <ItemPrice>{item.price}</ItemPrice>
              </ItemHeader>
              <ItemMeta>
                <ItemQuantity>Qty {item.quantity}</ItemQuantity>
                {item.isOutOfStock && <OutOfStockTag>Out of stock</OutOfStockTag>}
              </ItemMeta>
              {item.note ? <ItemNote>{item.note}</ItemNote> : null}
              <ItemActions>
                <SmallButton>
                  <SmallButtonText>Substitute</SmallButtonText>
                </SmallButton>
                <SmallButton>
                  <SmallButtonText>Mark Unavailable</SmallButtonText>
                </SmallButton>
              </ItemActions>
            </ItemCard>
          ))}
        </ItemList>

        <TotalCard>
          <TotalLabel>Order Total</TotalLabel>
          <TotalValue>{order.total}</TotalValue>
        </TotalCard>

        <PrimaryButton accessibilityRole="button">
          <PrimaryButtonText>Accept Order</PrimaryButtonText>
        </PrimaryButton>
        <SecondaryButton accessibilityRole="button">
          <SecondaryButtonText>Request Changes</SecondaryButtonText>
        </SecondaryButton>
        <TertiaryButton accessibilityRole="button">
          <TertiaryButtonText>Decline</TertiaryButtonText>
        </TertiaryButton>
      </ScrollView>
    </SafeAreaView>
  );
}

const Header = styled(View)`
  gap: ${theme.spacing.sm}px;
  margin-bottom: ${theme.spacing.lg}px;
`;

const Title = styled(Text)`
  font-size: 28px;
  font-weight: 800;
  color: #0b0b0b;
`;

const StatusPill = styled(View)`
  flex-direction: row;
  align-items: center;
  align-self: flex-start;
  padding-vertical: 4px;
  padding-horizontal: ${theme.spacing.sm}px;
  border-radius: 999px;
  background-color: rgba(11, 11, 11, 0.08);
`;

const StatusDot = styled(View)`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: #0b0b0b;
  margin-right: ${theme.spacing.xs}px;
`;

const StatusText = styled(Text)`
  font-size: 12px;
  font-weight: 700;
  color: #0b0b0b;
`;

const MetaRow = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.lg}px;
`;

const MetaBlock = styled(View)`
  flex: 1;
`;

const MetaLabel = styled(Text)`
  font-size: 12px;
  font-weight: 600;
  color: rgba(11, 11, 11, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.6px;
`;

const MetaValue = styled(Text)`
  font-size: 16px;
  font-weight: 700;
  color: #0b0b0b;
  margin-top: 4px;
`;

const InfoCard = styled(View)`
  padding: ${theme.spacing.md}px;
  border-radius: ${theme.borderRadius.lg}px;
  border-width: 1px;
  border-color: rgba(11, 11, 11, 0.1);
  margin-bottom: ${theme.spacing.xl}px;
  background-color: #ffffff;
`;

const InfoRow = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-bottom: ${theme.spacing.sm}px;
`;

const InfoText = styled(Text)`
  margin-left: ${theme.spacing.sm}px;
  font-size: 15px;
  font-weight: 600;
  color: #0b0b0b;
`;

const SectionTitle = styled(Text)`
  font-size: 18px;
  font-weight: 700;
  color: #0b0b0b;
  margin-bottom: ${theme.spacing.sm}px;
`;

const ItemList = styled(View)`
  gap: ${theme.spacing.md}px;
  margin-bottom: ${theme.spacing.xl}px;
`;

const ItemCard = styled(View)`
  border-radius: ${theme.borderRadius.lg}px;
  border-width: 1px;
  border-color: rgba(11, 11, 11, 0.08);
  padding: ${theme.spacing.md}px;
  background-color: #ffffff;
`;

const ItemHeader = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
`;

const ItemTitle = styled(Text)`
  font-size: 16px;
  font-weight: 700;
  color: #0b0b0b;
  flex: 1;
  margin-right: ${theme.spacing.sm}px;
`;

const ItemPrice = styled(Text)`
  font-size: 15px;
  font-weight: 700;
  color: #0b0b0b;
`;

const ItemMeta = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-top: ${theme.spacing.xs}px;
  gap: ${theme.spacing.sm}px;
`;

const ItemQuantity = styled(Text)`
  font-size: 13px;
  font-weight: 600;
  color: rgba(11, 11, 11, 0.6);
`;

const OutOfStockTag = styled(Text)`
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  background-color: #0b0b0b;
  padding-vertical: 2px;
  padding-horizontal: 8px;
  border-radius: 999px;
`;

const ItemNote = styled(Text)`
  margin-top: ${theme.spacing.sm}px;
  font-size: 12px;
  color: rgba(11, 11, 11, 0.65);
`;

const ItemActions = styled(View)`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${theme.spacing.sm}px;
  margin-top: ${theme.spacing.md}px;
`;

const SmallButton = styled(Pressable)`
  border-radius: 999px;
  border-width: 1px;
  border-color: rgba(11, 11, 11, 0.15);
  padding-vertical: 6px;
  padding-horizontal: ${theme.spacing.md}px;
`;

const SmallButtonText = styled(Text)`
  font-size: 12px;
  font-weight: 700;
  color: #0b0b0b;
`;

const TotalCard = styled(View)`
  padding: ${theme.spacing.md}px;
  border-radius: ${theme.borderRadius.lg}px;
  border-width: 1px;
  border-color: rgba(11, 11, 11, 0.1);
  background-color: #ffffff;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.lg}px;
`;

const TotalLabel = styled(Text)`
  font-size: 14px;
  font-weight: 600;
  color: rgba(11, 11, 11, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.6px;
`;

const TotalValue = styled(Text)`
  font-size: 18px;
  font-weight: 800;
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
  margin-bottom: ${theme.spacing.sm}px;
`;

const SecondaryButtonText = styled(Text)`
  color: #0b0b0b;
  font-size: 16px;
  font-weight: 700;
`;

const TertiaryButton = styled(Pressable)`
  border-radius: ${theme.borderRadius.lg}px;
  padding-vertical: ${theme.spacing.md}px;
  align-items: center;
`;

const TertiaryButtonText = styled(Text)`
  color: rgba(11, 11, 11, 0.7);
  font-size: 15px;
  font-weight: 600;
`;
