// api/orders.ts
import axios from "axios";
import { getAuthHeaders } from "../../common/auth/api/AuthAPI";

const API_BASE_URL = "https://rewardplanners.com/api/crm";

export type CancellationReason = {
  id: number;
  reason: string;
  reasonType?: string;
};

export type OrderShipment = {
  vendor_id?: number;
  courier_name?: string | null;
  awb_number?: string | null;
  shipping_status?: string | null;
  label_url?: string | null;
  manifest_url?: string | null;
  status_label?: string | null;
};

export type TrackOrderResponse = {
  order_id: string;
  shipments: OrderShipment[];
};

export const fetchHistory = async (
  page = 1,
  filters: {
    search?: string;
    time_filter?: string;
    status?: string;
    [key: string]: any;
  } = {}
) => {
  try {
    const headers = await getAuthHeaders();
    const params: Record<string, any> = { page };

    if (filters.search) params.search = filters.search;
    if (filters.time_filter) params.time_filter = filters.time_filter;
    if (filters.status) params.status = filters.status;

    Object.entries(filters).forEach(([key, value]) => {
      if (value != null && !params[key]) {
        params[key] = value;
      }
    });

    const res = await axios.get(
      `${API_BASE_URL}/v1/orders/orders-history`,
      { params, headers }
    );
    return res.data;
  } catch (error: any) {
    const status = Number(error?.response?.status || 0);
    if (status !== 401) {
      console.error("Order history error", error);
    }
    return {
      success: false,
      orders: [],
      total: 0,
      totalPages: 0,
      currentPage: 1,
    };
  }
};

export const fetchOrderReceipt = async (orderId: number) => {
  const headers = await getAuthHeaders();
  try {
    const res = await axios.get(
      `${API_BASE_URL}/v1/checkout/order-receipt/${orderId}`,
      { headers }
    );
    return res.data;
  } catch (error) {
    console.error("Order receipt error", error);
    return { success: false };
  }
};

export type OrderDetailsResponse = {
  success: boolean;

  order?: {
    order_id: number;
    order_ref: string;
    status: string;
    total_amount: string;
    created_at: string;
    is_reward_credited: boolean;
  };

  address?: {
    type: string;
    name: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    zipcode: string;
    landmark?: string;
  };

  items?: Array<{
    order_item_id: number;
    product_id: number;
    variant_id: number;
    product_name: string;
    brand_name: string;
    image: string | null;
    attributes: Record<string, any>;
    quantity: number;
    price: number;
    item_total: number;
    reward_discount: number;
  }>;

  shipments?: Array<{
    vendor_id: number;
    courier_name: string | null;
    awb_number: string | null;
    shipping_status: string;
    shipping_charges: number;
    label_url: string | null;
    current_step: number;

    steps: Array<{
      key: string;
      label: string;
      completed: boolean;
      current: boolean;
    }>;

    timeline: any[];

    expected_delivery_date: string | null;
    special_state: string | null;
  }>;

  order_progress?: {
    current_step: number;

    steps: Array<{
      key: string;
      label: string;
      completed: boolean;
      current: boolean;
    }>;
  };

  summary?: {
    item_total: number;
    shipping_total: number;
    reward_discount: number;
    reward_coins_used: number;
    reward_coins_earned: number;
    bag_discount: number;
    order_total: number;
  };
};

export const fetchOrderDetails = async (
  orderId: number
): Promise<OrderDetailsResponse> => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.get(
      `${API_BASE_URL}/v1/orders/order-details/${orderId}`,
      { headers }
    );

    return res.data;
  } catch (error: any) {
    console.error("Order details error", error);

    return {
      success: false,
      order: undefined,
      address: undefined,
      items: [],
      shipments: [],
      order_progress: undefined,
      summary: undefined,
    };
  }
};

export const fetchCancellationReasons = async () => {
  try {
    const headers = await getAuthHeaders();

    const requests = [
      () => axios.get(`${API_BASE_URL}/v1/orders/cancellation-reasons`, { headers }),
      () => axios.get(`${API_BASE_URL}/v1/orders/cancellation-reas`, { headers }),
    ];

    let payload: any = null;

    for (const request of requests) {
      try {
        const res = await request();
        payload = res.data;
        break;
      } catch (err: any) {
        const status = err?.response?.status;
        if (status !== 404 && status !== 405) {
          throw err;
        }
      }
    }

    const list = payload?.reasons || payload?.data || payload || [];

    if (!Array.isArray(list)) {
      return [];
    }

    return list
      .map((item: any, index: number): CancellationReason | null => {
        if (typeof item === "string") {
          return {
            id: index + 1,
            reason: item,
          };
        }

        const reasonText = String(
          item?.reason_text ?? item?.reason ?? item?.title ?? item?.name ?? ""
        ).trim();
        if (!reasonText) {
          return null;
        }

        return {
          id: Number(item?.id ?? item?.reason_id ?? item?.cancellation_reason_id ?? index + 1),
          reason: reasonText,
          reasonType: item?.reason_type ? String(item.reason_type) : undefined,
        };
      })
      .filter((item): item is CancellationReason => !!item);
  } catch (error) {
    console.error("Fetch reasons error:", error);
    return [];
  }
};

export const cancelOrder = async (
  orderId: number,
  reasonId: number,
  reasonType?: string,
  comment?: string
) => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.post(
      `${API_BASE_URL}/v1/orders/cancel/${orderId}`,
      {
        reason_id: reasonId,
        reason_type: reasonType ?? "",
        comment: comment ?? "",
      },
      { headers }
    );

    return res.data;
  } catch (error) {
    console.error("Cancel Order Error:", error);
    return { success: false };
  }
};

export const trackOrder = async (orderId: string | number): Promise<TrackOrderResponse> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(
      `${API_BASE_URL}/v1/orders/track-status/${orderId}`,
      { headers }
    );
    return {
      order_id: String(res?.data?.order_id ?? orderId),
      shipments: Array.isArray(res?.data?.shipments) ? res.data.shipments : [],
    };
  } catch (error: any) {
    const status = Number(error?.response?.status || 0);
    if (status !== 404) {
      console.error("Track order error", error);
    }
    return {
      order_id: String(orderId),
      shipments: [],
    };
  }
};

type FetchOrderInvoiceResult =
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
    return fallback || "invoice.pdf";
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const normalMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (normalMatch?.[1]) {
    return normalMatch[1];
  }

  return fallback || "invoice.pdf";
};

export const fetchOrderInvoice = async (
  orderId: number | string,
): Promise<FetchOrderInvoiceResult> => {
  const headers = await getAuthHeaders();
  try {
    const res = await axios.get(
      `${API_BASE_URL}/v1/orders/invoice/${orderId}`,
      {
        headers,
        responseType: "arraybuffer",
      },
    );

    const base64 =
      typeof res.data === "string"
        ? res.data.replace(/^data:application\/pdf;base64,/, "")
        : arrayBufferToBase64(res.data as ArrayBuffer);

    const contentDisposition = res?.headers?.["content-disposition"] as
      | string
      | undefined;
    const fileName = extractFileName(contentDisposition, `invoice_${orderId}.pdf`);

    if (!base64) {
      return { success: false };
    }

    return {
      success: true,
      base64,
      fileName,
    };
  } catch (error) {
    const axiosError = error as {
      response?: {
        status?: number;
      };
    };

    const status = Number(axiosError?.response?.status || 0);

    if (status === 404) {
      return {
        success: false,
        status,
        message: "Invoice is not available for this order yet.",
      };
    }

    if (status >= 500) {
      return {
        success: false,
        status,
        message: "Invoice could not be generated right now. Please try again later.",
      };
    }

    console.error("Order invoice error", error);
    return {
      success: false,
      status,
      message: "Could not fetch invoice PDF",
    };
  }
};

export const fetchBuyAgainOrders = async (
  page: number = 1,
  search: string = "",
  sort: string = "recent"
) => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.get(
      `${API_BASE_URL}/v1/orders/buy-again?page=${page}&search=${search}&sort=${sort}`,
      { headers }
    );

    return res.data;
  } catch (error) {
    console.log("Fetch Buy Again Error:", error);
    throw error;
  }
};
