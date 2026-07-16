import axios from 'axios';
import { BASE_API_URL } from './api';
import { API } from './InsuranceApi';
import { ServiceHomeResponse } from '../navigation/type';

export const API_BASE = BASE_API_URL;

export const getAllServiceCategories = async () => {
  try {
    const res = await axios.get(`${API_BASE}/category/all-categories`);
    const data = res?.data?.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to fetch service categories', error);
    return [];
  }
};

export const getServicesByCategory = async (categoryId: number) => {
  try {
    const result = await getServiceByCategory(categoryId);
    if (result.type === 'list') return result.services;
    if (result.type === 'direct') return result.variants;
    return [];
  } catch (error) {
    console.error(`Failed to fetch services for category ${categoryId}`, error);
    return [];
  }
};


export const sendServiceEnquiry = async (enquiryData: {
  name: string;
  email: string;
  contact: string;
  city?: string;
  pincode?: string;
  subject?: string;
  description: string;
  bundle_id?: number;
  [key: string]: any;
}) => {
  try {
    if (!enquiryData.name || !enquiryData.email || !enquiryData.contact || !enquiryData.description) {
      throw new Error('Missing required fields');
    }

    const payload = {
      name: enquiryData.name,
      email: enquiryData.email,
      contact: enquiryData.contact,
      description: enquiryData.description,
      subject: enquiryData.subject || 'Service Enquiry',

      ...(enquiryData.city && { city: enquiryData.city }),
      ...(enquiryData.pincode && { pincode: enquiryData.pincode }),

      ...(enquiryData.bundle_id && { bundle_id: enquiryData.bundle_id }), // ✅ KEY CHANGE

      ...Object.fromEntries(
        Object.entries(enquiryData).filter(
          ([key]) =>
            ![
              'name',
              'email',
              'contact',
              'city',
              'pincode',
              'subject',
              'description',
              'bundle_id',
            ].includes(key)
        )
      ),
    };

    const res = await axios.post(
      `${API_BASE}/service-enquiry/send-enquiry-notification`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return res.data;
  } catch (error) {
    console.error('Failed to send enquiry', error);
    throw error;
  }
};

export const getServiceByCategory = async (
  categoryId: number | null | undefined
) => {
  try {
    // Prevent invalid API calls
    if (!categoryId || Number(categoryId) <= 0) {
      console.warn(
        '⚠️ Invalid categoryId:',
        categoryId
      );

      return {
        success: false,
        type: 'unknown' as const,
        category: null,
        services: [],
      };
    }

    console.log(
      '📡 Fetching category:',
      categoryId
    );

    const res = await API.get(
      `/service/by-category/${categoryId}`
    );

    const { success, type, data } =
      res.data || {};

    if (!success) {
      return {
        success: false,
        type: 'unknown' as const,
        category: null,
        services: [],
      };
    }

    if (type === 'list') {
      return {
        success: true,
        type: 'list' as const,
        category: data?.category || null,
        services: Array.isArray(data?.services)
          ? data.services
          : [],
      };
    }

    if (type === 'direct') {
      return {
        success: true,
        type: 'direct' as const,
        category: data?.category || null,
        service: data?.service || null,
        variants: Array.isArray(data?.variants)
          ? data.variants
          : [],
        enquiryFields: Array.isArray(
          data?.enquiry_fields
        )
          ? data.enquiry_fields
          : [],
        sections: Array.isArray(
          data?.service_sections
        )
          ? data.service_sections
          : [],
      };
    }

    return {
      success: true,
      type: 'unknown' as const,
      category: null,
      services: [],
    };

  } catch (error: any) {
    console.error(
      '❌ Service API Error:',
      error?.response?.data || error
    );

    return {
      success: false,
      type: 'unknown' as const,
      category: null,
      services: [],
    };
  }
};

export const getServiceDetails = async (serviceId: number) => {
  try {
    const res = await API.get(`/service/details/${serviceId}`);
    console.log("✅ Service Details Response:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("❌ Service Details Error:", error?.response || error);
    throw error;
  }
};

type CreateServiceEnquiryBasePayload = {
  name: string;
  city?: string;
  pincode?: string;
  mobile: string;
  email: string;
  enquiry_data: Record<string, unknown>;
};

export type CreateServiceEnquiryPayload =
  | (CreateServiceEnquiryBasePayload & {
      bundle_id: number;
      service_id?: never;
      variant_id?: never;
    })
  | (CreateServiceEnquiryBasePayload & {
      service_id: number;
      variant_id: number;
      bundle_id?: never;
    });

const ENQUIRY_DATA_EXCLUDED_KEYS = new Set([
  'name',
  'user_name',
  'full_name',
  'username',
  'city',
  'town',
  'email',
  'email_id',
  'email_address',
  'mobile',
  'mobile_number',
  'phone',
  'contact',
  'phone_number',
]);

export const createServiceEnquiry = async (payload: CreateServiceEnquiryPayload) => {
  try {
    const rawEnquiryData = payload.enquiry_data || {};
    const sanitizedEnquiryData = Object.fromEntries(
      Object.entries(rawEnquiryData).filter(([key]) => !ENQUIRY_DATA_EXCLUDED_KEYS.has(String(key).toLowerCase())),
    );

    const requestBody: CreateServiceEnquiryPayload = {
      name: String(payload.name || '').trim(),
      city: payload.city?.trim() ? payload.city.trim() : undefined,
      pincode: payload.pincode?.trim() ? payload.pincode.trim() : undefined,
      mobile: String(payload.mobile || '').trim(),
      email: String(payload.email || '').trim(),
      enquiry_data: sanitizedEnquiryData,
      ...('bundle_id' in payload && payload.bundle_id
        ? { bundle_id: Number(payload.bundle_id) }
        : {
            service_id: Number(payload.service_id),
            variant_id: Number(payload.variant_id),
          }),
    };

    const res = await API.post('/service-enquiry', requestBody);

    console.log('✅ Enquiry Success:', res.data);
    return res.data;
  } catch (error: any) {
    const errorData = error?.response?.data;
    console.error('❌ Enquiry Error:', errorData || error);

    const message =
      errorData?.message ||
      errorData?.error ||
      error?.message ||
      'Failed to submit service enquiry';

    throw new Error(message);
  }
};

export const getServiceHome = async (): Promise<ServiceHomeResponse> => {
  try {
    const response = await fetch(`${API_BASE}/service/home`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const json = await response.json();

    if (!response.ok || json?.success === false) {
      throw new Error(json?.message || "Failed to fetch service home");
    }

    return json;
  } catch (error: any) {
    console.error("❌ getServiceHome Error:", error);
    throw error;
  }
};

export const getAllServices = async (search = '') => {
  try {
    const response = await axios.get(
      `${API_BASE}/service/all-services`,
      {
        params: {
          search,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.log('Get Services API Error:', error?.response || error);

    throw error?.response?.data || {
      success: false,
      message: 'Something went wrong',
    };
  }
};


