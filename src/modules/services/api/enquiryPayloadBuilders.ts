import { NATURE_OF_WORK } from '../constant/InsuranceConstants';

type FormDataLike = {
  gender?: string;
  members?: string[];
  memberCounts?: Record<string, number>;
  ages?: Record<string, string | number>;
  details?: {
    firstName?: string;
    lastName?: string;
    mobileNumber?: string;
    city?: string;
    pincode?: string;
    zone?: string;
    occupation?: string;
    annualIncomeRange?: string;
    natureOfWork?: string;
  };
};

const COMPANY_ID_DEFAULT = 'PP739792';

const toStr = (value: any, fallback = ''): string => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const getAgeValue = (ages: Record<string, string | number> | undefined, key: string, fallback = '') =>
  toStr(ages?.[key], fallback);

const getCount = (memberCounts: Record<string, number> | undefined, key: 'son' | 'daughter') =>
  toStr(memberCounts?.[key] || 0, '0');

const getCommon = (formData: FormDataLike, companyId?: string) => ({
  companyId: companyId || COMPANY_ID_DEFAULT,
  created_at: new Date().toISOString(),
  cust_fname: toStr(formData.details?.firstName),
  cust_lname: toStr(formData.details?.lastName),
  cust_mobile: toStr(formData.details?.mobileNumber),
  cust_city: toStr(formData.details?.city),
  cust_Pincode: toStr(formData.details?.pincode),
  gender: toStr(formData.gender || 'Male', 'Male'),
  zone: toStr(formData.details?.zone),
  __currentStep: 3,
  __savedAt: new Date().toISOString(),
});

const getRiskTabAndCategory = (natureOfWork?: string): { risk_tab: string; riskcategory: string } => {
  const work = toStr(natureOfWork);
  if (!work) return { risk_tab: '1', riskcategory: '' };

  for (const [tab, options] of Object.entries(NATURE_OF_WORK)) {
    const matched = options.find((item) => item.label === work);
    if (matched) {
      return { risk_tab: toStr(tab), riskcategory: matched.label };
    }
  }

  return { risk_tab: '1', riskcategory: work };
};

export const buildHealthEnquiryData = (
  formData: FormDataLike,
  coverAmountValue: number,
  companyId?: string,
): Record<string, any> => {
  const members = formData.members || [];
  const hasSelf = members.includes('self');
  const hasSpouse = members.includes('spouse');
  const hasSon = members.includes('son');
  const hasDaughter = members.includes('daughter');

  const sonCount = getCount(formData.memberCounts, 'son');
  const daughterCount = getCount(formData.memberCounts, 'daughter');

  const payload: Record<string, any> = {
    ...getCommon(formData, companyId),
    form_name: 'enquiry_form',
    lead_type: 'health',
    mobile_verified: '1',
    cover_amount: toStr(coverAmountValue),
    cover_for: `${hasSelf ? '1' : '0'}${hasSpouse ? '1' : '0'}${sonCount}${daughterCount}`,
    Age: getAgeValue(formData.ages, 'self', '30'),
    SAge: hasSpouse ? getAgeValue(formData.ages, 'spouse', '') : '',
    sonCount,
    daughterCount,
  };

  if (hasSelf) payload.self = 'on';
  if (hasSpouse) payload.spouse = 'on';
  if (hasSon) payload.son = 'on';
  if (hasDaughter) payload.daughter = 'on';

  const sons = Number(sonCount);
  for (let i = 1; i <= sons; i += 1) {
    const key = sons === 1 ? 'son' : `son_${i}`;
    payload[`son${i}Age`] = getAgeValue(formData.ages, key, '');
  }

  const daughters = Number(daughterCount);
  for (let i = 1; i <= daughters; i += 1) {
    const key = daughters === 1 ? 'daughter' : `daughter_${i}`;
    payload[`daughter${i}Age`] = getAgeValue(formData.ages, key, '');
  }

  return payload;
};

export const buildSuperTopupEnquiryData = (
  formData: FormDataLike,
  coverAmountValue: number,
  companyId?: string,
): Record<string, any> => {
  const members = formData.members || [];
  const hasSelf = members.includes('self');
  const hasSpouse = members.includes('spouse');

  return {
    ...getCommon(formData, companyId),
    lead_type: 'super-top-up',
    cover_amount: toStr(coverAmountValue),
    Age: getAgeValue(formData.ages, 'self', '30'),
    SAge: hasSpouse ? getAgeValue(formData.ages, 'spouse', '') : '',
    sonCount: getCount(formData.memberCounts, 'son'),
    daughterCount: getCount(formData.memberCounts, 'daughter'),
    ...(hasSelf ? { self: 'on' } : {}),
  };
};

export const buildPersonalAccidentEnquiryData = (
  formData: FormDataLike,
  coverAmountValue: number,
  companyId?: string,
): Record<string, any> => {
  const { risk_tab, riskcategory } = getRiskTabAndCategory(formData.details?.natureOfWork);

  return {
    ...getCommon(formData, companyId),
    lead_type: 'personal-accident',
    plan_type: 'pa',
    cover_amount: toStr(coverAmountValue),
    income_range: toStr(formData.details?.annualIncomeRange),
    occupation_of_insured: toStr(formData.details?.occupation),
    risk_tab,
    riskcategory,
  };
};
