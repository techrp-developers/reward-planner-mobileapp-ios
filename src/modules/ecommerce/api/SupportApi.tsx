// SupportApi.tsx

import api from "../../common/auth/api/axios";

export type SupportCategory = {
  category_id: number;
  name: string;
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

const SUPPORT_CATEGORIES_ENDPOINT = "/v1/support/categories";
const CREATE_SUPPORT_TICKET_ENDPOINT = "/v1/support/create-ticket";

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
