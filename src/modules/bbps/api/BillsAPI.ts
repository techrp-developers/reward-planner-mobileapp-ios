import axios from "axios";
import { getAuthHeaders, clearAuthToken } from "../../common/auth/api/AuthAPI";
import { apiClient, NormalizedApiError } from "./apiClient";

const API_BASE_URL = "https://rewardplanners.com/api/crm";

export interface BillCategory {
  operator_category_name: string;
  operator_category_id: number;
  operator_category_group: string;
  status: string;
}

export interface BillLocation {
  operator_location_name: string;
  operator_location_id: string;
  abbreviation: string;
}

export interface Operator {
  operator_id: number;
  name: string;
  billFetchResponse: number;
  high_commission_channel: number;
  kyc_required: number;
  operator_category: number;
  location_id: number;
}

export const fetchBillsCategories = async (): Promise<BillCategory[]> => {
  try {
    const res = await axios.get(`${API_BASE_URL}/v1/bills/categories`);
    return Array.isArray(res.data?.data) ? res.data.data : [];
  } catch (error: any) {
    console.error("Fetch Categories Error:", error?.response?.data || error);
    throw error;
  }
};

export const fetchBillLocations = async (): Promise<BillLocation[]> => {
  try {
    const res = await axios.get(`${API_BASE_URL}/v1/bills/locations`);
    return Array.isArray(res.data?.data) ? res.data.data : [];
  } catch (error: any) {
    console.error(
      "Fetch Locations Error:",
      error?.response?.data || error
    );
    throw error;
  }
};

// Shared react-query cache keys so BillerSelectScreen's prefetch-on-tap and
// BillDetailsScreen's own query land in the same cache entry.
export const bbpsOperatorsQueryKey = (categoryId: number) =>
  ['bbps-operators', categoryId] as const;

export const bbpsOperatorDetailsQueryKey = (operatorId: number) =>
  ['bbps-operator-details', operatorId] as const;

export const fetchOperators = async (
  categoryId: number
): Promise<Operator[]> => {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/v1/bills/operators?category_id=${categoryId}`
    );

    return Array.isArray(res.data?.data) ? res.data.data : [];
  } catch (error: any) {
    console.error(
      "Fetch Operators Error:",
      error?.response?.data || error
    );
    throw error;
  }
};

export interface OperatorField {
  error_message: string;
  param_label: string;
  regex: string;
  param_name: string;
  param_id: string;
  param_type: string;
}

export interface OperatorDetails {
  operator_name: string;
  operator_id: number;
  fetchBill: number;
  BBPS: number;
  data: OperatorField[];
}

export const fetchOperatorDetails = async (
  operatorId: number
): Promise<OperatorDetails> => {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/v1/bills/operator/${operatorId}`
    );

    return {
      operator_name: res.data?.operator_name || "",
      operator_id: res.data?.operator_id || 0,
      fetchBill: res.data?.fetchBill || 0,
      BBPS: res.data?.BBPS || 0,
      data: Array.isArray(res.data?.data) ? res.data.data : [],
    };
  } catch (error: any) {
    console.error("Operator Details Error:", error?.response?.data || error);
    throw error;
  }
};

export const fetchBill = async (
  payload: Record<string, string | number | undefined>,
  token?: string,
) => {
  try {
    const authHeaders = token
      ? { Authorization: `Bearer ${token}` }
      : await getAuthHeaders();

    const response = await axios.post(
      `${API_BASE_URL}/v1/bills/fetch-bill`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      await clearAuthToken();
    }

    __DEV__ && console.log(
      "Fetch Bill Error:",
      error?.response?.data || error?.message
    );

    if (error?.response?.data) {
      return error.response.data;
    }

    throw error?.response?.data || error?.message;
  }
};

export interface RechargePlan {
  planId: string;
  amount: string;
  validity: string;
  description: string;
  [key: string]: any;
}

export interface RechargePlanGroup {
  label: string;
  plans: RechargePlan[];
}

export interface RechargePlansResponse {
  status: number;
  responseTypeId: number;
  message: string;
  operatorId: string;
  circleId: string;
  mobile: string;
  count: number;
  groups: RechargePlanGroup[];
  plans: RechargePlan[];
}

export const fetchRechargePlans = async (
  mobile: string,
  operatorId: number | string,
  circleId: number | string,
) => {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/v1/bills/recharge/plans`,
      {
        params: {
          mobile,
          operator_id: operatorId,
          circle_id: circleId,
        },
      }
    );

    return {
      success: res.data?.success ?? false,
      message: res.data?.message ?? '',
      data: {
        status: res.data?.data?.status ?? 0,
        responseTypeId: res.data?.data?.responseTypeId ?? 0,
        message: res.data?.data?.message ?? '',
        operatorId: res.data?.data?.operatorId ?? '',
        circleId: res.data?.data?.circleId ?? '',
        mobile: res.data?.data?.mobile ?? '',
        count: res.data?.data?.count ?? 0,
        groups: Array.isArray(res.data?.data?.groups)
          ? res.data.data.groups
          : [],
        plans: Array.isArray(res.data?.data?.plans)
          ? res.data.data.plans
          : [],
      } as RechargePlansResponse,
    };
  } catch (error: any) {
    console.error(
      'Recharge Plans Error:',
      error?.response?.data || error
    );

    throw error?.response?.data || error;
  }
};

export type BillPayCreateOrderPayload = {
  operator_id: string;
  utility_acc_no?: string;
  circle_id?: string;
  plan_id?: string;
  bill_fetch_id?: number | string;
  sender_name?: string;
};

export type BillPayCreateOrderResult =
  | { success: true; status: number; data: any }
  | NormalizedApiError;

/**
 * A recharge order needs utility_acc_no + circle_id + plan_id + sender_name.
 * A bill-pay order only needs operator_id + bill_fetch_id — the backend does
 * not expect sender_name for this flow (see PaymentConfirmationScreen, which
 * never sends it). Catching a missing field here means we never even hit the
 * network for an incomplete payload, and the caller gets a precise message
 * instead of a generic "Order Failed".
 */
const validateCreateOrderPayload = (payload: BillPayCreateOrderPayload): string | null => {
  if (!payload?.operator_id) {
    return "operator_id is required.";
  }

  const isRechargeOrder = Boolean(payload.plan_id || payload.circle_id || payload.utility_acc_no);

  if (isRechargeOrder) {
    if (!payload.utility_acc_no) return "utility_acc_no is required for a recharge order.";
    if (!payload.circle_id) return "circle_id is required for a recharge order.";
    if (!payload.plan_id) return "plan_id is required for a recharge order.";
    if (!payload.sender_name) return "sender_name is required for a recharge order.";
  } else if (!payload.bill_fetch_id) {
    return "bill_fetch_id is required for a bill payment order.";
  }

  return null;
};

export const createBillPayOrder = async (
  payload: BillPayCreateOrderPayload,
  token?: string,
): Promise<BillPayCreateOrderResult> => {
  const validationError = validateCreateOrderPayload(payload);

  if (validationError) {
    if (__DEV__) {
      console.warn("[createBillPayOrder] Payload validation failed before any network call:", {
        reason: validationError,
        payload,
      });
    }

    return {
      success: false,
      status: 400,
      kind: "VALIDATION_ERROR",
      message: validationError,
      error: { field: validationError, payload },
    };
  }

  try {
    // Explicit fallback header — apiClient's own interceptor will overwrite
    // this with the live session token if one is set via setSessionHandlers,
    // but BBPS previously relied solely on this AsyncStorage-backed token
    // and never went through the shared session/refresh pipeline at all.
    const authHeaders = token
      ? { Authorization: `Bearer ${token}` }
      : await getAuthHeaders();

    const res = await apiClient.post(
      "/v1/bill-pay/create-order",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      }
    );

    return { success: true, status: res.status, data: res.data?.data ?? res.data };
  } catch (error: any) {
    // apiClient's response interceptor already normalizes axios errors into
    // a NormalizedApiError before they reach here.
    if (error && error.success === false && error.kind) {
      return error as NormalizedApiError;
    }

    console.error("Create Bill Pay Order Error:", error);
    return {
      success: false,
      status: null,
      kind: "UNKNOWN_ERROR",
      message: error?.message || "Could not create the recharge/bill order.",
      error,
    };
  }
};

export const verifyBillPayPayment = async (
  payload: Record<string, any>,
  token?: string,
) => {
  try {
    const authHeaders = token
      ? { Authorization: `Bearer ${token}` }
      : await getAuthHeaders();

    const res = await axios.post(
      `${API_BASE_URL}/v1/bill-pay/verify-payment`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      }
    );

    return res.data;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      await clearAuthToken();
    }

    console.error("Verify Bill Pay Payment Error:", error?.response?.data || error);
    throw error?.response?.data || error;
  }
};

export const checkBillTransactionStatus = async (
  transactionId: string | number,
  token?: string,
) => {
  try {
    const authHeaders = token
      ? { Authorization: `Bearer ${token}` }
      : await getAuthHeaders();

    const res = await axios.get(
      `${API_BASE_URL}/v1/bills/check-status/${transactionId}`,
      { headers: authHeaders }
    );

    return res.data;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      await clearAuthToken();
    }

    console.error("Check Bill Status Error:", error?.response?.data || error);
    throw error?.response?.data || error;
  }
};

export interface OrderHistoryItem {
  id: number;
  operator_id: number;
  operator_name: string | null;
  utility_acc_no: string | null;
  confirmation_mobile_no: string | null;
  sender_name: string | null;
  amount: string;
  bbps_status: string;
  payment_status: string | null;
  provider_client_ref_id: string;
  recharge_circle_id: string | null;
  razorpay_order_id: string | null;
  created_at: string;
  final_status: TransactionStatus;
}

export interface OrderHistoryResponse {
  success: boolean;
  orders: OrderHistoryItem[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface OrderHistoryParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  timeFilter?: string;
}

export const bbpsOrderHistoryQueryKey = (params: OrderHistoryParams) =>
  ['bbps-order-history', params] as const;

export const fetchOrderHistory = async (
  params: OrderHistoryParams = {},
  token?: string,
): Promise<OrderHistoryResponse> => {
  try {
    const authHeaders = token
      ? { Authorization: `Bearer ${token}` }
      : await getAuthHeaders();

    const res = await axios.get(`${API_BASE_URL}/v1/bills/order-history`, {
      headers: authHeaders,
      params: {
        page: params.page,
        limit: params.limit,
        status: params.status || undefined,
        search: params.search || undefined,
        from_date: params.fromDate || undefined,
        to_date: params.toDate || undefined,
        time_filter: params.timeFilter || undefined,
      },
    });

    return {
      success: res.data?.success ?? false,
      orders: Array.isArray(res.data?.orders) ? res.data.orders : [],
      total: res.data?.total ?? 0,
      totalPages: res.data?.totalPages ?? 1,
      currentPage: res.data?.currentPage ?? 1,
    };
  } catch (error: any) {
    if (error?.response?.status === 401) {
      await clearAuthToken();
    }

    console.error("Fetch Order History Error:", error?.response?.data || error);
    throw error?.response?.data || error;
  }
};

export const TERMINAL_TRANSACTION_STATUSES = [
  "SUCCESS",
  "FAILED",
  "REFUNDED",
  "RECONCILIATION_REQUIRED",
] as const;

export type TransactionStatus =
  | typeof TERMINAL_TRANSACTION_STATUSES[number]
  | "PENDING"
  | "RETRYING"
  | "REFUND_PENDING";

const extractTransactionStatus = (response: any): { status: TransactionStatus; message: string } => {
  // check-status responds with { success, data: { final_status, bbps_status,
  // payment_status, ... } } — final_status ("SUCCESS" | "FAILED" | "REFUNDED" |
  // "RECONCILIATION_REQUIRED") is the terminal-state field; it has no top-level
  // `status`/`transaction_status`/`message`, which is why polling never used to
  // stop — those fields never existed in the real response.
  const status = String(
    response?.data?.final_status ||
    response?.data?.status ||
    response?.status ||
    response?.data?.transaction_status ||
    "PENDING"
  ).toUpperCase() as TransactionStatus;

  const message =
    response?.message ||
    response?.data?.message ||
    (status === "PENDING"
      ? "Transaction is being processed."
      : `Payment ${response?.data?.payment_status || response?.data?.bbps_status || status}.`);

  return { status, message };
};

/**
 * Polls /v1/bills/check-status/:transactionId every `intervalMs` until a
 * terminal status is reached. Returns a cancel function to stop polling
 * (e.g. on screen unmount).
 */
const MAX_CONSECUTIVE_POLL_ERRORS = 5;

export const pollTransactionStatus = (
  transactionId: string | number,
  onUpdate: (result: { status: TransactionStatus; message: string }) => void,
  intervalMs: number = 5000,
): (() => void) => {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let consecutiveErrors = 0;

  const tick = async () => {
    try {
      const response = await checkBillTransactionStatus(transactionId);
      if (cancelled) return;
      consecutiveErrors = 0;

      const result = extractTransactionStatus(response);
      onUpdate(result);

      if (!TERMINAL_TRANSACTION_STATUSES.includes(result.status as any)) {
        timer = setTimeout(tick, intervalMs);
      }
    } catch (error: any) {
      if (cancelled) return;

      // A single dropped request (e.g. a brief network blip) shouldn't strand
      // the user on a permanent "Payment Failed" screen while the backend is
      // still processing — keep polling until errors persist.
      consecutiveErrors += 1;

      if (consecutiveErrors < MAX_CONSECUTIVE_POLL_ERRORS) {
        onUpdate({
          status: "PENDING",
          message: "Having trouble reaching the server, retrying...",
        });
        timer = setTimeout(tick, intervalMs);
        return;
      }

      onUpdate({
        status: "FAILED",
        message: error?.message || "Could not check transaction status.",
      });
    }
  };

  tick();

  return () => {
    cancelled = true;
    if (timer) {
      clearTimeout(timer);
    }
  };
};
