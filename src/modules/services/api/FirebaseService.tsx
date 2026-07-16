import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

export type CreateFirebaseEnquiryPayload = {
  service_id: number;
  variant_id: number;
  name: string;
  city?: string;
  mobile: string;
  email: string;
  enquiry_data: Record<string, any>;
};

export type CreateFirebaseEnquiryResponse = {
  success: true;
  id: string;
};

export type InsuranceLeadType = 'health' | 'supertopup' | 'personal_accident';

export type FirebaseInsuranceLead = {
  id: string;
  service_id: number;
  insuranceType: InsuranceLeadType;
  variant_id: number;
  name: string;
  city?: string;
  mobile: string;
  email: string;
  enquiry_data: Record<string, any>;
  createdAt?: any;
};

const INSURANCE_SERVICE_MAP: Record<number, InsuranceLeadType> = {
  1: 'health',
  2: 'supertopup',
  3: 'personal_accident',
};

const toInsuranceLead = (id: string, raw: any): FirebaseInsuranceLead | null => {
  const serviceId = Number(raw?.service_id);
  const insuranceType = INSURANCE_SERVICE_MAP[serviceId];
  if (!insuranceType) return null;

  return {
    id,
    service_id: serviceId,
    insuranceType,
    variant_id: Number(raw?.variant_id || 0),
    name: String(raw?.name || ''),
    city: raw?.city,
    mobile: String(raw?.mobile || ''),
    email: String(raw?.email || ''),
    enquiry_data: (raw?.enquiry_data || {}) as Record<string, any>,
    createdAt: raw?.createdAt,
  };
};

export const createFirebaseEnquiry = async (
  payload: CreateFirebaseEnquiryPayload,
): Promise<CreateFirebaseEnquiryResponse> => {
  try {
    const docRef = await addDoc(collection(db, 'service_enquiries'), {
      ...payload,
      createdAt: serverTimestamp(),
    });

    console.log('✅ Firebase Enquiry Saved:', {
      id: docRef.id,
      service_id: payload.service_id,
      name: payload.name,
      mobile: payload.mobile,
    });

    return {
      success: true,
      id: docRef.id,
    };
  } catch (error) {
    console.error('❌ Firebase Error:', error);
    throw error;
  }
};

/**
 * Fetch only insurance leads from Firebase service_enquiries collection.
 * Includes: health (1), supertopup (2), personal_accident (3)
 */
export const getFirebaseInsuranceLeads = async (
  max = 100,
): Promise<FirebaseInsuranceLead[]> => {
  try {
    const insuranceServiceIds = [1, 2, 3];

    const q = query(
      collection(db, 'service_enquiries'),
      where('service_id', 'in', insuranceServiceIds),
      orderBy('createdAt', 'desc'),
      limit(max),
    );

    const snap = await getDocs(q);
    const leads = snap.docs
      .map((doc) => toInsuranceLead(doc.id, doc.data()))
      .filter((lead): lead is FirebaseInsuranceLead => lead !== null);

    console.log(`✅ Firebase Insurance Leads fetched: ${leads.length}`);
    return leads;
  } catch (error: any) {
    // Fallback path when composite index is not ready.
    if (String(error?.message || '').toLowerCase().includes('index')) {
      try {
        const fallbackQ = query(
          collection(db, 'service_enquiries'),
          where('service_id', 'in', [1, 2, 3]),
          limit(max),
        );

        const fallbackSnap = await getDocs(fallbackQ);
        const leads = fallbackSnap.docs
          .map((doc) => toInsuranceLead(doc.id, doc.data()))
          .filter((lead): lead is FirebaseInsuranceLead => lead !== null)
          .sort((a, b) => {
            const aMs = a.createdAt?.toMillis?.() || 0;
            const bMs = b.createdAt?.toMillis?.() || 0;
            return bMs - aMs;
          });

        console.log(`✅ Firebase Insurance Leads fetched (fallback): ${leads.length}`);
        return leads;
      } catch (fallbackError) {
        console.error('❌ Firebase Insurance Leads fallback error:', fallbackError);
        throw fallbackError;
      }
    }

    console.error('❌ Firebase Insurance Leads fetch error:', error);
    throw error;
  }
};


