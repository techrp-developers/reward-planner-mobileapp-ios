import axios from "axios";
import { getAuthHeaders, clearAuthToken } from "../../common/auth/api/AuthAPI";
import { BASE_API_URL } from "./api";


type RequiredDocumentItem = {
  service_document_id?: number;
  document_id?: number;
  id?: number;
  document_name?: string;
  is_mandatory?: number | boolean;
  uploaded?: boolean;
  file_path?: string | null;
};

const getErrorMessage = (error: any, fallback: string) => {
  return String(
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.details ||
    error?.message ||
    fallback,
  );
};


// ==============================
// 📄 1. Get Required Documents
// ==============================
export const getRequiredDocuments = async (order_id: number) => {
  try {
    const headers = await getAuthHeaders();
    const candidates = [
      `${BASE_API_URL}/service-order-documents/documents/${order_id}`,
      `${BASE_API_URL}/service-order-documents/documents/${order_id}/`,
    ];

    for (const url of candidates) {
      try {
        const res = await axios.get(url, { headers });
        const list = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
            ? res.data
            : [];

        return {
          ...res.data,
          data: list as RequiredDocumentItem[],
        };
      } catch (innerError: any) {
        if (Number(innerError?.response?.status) === 404) {
          continue;
        }
        throw innerError;
      }
    }

    return { success: true, data: [] as RequiredDocumentItem[] };

  } catch (error: any) {
    if (error?.response?.status === 401) {
      await clearAuthToken();
    }

    console.error("❌ Get Documents Error:", error?.response || error);
    throw new Error(getErrorMessage(error, 'Unable to fetch required documents'));
  }
};


// ─── Types ────────────────────────────────────────────────────────────────────

export type ServiceDocument = {
  document_key: string;
  document_name: string;
  is_mandatory: boolean;
  is_expirable: boolean;
  uploaded: boolean;
  expiry_date: string | null;
  document_number: string | null;
  file_url: string | null;
};

export type ParentDocumentsResponse = {
  success: boolean;
  data: {
    parent_order_id: string;
    can_submit: boolean;
    documents: ServiceDocument[];
  };
};

export type SubmitDocumentPayload = {
  document_key: string;
  document_number?: string | null;
  expiry_date?: string | null;       // ISO date string e.g. "2027-06-13"
  file: {
    uri: string;
    name: string;
    type: string;                    // e.g. "image/jpeg", "application/pdf"
  };
};

export type SubmitDocumentsResponse = {
  success: boolean;
  message?: string;
  data?: any;
};

// ─── GET ──────────────────────────────────────────────────────────────────────

/**
 * Fetch all documents required for a parent service order
 * GET /v1/service-order-documents/parent-documents/:parentOrderId
 */
export const fetchParentOrderDocuments = async (
  parentOrderId: string
): Promise<ParentDocumentsResponse> => {
  const headers = await getAuthHeaders();
  const res = await axios.get(
    `${BASE_API_URL}/service-order-documents/parent-documents/${parentOrderId}`,
    { headers }
  );
  return res.data;
};

// ─── POST ─────────────────────────────────────────────────────────────────────

/**
 * Submit documents for a parent service order (multipart/form-data)
 * POST /v1/service-orders/submit-documents/:parentOrderId
 */
export const submitParentOrderDocuments = async (
  parentOrderId: string,
  documents: SubmitDocumentPayload[]
): Promise<SubmitDocumentsResponse> => {
  const authHeaders = await getAuthHeaders();
  const formData = new FormData();

  documents.forEach((doc) => {
    // File keyed by document_key — matches backend's flat multipart format
    formData.append(doc.document_key, {
      uri: doc.file.uri,
      name: doc.file.name,
      type: doc.file.type,
    } as any);

    if (doc.document_number) {
      formData.append(`${doc.document_key}_document_number`, doc.document_number);
    }

    if (doc.expiry_date) {
      formData.append(`${doc.document_key}_expiry_date`, doc.expiry_date);
    }
  });

  const res = await axios.post(
    `${BASE_API_URL}/service-orders/submit-documents/${parentOrderId}`,
    formData,
    {
      headers: {
        ...authHeaders,
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
};