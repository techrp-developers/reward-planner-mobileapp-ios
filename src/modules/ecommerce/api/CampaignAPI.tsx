import axios from "axios";
import { getAuthHeaders, clearAuthToken } from "../../common/auth/api/AuthAPI";
const BASE_API_URL = "https://rewardplanners.com/api/crm/v1";

/* =========================================================
   TYPES
========================================================= */

export interface CampaignPoster {
  campaign_id: number;
  title: string;
  banner_image: string;
  redirect_type: string | null;
  redirect_id: number | null;
  redirect_url: string | null;
}

export interface FlashSaleCampaign {
  campaign_id: number;
  title: string;
  banner_image: string;
  start_at: string;
  end_at: string;
}

export interface CampaignHomeData {
  posters: CampaignPoster[];
  dashboard_posters: CampaignPoster[];
  flash_sales: FlashSaleCampaign[];
}

export interface CampaignHomeResponse {
  success: boolean;
  data: CampaignHomeData;
}

/* =========================================================
   GET CAMPAIGN HOME
========================================================= */

export const getCampaignHome = async (): Promise<CampaignHomeResponse> => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.get(
      `${BASE_API_URL}/campaign/home`,
      { headers }
    );

    return res.data;
  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("❌ Get Campaign Home Error:", {
      status: error?.response?.status,
      message: error?.response?.data?.message,
      data: error?.response?.data,
    });

    throw error?.response?.data || error;
  }
};

/* =========================================================
   TYPES
========================================================= */

export interface CampaignProductReward {
  enabled: boolean;
  coins: number;
  label: string | null;
}

export interface CampaignProduct {
  id: number;
  product_id: number;
  product_name: string;
  brand_name?: string;
  category_id?: number;
  subcategory_id?: number;
  is_discount_eligible?: number;
  variant_id: number;
  mrp: string;
  original_price: string;
  final_price: string;
  image?: string;
  price?: string;
  originalPrice?: string;
  discount?: string;
  reward?: CampaignProductReward;
  redeem_coins?: number;
  rp_price?: string | number | null;
}

export interface CampaignProductsResponse {
  success: boolean;
  count: number;
  data: CampaignProduct[];
}

/* =========================================================
   GET CAMPAIGN PRODUCTS
========================================================= */

export const getCampaignProducts = async (
  campaignId: number
): Promise<CampaignProductsResponse> => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.get(
      `${BASE_API_URL}/campaign/${campaignId}/products`,
      { headers }
    );

    return res.data;
  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("❌ Get Campaign Products Error:", {
      status: error?.response?.status,
      message: error?.response?.data?.message,
      data: error?.response?.data,
    });

    throw error?.response?.data || error;
  }
};