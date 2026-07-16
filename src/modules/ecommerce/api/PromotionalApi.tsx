import axios from "axios";
import { getAuthHeaders } from "../../common/auth/api/AuthAPI";
import { normalizeProduct } from "../utils/normalizeProduct";

const API_BASE_URL = "https://rewardplanners.com/api/crm";
const DEFAULT_PAGE_SIZE = 10;
const CACHE_TTL_MS = 5 * 60 * 1000;

type PromotionApiResponse<T = any> = {
    success: boolean;
    total: number;
    hasMore: boolean;
    offset: number;
    limit: number;
    nextOffset: number;
    products: T[];
    [key: string]: any;
};

const promotionResponseCache = new Map<
    string,
    { timestamp: number; data: PromotionApiResponse<any> }
>();
const promotionRequestInFlight = new Map<string, Promise<PromotionApiResponse<any>>>();

const normalizeOffset = (offset = 0) => {
    if (!Number.isFinite(offset) || offset < 0) {
        return 0;
    }

    return Math.floor(offset);
};

const buildCacheKey = (endpoint: string, offset: number, requiresAuth: boolean) => {
    return `${endpoint}|${offset}|${requiresAuth ? "auth" : "public"}`;
};

const getCachedResponse = <T = any>(key: string): PromotionApiResponse<T> | null => {
    const cached = promotionResponseCache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp >= CACHE_TTL_MS) {
        promotionResponseCache.delete(key);
        return null;
    }

    return cached.data as PromotionApiResponse<T>;
};

const setCachedResponse = <T = any>(key: string, data: PromotionApiResponse<T>) => {
    promotionResponseCache.set(key, {
        timestamp: Date.now(),
        data,
    });
};

const normalizePromotionResponse = <T = any>(payload: any, fallbackOffset = 0): PromotionApiResponse<T> => {
    const data = payload?.data;
    const products =
        (Array.isArray(payload?.products) && payload.products) ||
        (Array.isArray(data?.products) && data.products) ||
        (Array.isArray(payload?.data) && payload.data) ||
        (Array.isArray(payload) && payload) ||
        [];

    const rawTotal = payload?.total ?? data?.total ?? products.length;
    const total = Number.isFinite(Number(rawTotal)) ? Number(rawTotal) : products.length;

    const offset = normalizeOffset(payload?.offset ?? data?.offset ?? fallbackOffset);
    const hasMore =
        typeof payload?.hasMore === "boolean"
            ? payload.hasMore
            : typeof data?.hasMore === "boolean"
              ? data.hasMore
              : offset + products.length < total;

    const basePayload = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};

    return {
        ...basePayload,
        success: Boolean(payload?.success ?? data?.success ?? true),
        total,
        hasMore,
        offset,
        limit: DEFAULT_PAGE_SIZE,
        nextOffset: hasMore ? offset + products.length : offset,
        products: products.map(normalizeProduct),
    };
};

const buildRequestConfig = async (offset = 0, requiresAuth = false) => {
    const normalizedOffset = normalizeOffset(offset);
    const headers = requiresAuth ? await getAuthHeaders() : undefined;

    return {
        ...(headers ? { headers } : {}),
        params: {
            offset: normalizedOffset,
            limit: DEFAULT_PAGE_SIZE,
        },
    };
};

const fetchPromotionalProducts = async <T = any>(
    endpoint: string,
    offset = 0,
    requiresAuth = false
): Promise<PromotionApiResponse<T>> => {
    const normalizedOffset = normalizeOffset(offset);
    const cacheKey = buildCacheKey(endpoint, normalizedOffset, requiresAuth);

    const cached = getCachedResponse<T>(cacheKey);
    if (cached) {
        return cached;
    }

    const pending = promotionRequestInFlight.get(cacheKey);
    if (pending) {
        return pending as Promise<PromotionApiResponse<T>>;
    }

    const request = (async () => {
        const config = await buildRequestConfig(normalizedOffset, requiresAuth);
        const res = await axios.get(`${API_BASE_URL}${endpoint}`, config);
        const normalized = normalizePromotionResponse<T>(res.data, normalizedOffset);
        setCachedResponse(cacheKey, normalized);
        return normalized;
    })();

    promotionRequestInFlight.set(cacheKey, request as Promise<PromotionApiResponse<any>>);

    try {
        return await request;
    } finally {
        promotionRequestInFlight.delete(cacheKey);
    }
};

export const fetchNewArrivals = async (offset = 0) => {
    return fetchPromotionalProducts(`/v1/product/new-arrivals`, offset);
};

export const getRecentProducts = async (offset = 0) => {
    return fetchPromotionalProducts(`/v1/product/recent-products`, offset, true);
};

export const getRecommendedProducts = async (offset = 0) => {
    const normalizedOffset = normalizeOffset(offset);
    const endpoint = `/v1/product/recommendations`;
    const cacheKey = buildCacheKey(endpoint, normalizedOffset, true);

    const cached = getCachedResponse(cacheKey);
    if (cached) {
        return cached;
    }

    const pending = promotionRequestInFlight.get(cacheKey);
    if (pending) {
        return pending;
    }

    const request = (async () => {
        const config = await buildRequestConfig(normalizedOffset, true);
        const res = await axios.get(`${API_BASE_URL}${endpoint}`, config);

        const payload = res.data;
        const message = String(payload?.message || "").toLowerCase();
        const isUnauthorizedPayload =
            payload?.success === false &&
            (message.includes("unauthorized") || message.includes("token") || message.includes("login"));

        if (isUnauthorizedPayload) {
            const error: any = new Error(payload?.message || "Unauthorized user");
            error.response = {
                status: 401,
                data: payload,
            };
            throw error;
        }

        const normalized = normalizePromotionResponse(payload, normalizedOffset);
        setCachedResponse(cacheKey, normalized);
        return normalized;
    })();

    promotionRequestInFlight.set(cacheKey, request as Promise<PromotionApiResponse<any>>);

    try {
        return await request;
    } finally {
        promotionRequestInFlight.delete(cacheKey);
    }
};

export const getSimilarProducts = async (product_id: number, offset = 0) => {
    return fetchPromotionalProducts(`/v1/product/similar/${product_id}`, offset, true);
};

export const getTrendingProducts = async (offset = 0) => {
    return fetchPromotionalProducts(`/v1/product/trending`, offset);
};
export const fetchBestSellers = async (offset = 0) => {
    return fetchPromotionalProducts(`/v1/product/best-sellers`, offset);
};
export const fetchMostViewedProducts = async (offset = 0) => {
    return fetchPromotionalProducts(`/v1/product/most-viewed`, offset);
};
export const fetchTopRatedProducts = async (offset = 0) => {
    return fetchPromotionalProducts(`/v1/product/top-rated`, offset);
};

export const getCustomersAlsoBought = async (productId: number, offset = 0) => {
    return fetchPromotionalProducts(
        `/v1/product/${productId}/customers-also-bought`,
        offset
    );
};