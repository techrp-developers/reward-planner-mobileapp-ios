// SupportApi.tsx

import api from "../../common/auth/api/axios";
import { SERVER_URL } from '../../../config/apiConfig'

export type SupportCategory = {
  category_id: number;
  name: string;
};

export type SupportTicket = {
  ticket_id: number;
  subject: string;
  description: string;
  category_name: string;
  status: string;
  attachment_url?: string;
  created_at: string;
  updated_at: string;
  support_module: string;
  reference_type?: string;
  reference_id?: string;
  reference_label?: string;
};

export type CreateSupportTicketPayload = {
  description: string;
  category_id: number;
  support_module: 'general' | 'ecommerce' | 'services' | 'bbps' | 'step_counter';
  reference_type?: 'order';
  reference_id?: string;
  reference_label?: string;
  attachment?: {
    uri: string;
    name: string;
    type: string;
  };
};

type SupportCategoriesResponse = {
  success: boolean;
  data: SupportCategory[];
};

type CreateSupportTicketResponse = {
  success: boolean;
  message: string;
  data: any;
};

type SupportTicketsResponse = {
  success: boolean;
  message?: string;
  data: SupportTicket[];
};

const SUPPORT_CATEGORIES_ENDPOINT = "/v1/support/categories";
const CREATE_SUPPORT_TICKET_ENDPOINT = "/v1/support/create-ticket";
const SUPPORT_TICKETS_ENDPOINT = "/v1/support/my-tickets";

const normalizeTicketStatus = (value: any) => {
  const normalized = String(value || "open")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (normalized === "inprogress") {
    return "in_progress";
  }

  return normalized || "open";
};

const normalizeAttachmentUrl = (value: unknown) => {
  const url = String(value || '').trim();
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SERVER_URL.replace(/\/$/, '')}/${url.replace(/^\/+/, '')}`;
};

const mapSupportTicket = (item: any): SupportTicket | null => {
  const ticketId = Number(item?.ticket_id ?? item?.id ?? item?.support_id);
  const subject = String(
    item?.subject || item?.title || item?.issue_subject || ""
  ).trim();

  if (!ticketId || !subject) {
    return null;
  }

  return {
    ticket_id: ticketId,
    subject,
    description: String(
      item?.description || item?.message || item?.issue_description || ""
    ).trim(),
    category_name: String(
      item?.category_name || item?.category?.name || item?.category || "General"
    ).trim(),
    status: normalizeTicketStatus(
      item?.status || item?.status_name || item?.ticket_status
    ),
    attachment_url: normalizeAttachmentUrl(item?.attachment_url),
    created_at: String(
      item?.created_at || item?.createdAt || item?.date || ""
    ).trim(),
    updated_at: String(
      item?.updated_at || item?.updatedAt || item?.created_at || item?.date || ""
    ).trim(),
    support_module: String(item?.support_module || 'general'),
    reference_type: item?.reference_type ? String(item.reference_type) : undefined,
    reference_id: item?.reference_id ? String(item.reference_id) : undefined,
    reference_label: item?.reference_label ? String(item.reference_label) : undefined,
  };
};

// ============================ GET SUPPORT CATEGORIES ============================

export const fetchSupportCategories =
  async (): Promise<SupportCategoriesResponse> => {
    try {
      const res = await api.get(SUPPORT_CATEGORIES_ENDPOINT);

      return {
        success: Boolean(res?.data?.success),
        data: Array.isArray(res?.data?.data)
          ? res.data.data.map((item: any) => ({
            category_id: Number(item?.category_id),
            name: String(item?.name || ""),
          })).filter((item: SupportCategory) => item.category_id && item.name)
          : [],
      };
    } catch (error: any) {
      console.error("Support categories error", error);

      return {
        success: false,
        data: [],
      };
    }
  };

// ============================ CREATE SUPPORT TICKET ============================

export const createSupportTicket = async (
  payload: CreateSupportTicketPayload
): Promise<CreateSupportTicketResponse> => {
  try {
    const formData = new FormData();
    formData.append('description', payload.description);
    formData.append('category_id', String(payload.category_id));
    formData.append('support_module', payload.support_module);
    if (payload.reference_type) formData.append('reference_type', payload.reference_type);
    if (payload.reference_id) formData.append('reference_id', payload.reference_id);
    if (payload.reference_label) formData.append('reference_label', payload.reference_label);
    if (payload.attachment) {
      formData.append('attachment', payload.attachment as any);
    }

    const res = await api.post(
      CREATE_SUPPORT_TICKET_ENDPOINT,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );

    return {
      success: Boolean(res?.data?.success),
      message:
        res?.data?.message ||
        "Ticket created successfully",
      data: res?.data,
    };
  } catch (error: any) {
    console.error("Create support ticket error", error);

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        "Failed to create support ticket",
      data: null,
    };
  }
};

// ============================ GET SUPPORT TICKETS ============================

export const fetchSupportTickets =
  async (): Promise<SupportTicketsResponse> => {
    try {
      const res = await api.get(SUPPORT_TICKETS_ENDPOINT);
      const rows = Array.isArray(res?.data?.data) ? res.data.data : [];

      return {
        success: Boolean(res?.data?.success),
        message: String(res?.data?.message || ""),
        data: rows
          .map(mapSupportTicket)
          .filter((item: SupportTicket | null): item is SupportTicket => Boolean(item)),
      };
    } catch (error: any) {
      console.error("Support tickets error", error);

      return {
        success: false,
        message:
          error?.response?.data?.message || "Failed to load support tickets",
        data: [],
      };
    }
  };
