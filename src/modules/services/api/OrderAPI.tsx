import axios from "axios";
import { getAuthHeaders, clearAuthToken } from "../../common/auth/api/AuthAPI";
import { BASE_API_URL, BASE_IMAGE_URL } from "./api";

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
}

export interface ServiceCancellationReason {
  reason_id: number;
  reason_text: string;
}

export interface ServiceInvoiceDetails {
  id: number;
  parent_order_id: string;
  invoice_number: string;
  invoice_url: string;
  total_amount: string;
  created_at: string;
  url: string;
  download_url: string;
}

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
  order_ref: string;
  service_name: string;
  variant_name: string;
  title: string;
  image_url: string;
  price: number;
  status: string;
  documents: ServiceDocument[];
  timeline: ServiceTimeline[];
  feedback: ServiceFeedback;
  cancellation: ServiceCancellation;
  refund: any;
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
  summary: {
    total_services: number;
    completed_services: number;
    total_bundles: number;
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

    console.log("📤 Creating payment order:", parent_order_id);

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

    console.log("🔐 Verifying service payment:", {
      parent_order_id: payload.parent_order_id,
      razorpay_order_id: payload.razorpay_order_id,
    });

    const res = await axios.post(
      `${BASE_API_URL}/service-orders/verify-payment`,
      payload,
      { headers }
    );

    console.log("✅ Payment verified:", res.data);
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

    console.log("📊 Checking service payment status for:", parent_order_id);

    const res = await axios.get(
      `${BASE_API_URL}/service-orders/payment-status/${parent_order_id}`,
      { headers }
    );

    console.log("📊 Payment status:", res.data);
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
// 8. Get Service Invoice Details
// ==============================
export const getServiceInvoiceDetails = async (
  parent_order_id: string
): Promise<{
  success: boolean;
  data: ServiceInvoiceDetails;
}> => {
  try {
    const headers = await getAuthHeaders();

    if (!parent_order_id) {
      throw new Error("parent_order_id is required");
    }

    const res = await axios.get(
      `${BASE_API_URL}/service-orders/invoice-details/${parent_order_id}`,
      { headers }
    );

    const invoice = res.data?.data;
    const relativeUrl = String(invoice?.url || "").trim();
    const downloadUrl = relativeUrl
      ? relativeUrl.startsWith("http")
        ? relativeUrl
        : `${BASE_IMAGE_URL}/api/crm${relativeUrl.startsWith("/") ? relativeUrl : `/${relativeUrl}`}`
      : "";

    return {
      success: Boolean(res.data?.success),
      data: {
        ...invoice,
        download_url: downloadUrl,
      },
    };
  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("Get Service Invoice Details Error:", error?.response || error);
    throw error?.response?.data || error;
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

