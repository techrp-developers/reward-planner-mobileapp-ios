/**
 * PolicyPlannerApi.ts
 * Direct PolicyPlanner.com premium API calls.
 * These are NOT the CRM enquiry APIs — they hit policyplanner.com directly.
 * For CRM lead flow use InsuranceCrmApi.ts instead.
 */

import axios from 'axios';
import { getAuthHeaders } from '../../common/auth/api/AuthAPI';

const HEALTH_BASE_URL =
  'https://policyplanner.com/health-insurance/companies/plans?policy=Health';
const HEALTH_BASE_URL_FALLBACK =
  'https://policyplanner.com/health-insurance//companies/plans?policy=Health';
const SUPERTOPUP_BASE_URL =
  'https://policyplanner.com/health-insurance/companies/plans?policy=super_top_up';
const PA_BASE_URL =
  'https://policyplanner.com/health-insurance/companies/plans?policy=pa';

// ─── Health ────────────────────────────────────────────────────────────────

export const fetchPlans = async (headers?: any): Promise<any[]> => {
  try {
    const authHeaders = headers || (await getAuthHeaders());
    for (const url of [HEALTH_BASE_URL, HEALTH_BASE_URL_FALLBACK]) {
      try {
        const res = await axios.get(url, { headers: authHeaders });
        if (res.data?.success && Array.isArray(res.data?.data)) {
          return res.data.data;
        }
        console.warn('fetchPlans: Unexpected response', res.data);
      } catch (err) {
        console.warn('fetchPlans failed for URL:', url, err);
      }
    }
    return [];
  } catch (error) {
    console.error('Error fetching plans:', error);
    return [];
  }
};

const getCompanyFromUrl = (url: string): string => {
  try {
    return url.split('/')[4];
  } catch {
    return 'general';
  }
};

const buildHealthPayload = (company: string, payload: any) => {
  const base = {
    coverAmount: Number(payload.coverAmount) || 0,
    zone: String(payload.zone || '1'),
    age: Number(payload.age) || 30,
  };

  switch (company) {
    case 'nic':
    case 'bajaj':
    case 'hdfc':
    case 'icici':
    case 'tata':
      return {
        ...base,
        sage: payload.sage ?? null,
        c1age: payload.c1age ?? null,
        c2age: payload.c2age ?? null,
        c3age: payload.c3age ?? null,
        c4age: payload.c4age ?? null,
      };
    default:
      return base;
  }
};

export const getPremium = async (
  url: string,
  payload: any,
  headers?: any,
): Promise<any> => {
  try {
    const company = getCompanyFromUrl(url);
    const finalPayload = buildHealthPayload(company, payload);
    const authHeaders = headers || (await getAuthHeaders());
    const res = await axios.post(url, finalPayload, {
      headers: authHeaders,
      timeout: 10000,
    });
    return res.data;
  } catch (error: any) {
    console.warn(
      `❌ Premium API failed: ${url}`,
      error?.response?.status || error?.message,
    );
    throw error;
  }
};

export const getAllPremiums = async (payload: any): Promise<any[]> => {
  try {
    const plans = await fetchPlans();
    if (!plans.length) {
      console.warn('❌ No plans found');
      return [];
    }
    const responses = await Promise.allSettled(
      plans.map((plan: any) => getPremium(plan.api_type, payload)),
    );
    return responses.map((res, index) => {
      const planUrl = plans[index].api_type;
      if (res.status === 'fulfilled') {
        return { url: planUrl, success: true, data: res.value };
      }
      return {
        url: planUrl,
        success: false,
        data: null,
        error:
          res.reason?.response?.status ||
          res.reason?.message ||
          'Unknown error',
      };
    });
  } catch (error) {
    console.error('Error in getAllPremiums:', error);
    return [];
  }
};

// ─── Super Top-Up ──────────────────────────────────────────────────────────

export const fetchSuperTopUpPlans = async (headers?: any): Promise<any[]> => {
  try {
    const authHeaders = headers || (await getAuthHeaders());
    const res = await axios.get(SUPERTOPUP_BASE_URL, { headers: authHeaders });
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    console.warn('fetchSuperTopUpPlans: Unexpected response', res.data);
    return [];
  } catch (error) {
    console.error('Error fetching super top-up plans:', error);
    return [];
  }
};

const buildSuperTopUpPayload = (payload: any) => ({
  coverAmount: payload.coverAmount,
  deductible: payload.deductible || 500000,
  age: payload.age,
  sage: payload.sage || null,
  c1age: payload.c1age || null,
  c2age: payload.c2age || null,
  c3age: payload.c3age || null,
  c4age: payload.c4age || null,
});

export const getSuperTopUpPremium = async (
  url: string,
  payload: any,
  headers?: any,
): Promise<any> => {
  try {
    if (!url) throw new Error('API URL missing');
    const finalPayload = buildSuperTopUpPayload(payload);
    const authHeaders = headers || (await getAuthHeaders());
    const res = await axios.post(url, finalPayload, {
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      timeout: 10000,
    });
    return res.data;
  } catch (error: any) {
    console.warn(
      `❌ SuperTopUp API failed: ${url}`,
      error?.response?.status || error?.message,
    );
    throw error;
  }
};

export const getAllSuperTopUpPremiums = async (payload: any): Promise<any[]> => {
  try {
    const plans = await fetchSuperTopUpPlans();
    if (!plans.length) {
      console.warn('No Super Top-Up plans found');
      return [];
    }
    const responses = await Promise.allSettled(
      plans.map((plan: any) => getSuperTopUpPremium(plan.api_type, payload)),
    );
    return responses.map((res, index) => {
      if (res.status === 'fulfilled') {
        return { url: plans[index].api_type, success: true, data: res.value };
      }
      return {
        url: plans[index].api_type,
        success: false,
        error:
          res.reason?.response?.status ||
          res.reason?.message ||
          'Unknown error',
      };
    });
  } catch (error) {
    console.error('Error in getAllSuperTopUpPremiums:', error);
    return [];
  }
};

// ─── Personal Accident ─────────────────────────────────────────────────────

export const fetchPAPlans = async (headers?: any): Promise<any[]> => {
  try {
    const authHeaders = headers || (await getAuthHeaders());
    const res = await axios.get(PA_BASE_URL, {
      headers: authHeaders,
      timeout: 8000,
    });
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    console.warn('fetchPAPlans: Unexpected response', res.data);
    return [];
  } catch (error) {
    console.error('Error fetching PA plans:', error);
    return [];
  }
};

export const getPAPremium = async (
  url: string,
  payload: any,
  headers?: any,
): Promise<any> => {
  try {
    if (!url) throw new Error('API URL missing');
    if (!payload.coverAmount || !payload.category || !payload.age) {
      throw new Error('coverAmount, category, and age are required');
    }
    const authHeaders = headers || (await getAuthHeaders());
    const res = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      timeout: 8000,
    });
    return res.data;
  } catch (error: any) {
    console.warn(
      `❌ PA Premium API failed: ${url}`,
      error?.response?.status || error?.message,
    );
    throw error;
  }
};

export const getAllPAPremiums = async (payload: any): Promise<any[]> => {
  try {
    if (!payload.coverAmount || !payload.category || !payload.age) {
      throw new Error('coverAmount, category, and age are required');
    }
    const plans = await fetchPAPlans();
    if (!plans.length) {
      console.warn('❌ No PA plans found');
      return [];
    }
    const responses = await Promise.allSettled(
      plans.map((plan: any) => getPAPremium(plan.api_type, payload)),
    );
    return responses.map((res, index) => {
      const planUrl = plans[index].api_type;
      if (res.status === 'fulfilled') {
        return { url: planUrl, success: true, data: res.value };
      }
      return {
        url: planUrl,
        success: false,
        data: null,
        error:
          res.reason?.response?.status ||
          res.reason?.message ||
          'Unknown error',
      };
    });
  } catch (error) {
    console.error('Error in getAllPAPremiums:', error);
    return [];
  }
};
