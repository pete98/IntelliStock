export const ORDER_STATUS = {
  pendingPayment: 'PENDING_PAYMENT',
  paid: 'PAID',
  readyForPickup: 'READY_FOR_PICKUP',
  pickedUp: 'PICKED_UP',
  cancelled: 'CANCELLED',
  paymentFailed: 'PAYMENT_FAILED',
} as const;

export const STORE_REVIEW_STATUS = {
  pending: 'PENDING',
  accepted: 'ACCEPTED',
  rejected: 'REJECTED',
} as const;

export const PAYMENT_COLLECTION_STATUS = {
  notStarted: 'NOT_STARTED',
  authorizing: 'AUTHORIZING',
  authorized: 'AUTHORIZED',
  captureRequested: 'CAPTURE_REQUESTED',
  captured: 'CAPTURED',
  authCancelled: 'AUTH_CANCELLED',
  failed: 'FAILED',
} as const;

export const ORDER_SUBSTITUTION_STATUS = {
  pendingCustomer: 'PENDING_CUSTOMER',
  acceptedByCustomer: 'ACCEPTED_BY_CUSTOMER',
  declinedByCustomer: 'DECLINED_BY_CUSTOMER',
  applied: 'APPLIED',
  cancelled: 'CANCELLED',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
export type StoreReviewStatus = (typeof STORE_REVIEW_STATUS)[keyof typeof STORE_REVIEW_STATUS];
export type PaymentCollectionStatus =
  (typeof PAYMENT_COLLECTION_STATUS)[keyof typeof PAYMENT_COLLECTION_STATUS];
export type OrderSubstitutionStatus =
  (typeof ORDER_SUBSTITUTION_STATUS)[keyof typeof ORDER_SUBSTITUTION_STATUS];

export interface OrderSummary {
  orderId: string;
  userId: number;
  storeId: number;
  status: OrderStatus;
  storeReviewStatus?: StoreReviewStatus;
  paymentCollectionStatus?: PaymentCollectionStatus;
  fulfillmentType?: string;
  deliveryStatus?: string;
  customerName?: string | null;
  customerPhone?: string | null;
  pendingSubstitutionCount: number;
  total: number;
  pickupWindowStart?: string | null;
  pickupWindowEnd?: string | null;
  createdAt?: string | null;
}

export interface OrderItem {
  id?: number;
  productId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderSubstitution {
  id: number;
  orderItemId?: number;
  requestedProductId?: number;
  replacementProductId?: number;
  replacementName?: string | null;
  replacementQty?: number;
  replacementUnitPrice?: number;
  reason?: string | null;
  status: OrderSubstitutionStatus;
}

export interface OrderDetail {
  orderId: string;
  userId: number;
  storeId: number;
  status: OrderStatus;
  storeReviewStatus?: StoreReviewStatus;
  paymentCollectionStatus?: PaymentCollectionStatus;
  customerName?: string | null;
  customerPhone?: string | null;
  hasPendingSubstitutions?: boolean;
  pendingSubstitutionCount: number;
  fulfillmentType?: string;
  deliveryStatus?: string;
  subtotal: number;
  tax: number;
  total: number;
  currency?: string;
  pickupWindowStart?: string | null;
  pickupWindowEnd?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  items: OrderItem[];
  substitutions: OrderSubstitution[];
}

export interface OrderStatusResponse {
  orderId: string;
  status: OrderStatus;
  storeReviewStatus?: StoreReviewStatus;
  paymentCollectionStatus?: PaymentCollectionStatus;
  updatedAt?: string;
}

export interface SubstitutionProposal {
  orderItemId?: number;
  requestedProductId?: number;
  replacementProductId?: number;
  replacementName?: string;
  replacementQty?: number;
  replacementUnitPrice?: number;
  reason?: string;
}

