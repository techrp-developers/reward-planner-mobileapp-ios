import axios from 'axios';
import { BASE_API_URL } from './api';
import { getAuthHeaders } from '../../common/auth/api/AuthAPI';


// ===================== Types =====================

export interface ServiceBundle {
  id: number;
  name: string;
  description: string;
  bundle_price: string;
  original_price: string;
  banner_image: string;
}

export interface BundleItem {
  id: number;
  service_id: number;
  variant_id: number;
  price: string;
  bundle_price?: number | string;
  individual_price?: number | string;
  is_required: number;
  service_name: string;
  variant_name: string;
  title: string;
  image_url: string | null;
  documents?: Array<{
    id: number;
    document_name: string;
    is_mandatory: 0 | 1;
  }>;
}

export interface BundleEnquiryField {
  label?: string;
  field_name?: string;
  field_type?: string;
  options?: unknown;
  is_required?: number;
}

export interface BundleDetail {
  bundle: {
    id: number;
    name: string;
    description: string;
    banner_image: string;
    bundle_price: string;
    original_price: string;
  };
  items: BundleItem[];
  sections: {
    features?: unknown[];
    details?: unknown[];
    trust_stats?: string[];
    paragraphs?: Array<{
      title?: string;
      content?: string[];
    }>;
  };
  enquiry_fields: BundleEnquiryField[];
  pricing: {
    total_price: number;
    bundle_price: string;
    savings: number;
  };
}

export interface ServiceCartItem {
  id: number;
  quantity: number;
  price: number;
  bundle_id: number | null;
  service_name: string;
  variant_name: string;
  variant_id: number;
  service_id: number;
  title: string;
  image_url: string | null;
  documents: Array<{
    id: number;
    document_name: string;
    is_mandatory: 0 | 1;
  }>;
}

interface ServiceBundleListResponse {
  success?: boolean;
  data?: ServiceBundle[];
}

interface BundleDetailResponse {
  success?: boolean;
  data?: BundleDetail;
}

interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
}

// ===================== Bundle APIs =====================

export const getServiceBundles = async (): Promise<ServiceBundle[]> => {
  try {
    const res = await axios.get<ServiceBundleListResponse>(`${BASE_API_URL}/service-bundle/`);
    const items = Array.isArray(res.data?.data) ? res.data.data : [];

    if (!res.data?.success) return [];

    return items.map((item) => ({
      ...item,
      banner_image: item.banner_image || '',
    }));
  } catch (error) {
    console.error('Service Bundle API Error:', error);
    return [];
  }
};

export const getBundleDetail = async (bundleId: number): Promise<BundleDetail | null> => {
  try {
    const res = await axios.get<BundleDetailResponse>(
      `${BASE_API_URL}/service-bundle/bundle-detail/${bundleId}`
    );

    if (res.data?.success && res.data?.data?.bundle) {
      const data = res.data.data;
      const safeItems = Array.isArray(data.items) ? data.items : [];

      return {
        ...data,
        bundle: {
          ...data.bundle,
          banner_image: data.bundle.banner_image || '',
        },
        items: safeItems.map((item) => ({
          ...item,
          image_url: item.image_url ?? null,
        })),
      };
    }

    return null;
  } catch (error) {
    console.error('Bundle Detail API Error:', error);
    return null;
  }
};

export const sendBundleEnquiry = async (
  bundleId: number,
  formData: Record<string, string>
) => {
  try {
    const headers = await getAuthHeaders();

    const payload = {
      bundle_id: bundleId,
      ...formData,
    };

    const res = await axios.post<ApiResponse>(
      `${BASE_API_URL}/bundle-enquiry`,
      payload,
      { headers }
    );

    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Failed to submit enquiry');
    }

    return res.data;
  } catch (error: any) {
    console.error('Bundle Enquiry Error:', error?.response?.data || error);
    throw error?.response?.data || error;
  }
};

// ===================== Cart APIs =====================

export const addBundleToCart = async (
  bundle_id: number,
  payload: {
    selected_items: number[];
  }
) => {
  if (!bundle_id) {
    throw new Error('Invalid bundle_id');
  }

  try {
    const headers = await getAuthHeaders();
    const res = await axios.post<ApiResponse<{ added_items: number[] }>>(
      `${BASE_API_URL}/service-cart/add-bundle/${bundle_id}`,
      payload,
      { headers }
    );

    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Failed to add bundle');
    }

    return res.data;
  } catch (error: any) {
    console.error('Add Bundle To Cart Error:', error?.response?.data || error);
    throw error?.response?.data || error;
  }
};

export const addServiceToCart = async ({
  service_id,
  variant_id,
}: {
  service_id: number;
  variant_id: number;
}) => {
  if (!service_id || !variant_id) {
    throw new Error('Invalid service_id or variant_id');
  }

  try {
    const headers = await getAuthHeaders();
    const res = await axios.post<ApiResponse>(
      `${BASE_API_URL}/service-cart/add`,
      { service_id, variant_id },
      { headers }
    );

    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Failed to add to cart');
    }

    return res.data;
  } catch (error: any) {
    console.error('Add Service To Cart Error:', error?.response?.data || error);
    throw error?.response?.data || error;
  }
};

export const getServiceCartItems = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get<
      ApiResponse<{
        bundles: Array<{
          bundle_id: number;
          items: ServiceCartItem[];
          bundle_total: number;
        }>;
        individual_items: ServiceCartItem[];
        total: number;
      }>
    >(`${BASE_API_URL}/service-cart/cart-items`, { headers });

    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Failed to fetch cart');
    }

    return res.data.data;
  } catch (error: any) {
    console.error('Get Cart Items Error:', error?.response?.data || error);
    throw error?.response?.data || error;
  }
};

export const removeServiceCartItem = async (item_id: number) => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.delete<ApiResponse>(
      `${BASE_API_URL}/service-cart/item/${item_id}`,
      { headers }
    );

    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Failed to remove cart item');
    }

    return res.data;
  } catch (error: any) {
    console.error('Remove Cart Item Error:', error?.response?.data || error);
    throw error?.response?.data || error;
  }
};

export const clearServiceCart = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.delete<ApiResponse>(`${BASE_API_URL}/service-cart/clear`, { headers });

    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Failed to clear cart');
    }

    return res.data;
  } catch (error: any) {
    console.error('Clear Cart Error:', error?.response?.data || error);
    throw error?.response?.data || error;
  }
};

// ===================== Checkout APIs =====================

export const getBuyNowPreview = async ({
  service_id,
  variant_id,
}: {
  service_id: number;
  variant_id: number;
}) => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get<ApiResponse>(
      `${BASE_API_URL}/service-checkout/buy-now-preview`,
      {
        headers,
        params: { service_id, variant_id },
      }
    );

    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Failed to load buy now preview');
    }

    return res.data.data;
  } catch (error: any) {
    console.error('Buy Now Preview Error:', error?.response?.data || error);
    throw error?.response?.data || error;
  }
};

export const getCheckoutPreview = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get<ApiResponse>(
      `${BASE_API_URL}/service-checkout/checkout-preview`,
      { headers }
    );

    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Failed to load checkout preview');
    }

    return res.data.data;
  } catch (error: any) {
    console.error('Checkout Preview Error:', error?.response?.data || error);
    throw error?.response?.data || error;
  }
};

export const createCheckoutOrder = async ({
  service_id,
  variant_id,
  isBuyNow = false,
}: {
  service_id?: number;
  variant_id?: number;
  isBuyNow?: boolean;
}) => {
  try {
    const headers = await getAuthHeaders();
    const payload = isBuyNow ? { service_id, variant_id } : {};

    const res = await axios.post<ApiResponse>(
      `${BASE_API_URL}/service-checkout/buy-now`,
      payload,
      { headers }
    );

    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Failed to create order');
    }

    return res.data.data;
  } catch (error: any) {
    console.error('Create Order Error:', error?.response?.data || error);
    throw error?.response?.data || error;
  }
};

// GET /v1/service-checkout/buy-now-preview
export const getBuyNowPreviewAPI = async ({
  service_id,
  variant_id,
}: {
  service_id: number;
  variant_id: number;
}) => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.get(
      `${BASE_API_URL}/service-checkout/buy-now-preview`,
      {
        headers,
        params: {
          service_id,
          variant_id,
        },
      }
    );

    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Failed to fetch buy now preview');
    }

    return res.data.data;
  } catch (error: any) {
    console.error('❌ Buy Now Preview Error:', error?.response?.data || error);
    throw error?.response?.data || error;
  }
};

// GET /v1/service-checkout/checkout-preview
export const getCheckoutPreviewAPI = async () => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.get(
      `${BASE_API_URL}/service-checkout/checkout-preview`,
      { headers }
    );

    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Failed to fetch checkout preview');
    }

    return res.data.data;
  } catch (error: any) {
    console.error('❌ Checkout Preview Error:', error?.response?.data || error);
    throw error?.response?.data || error;
  }
};
// POST /v1/service-checkout/buy-now
export const createOrderAPI = async ({
  service_id,
  variant_id,
  isBuyNow = false,
}: {
  service_id?: number;
  variant_id?: number;
  isBuyNow?: boolean;
}) => {
  try {
    const headers = await getAuthHeaders();

    const payload = isBuyNow
      ? { service_id, variant_id }
      : {}; // cart mode → empty payload

    const res = await axios.post(
      `${BASE_API_URL}/service-checkout/buy-now`,
      payload,
      { headers }
    );

    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Order creation failed');
    }

    return res.data.data;
  } catch (error: any) {
    console.error('❌ Create Order Error:', error?.response?.data || error);
    throw error?.response?.data || error;
  }
};

export const getBuyNowBundlePreview = async (payload: {
  bundle_id: number;
  selected_items: number[];
}) => {
  try {
    const headers = await getAuthHeaders();

    const response = await axios.get(
      `${BASE_API_URL}/service-checkout/buy-now-bundle-preview`,
      {
        headers,
        params: {
          bundle_id: payload.bundle_id,
          selected_items: payload.selected_items.join(','), // ✅ FIX
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("❌ Bundle Preview API error:", error?.response?.data || error.message);
    throw error?.response?.data || error;
  }
};

export const buyNowBundle = async (payload: {
  bundle_id: number;
  selected_items: number[];
  address_id: number;
}) => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await axios.post(
      `${BASE_API_URL}/service-checkout/buy-now-bundle`,
      payload,
      {
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("❌ buyNowBundle API error:", error?.response?.data || error.message);
    throw error?.response?.data || error;
  }
};