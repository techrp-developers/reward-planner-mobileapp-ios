/**
 * InsuranceCrmApi.ts
 * Single source of truth for all RewardPlanners CRM insurance API calls.
 * Base URL: https://rewardplanners.com/api/crm/v1
 */

import axios from 'axios';
import { getAuthHeaders } from '../../common/auth/api/AuthAPI';

const CRM_BASE_URL = 'https://rewardplanners.com/api/crm/v1';

// Axios instance shared by CRM calls and re-exported for ServiceAPI backward compat.
export const API = axios.create({
  baseURL: CRM_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

API.interceptors.request.use(
  async (config) => {
    console.log('🌐 API Request:', config.method?.toUpperCase(), (config.baseURL ?? '') + (config.url ?? ''));
    const authHeaders = await getAuthHeaders();
    Object.assign(config.headers, authHeaders || {});
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Types ─────────────────────────────────────────────────────────────────

export type InsuranceType = 'health' | 'super_topup' | 'personal_accident';

const toCrmInsuranceType = (
  insuranceType: InsuranceType | 'personal_accident',
): InsuranceType => {
  if (insuranceType === 'personal_accident') return 'personal_accident';
  return insuranceType;
};
 

// ─── CRM Functions ─────────────────────────────────────────────────────────

/**
 * Start a new insurance lead enquiry.
 * Returns { enquiry_id, enquiryId, ...rest } with a guaranteed numeric ID.
 */
export const startInsurance = async (
  insurance_type: InsuranceType,
): Promise<{ enquiry_id: number; enquiryId: number; [key: string]: any }> => {
  try {
    const crmType = toCrmInsuranceType(insurance_type);
    const res = await API.post('/insurance/start', { insurance_type: crmType });
    const payload = res.data?.data || res.data;

    const rawId = payload?.enquiry_id ?? payload?.enquiryId ?? payload?.id ?? null;
    const enquiryId = Number(rawId);

    if (!Number.isFinite(enquiryId) || enquiryId <= 0) {
      throw new Error(
        `Invalid enquiry ID received: ${rawId}. Response: ${JSON.stringify(payload)}`,
      );
    }

    console.log(
      `[CRM] ✅ Created enquiry: ${enquiryId} (uiType: ${insurance_type}, crmType: ${crmType})`,
    );

    return { enquiry_id: enquiryId, enquiryId, ...payload };
  } catch (error: any) {
    console.error('[CRM] ❌ startInsurance failed:', error.message);
    throw new Error(
      error?.response?.data?.message ||
        error.message ||
        'Unable to create insurance enquiry. Please try again.',
    );
  }
};

/**
 * Save a step in the insurance lead flow.
 */
export const saveStep = async (
  enquiry_id: number,
  step: number,
  section: string,
  data: any,
): Promise<any> => {
  console.log(
    `[CRM] saveStep → enquiry=${enquiry_id}, step=${step}, section=${section}`,
  );
  const res = await API.post('/insurance/save-step', {
    enquiry_id,
    step,
    section,
    data,
  });
  return res.data;
};

/**
 * Mark an insurance enquiry as complete, triggering quote generation.
 */
export const completeInsurance = async (enquiry_id: number): Promise<any> => {
  const res = await API.post('/insurance/complete', { enquiry_id });
  console.log(`[CRM] ✅ completeInsurance success for enquiry: ${enquiry_id}`);
  return res.data;
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Fetch quotes for a completed enquiry.
 * Retries with exponential back-off when the backend reports the enquiry is not yet ready.
 */
export const getQuotes = async (enquiry_id: number, retries = 8): Promise<any> => {
  let lastError: any;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const res = await API.post('/insurance/get-quotes', { enquiry_id });
      console.log(`[CRM] ✅ getQuotes success for enquiry: ${enquiry_id}`);
      return res.data;
    } catch (error: any) {
      const status = error?.response?.status;
      const message = String(
        error?.response?.data?.message || error?.message || '',
      ).toLowerCase();

      const routeIssue =
        status === 404 ||
        status === 405 ||
        message.includes('route') ||
        message.includes('method not allowed');

      if (routeIssue) {
        try {
          console.log(`[CRM] getQuotes fallback GET ${attempt}/${retries} for enquiry: ${enquiry_id}`);
          const getRes = await API.get('/insurance/get-quotes', {
            params: { enquiry_id },
          });
          return getRes.data;
        } catch (getError: any) {
          lastError = getError;
        }
      } else {
        lastError = error;
      }

      const pendingMsg = String(
        lastError?.response?.data?.message || lastError?.message || '',
      ).toLowerCase();

      const enquiryPending =
        pendingMsg.includes('enquiry not found') ||
        pendingMsg.includes('enquiry id not found') ||
        pendingMsg.includes('not found') ||
        pendingMsg.includes('not fount') ||
        pendingMsg.includes('not ready') ||
        pendingMsg.includes('processing') ||
        pendingMsg.includes('try again');

      if (!enquiryPending || attempt >= retries) {
        throw lastError;
      }

      const delay = Math.min(12000, Math.round(1000 * Math.pow(1.5, attempt - 1)));
      console.log(
        `[CRM] getQuotes retry ${attempt}/${retries} for enquiry ${enquiry_id} in ${delay}ms (reason: ${pendingMsg || 'pending'})`,
      );
      await sleep(delay);
    }
  }

  throw lastError || new Error('Unable to fetch quotes');
};

/**
 * Save the plan selected by the user.
 */
export const selectPlan = async (enquiry_id: number, plan: any): Promise<any> => {
  const res = await API.post('/insurance/select-plan', { enquiry_id, plan });
  return res.data;
};
