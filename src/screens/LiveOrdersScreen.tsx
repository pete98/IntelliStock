import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import styled from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { theme } from '@/config/theme';
import { RootStackParamList } from '@/navigation/types';

interface LiveOrder {
  id: string;
  customerName: string;
  fulfillment: 'Pickup' | 'Delivery';
  eta: string;
}

function getMockOrders(): LiveOrder[] {
  return [
    {
      id: 'order-1',
      customerName: 'Ariana Lewis',
      fulfillment: 'Pickup',
      eta: '12 min',
    },
    {
      id: 'order-2',
      customerName: 'Ravi Shah',
      fulfillment: 'Delivery',
      eta: '22 min',
    },
    {
      id: 'order-3',
      customerName: 'Olivia Chen',
      fulfillment: 'Pickup',
      eta: '18 min',
    },
    {
      id: 'order-4',
      customerName: 'Marcus Hill',
      fulfillment: 'Delivery',
      eta: '30 min',
    },
  ];
}

export function LiveOrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const orders = getMockOrders();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <Header>
          <BackButton accessibilityRole="button" onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#0b0b0b" />
          </BackButton>
          <Title>Live Orders</Title>
          <Subtitle>Review and accept incoming orders.</Subtitle>
        </Header>

        <OrderList>
          {orders.map(order => (
            <OrderRow
              key={order.id}
              accessibilityRole="button"
              accessibilityLabel={`Review order for ${order.customerName}`}
              onPress={() => navigation.navigate('OrderApproval')}
            >
              <OrderLeft>
                <CustomerName>{order.customerName}</CustomerName>
                <OrderMeta>ETA {order.eta}</OrderMeta>
              </OrderLeft>
              <StatusPill>
                <StatusText>{order.fulfillment}</StatusText>
              </StatusPill>
            </OrderRow>
          ))}
        </OrderList>

        <PrimaryButton
          accessibilityRole="button"
          onPress={() => navigation.navigate('OrderApproval')}
        >
          <PrimaryButtonText>Review Selected</PrimaryButtonText>
        </PrimaryButton>
      </ScrollView>
    </SafeAreaView>
  );
}

const Header = styled(View)`
  margin-bottom: ${theme.spacing.lg}px;
`;

const BackButton = styled(Pressable)`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  border-width: 1px;
  border-color: rgba(11, 11, 11, 0.08);
  align-items: center;
  justify-content: center;
  margin-bottom: ${theme.spacing.md}px;
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

const OrderList = styled(View)`
  gap: ${theme.spacing.sm}px;
  margin-bottom: ${theme.spacing.xl}px;
`;

const OrderRow = styled(Pressable)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing.md}px;
  border-radius: ${theme.borderRadius.lg}px;
  border-width: 1px;
  border-color: rgba(11, 11, 11, 0.08);
  background-color: #ffffff;
  ${theme.shadows.sm};
`;

const OrderLeft = styled(View)`
  flex: 1;
  margin-right: ${theme.spacing.md}px;
`;

const CustomerName = styled(Text)`
  font-size: 16px;
  font-weight: 700;
  color: #0b0b0b;
`;

const OrderMeta = styled(Text)`
  font-size: 12px;
  font-weight: 600;
  color: rgba(11, 11, 11, 0.6);
  margin-top: 4px;
`;

const StatusPill = styled(View)`
  padding-vertical: 6px;
  padding-horizontal: ${theme.spacing.md}px;
  border-radius: 999px;
  background-color: #0b0b0b;
`;

const StatusText = styled(Text)`
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.6px;
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
