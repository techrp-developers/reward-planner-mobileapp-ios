import axios from "axios";
import api from "../../common/auth/api/axios";

const API_BASE_URL = "https://rewardplanners.com/api/crm";

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
  amount: number
) => {
  const endpoint = `${API_BASE_URL}/v1/payment/create-order`;
  const amountNum = Number(amount ?? 0);
  const paiseAmount = Math.round(amountNum * 100);

  const payloads = [
    { orderId, amount: amountNum },
    { order_id: orderId, amount: amountNum },
    { orderId, amount: paiseAmount },
    { order_id: orderId, amount: paiseAmount },
  ];

  let lastError: any;

  for (const payload of payloads) {
    try {
      const res = await axios.post(endpoint, payload);
      const normalized = normalizePaymentOrderResponse(res.data);

      if (!normalized.orderId || !normalized.amount) {
        throw new Error("Invalid payment order response");
      }

      return normalized;
    } catch (error: any) {
      lastError = error;
      if (error?.response?.status !== 400) {
        break;
      }
    }
  }

  throw lastError;
};

export const verifyPayment = async (payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderId: number;
}) => {
  const endpoint = `${API_BASE_URL}/v1/payment/verify-payment`;

  const payloads = [
    {
      razorpay_order_id: payload.razorpay_order_id,
      razorpay_payment_id: payload.razorpay_payment_id,
      razorpay_signature: payload.razorpay_signature,
      orderId: payload.orderId,
    },
    {
      razorpay_order_id: payload.razorpay_order_id,
      razorpay_payment_id: payload.razorpay_payment_id,
      razorpay_signature: payload.razorpay_signature,
      order_id: payload.orderId,
    },
    {
      razorpay_order_id: payload.razorpay_order_id,
      razorpay_payment_id: payload.razorpay_payment_id,
      razorpay_signature: payload.razorpay_signature,
      orderId: payload.orderId,
      order_id: payload.orderId,
    },
  ];

  let lastError: any;
  for (const body of payloads) {
    try {
      const res = await axios.post(endpoint, body);
      return res.data;
    } catch (error: any) {
      lastError = error;
      if (error?.response?.status !== 400 && error?.response?.status !== 404) {
        break;
      }
    }
  }

  throw lastError;
};

export const checkPaymentStatus = async (orderId: number) => {
  const endpoints = [
    `${API_BASE_URL}/v1/payment/payment-status/${orderId}`,
    `${API_BASE_URL}/v1/payment/payment-status/${orderId}`,
    `${API_BASE_URL}/v1/orders/payment-status/${orderId}`,
  ];

  let lastError: any;
  for (const endpoint of endpoints) {
    try {
      const res = await axios.get(endpoint);
      return res.data;
    } catch (error: any) {
      lastError = error;
      if (error?.response?.status !== 404) {
        break;
      }
    }
  }

  throw lastError;
};

export const cancelPendingPaymentOrder = async (orderId: number) => {
  const res = await api.post(`/v1/payment/cancel-order/${orderId}`);
  return res.data;
};