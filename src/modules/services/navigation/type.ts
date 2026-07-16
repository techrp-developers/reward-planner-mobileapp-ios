import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NormalizedServiceData } from '../types/ServiceTypes';
import type { BundleEnquiryField } from '../api/BundleAPI';

export type HomeStackParamList = {
  Home: undefined;
  ServiceSearch: undefined;
  MutualFundCalculators: undefined;
  CommonQuestions: undefined;
  FAQListing: { categoryId: string; categoryTitle: string };
  SIPCalculator: undefined;
  GoalSIPCalculator: undefined;
  SmartGoalCalculator: undefined;
  InflationCalculator: undefined;
  CostOfDelayCalculator: undefined;
  LumpsumCalculator: undefined;
  RetirementCalculator: undefined;
  StepUpSIPCalculator: undefined;
  SWPCalculator: undefined;
  ServiceDescription: {
    serviceId: number;
    categoryId?: number;
    title?: string;
    serviceData?: NormalizedServiceData;
  };
  Health: undefined;
  SuperTopUp: undefined;
  PersonalAccident: undefined;
  Government_Document_Screen: {
    categoryId: number;
  };
  DocumentUpload: {
    order_id: number;
    parent_order_id: string;
  };
  PackScreen: {
    packType?: 'home' | 'married' | 'job';
    bundleId?: number;
    categoryId?: number;
    title?: string;
  };
  PackEnquiryForm: {
    bundleId?: number;
    title?: string;
    description?: string;
    price?: string;
    image?: string;
    oldPrice?: string;
    offerPrice?: string;
    coins?: string;
    days?: string;
    enquiryFields?: BundleEnquiryField[];
    safetyTitle?: string;
    safetyText?: string;
  };
  SubmittedSuccessful?: {
    statusText?: string;
    title?: string;
    description?: string;
    enquiryId?: string;
    /** When true, auto-navigates to the Services home screen after redirectDelayMs. */
    redirectToHome?: boolean;
    redirectDelayMs?: number;
  };
  CartScreen: undefined;
  Profile: undefined;
  MyOrder: undefined;
  ServiceOrderDetail: { parent_order_id: string };
  ServiceCancellationRequest: {
    service_order_id: number;
    parent_order_id: string;
    order_ref: string;
    service_name: string;
    variant_name?: string;
    image_url?: string | null;
  };
  ServiceFeedback: {
    service_order_id: number;
    parent_order_id: string;
    order_ref: string;
    service_name: string;
    variant_name?: string;
    image_url?: string | null;
  };
  WalletHistory: undefined;
  TodoList: undefined;
  AddAddressMap: undefined;
  PrivacyPolicy: undefined;
  TermsAndConditions: undefined;
  OrderConfirmedScreen: { order_id?: number } | undefined;
  CommonQuestionsScreen: undefined;
  ArticleDetails: { articleId: number; sectionId: number };
  MFInvestorsDetail: { categoryId: number };
  MFSectionArticles: { sectionId: number; sectionTitle: string };
  AddressSelect: { fromCart?: boolean } | undefined;

  ServiceCheckoutScreen: {
    mode?: 'buy_now' | 'cart';
    service_id?: number;
    variant_id?: number;
    bundle_id?: number; 
    previewData?: any; 
  };
};

export type ServicePreviewItem = {
  id: number | string;
  service_id: number | null;
  variant_id: number | null;

  service_name: string;
  variant_name: string;
  description: string;

  price: number;
  mrp: number;

  documents: string[];

  isBundle?: boolean;
  bundle_items?: any[];
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  Profile: undefined;
};

export type ServiceItem = {
  service_id: number;
  variant_id: number;
  name: string;
  title?: string;
  description?: string;
  enquiry?: boolean | number;
  rating?: number;
  total_orders?: number;
  price: number;
  mrp?: number;
  discount_percent?: number;
  coins?: number;
  service_image?: string | null;
  variant_image?: string | null;
  image?: string | null; // For backward compatibility
};

export type BannerItem = {
  banner_id: number;
  title: string;
  image_url: string;
  redirect_type: 'service' | 'url' | 'category' | 'bundle';
  redirect_id?: number | null;
  redirect_url?: string | null;
};

export type SectionItem = ServiceItem | BannerItem;

export type ServiceSection = {
  section_id: number;
  title: string;
  section_key: string;
  layout_type: 'horizontal' | 'vertical' | 'grid' | 'carousel';
  section_type: 'services' | 'bundles' | 'promotions' | 'banners';
  items: SectionItem[];
};

export type ServiceHomeResponse = {
  success: boolean;
  data?: ServiceSection[];
  message?: string;
};
