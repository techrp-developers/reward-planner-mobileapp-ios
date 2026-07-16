import type {
  ServiceVariantRaw,
  NormalizedVariant,
  NormalizedDocument,
  NormalizedServiceData,
  FAQItem,
  TrustStat,
  EnquiryField,
} from '../types/ServiceTypes';

// ─── Fallbacks ────────────────────────────────────────────────
const FALLBACK_FEATURES = [
  'Single Form Submission',
  'Document Checklist Built-in',
  'Appointment Slot Assistance',
];

const FALLBACK_FAQ: FAQItem[] = [
  {
    question: 'What services do we provide?',
    answer: 'New application, correction, reprint, and renewal of government documents.',
  },
  {
    question: 'How much time will my service take?',
    answer:
      "Timelines depend on the service type and government processing. We'll show an estimated timeline before you pay.",
  },
  {
    question: 'Do I need to visit the office?',
    answer:
      "Some services are fully online, while others need biometrics or verification visits. We'll tell you upfront.",
  },
];

const FALLBACK_TRUST_STATS: TrustStat[] = [
  { value: '20+', label: 'Trusted Partners' },
  { value: '15000+', label: 'Customers Served' },
  { value: '5+ Years', label: 'of Expertise' },
];

// ─── Variant normalizer ───────────────────────────────────────
function normalizeVariant(raw: ServiceVariantRaw): NormalizedVariant {
  const features = Array.isArray(raw.features) ? raw.features.filter(Boolean) : [];
  const details = Array.isArray(raw.details) ? raw.details.filter(Boolean) : [];

  // Merge features + details, deduplicated (preserve order, features first)
  const seen = new Set<string>();
  const mergedFeatures: string[] = [];
  for (const item of [...features, ...details]) {
    const key = String(item).trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      mergedFeatures.push(String(item).trim());
    }
  }

  return {
    id: Number(raw.id) || 0,
    variant_name: String(raw.variant_name || ''),
    title: String(raw.title || raw.variant_name || ''),
    short_description: String(raw.short_description || ''),
    price: String(raw.price || '0'),
    mrp: String(raw.mrp || ''),
    mergedFeatures: mergedFeatures.length > 0 ? mergedFeatures : FALLBACK_FEATURES,
    trust_stats: Array.isArray(raw.trust_stats) ? raw.trust_stats.filter(Boolean).map(String) : [],
    paragraphs: Array.isArray(raw.paragraphs) ? raw.paragraphs : [],
    when_required: Array.isArray(raw.when_required) ? raw.when_required : [],
    journey: Array.isArray(raw.journey) ? raw.journey : [],
  };
}

export function normalizeVariants(variants: unknown): NormalizedVariant[] {
  if (!Array.isArray(variants)) return [];
  return variants.map((item) => normalizeVariant((item || {}) as ServiceVariantRaw));
}

function normalizeFieldOptions(raw: unknown): string[] | null {
  if (Array.isArray(raw)) {
    const cleaned = raw.map((item) => String(item).trim()).filter(Boolean);
    return cleaned.length > 0 ? cleaned : null;
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    // Backend may send options as a JSON-encoded array string, e.g. '["Male","Female"]'.
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return normalizeFieldOptions(parsed);
      } catch {
        // fall through to comma-separated parsing below
      }
    }

    // Or as a plain comma-separated string, e.g. "Male,Female,Other".
    const cleaned = trimmed.split(',').map((item) => item.trim()).filter(Boolean);
    return cleaned.length > 0 ? cleaned : null;
  }

  return null;
}

function normalizeEnquiryFields(fields: unknown): EnquiryField[] {
  if (!Array.isArray(fields)) return [];

  const seen = new Set<string>();
  const output: EnquiryField[] = [];

  for (const raw of fields as any[]) {
    const fieldName = String(raw?.field_name || '').trim();
    if (!fieldName) continue;

    const dedupeKey = fieldName.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    output.push({
      label: String(raw?.label || fieldName),
      field_name: fieldName,
      field_type: String(raw?.field_type || 'text'),
      options: normalizeFieldOptions(raw?.options),
      is_required: Number(raw?.is_required || 0) === 1 ? 1 : 0,
    });
  }

  return output;
}

// ─── Trust stats parser ───────────────────────────────────────
export function parseTrustStats(raw: string[]): TrustStat[] {
  if (!raw.length) return FALLBACK_TRUST_STATS;
  return raw.slice(0, 3).map((item) => {
    const str = String(item);
    const spaceIdx = str.indexOf(' ');
    if (spaceIdx === -1) return { value: str, label: str };
    return {
      value: str.substring(0, spaceIdx),
      label: str.substring(spaceIdx + 1),
    };
  });
}

// ─── Journey / when_required → flat string list ──────────────
export function extractMiddleBlock(variant: NormalizedVariant): {
  title: string;
  points: string[];
} {
  const journeyItem = variant.journey[0];
  if (journeyItem?.title && Array.isArray(journeyItem.content) && journeyItem.content.length > 0) {
    const points = journeyItem.content.map((step) => {
      if (Array.isArray(step)) {
        const heading = String((step as string[])[0] || '').trim();
        const detail = String((step as string[])[1] || '').trim();
        return detail ? `${heading}: ${detail}` : heading;
      }
      return String(step || '');
    });
    return { title: journeyItem.title, points };
  }

  const requiredItem = variant.when_required[0];
  if (
    requiredItem?.title &&
    Array.isArray(requiredItem.content) &&
    requiredItem.content.length > 0
  ) {
    return {
      title: requiredItem.title,
      points: requiredItem.content.map(String),
    };
  }

  return {
    title: 'Why this service matters',
    points: ['Fast & transparent process', 'Experienced documentation team'],
  };
}

// ─── Safety card data ─────────────────────────────────────────
export function extractSafetyContent(variant: NormalizedVariant): {
  title: string;
  text: string;
} {
  const paragraph = variant.paragraphs[0];
  if (!paragraph) {
    return {
      title: '100% Data Safety',
      text: 'Your personal information is protected and used only for your service request.',
    };
  }
  const text = Array.isArray(paragraph.content)
    ? paragraph.content.join(' ')
    : String(paragraph.content || '');
  return {
    title: paragraph.title || '100% Data Safety',
    text: text || 'Your personal information is protected and used only for your service request.',
  };
}

// ─── Main export ──────────────────────────────────────────────
export function normalizeServiceData(apiResponse: any): NormalizedServiceData | null {
  if (!apiResponse) return null;

  // Support both { data: { service, variants… } } and flat { service, variants… }
  const data = apiResponse?.data ?? apiResponse;
  if (!data?.service) return null;

  const variants: NormalizedVariant[] = normalizeVariants(data.variants);

  const documents: NormalizedDocument[] = Array.isArray(data.documents)
    ? data.documents
        .map((d: any) => ({
          id: Number(d?.id) || 0,
          name: String(d?.document_name || '').trim(),
          mandatory: Number(d?.is_mandatory || 0) === 1,
        }))
        .filter((d: NormalizedDocument) => !!d.name)
    : [];

  const sections = Array.isArray(data.service_sections) ? data.service_sections : [];
  const faqSection = sections.find(
    (s: any) =>
      String(s?.section_type || '').toLowerCase() === 'faq' && Array.isArray(s?.content),
  );

  const faqData: FAQItem[] =
    faqSection?.content?.length
      ? (faqSection.content as any[]).map((q) => ({
          question: String(q?.question || ''),
          answer: String(q?.answer || ''),
        }))
      : FALLBACK_FAQ;

  return {
    service: data.service,
    variants,
    documents,
    enquiry_fields: normalizeEnquiryFields(data.enquiry_fields),
    faqData,
    faqTitle: faqSection?.title || 'Everything You Need to Know',
  };
}
