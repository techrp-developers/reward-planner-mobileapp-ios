import { API_BASE_URL } from "../../../config/apiConfig";
import { getAuthHeaders } from "../../common/auth/api/AuthAPI";

// Follow the shared environment switch, including the live reverse-proxy prefix.
export const INSURANCE_BASE_URL = API_BASE_URL;

export const fetchGmcDetails = async (): Promise<any> => {
  const headers = await getAuthHeaders();
  if (!headers.Authorization) {
    return { success: false, data: null };
  }

  try {
    const response = await fetch(`${INSURANCE_BASE_URL}/v1/gmc/details`, {
      headers: {
        ...headers,
      },
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[InssuranceApi] Fetch GMC details failed:", error);
    return { success: false, data: null };
  }
};

export const submitClaimEnquiry = async (payload: any): Promise<any> => {
  const headers = await getAuthHeaders();
  try {
    const response = await fetch(`${INSURANCE_BASE_URL}/v1/gmc/claims/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[InssuranceApi] Submit claim enquiry failed:", error);
    return { success: false, message: "Network request failed" };
  }
};

export const fetchClaimHistory = async (): Promise<any> => {
  const headers = await getAuthHeaders();
  try {
    const response = await fetch(`${INSURANCE_BASE_URL}/v1/gmc/claims/history`, {
      headers: {
        ...headers,
      },
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[InssuranceApi] Fetch claim history failed:", error);
    return { success: false, data: [] };
  }
};
