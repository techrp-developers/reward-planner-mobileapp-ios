import axios from "axios";
import { getAuthHeaders, clearAuthToken } from "../../common/auth/api/AuthAPI";
import { BASE_API_URL } from "./api";

/* =========================================================
   TYPES
========================================================= */

export interface ServiceOrderItem {
  id: number;
  order_ref: string;
  service_name: string;
  variant_name: string;
  image_url: string;
  price: number;
  bundle_id: number | null;
}

export interface ServiceBundle {
  bundle_id: number;
  bundle_total: number;
  items: ServiceOrderItem[];
}

export interface OrderPreview {
  type: "service" | "bundle";
  name: string;
}

export interface OrderSummary {
  total_items: number;
  total_bundles: number;
}

export interface ServiceOrder {
  parent_order_id: string;
  created_at: string;
  status: string;
  total_amount: number;
  items: ServiceOrderItem[];
  bundles: ServiceBundle[];
  summary: OrderSummary;
  preview: OrderPreview[];
}

export interface OrdersResponse {
  success: boolean;
  orders: ServiceOrder[];
  total: number;
  totalPages: number;
  currentPage: number;
  summary: {
    all: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    pending_payment: number;
  };
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  timeFilter?: string;
}
export interface ServiceDocument {
  service_document_id: number;
  uploaded_document_id: number;
  document_name: string;
  document_key: string;
  is_mandatory: boolean;
  is_expirable: boolean;
  uploaded: boolean;
  expiry_date: string | null;
  document_number: string | null;
  file_url: string | null;
}

export interface ServiceTimeline {
  status: string;
  completed: boolean;
}

export interface ServiceFeedback {
  can_submit: boolean;
  submitted: boolean;
  data: any;
}

export interface ServiceCancellation {
  can_cancel: boolean;
  status?: string;
  reason?: string | null;
  refund_status?: string | null;
  timeline?: Array<{
    event: string;
    label: string;
    date: string | null;
  }>;
}

export interface ServiceCancellationReason {
  reason_id: number;
  reason_text: string;
}

export interface ServiceCancellationDetails {
  service_order_id: number;
  order_ref: string;
  status: string;
  service: {
    service_id?: number | null;
    service_name: string;
    variant_name?: string | null;
    title?: string | null;
    image_url?: string | null;
  };
  address: null | {
    address_type?: string | null;
    address1?: string | null;
    address2?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    zipcode?: string | null;
    landmark?: string | null;
    contact_name?: string | null;
    contact_phone?: string | null;
  };
  cancellation: null | {
    status: string;
    reason?: string | null;
    comment?: string | null;
    refund_status?: string | null;
    refund_method?: string | null;
    refund_amount: number;
    created_at?: string | null;
  };
  timeline: Array<{
    label: string;
    event: string;
    date?: string | null;
  }>;
  refund: {
    total: number;
    money_refund: number;
    coin_refund: number;
  };
  rewards: {
    used: number;
    reversed: number;
  };
  summary: {
    service_total: number;
    order_total: number;
  };
}

type ServiceInvoicePdfResult =
  | { success: true; base64: string; fileName: string }
  | { success: false; message?: string; status?: number };

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...Array.from(chunk));
  }

  const encoder = (globalThis as { btoa?: (value: string) => string }).btoa;
  if (typeof encoder !== "function") {
    throw new Error("Base64 encoder is not available");
  }

  return encoder(binary);
};

const extractFileName = (contentDisposition?: string, fallback?: string): string => {
  if (!contentDisposition) {
    return fallback || "service_invoice.pdf";
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const normalMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (normalMatch?.[1]) {
    return normalMatch[1];
  }

  return fallback || "service_invoice.pdf";
};

export interface SubmitServiceFeedbackPayload {
  service_order_id: number;
  rating: number;
  ease_rating?: number;
  expert_rating?: number;
  completion_time?: string;
  confidence?: string;
  reuse_intent?: string;
  comment?: string;
}

export interface ServiceItem {
  id: number;
  service_id?: number | null;
  order_ref: string;
  service_name: string;
  variant_name: string;
  title: string;
  image_url: string;
  price: number;
  total_amount?: number;
  reward_coins_used?: number;
  reward_coins_earned?: number;
  status: string;
  payment_status?: string;
  documents: ServiceDocument[];
  timeline: ServiceTimeline[];
  feedback: ServiceFeedback;
  cancellation: ServiceCancellation;
  refund: null | {
    amount: number;
    method: 'original' | 'wallet' | 'split';
    total: number;
    money_refund: number;
    coin_refund: number;
    status: string | null;
  };
}

export interface ServiceDetailBundle {
  bundle_id: number;
  bundle_total: number;
  items: ServiceItem[];
}

export interface ServiceAddress {
  address_type: string;
  address1: string;
  address2: string;
  city: string;
  zipcode: string;
  landmark: string;
  contact_name: string;
  contact_phone: string;
  state: string;
  country: string;
}

export interface ServiceOrderDetails {
  parent_order_id: string;
  created_at: string;
  status: string;
  address: ServiceAddress | null;
  total_amount: number;
  subtotal: number;
  reward_discount: number;
  reward_coins_used: number;
  reward_coins_earned: number;
  rewards: {
    used: number;
    earned: number;
  };
  summary: {
    total_services: number;
    completed_services: number;
    total_bundles: number;
    subtotal: number;
    reward_discount: number;
    total: number;
    reward_coins_used: number;
    reward_coins_earned: number;
  };
  timeline: ServiceTimeline[];
  items: ServiceItem[];
  bundles: ServiceDetailBundle[];
}

/* =========================================================
   1. GET MY ORDERS
========================================================= */

export const getMyServiceOrders = async (
  params: GetOrdersParams = {}
): Promise<OrdersResponse> => {
  try {
    const headers = await getAuthHeaders();

    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      fromDate = "",
      toDate = "",
      timeFilter = "",
    } = params;

    const res = await axios.get(
      `${BASE_API_URL}/service-orders/my-orders`,
      {
        headers,
        params: {
          page,
          limit,
          search,
          status,
          from_date: fromDate,
          to_date: toDate,
          time_filter: timeFilter,
        },
      }
    );

    return res.data;
  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("❌ Get My Orders Error:", error?.response || error);
    throw error?.response?.data || error;
  }
};

// ==============================
// 📦 2. Get Order Details
// ==============================
export const getServiceOrderDetails = async (
  parent_order_id: string
) => {
  try {
    const headers = await getAuthHeaders();

    if (!parent_order_id) {
      throw new Error("parent_order_id is required");
    }

    const res = await axios.get(
      `${BASE_API_URL}/service-orders/order-details/${parent_order_id}`,
      { headers }
    );

    return res.data;
  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("❌ Get Order Details Error:", {
      status: error?.response?.status,
      message: error?.response?.data?.message,
      data: error?.response?.data,
    });

    throw error?.response?.data || error;
  }
};

// ==============================
// 💳 3. Create Payment Order
// ==============================
export const createServiceOrderPayment = async (parent_order_id: string) => {
  try {
    const headers = await getAuthHeaders();

    if (!parent_order_id || parent_order_id.length < 10) {
      throw new Error("Invalid parent_order_id (must be UUID)");
    }

    __DEV__ && console.log("📤 Creating payment order:", parent_order_id);

    const res = await axios.post(
      `${BASE_API_URL}/service-orders/create-order`,
      { parent_order_id },
      { headers }
    );

    return res.data;

  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("❌ Payment Order Error:", error?.response || error);
    throw error?.response?.data || error;
  }
};


// ==============================
// ✅ 4. Verify Service Payment
// ==============================
export const verifyServicePayment = async (payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  parent_order_id: string;
}) => {
  try {
    const headers = await getAuthHeaders();

    __DEV__ && console.log("🔐 Verifying service payment:", {
      parent_order_id: payload.parent_order_id,
      razorpay_order_id: payload.razorpay_order_id,
    });

    const res = await axios.post(
      `${BASE_API_URL}/service-orders/verify-payment`,
      payload,
      { headers }
    );

    __DEV__ && console.log("✅ Payment verified:", res.data);
    return res.data;

  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("❌ Verify Service Payment Error:", {
      status: error?.response?.status,
      message: error?.response?.data?.message,
      data: error?.response?.data,
    });
    throw error?.response?.data || error;
  }
};


// ==============================
// 📊 5. Check Service Payment Status
// ==============================
export const checkServicePaymentStatus = async (parent_order_id: string) => {
  try {
    const headers = await getAuthHeaders();

    __DEV__ && console.log("📊 Checking service payment status for:", parent_order_id);

    const res = await axios.get(
      `${BASE_API_URL}/service-orders/payment-status/${parent_order_id}`,
      { headers }
    );

    __DEV__ && console.log("📊 Payment status:", res.data);
    return res.data;

  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("❌ Check Payment Status Error:", {
      status: error?.response?.status,
      message: error?.response?.data?.message,
    });
    throw error?.response?.data || error;
  }
};

// ==============================
// 6. Get Service Cancellation Reasons
// ==============================
export const getServiceCancellationReasons = async (): Promise<{
  success: boolean;
  reasons: ServiceCancellationReason[];
}> => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.get(
      `${BASE_API_URL}/service-orders/cancellation-reasons`,
      { headers }
    );

    return {
      success: Boolean(res.data?.success),
      reasons: Array.isArray(res.data?.reasons) ? res.data.reasons : [],
    };
  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("Get Service Cancellation Reasons Error:", error?.response || error);
    throw error?.response?.data || error;
  }
};

// ==============================
// 7. Request Service Order Cancellation
// ==============================
export const requestServiceOrderCancellation = async (payload: {
  service_order_id: number;
  reason_id: number;
  comment?: string;
}) => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.post(
      `${BASE_API_URL}/service-orders/cancel-order-request`,
      {
        service_order_id: payload.service_order_id,
        reason_id: payload.reason_id,
        comment: payload.comment?.trim() || "",
      },
      { headers }
    );

    return res.data;
  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("Request Service Cancellation Error:", error?.response || error);
    throw error?.response?.data || error;
  }
};

// ==============================
// 8. Get Service Cancellation Details
// ==============================
export const getServiceCancellationDetails = async (
  service_order_id: number
): Promise<{ success: boolean; data?: ServiceCancellationDetails; message?: string }> => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.get(
      `${BASE_API_URL}/service-orders/cancellation-details/${service_order_id}`,
      { headers }
    );

    return {
      success: Boolean(res.data?.success),
      data: res.data?.data,
      message: res.data?.message,
    };
  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("Get Service Cancellation Details Error:", error?.response || error);
    throw error?.response?.data || error;
  }
};

// ==============================
// 9. Get Service Invoice Details
// ==============================
export const getServiceInvoiceDetails = async (
  parent_order_id: string
): Promise<ServiceInvoicePdfResult> => {
  try {
    const headers = await getAuthHeaders();

    if (!parent_order_id) {
      throw new Error("parent_order_id is required");
    }

    const res = await axios.get(
      `${BASE_API_URL}/service-orders/invoice-details/${parent_order_id}`,
      {
        headers,
        responseType: "arraybuffer",
      }
    );

    const base64 =
      typeof res.data === "string"
        ? res.data.replace(/^data:application\/pdf;base64,/, "")
        : arrayBufferToBase64(res.data as ArrayBuffer);

    const contentDisposition = res?.headers?.["content-disposition"] as
      | string
      | undefined;
    const fileName = extractFileName(contentDisposition, `service_invoice_${parent_order_id}.pdf`);

    if (!base64) {
      return { success: false, message: "Invoice PDF is empty" };
    }

    return {
      success: true,
      base64,
      fileName,
    };
  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("Get Service Invoice Details Error:", error?.response || error);
    const status = Number(error?.response?.status || 0);
    const message =
      status === 400
        ? "Invoice is available after payment."
        : status === 404
          ? "Invoice is not available for this order yet."
          : error?.message || "Could not fetch invoice PDF";

    return { success: false, status, message };
  }
};

// ==============================
// 9. Submit Service Feedback
// ==============================
export const submitServiceFeedback = async (
  payload: SubmitServiceFeedbackPayload
) => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.post(
      `${BASE_API_URL}/service/feedback`,
      {
        service_order_id: payload.service_order_id,
        rating: payload.rating,
        ease_rating: payload.ease_rating,
        expert_rating: payload.expert_rating,
        completion_time: payload.completion_time,
        confidence: payload.confidence,
        reuse_intent: payload.reuse_intent,
        comment: payload.comment?.trim() || "",
      },
      { headers }
    );

    return res.data;
  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("Submit Service Feedback Error:", error?.response || error);
    throw error?.response?.data || error;
  }
};

