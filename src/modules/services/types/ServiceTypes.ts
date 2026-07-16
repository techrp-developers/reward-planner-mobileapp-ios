// ─────────────────────────────────────────────────────────────
//  Raw API shapes  (what the server actually sends)
// ─────────────────────────────────────────────────────────────

export interface ServiceInfo {
  id: number;
  category_id: number;
  name: string;
  description: string;
  service_image: string;
  price: string;
  estimated_days: number;
  rating: string;
  total_orders: number;
  status: number;
  show_enquiry?: number;
  created_at: string;
  updated_at: string;
  category_name?: string;
}

export interface JourneyStep {
  /** Can be a plain string, or a [heading, detail] tuple */
  0?: string;
  1?: string;
}

export interface JourneyItem {
  title: string;
  content: Array<string | [string, string]>;
}

export interface WhenRequiredItem {
  title: string;
  content: string[];
}

export interface Paragraph {
  title?: string;
  content: string | string[];
}

export interface ServiceVariantRaw {
  id: number;
  variant_name: string;
  title?: string;
  short_description?: string;
  price: string;
  mrp?: string;
  features?: string[];
  details?: string[];
  trust_stats?: string[];
  paragraphs?: Paragraph[];
  when_required?: WhenRequiredItem[];
  journey?: JourneyItem[];
}

export type FieldType = 'text' | 'number' | 'textarea' | 'select' | string;

export interface EnquiryField {
  label: string;
  field_name: string;
  field_type: FieldType;
  options: string[] | null;
  is_required: 0 | 1;
}

export interface ServiceDocumentRaw {
  id: number;
  document_name: string;
  is_mandatory: 0 | 1;
}

export interface FAQItemRaw {
  question: string;
  answer: string;
}

export interface ServiceSection {
  section_type: string;
  title?: string;
  content: FAQItemRaw[] | unknown[];
}

export interface ServiceAPIResponse {
  success: boolean;
  data: {
    service: ServiceInfo;
    variants: ServiceVariantRaw[];
    documents: ServiceDocumentRaw[];
    enquiry_fields: EnquiryField[];
    service_sections: ServiceSection[];
  };
}

// ─────────────────────────────────────────────────────────────
//  Normalized shapes  (what the UI consumes, always safe)
// ─────────────────────────────────────────────────────────────

export interface NormalizedVariant {
  id: number;
  variant_name: string;
  title: string;
  short_description: string;
  price: string;
  mrp: string;
  /** features + details merged and de-duplicated; never empty */
  mergedFeatures: string[];
  trust_stats: string[];
  paragraphs: Paragraph[];
  when_required: WhenRequiredItem[];
  journey: JourneyItem[];
}

export interface NormalizedDocument {
  id: number;
  name: string;
  mandatory: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface TrustStat {
  value: string;
  label: string;
}

export interface NormalizedServiceData {
  service: ServiceInfo;
  variants: NormalizedVariant[];
  documents: NormalizedDocument[];
  enquiry_fields: EnquiryField[];
  faqData: FAQItem[];
  faqTitle: string;
}

// ─────────────────────────────────────────────────────────────
//  ServiceCart component shape
// ─────────────────────────────────────────────────────────────

export interface CartVariantItem {
  id: string;
  title: string;
  /** Descriptive plan title shown under the short variant label (omitted when variant_name is "Default"). */
  planTitle?: string;
  price: string;
  oldPrice: string;
  subtitle: string;
  rawVariant: NormalizedVariant;
}
