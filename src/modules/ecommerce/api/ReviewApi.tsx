import axios from "axios";
import { getAuthHeaders } from "../../common/auth/api/AuthAPI";

const API_BASE_URL = "https://rewardplanners.com/api/crm";

/* ---------------- CREATE REVIEW ---------------- */

export type CreateReviewPayload = {
  product_id: number;
  variant_id: number;
  order_id: number;
  rating: number;
  value_for_money: 0 | 1;
  good_quality: 0 | 1;
  smooth_experience: 0 | 1;
  review_text: string;
  media?: ReviewMediaFile[];
};

export type ReviewMediaFile = {
  uri: string;
  type?: string;
  fileName?: string;
  name?: string;
};

export const createReview = async (reviewData: CreateReviewPayload) => {
  try {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) {
      throw new Error("Please login to submit your review.");
    }

    const { media, ...payload } = reviewData;
    const mediaFiles = Array.isArray(media) ? media : [];

    const formData = new FormData();
    formData.append("product_id", String(payload.product_id));
    formData.append("variant_id", String(payload.variant_id));
    formData.append("order_id", String(payload.order_id));
    formData.append("rating", String(payload.rating));
    formData.append("value_for_money", String(payload.value_for_money));
    formData.append("good_quality", String(payload.good_quality));
    formData.append("smooth_experience", String(payload.smooth_experience));
    formData.append("review_text", payload.review_text);

    mediaFiles.forEach((mediaFile, index) => {
      if (!mediaFile?.uri) return;
      const mediaName =
        mediaFile.fileName || mediaFile.name || `review-${Date.now()}-${index}.jpg`;

      formData.append("media", {
        uri: mediaFile.uri,
        type: mediaFile.type || "image/jpeg",
        name: mediaName,
      } as any);
    });

    const res = await axios.post(
      `${API_BASE_URL}/v1/review/create-review`,
      formData,
      {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return res.data;
  } catch (error) {
    console.log("Create Review Error:", error);
    throw error;
  }
};

/* ---------------- UPLOAD REVIEW MEDIA ---------------- */

export const uploadReviewMedia = async (
  reviewId: number | string,
  mediaFile: ReviewMediaFile
) => {
  try {
    if (!mediaFile?.uri) {
      throw new Error("Invalid media file");
    }

    const headers = await getAuthHeaders();
    if (!headers.Authorization) {
      throw new Error("Please login to upload review media.");
    }

    const formData = new FormData();

    const mediaName =
      mediaFile.fileName || mediaFile.name || `review-${Date.now()}.jpg`;

    formData.append("media", {
      uri: mediaFile.uri,
      type: mediaFile.type || "image/jpeg",
      name: mediaName,
    } as any);

    const res = await axios.post(
      `${API_BASE_URL}/v1/review/${reviewId}/media`,
      formData,
      {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return res.data;
  } catch (error) {
    console.log("Upload Review Media Error:", error);
    throw error;
  }
};

/* ---------------- GET ALL REVIEWS ---------------- */

export const fetchProductReviews = async (productId: number | string) => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.get(
      `${API_BASE_URL}/v1/review/all-reviews/${productId}`,
      { headers }
    );

    return res.data;
  } catch (error) {
    console.log("Fetch Reviews Error:", error);
    throw error;
  }
};

/* ---------------- MARK REVIEW HELPFUL ---------------- */

export const markReviewHelpful = async (reviewId: number | string) => {
  try {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) {
      throw new Error("Please login to mark review helpful.");
    }

    const res = await axios.post(
      `${API_BASE_URL}/v1/review/${reviewId}/helpful`,
      {},
      { headers }
    );

    return res.data;
  } catch (error) {
    console.log("Helpful Review Error:", error);
    throw error;
  }
};

/* ---------------- REMOVE HELPFUL ---------------- */

export const removeHelpfulReview = async (reviewId: number | string) => {
  try {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) {
      throw new Error("Please login to update review helpful status.");
    }

    const res = await axios.delete(
      `${API_BASE_URL}/v1/review/${reviewId}/helpful`,
      { headers }
    );

    return res.data;
  } catch (error) {
    console.log("Remove Helpful Error:", error);
    throw error;
  }
};


export const fetchReviewableOrder = async (variantId: number | string) => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.get(
      `${API_BASE_URL}/v1/review/reviewable-order/${variantId}`,
      { headers }
    );

    return res.data;
  } catch (error) {
    console.log("Fetch Reviewable Order Error:", error);
    throw error;
  }
};