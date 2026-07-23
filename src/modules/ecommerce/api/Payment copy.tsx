import api from "../../common/auth/api/axios";

const normalizePaymentOrderResponse = (raw: any) => {
  const data = raw?.data ?? raw ?? {};

  const orderId =
    data.orderId ??
    data.order_id ??
    data.razorpayOrderId ??
    data.razorpay_order_id ??
    data.id;

  const amount = Number(data.amount ?? 0);

  return {
    ...data,
    orderId,
    amount,
    currency: data.currency || "INR",
  };
};


export const createPaymentOrder = async (
  orderId: number,
) => {
  const res = await api.post("/v1/payment/create-order", { orderId });
  const normalized = normalizePaymentOrderResponse(res.data);

  if (!normalized.orderId || !normalized.amount || !normalized.key) {
    throw new Error("Invalid payment order response");
  }

  return normalized;
};

export const verifyPayment = async (payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderId: number;
}) => {
  const res = await api.post("/v1/payment/verify-payment", {
    razorpay_order_id: payload.razorpay_order_id,
    razorpay_payment_id: payload.razorpay_payment_id,
    razorpay_signature: payload.razorpay_signature,
  });
  return res.data;
};

export const checkPaymentStatus = async (orderId: number) => {
  const res = await api.get(`/v1/payment/payment-status/${orderId}`);
  return res.data;
};

export const cancelPendingPaymentOrder = async (orderId: number) => {
  const res = await api.post(`/v1/payment/cancel-order/${orderId}`);
  return res.data;
};
