// src/navigation/types.ts
import type { NavigatorScreenParams } from '@react-navigation/native';

export type HomeStackParamList = {
  Home: undefined;
  Category: {
    categoryId: number | string;
    title: string;
    subcategoryId?: number | string;
    subcategoryTitle?: string;
  };
  ProductDescription: { productId: number | string };
  Cart: undefined;
  AddressSelect: { fromCart?: boolean; manageOnly?: boolean } | undefined;
  WithAddress: undefined;
  WalletHistory: undefined;
  Coupan: undefined;
  CategoriesScreen: undefined;
  OrderReceipt:  undefined;
  Explore : undefined;
  ProductScreen: undefined;
  ReviewScreen: {
    product_id: number;
    variant_id: number;
    order_id: number;
    product_name?: string;
    image?: string;
    delivered_on?: string;
  };
  SearchScreen: undefined;
    WishList: undefined;
  OrderStepUI: {
    mode?: 'cart' | 'buy_now';
    product_id?: number;
    variant_id?: number;
    qty?: number;
  };

  OrderConfirm: { order_id?: number; items?: any[]; total?: number };
  MyOrder: undefined;
  BuyNow: undefined;
  PrivacyPolicy: undefined;
  TermsAndConditions: undefined;
  TodoList: undefined;
    Profile : undefined;

  AddAddressMap: { fromCart?: boolean } | undefined;
  AddressDetails:
    | undefined
    | {
        mode?: "add" | "edit";
        addressId?: number;
        manageOnly?: boolean;
        initialData?: {
          saveAs?: "Home" | "Work" | "Other";
          flatHouseBuilding?: string;
          areaLocality?: string;
          landmark?: string;
          name?: string;
          phone?: string;
          pincode?: string;
          city?: string;
          state?: string;
          state_id?: number;
          isDefault?: boolean;
        };
      };
OrderConfirmedScreen: {
    order_id: number;
  };
    SelectCancellationReason: {
    orderId: number;
    orderRef?: string;
    savings?: number;
    productTitle?: string;
    productWeight?: string;
  };
  EditProfile: undefined;
  Settings: undefined;
  Privacy: undefined;
  Support: undefined;
  ChangePassword: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  Cart: undefined;
  Profile: undefined;
};

// Allow OrderStepUI to accept optional params for buy-now flow
export type OrderStepParams = {
  mode?: 'buy_now' | 'cart';
  product_id?: number | string;
  variant_id?: number | string;
  qty?: number;
};

// Extend HomeStackParamList OrderStepUI to accept params
declare module './types' {}
