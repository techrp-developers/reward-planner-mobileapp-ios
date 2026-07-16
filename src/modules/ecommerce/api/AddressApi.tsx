// src/api/AddressApi.ts
import axios from "axios";
import { getAuthHeaders, clearAuthToken } from "../../common/auth/api/AuthAPI";

const API_BASE_URL = "https://rewardplanners.com/api/crm";


export type AddToAddressPayload = {
  address_type: "home" | "work" | "other";
  address1: string;
  address2?: string;
  city: string;
  state_id?: number;
  zipcode: string;
  is_default?: number;
  landmark?: string;
  contact_name?: string;
  contact_phone?: string;

  // NEW
  latitude?: number;
  longitude?: number;
};


export const addAddress = async (payload: AddToAddressPayload) => {
  console.log("📦 Sending Address payload:", payload);
  const headers = await getAuthHeaders();
  const res = await axios.post(`${API_BASE_URL}/v1/auth/address`, payload, {
    headers,
  });
  return res.data;
};

export const fetchCountries = async () => {
  const res = await axios.get(`${API_BASE_URL}/v1/auth/countries`);
  return res.data;
};

export const fetchStatesByCountry = async (countryId: number) => {
  const res = await axios.get(`${API_BASE_URL}/v1/auth/states/${countryId}`);
  return res.data;
};



export const fetchAllAddress = async () => {
  try {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) {
      console.debug('No auth token available for address fetch');
      return { data: [] };
    }

    const res = await axios.get(`${API_BASE_URL}/v1/auth/addresses`, {
      headers,
    });
    return res.data;
  } catch (error: any) {
    const status = Number(error?.response?.status || 0);

    if (status === 401) {
      console.debug('Address fetch: Unauthorized (token may be expired)');
      await clearAuthToken();
      return { data: [] };
    }

    if (status === 503) {
      console.debug('Address API unavailable (503), returning empty address fallback');
      return { data: [] };
    }

    if (status >= 500) {
      console.warn('Address fetch: Server error', status);
      return { data: [] };
    }

    console.debug('Address fetch failed:', error?.message || error);
    return { data: [] };
  }
};



export const updateAddress = async (
  address_id: number,
  payload: Partial<AddToAddressPayload>
) => {
  const headers = await getAuthHeaders();
  const res = await axios.put(
    `${API_BASE_URL}/v1/auth/address/${address_id}`,
    payload,
    {
      headers,
    }
  );
  return res.data;
};

export const deleteAddress = async (address_id: number) => {
  const headers = await getAuthHeaders();
  return axios.delete(`${API_BASE_URL}/v1/auth/address/${address_id}`, {
    headers,
  });
};

export const fetchAddressByID = async (address_id: string | number) => {
  const headers = await getAuthHeaders();
  const res = await axios.get(
    `${API_BASE_URL}/v1/auth/address/${address_id}`,
    { headers }
  );
  return res.data.data;
};
export const fetchAllStates = async () => {
  const res = await axios.get(`${API_BASE_URL}/auth/all-states`);
  return res.data;
};

export const setAddressAsDefault = async (addressId: string | number): Promise<boolean> => {
  try {
    const headers = await getAuthHeaders();
    await axios.patch(
      `${API_BASE_URL}/v1/auth/address/${addressId}`,
      { is_default: 1 },
      { headers },
    );
    return true;
  } catch {
    return false;
  }
};
