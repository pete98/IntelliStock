import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import styled from 'styled-components/native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import { orderService } from '@/api/order.service';
import { theme } from '@/config/theme';
import { RootStackParamList } from '@/navigation/types';
import { OrderDetail, OrderItem } from '@/types/order';

type OrderApprovalRoute = RouteProp<RootStackParamList, 'OrderApproval'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'OrderApproval'>;

function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (!Number.isFinite(amount)) return '$0.00';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function formatStatus(value?: string): string {
  if (!value) return 'Unknown';
  return value.replace(/_/g, ' ').toLowerCase();
}

export function OrderApprovalScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<OrderApprovalRoute>();
  const orderId = route.params.orderId;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [isSubstitutionModalVisible, setIsSubstitutionModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [replacementName, setReplacementName] = useState('');
  const [replacementQty, setReplacementQty] = useState('');
  const [replacementUnitPrice, setReplacementUnitPrice] = useState('');
  const [substitutionReason, setSubstitutionReason] = useState('');

  const canAcceptOrReject = useMemo(
    () => order?.storeReviewStatus === 'PENDING',
    [order?.storeReviewStatus]
  );
  const canMarkReady = useMemo(
    () =>
      order?.storeReviewStatus === 'ACCEPTED' &&
      order?.status === 'PAID' &&
      order?.paymentCollectionStatus === 'CAPTURED',
    [order?.paymentCollectionStatus, order?.status, order?.storeReviewStatus]
  );

  const loadOrder = useCallback(async () => {
    setIsLoading(true);
    try {
      setErrorMessage(null);
      const response = await orderService.getStoreOrder(orderId);
      setOrder(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load order details.';
      setErrorMessage(message);
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  async function handleAcceptOrder() {
    if (!order) return;
    try {
      setIsSubmitting(true);
      await orderService.acceptOrder(order.orderId, { reviewedBy: 'intellistock' });
      Toast.show({ type: 'success', text1: 'Order accepted' });
      await loadOrder();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to accept order.';
      Toast.show({ type: 'error', text1: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRejectOrder() {
    if (!order) return;
    const reason = rejectReason.trim();
    if (!reason) {
      Toast.show({ type: 'error', text1: 'Rejection reason is required.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await orderService.rejectOrder(order.orderId, {
        reviewedBy: 'intellistock',
        reason,
      });
      setIsRejectModalVisible(false);
      setRejectReason('');
      Toast.show({ type: 'success', text1: 'Order rejected' });
      await loadOrder();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reject order.';
      Toast.show({ type: 'error', text1: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMarkReady() {
    if (!order) return;
    try {
      setIsSubmitting(true);
      await orderService.markReady(order.orderId);
      Toast.show({ type: 'success', text1: 'Order marked ready' });
      await loadOrder();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to mark order ready.';
      Toast.show({ type: 'error', text1: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  function openSubstitutionModal(item: OrderItem) {
    setSelectedItem(item);
    setReplacementName(item.name);
    setReplacementQty(String(item.quantity));
    setReplacementUnitPrice(item.unitPrice > 0 ? item.unitPrice.toFixed(2) : '');
    setSubstitutionReason('');
    setIsSubstitutionModalVisible(true);
  }

  function closeSubstitutionModal() {
    setIsSubstitutionModalVisible(false);
    setSelectedItem(null);
    setReplacementName('');
    setReplacementQty('');
    setReplacementUnitPrice('');
    setSubstitutionReason('');
  }

  async function handleSubmitSubstitution() {
    if (!order || !selectedItem) return;

    const normalizedName = replacementName.trim();
    const normalizedReason = substitutionReason.trim();
    const qty = Number(replacementQty);
    const unitPrice = Number(replacementUnitPrice);

    if (!normalizedName) {
      Toast.show({ type: 'error', text1: 'Replacement name is required.' });
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      Toast.show({ type: 'error', text1: 'Replacement quantity must be greater than 0.' });
      return;
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      Toast.show({ type: 'error', text1: 'Replacement unit price must be 0 or greater.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await orderService.proposeSubstitutions(order.orderId, {
        proposedBy: 'intellistock',
        substitutions: [
          {
            orderItemId: selectedItem.id,
            requestedProductId: selectedItem.productId,
            replacementName: normalizedName,
            replacementQty: qty,
            replacementUnitPrice: unitPrice,
            reason: normalizedReason || `Substitute for ${selectedItem.name}`,
          },
        ],
      });
      closeSubstitutionModal();
      Toast.show({ type: 'success', text1: 'Substitution sent to customer' });
      await loadOrder();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit substitution.';
      Toast.show({ type: 'error', text1: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <TopBar>
          <BackButton accessibilityRole="button" onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#0b0b0b" />
          </BackButton>
          <RefreshButton accessibilityRole="button" onPress={() => void loadOrder()}>
            <RefreshText>Refresh</RefreshText>
          </RefreshButton>
        </TopBar>

        <Header>
          <Title>Order Approval</Title>
          <Subtitle>Review customer details, substitutions, and store decision.</Subtitle>
        </Header>

        {isLoading ? (
          <CenteredState>
            <ActivityIndicator size="small" color="#0b0b0b" />
            <StateText>Loading order...</StateText>
          </CenteredState>
        ) : null}

        {!isLoading && errorMessage ? (
          <ErrorCard>
            <ErrorText>{errorMessage}</ErrorText>
          </ErrorCard>
        ) : null}

        {!isLoading && order ? (
          <>
            <MetaCard>
              <MetaRow>
                <MetaLabel>Order</MetaLabel>
                <MetaValue>{order.orderId}</MetaValue>
              </MetaRow>
              <MetaRow>
                <MetaLabel>Status</MetaLabel>
                <MetaValue>{formatStatus(order.status)}</MetaValue>
              </MetaRow>
              <MetaRow>
                <MetaLabel>Store Review</MetaLabel>
                <MetaValue>{formatStatus(order.storeReviewStatus)}</MetaValue>
              </MetaRow>
              <MetaRow>
                <MetaLabel>Payment Collection</MetaLabel>
                <MetaValue>{formatStatus(order.paymentCollectionStatus)}</MetaValue>
              </MetaRow>
            </MetaCard>

            <InfoCard>
              <InfoRow>
                <Ionicons name="person-outline" size={18} color="#0b0b0b" />
                <InfoText>{order.customerName || `User #${order.userId}`}</InfoText>
              </InfoRow>
              {order.customerPhone ? (
                <InfoRow>
                  <Ionicons name="call-outline" size={18} color="#0b0b0b" />
                  <InfoText>{order.customerPhone}</InfoText>
                </InfoRow>
              ) : null}
              <InfoRow>
                <Ionicons name="car-outline" size={18} color="#0b0b0b" />
                <InfoText>{formatStatus(order.fulfillmentType)}</InfoText>
              </InfoRow>
              <InfoRow>
                <Ionicons name="time-outline" size={18} color="#0b0b0b" />
                <InfoText>
                  {order.pickupWindowStart || 'N/A'} - {order.pickupWindowEnd || 'N/A'}
                </InfoText>
              </InfoRow>
            </InfoCard>

            <SectionTitle>Items</SectionTitle>
            <ItemList>
              {order.items.map((item, index) => (
                <ItemCard key={item.id ? `${order.orderId}-${item.id}` : `${order.orderId}-${item.productId}-${index}`}>
                  <ItemHeader>
                    <ItemTitle>{item.name}</ItemTitle>
                    <ItemPrice>{formatCurrency(item.lineTotal, order.currency)}</ItemPrice>
                  </ItemHeader>
                  <ItemMeta>Qty {item.quantity}</ItemMeta>
                  {canAcceptOrReject ? (
                    <SmallButton
                      accessibilityRole="button"
                      onPress={() => openSubstitutionModal(item)}
                      style={{ opacity: isSubmitting ? 0.6 : 1 }}
                      disabled={isSubmitting}
                    >
                      <SmallButtonText>Propose Substitution</SmallButtonText>
                    </SmallButton>
                  ) : null}
                </ItemCard>
              ))}
            </ItemList>

            <TotalCard>
              <TotalLabel>Order Total</TotalLabel>
              <TotalValue>{formatCurrency(order.total, order.currency)}</TotalValue>
            </TotalCard>

            {order.pendingSubstitutionCount > 0 ? (
              <PendingSubstitutionCard>
                <PendingSubstitutionText>
                  {order.pendingSubstitutionCount} substitution(s) awaiting customer decision.
                </PendingSubstitutionText>
              </PendingSubstitutionCard>
            ) : null}

            {canAcceptOrReject ? (
              <>
                <PrimaryButton
                  accessibilityRole="button"
                  disabled={isSubmitting}
                  onPress={() => void handleAcceptOrder()}
                  style={{ opacity: isSubmitting ? 0.6 : 1 }}
                >
                  <PrimaryButtonText>Accept Order</PrimaryButtonText>
                </PrimaryButton>
                <SecondaryButton
                  accessibilityRole="button"
                  disabled={isSubmitting}
                  onPress={() => setIsRejectModalVisible(true)}
                  style={{ opacity: isSubmitting ? 0.6 : 1 }}
                >
                  <SecondaryButtonText>Reject Order</SecondaryButtonText>
                </SecondaryButton>
              </>
            ) : null}

            {canMarkReady ? (
              <PrimaryButton
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={() => void handleMarkReady()}
                style={{ opacity: isSubmitting ? 0.6 : 1 }}
              >
                <PrimaryButtonText>Mark Ready For Pickup</PrimaryButtonText>
              </PrimaryButton>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <Modal
        visible={isRejectModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsRejectModalVisible(false)}
      >
        <ModalOverlay>
          <ModalCard>
            <ModalTitle>Reject Order</ModalTitle>
            <ModalLabel>Reason</ModalLabel>
            <ModalInput
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Out of stock, closed, etc."
            />
            <ModalActions>
              <ModalButton onPress={() => setIsRejectModalVisible(false)}>
                <ModalButtonText>Cancel</ModalButtonText>
              </ModalButton>
              <ModalPrimaryButton
                onPress={() => void handleRejectOrder()}
                style={{ opacity: isSubmitting ? 0.6 : 1 }}
                disabled={isSubmitting}
              >
                <ModalPrimaryButtonText>Reject</ModalPrimaryButtonText>
              </ModalPrimaryButton>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      </Modal>

      <Modal
        visible={isSubstitutionModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeSubstitutionModal}
      >
        <ModalOverlay>
          <ModalCard>
            <ModalTitle>Propose Substitution</ModalTitle>
            <ModalLabel>Replacement Name</ModalLabel>
            <ModalInput value={replacementName} onChangeText={setReplacementName} />

            <ModalLabel>Quantity</ModalLabel>
            <ModalInput
              value={replacementQty}
              onChangeText={setReplacementQty}
              keyboardType="number-pad"
            />

            <ModalLabel>Unit Price</ModalLabel>
            <ModalInput
              value={replacementUnitPrice}
              onChangeText={setReplacementUnitPrice}
              keyboardType="decimal-pad"
            />

            <ModalLabel>Reason</ModalLabel>
            <ModalInput value={substitutionReason} onChangeText={setSubstitutionReason} />

            <ModalActions>
              <ModalButton onPress={closeSubstitutionModal}>
                <ModalButtonText>Cancel</ModalButtonText>
              </ModalButton>
              <ModalPrimaryButton
                onPress={() => void handleSubmitSubstitution()}
                style={{ opacity: isSubmitting ? 0.6 : 1 }}
                disabled={isSubmitting}
              >
                <ModalPrimaryButtonText>Send</ModalPrimaryButtonText>
              </ModalPrimaryButton>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      </Modal>
    </SafeAreaView>
  );
}

const TopBar = styled(View)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.md}px;
`;

const BackButton = styled(Pressable)`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  border-width: 1px;
  border-color: rgba(11, 11, 11, 0.08);
  align-items: center;
  justify-content: center;
`;

const RefreshButton = styled(Pressable)`
  padding-vertical: 8px;
  padding-horizontal: ${theme.spacing.md}px;
  border-radius: 999px;
  border-width: 1px;
  border-color: rgba(11, 11, 11, 0.12);
`;

const RefreshText = styled(Text)`
  font-size: 12px;
  font-weight: 700;
  color: #0b0b0b;
`;

const Header = styled(View)`
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

const MetaCard = styled(View)`
  border-radius: ${theme.borderRadius.lg}px;
  border-width: 1px;
  border-color: rgba(11, 11, 11, 0.1);
  background-color: #ffffff;
  padding: ${theme.spacing.md}px;
  margin-bottom: ${theme.spacing.md}px;
`;

const MetaRow = styled(View)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.xs}px;
`;

const MetaLabel = styled(Text)`
  font-size: 12px;
  font-weight: 700;
  color: rgba(11, 11, 11, 0.6);
  text-transform: uppercase;
`;

const MetaValue = styled(Text)`
  font-size: 14px;
  font-weight: 700;
  color: #0b0b0b;
  text-transform: capitalize;
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
  flex-shrink: 1;
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
  align-items: center;
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

const ItemMeta = styled(Text)`
  margin-top: ${theme.spacing.xs}px;
  font-size: 13px;
  color: rgba(11, 11, 11, 0.7);
`;

const SmallButton = styled(Pressable)`
  align-self: flex-start;
  margin-top: ${theme.spacing.sm}px;
  border-radius: 999px;
  border-width: 1px;
  border-color: rgba(11, 11, 11, 0.18);
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
  margin-bottom: ${theme.spacing.md}px;
`;

const TotalLabel = styled(Text)`
  font-size: 14px;
  font-weight: 600;
  color: rgba(11, 11, 11, 0.6);
`;

const TotalValue = styled(Text)`
  font-size: 18px;
  font-weight: 800;
  color: #0b0b0b;
`;

const PendingSubstitutionCard = styled(View)`
  border-radius: ${theme.borderRadius.md}px;
  background-color: rgba(217, 119, 6, 0.12);
  border-width: 1px;
  border-color: rgba(217, 119, 6, 0.2);
  padding: ${theme.spacing.sm}px;
  margin-bottom: ${theme.spacing.md}px;
`;

const PendingSubstitutionText = styled(Text)`
  font-size: 13px;
  font-weight: 600;
  color: #92400e;
`;

const PrimaryButton = styled(Pressable)`
  background-color: #0b0b0b;
  border-radius: ${theme.borderRadius.lg}px;
  padding-vertical: ${theme.spacing.md}px;
  align-items: center;
  margin-bottom: ${theme.spacing.sm}px;
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

const CenteredState = styled(View)`
  align-items: center;
  justify-content: center;
  padding-vertical: ${theme.spacing.xl}px;
`;

const StateText = styled(Text)`
  margin-top: ${theme.spacing.sm}px;
  font-size: 14px;
  color: rgba(11, 11, 11, 0.62);
`;

const ErrorCard = styled(View)`
  border-radius: ${theme.borderRadius.lg}px;
  border-width: 1px;
  border-color: rgba(220, 38, 38, 0.25);
  background-color: rgba(220, 38, 38, 0.08);
  padding: ${theme.spacing.md}px;
`;

const ErrorText = styled(Text)`
  color: #991b1b;
  font-size: 14px;
  font-weight: 600;
`;

const ModalOverlay = styled(View)`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.45);
  justify-content: flex-end;
`;

const ModalCard = styled(View)`
  background-color: #ffffff;
  border-top-left-radius: ${theme.borderRadius.lg}px;
  border-top-right-radius: ${theme.borderRadius.lg}px;
  padding: ${theme.spacing.lg}px;
  gap: ${theme.spacing.sm}px;
`;

const ModalTitle = styled(Text)`
  font-size: 18px;
  font-weight: 800;
  color: #0b0b0b;
`;

const ModalLabel = styled(Text)`
  font-size: 12px;
  font-weight: 700;
  color: rgba(11, 11, 11, 0.6);
  text-transform: uppercase;
  margin-top: ${theme.spacing.xs}px;
`;

const ModalInput = styled(TextInput)`
  border-width: 1px;
  border-color: rgba(11, 11, 11, 0.18);
  border-radius: ${theme.borderRadius.md}px;
  padding: ${theme.spacing.md}px;
  font-size: 14px;
  color: #0b0b0b;
`;

const ModalActions = styled(View)`
  flex-direction: row;
  gap: ${theme.spacing.sm}px;
  margin-top: ${theme.spacing.sm}px;
`;

const ModalButton = styled(Pressable)`
  flex: 1;
  align-items: center;
  justify-content: center;
  border-width: 1px;
  border-color: rgba(11, 11, 11, 0.2);
  border-radius: ${theme.borderRadius.md}px;
  padding-vertical: ${theme.spacing.md}px;
`;

const ModalButtonText = styled(Text)`
  font-size: 14px;
  font-weight: 700;
  color: #0b0b0b;
`;

const ModalPrimaryButton = styled(Pressable)`
  flex: 1;
  align-items: center;
  justify-content: center;
  border-radius: ${theme.borderRadius.md}px;
  background-color: #0b0b0b;
  padding-vertical: ${theme.spacing.md}px;
`;

const ModalPrimaryButtonText = styled(Text)`
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
`;
