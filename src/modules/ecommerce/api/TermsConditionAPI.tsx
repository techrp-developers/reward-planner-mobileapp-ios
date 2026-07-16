import api, {
  API_BASE_URL,
} from "../../common/auth/api/axios";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type TermsStatusResponse = {
  success: boolean;
  terms_accepted: boolean;
};

export type AcceptTermsPayload = {
  accepted: boolean;
};

// ─────────────────────────────────────────────────────────────
// GET TERMS STATUS
// FINAL URL:
// https://rewardplanners.com/api/crm/v1/terms/current-status
// ─────────────────────────────────────────────────────────────

export const fetchTermsStatus =
  async (): Promise<TermsStatusResponse> => {
    const url =
      `${API_BASE_URL}/v1/terms/current-status`;

    console.log("[Terms] GET", url);

    const response =
      await api.get<TermsStatusResponse>(
        "/v1/terms/current-status",
      );

    console.log(
      "[Terms] GET response:",
      response.data,
    );

    return response.data;
  };

// ─────────────────────────────────────────────────────────────
// UPDATE TERMS
// FINAL URL:
// https://rewardplanners.com/api/crm/v1/terms/accept-terms
// ─────────────────────────────────────────────────────────────

export const updateTermsAcceptance =
  async (
    payload: AcceptTermsPayload,
  ): Promise<{ success: boolean }> => {
    const url =
      `${API_BASE_URL}/v1/terms/accept-terms`;

    console.log(
      "[Terms] POST",
      url,
      payload,
    );

    const response =
      await api.post<{ success: boolean }>(
        "/v1/terms/accept-terms",
        payload,
      );

    console.log(
      "[Terms] POST response:",
      response.data,
    );

    return response.data;
  };

  export type TermItem = {
  id: number;
  term_no: string;
  title: string;
  content: string;
  status: number;
  created_at: string;
  updated_at: string;
};

export type TermsListResponse = {
  success: boolean;
  message: string;
  data: TermItem[];
};

// GET TERMS LIST
export const fetchTermsList =
  async (): Promise<TermsListResponse> => {
    const response =
      await api.get<TermsListResponse>(
        "/v1/terms",
      );

    return response.data;
  };

  export type PrivacyPolicyItem = {
  id: number;
  policy_no: string;
  title: string;
  content: string;
  status: number;
  created_at: string;
  updated_at: string;
};

export type PrivacyPolicyResponse = {
  success: boolean;
  message: string;
  data: PrivacyPolicyItem[];
};

// GET PRIVACY POLICY

export const fetchPrivacyPolicy =
  async (): Promise<PrivacyPolicyResponse> => {
    const response =
      await api.get<PrivacyPolicyResponse>(
        "/v1/terms/privacy-policy",
      );

    return response.data;
  };