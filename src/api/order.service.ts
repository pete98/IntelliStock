import { getApiClient } from '@/config/api';
import { resolveStoreContext } from '@/utils/storeContext';
import {
  OrderDetail,
  OrderItem,
  OrderStatusResponse,
  OrderSubstitution,
  OrderSummary,
  SubstitutionProposal,
} from '@/types/order';

interface ListStoreOrdersParams {
  status?: string;
  reviewStatus?: string;
}

interface RejectOrderRequest {
  reviewedBy?: string;
  reason: string;
}

interface AcceptOrderRequest {
  reviewedBy?: string;
}

interface ProposeSubstitutionsRequest {
  proposedBy?: string;
  substitutions: SubstitutionProposal[];
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOrderItem(payload: Record<string, unknown>): OrderItem {
  return {
    id:
      payload.id === undefined || payload.id === null
        ? undefined
        : toNumber(payload.id),
    productId: toNumber(payload.productId),
    name: toStringOrNull(payload.name) ?? 'Item',
    unitPrice: toNumber(payload.unitPrice),
    quantity: toNumber(payload.quantity),
    lineTotal: toNumber(payload.lineTotal),
  };
}

function normalizeOrderSubstitution(payload: Record<string, unknown>): OrderSubstitution {
  return {
    id: toNumber(payload.id),
    orderItemId: payload.orderItemId ? toNumber(payload.orderItemId) : undefined,
    requestedProductId: payload.requestedProductId ? toNumber(payload.requestedProductId) : undefined,
    replacementProductId: payload.replacementProductId ? toNumber(payload.replacementProductId) : undefined,
    replacementName: toStringOrNull(payload.replacementName),
    replacementQty: payload.replacementQty ? toNumber(payload.replacementQty) : undefined,
    replacementUnitPrice: payload.replacementUnitPrice ? toNumber(payload.replacementUnitPrice) : undefined,
    reason: toStringOrNull(payload.reason),
    status: (toStringOrNull(payload.status) ?? 'PENDING_CUSTOMER') as OrderSubstitution['status'],
  };
}

function normalizeOrderSummary(payload: Record<string, unknown>): OrderSummary {
  return {
    orderId: toStringOrNull(payload.orderId) ?? '',
    userId: toNumber(payload.userId),
    storeId: toNumber(payload.storeId),
    status: (toStringOrNull(payload.status) ?? 'PENDING_PAYMENT') as OrderSummary['status'],
    storeReviewStatus: (toStringOrNull(payload.storeReviewStatus) ??
      undefined) as OrderSummary['storeReviewStatus'],
    paymentCollectionStatus: (toStringOrNull(payload.paymentCollectionStatus) ??
      undefined) as OrderSummary['paymentCollectionStatus'],
    fulfillmentType: toStringOrNull(payload.fulfillmentType) ?? undefined,
    deliveryStatus: toStringOrNull(payload.deliveryStatus) ?? undefined,
    customerName: toStringOrNull(payload.customerName),
    customerPhone: toStringOrNull(payload.customerPhone),
    pendingSubstitutionCount: toNumber(payload.pendingSubstitutionCount),
    total: toNumber(payload.total),
    pickupWindowStart: toStringOrNull(payload.pickupWindowStart),
    pickupWindowEnd: toStringOrNull(payload.pickupWindowEnd),
    createdAt: toStringOrNull(payload.createdAt),
  };
}

function normalizeOrderDetail(payload: Record<string, unknown>): OrderDetail {
  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  const rawSubstitutions = Array.isArray(payload.substitutions) ? payload.substitutions : [];

  return {
    orderId: toStringOrNull(payload.orderId) ?? '',
    userId: toNumber(payload.userId),
    storeId: toNumber(payload.storeId),
    status: (toStringOrNull(payload.status) ?? 'PENDING_PAYMENT') as OrderDetail['status'],
    storeReviewStatus: (toStringOrNull(payload.storeReviewStatus) ??
      undefined) as OrderDetail['storeReviewStatus'],
    paymentCollectionStatus: (toStringOrNull(payload.paymentCollectionStatus) ??
      undefined) as OrderDetail['paymentCollectionStatus'],
    customerName: toStringOrNull(payload.customerName),
    customerPhone: toStringOrNull(payload.customerPhone),
    hasPendingSubstitutions:
      typeof payload.hasPendingSubstitutions === 'boolean'
        ? payload.hasPendingSubstitutions
        : undefined,
    pendingSubstitutionCount: toNumber(payload.pendingSubstitutionCount),
    fulfillmentType: toStringOrNull(payload.fulfillmentType) ?? undefined,
    deliveryStatus: toStringOrNull(payload.deliveryStatus) ?? undefined,
    subtotal: toNumber(payload.subtotal),
    tax: toNumber(payload.tax),
    total: toNumber(payload.total),
    currency: toStringOrNull(payload.currency) ?? undefined,
    pickupWindowStart: toStringOrNull(payload.pickupWindowStart),
    pickupWindowEnd: toStringOrNull(payload.pickupWindowEnd),
    createdAt: toStringOrNull(payload.createdAt),
    updatedAt: toStringOrNull(payload.updatedAt),
    items: rawItems.map(item => normalizeOrderItem((item ?? {}) as Record<string, unknown>)),
    substitutions: rawSubstitutions.map(substitution =>
      normalizeOrderSubstitution((substitution ?? {}) as Record<string, unknown>)
    ),
  };
}

function normalizeOrderStatus(payload: Record<string, unknown>): OrderStatusResponse {
  return {
    orderId: toStringOrNull(payload.orderId) ?? '',
    status: (toStringOrNull(payload.status) ?? 'PENDING_PAYMENT') as OrderStatusResponse['status'],
    storeReviewStatus: (toStringOrNull(payload.storeReviewStatus) ??
      undefined) as OrderStatusResponse['storeReviewStatus'],
    paymentCollectionStatus: (toStringOrNull(payload.paymentCollectionStatus) ??
      undefined) as OrderStatusResponse['paymentCollectionStatus'],
    updatedAt: toStringOrNull(payload.updatedAt) ?? undefined,
  };
}

async function resolveStoreOrdersContext() {
  const client = await getApiClient();
  const { storeId } = await resolveStoreContext();
  const encodedStoreId = encodeURIComponent(storeId);
  return {
    client,
    storeOrdersPath: `/api/stores/${encodedStoreId}/orders`,
  };
}

export const orderService = {
  async listStoreOrders(params: ListStoreOrdersParams = {}): Promise<OrderSummary[]> {
    const { client, storeOrdersPath } = await resolveStoreOrdersContext();
    const queryParams: Record<string, string> = {};
    if (params.status) queryParams.status = params.status;
    if (params.reviewStatus) queryParams.reviewStatus = params.reviewStatus;

    const response = await client.get(storeOrdersPath, { params: queryParams });
    const rawOrders = Array.isArray(response.data) ? response.data : [];
    return rawOrders.map((entry: unknown) =>
      normalizeOrderSummary((entry ?? {}) as Record<string, unknown>)
    );
  },

  async getStoreOrder(orderId: string): Promise<OrderDetail> {
    const { client, storeOrdersPath } = await resolveStoreOrdersContext();
    const response = await client.get(`${storeOrdersPath}/${encodeURIComponent(orderId)}`);
    return normalizeOrderDetail((response.data ?? {}) as Record<string, unknown>);
  },

  async acceptOrder(orderId: string, request: AcceptOrderRequest = {}): Promise<OrderStatusResponse> {
    const { client, storeOrdersPath } = await resolveStoreOrdersContext();
    const response = await client.post(
      `${storeOrdersPath}/${encodeURIComponent(orderId)}/accept`,
      request
    );
    return normalizeOrderStatus((response.data ?? {}) as Record<string, unknown>);
  },

  async rejectOrder(orderId: string, request: RejectOrderRequest): Promise<OrderStatusResponse> {
    const { client, storeOrdersPath } = await resolveStoreOrdersContext();
    const response = await client.post(
      `${storeOrdersPath}/${encodeURIComponent(orderId)}/reject`,
      request
    );
    return normalizeOrderStatus((response.data ?? {}) as Record<string, unknown>);
  },

  async proposeSubstitutions(
    orderId: string,
    request: ProposeSubstitutionsRequest
  ): Promise<OrderDetail> {
    const { client, storeOrdersPath } = await resolveStoreOrdersContext();
    const response = await client.post(
      `${storeOrdersPath}/${encodeURIComponent(orderId)}/substitutions`,
      request
    );
    return normalizeOrderDetail((response.data ?? {}) as Record<string, unknown>);
  },

  async markReady(orderId: string): Promise<OrderStatusResponse> {
    const { client, storeOrdersPath } = await resolveStoreOrdersContext();
    const response = await client.post(
      `${storeOrdersPath}/${encodeURIComponent(orderId)}/ready`,
      {}
    );
    return normalizeOrderStatus((response.data ?? {}) as Record<string, unknown>);
  },
};
