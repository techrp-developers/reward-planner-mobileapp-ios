// SupportApi.tsx

import api from "../../common/auth/api/axios";

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
};

export type CreateSupportTicketPayload = {
  subject: string;
  description: string;
  category_id: number;
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
    attachment_url: item?.attachment_url
      ? String(item.attachment_url).trim()
      : undefined,
    created_at: String(
      item?.created_at || item?.createdAt || item?.date || ""
    ).trim(),
    updated_at: String(
      item?.updated_at || item?.updatedAt || item?.created_at || item?.date || ""
    ).trim(),
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
    const res = await api.post(
      CREATE_SUPPORT_TICKET_ENDPOINT,
      payload
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
