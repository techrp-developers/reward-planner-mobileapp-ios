/**
 * insurancePayloadMappers.ts
 * All CRM step payload mappers for Health, Super Top-Up, and PA flows.
 * Import these in screens instead of defining inline.
 */

// Minimal shared FormData shape compatible with Health, SuperTop, and PA screens.
type BaseFormData = {
  gender: string;
  members: string[];
  memberCounts: Record<string, number>;
  ages: Record<string, string | number>;
  details: {
    firstName?: string;
    lastName?: string;
    dob?: string;
    mobileNumber?: string;
    pincode?: string;
    city?: string;
    zone?: string;
    coverAmount?: string;
    agreeToTerms?: boolean;
    enquiryId?: number;
    occupation?: string;
    annualIncomeRange?: string;
    natureOfWork?: string;
  };
};

// ─── Step 1: Members Config ────────────────────────────────────────────────

export function mapMembersConfig(formData: BaseFormData) {
  const gender = (formData.gender || "Male").toLowerCase();
  const sons = formData.members.includes("son")
    ? formData.memberCounts?.son || 1
    : 0;
  const daughters = formData.members.includes("daughter")
    ? formData.memberCounts?.daughter || 1
    : 0;

  return {
    self: { included: formData.members.includes("self"), gender },
    spouse: { included: formData.members.includes("spouse") },
    sons,
    daughters,
  };
}

// ─── Step 2: Members Ages ──────────────────────────────────────────────────

export function mapMembersAges(formData: BaseFormData) {
  const gender = (formData.gender || "Male").toLowerCase();
  const out: Array<{ relation: string; gender?: string; age: number }> = [];

  if (formData.members.includes("self")) {
    out.push({ relation: "self", gender, age: Number(formData.ages?.self || 0) });
  }

  if (formData.members.includes("spouse")) {
    out.push({
      relation: "spouse",
      gender: gender === "male" ? "female" : "male",
      age: Number(formData.ages?.spouse || 0),
    });
  }

  if (formData.members.includes("son")) {
    const count = formData.memberCounts?.son || 1;
    for (let i = 1; i <= count; i += 1) {
      const key = count === 1 ? "son" : `son_${i}`;
      out.push({ relation: "son", age: Number(formData.ages?.[key] || 0) });
    }
  }

  if (formData.members.includes("daughter")) {
    const count = formData.memberCounts?.daughter || 1;
    for (let i = 1; i <= count; i += 1) {
      const key = count === 1 ? "daughter" : `daughter_${i}`;
      out.push({ relation: "daughter", age: Number(formData.ages?.[key] || 0) });
    }
  }

  return out;
}

// ─── Step 3: Basic Details ─────────────────────────────────────────────────

export function mapBasicDetails(formData: BaseFormData) {
  return {
    first_name: formData.details.firstName || "",
    last_name: formData.details.lastName || "",
    mobile: formData.details.mobileNumber || "",
    pincode: formData.details.pincode || "",
    city: formData.details.city || "",
    zone: Number(String(formData.details.zone || "").replace(/\D/g, "")) || 1,
  };
}

// ─── Step 4: Coverage Amounts ──────────────────────────────────────────────

/** Health: step=4, section="health" */
export function mapHealthCoverage(sumInsured: number) {
  return { sum_insured: sumInsured };
}

/** Super Top-Up: step=4, section="super_topup" */
export function mapSuperTopupCoverage(sumInsured: number, deductible = 500000) {
  return { sum_insured: sumInsured, cover_amount: sumInsured, deductible };
}

/** Personal Accident: step=4, section="pa" */
export function mapPaDetails(
  formData: BaseFormData,
  sumInsured: number,
  category?: number,
) {
  return {
    sum_insured: sumInsured,
    member: "self",
    members: ["self"],
    category: Number(category) || 1,
    gender: (formData.gender || "Male").toLowerCase(),
    dob: formData.details.dob || "",
    occupation: formData.details.occupation || "",
    annual_income_range: formData.details.annualIncomeRange || "",
    nature_of_work: formData.details.natureOfWork || "",
    age: Number(formData.ages?.self) || 30,
  };
}

// ─── Quote Normalizer ──────────────────────────────────────────────────────

type NormalizedQuote = {
  url: string;
  success: boolean;
  data?: any;
  error?: string;
};

/**
 * Normalise any CRM /get-quotes response shape into the UI-expected array format.
 */
export function normalizeQuotesForUi(quotesResponse: any): NormalizedQuote[] {
  const candidateLists = [
    quotesResponse,
    quotesResponse?.data,
    quotesResponse?.quotes,
    quotesResponse?.plans,
    quotesResponse?.data?.data,
    quotesResponse?.data?.quotes,
    quotesResponse?.data?.plans,
    quotesResponse?.result,
    quotesResponse?.result?.data,
    quotesResponse?.result?.quotes,
    quotesResponse?.result?.plans,
  ];

  const rawList: any[] = candidateLists.find((list) => Array.isArray(list)) || [];

  return rawList.map((item: any, index: number) => {
    if (typeof item?.success === "boolean" && item?.url) return item as NormalizedQuote;
    return {
      url: item?.url || item?.api_type || `crm_quote_${index}`,
      success: item?.success !== false,
      data: item?.data || item,
      error: item?.error,
    };
  });
}