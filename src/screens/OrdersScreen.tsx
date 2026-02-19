import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import styled from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { orderService } from '@/api/order.service';
import { theme } from '@/config/theme';
import { RootStackParamList } from '@/navigation/types';
import { OrderSummary } from '@/types/order';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Orders'>;

function formatFulfillment(value?: string): string {
  if (!value) return 'Order';
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function formatCreatedAt(createdAt?: string | null): string {
  if (!createdAt) return 'Created recently';
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return 'Created recently';
  return parsed.toLocaleString();
}

export function OrdersScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOrders = useCallback(async (refresh: boolean) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      setErrorMessage(null);
      const response = await orderService.listStoreOrders();
      setOrders(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load orders.';
      setErrorMessage(message);
    } finally {
      if (refresh) setIsRefreshing(false);
      else setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders(false);
  }, [loadOrders]);

  function handleReviewOrder(orderId: string) {
    navigation.navigate('OrderApproval', { orderId });
  }

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
          <Title>Orders</Title>
          <Subtitle>All store orders with status and actions.</Subtitle>
        </Header>

        <TopRow>
          <SummaryPill>
            <SummaryText>{orders.length} total</SummaryText>
          </SummaryPill>
          <RefreshButton accessibilityRole="button" onPress={() => void loadOrders(true)}>
            {isRefreshing ? (
              <ActivityIndicator size="small" color="#0b0b0b" />
            ) : (
              <RefreshLabel>Refresh</RefreshLabel>
            )}
          </RefreshButton>
        </TopRow>

        {isLoading ? (
          <CenteredState>
            <ActivityIndicator size="small" color="#0b0b0b" />
            <StateText>Loading orders...</StateText>
          </CenteredState>
        ) : null}

        {!isLoading && errorMessage ? (
          <ErrorCard>
            <ErrorText>{errorMessage}</ErrorText>
          </ErrorCard>
        ) : null}

        {!isLoading && !errorMessage && orders.length === 0 ? (
          <CenteredState>
            <StateText>No orders found for this store.</StateText>
          </CenteredState>
        ) : null}

        {!isLoading && !errorMessage ? (
          <OrderList>
            {orders.map(order => (
              <OrderRow
                key={order.orderId}
                accessibilityRole="button"
                accessibilityLabel={`Open order ${order.orderId}`}
                onPress={() => handleReviewOrder(order.orderId)}
              >
                <OrderLeft>
                  <CustomerName>{order.customerName || `User #${order.userId}`}</CustomerName>
                  <OrderMeta>{formatCreatedAt(order.createdAt)}</OrderMeta>
                  {order.customerPhone ? <OrderMeta>{order.customerPhone}</OrderMeta> : null}
                  <OrderMeta>
                    {order.storeReviewStatus ?? 'PENDING'} | {order.status}
                  </OrderMeta>
                </OrderLeft>
                <StatusPill>
                  <StatusText>{formatFulfillment(order.fulfillmentType)}</StatusText>
                </StatusPill>
              </OrderRow>
            ))}
          </OrderList>
        ) : null}
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

const TopRow = styled(View)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.md}px;
`;

const SummaryPill = styled(View)`
  padding-vertical: 6px;
  padding-horizontal: ${theme.spacing.md}px;
  border-radius: 999px;
  background-color: rgba(11, 11, 11, 0.08);
`;

const SummaryText = styled(Text)`
  font-size: 12px;
  font-weight: 700;
  color: #0b0b0b;
`;

const RefreshButton = styled(Pressable)`
  min-width: 72px;
  align-items: center;
  justify-content: center;
  padding-vertical: 6px;
  padding-horizontal: ${theme.spacing.md}px;
  border-radius: 999px;
  border-width: 1px;
  border-color: rgba(11, 11, 11, 0.12);
`;

const RefreshLabel = styled(Text)`
  font-size: 12px;
  font-weight: 700;
  color: #0b0b0b;
`;

const OrderList = styled(View)`
  gap: ${theme.spacing.sm}px;
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

const CenteredState = styled(View)`
  align-items: center;
  justify-content: center;
  padding-vertical: ${theme.spacing.xl}px;
  gap: ${theme.spacing.sm}px;
`;

const StateText = styled(Text)`
  font-size: 14px;
  font-weight: 600;
  color: rgba(11, 11, 11, 0.6);
`;

const ErrorCard = styled(View)`
  padding: ${theme.spacing.md}px;
  border-radius: ${theme.borderRadius.lg}px;
  border-width: 1px;
  border-color: rgba(220, 38, 38, 0.3);
  background-color: rgba(254, 242, 242, 0.8);
`;

const ErrorText = styled(Text)`
  color: #b91c1c;
  font-size: 13px;
  font-weight: 600;
`;
