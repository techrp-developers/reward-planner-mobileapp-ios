import api from "../../common/auth/api/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateServicePaymentOrderResponse = {
  success: boolean;
  data: {
    key: string;
    orderId: string;       // e.g. "order_T12C1Oa7j2RMIN"
    amount: number;        // paise e.g. 522500 = ₹5225
    currency: string;      // "INR"
    parent_order_id: string;
  };
};

export type VerifyServicePaymentPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type VerifyServicePaymentResponse = {
  success: boolean;
  message?: string;
  data?: {
    redirect_to: string; // "/service-order-documents/parent-documents/:id"
  };
};

export type CheckServicePaymentStatusResponse = {
  success: boolean;
  payment_status?: "paid" | "pending" | "failed" | string;
  status?: string;
  message?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const getServicePaymentError = (err: any, fallback: string): string =>
  String(
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );

export const isServicePaymentVerified = (res: any): boolean => {
  const status = String(res?.payment_status ?? res?.status ?? "").toLowerCase();
  if (status) {
    return status === "paid" ||
    status === "captured" ||
    status === "success" ||
    status === "verified";
  }
  return res?.success === true || res?.verified === true;
};

// ─── 1. Create Razorpay Order ─────────────────────────────────────────────────

/**
 * POST /v1/service-orders/create-order
 * Body: { parent_order_id }
 */
export const createServicePaymentOrder = async (
  parent_order_id: string
): Promise<CreateServicePaymentOrderResponse> => {
  const res = await api.post("/v1/service-orders/create-order", { parent_order_id });
  return res.data;
};

// ─── 2. Verify Payment ────────────────────────────────────────────────────────

/**
 * POST /v1/service-orders/verify-payment
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export const verifyServicePayment = async (
  payload: VerifyServicePaymentPayload
): Promise<VerifyServicePaymentResponse> => {
  __DEV__ && console.log("🔐 verifyServicePayment", {
    razorpay_order_id: payload.razorpay_order_id,
  });

  try {
    const res = await api.post("/v1/service-orders/verify-payment", payload);
    return res.data;
  } catch (err: any) {
    const status = Number(err?.response?.status ?? 0);
    const message = getServicePaymentError(err, "Payment verification failed");
    console.error("❌ Verify Service Payment Error:", { status, message, data: err?.response?.data });
    throw { status, message, data: err?.response?.data };
  }
};

// ─── 3. Check Payment Status (fallback / polling) ─────────────────────────────

/**
 * GET /v1/service-orders/payment-status/:parentOrderId
 * Fallback when verifyServicePayment throws (network drop, 500, etc.)
 */
export const checkServicePaymentStatus = async (
  parent_order_id: string
): Promise<CheckServicePaymentStatusResponse> => {
  const res = await api.get(`/v1/service-orders/payment-status/${encodeURIComponent(parent_order_id)}`);
  return res.data;
};
