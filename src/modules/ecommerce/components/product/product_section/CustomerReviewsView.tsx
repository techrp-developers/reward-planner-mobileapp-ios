import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {
  fetchProductReviews,
  fetchReviewableOrder,
  markReviewHelpful,
  removeHelpfulReview,
} from "../../../api/ReviewApi";

type CustomerReviewsViewProps = {
  productId: number | string;
  variantId?: number | string;
  onWriteReview?: (orderId: number) => void;
};

type ReviewItem = {
  id: number | string;
  rating: number;
  text: string;
  title?: string;
  author: string;
  createdAt?: string;
  media: string[];
  helpfulCount: number;
  isHelpfulByMe: boolean;
};

const MAX_VISIBLE = 3;
const REVIEW_UPLOADS_BASE = "https://rewardplanners.com/api/crm/uploads/";

const toNumber = (value: unknown, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const toAbsoluteMediaUrl = (value: unknown) => {
  if (typeof value !== "string") return "";

  const input = value.trim();
  if (!input) return "";

  if (/^(https?:)?\/\//i.test(input) || /^(data:|file:|content:)/i.test(input)) {
    return encodeURI(input);
  }

  const cleaned = input.replace(/^\/+/, "");
  return encodeURI(`${REVIEW_UPLOADS_BASE}${cleaned.replace(/^uploads\//, "")}`);
};

const asMediaArray = (source: unknown): any[] => {
  if (!source) return [];
  if (Array.isArray(source)) return source;

  if (typeof source === "string") {
    const trimmed = source.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === "object") return [parsed];
    } catch {
      // If value is not JSON, treat it as a single media path/url.
    }

    return [trimmed];
  }

  if (typeof source === "object") return [source];
  return [];
};

const normalizeMedia = (review: any): string[] => {
  const source =
    review?.media ??
    review?.images ??
    review?.review_media ??
    review?.review_images ??
    review?.reviewMedia;

  const mediaItems = asMediaArray(source);

  return mediaItems
    .map((item) => {
      if (typeof item === "string") return toAbsoluteMediaUrl(item);
      return toAbsoluteMediaUrl(
        item?.url ||
          item?.media_url ||
          item?.image_url ||
          item?.image ||
          item?.path ||
          item?.file_path ||
          item?.src
      );
    })
    .filter(Boolean);
};

const toReviewItem = (raw: any): ReviewItem => ({
  id: raw?.id ?? raw?.review_id ?? `${Date.now()}-${Math.random()}`,
  rating: toNumber(raw?.rating, 0),
  text: String(raw?.review_text || raw?.comment || "").trim(),
  title: raw?.headline || raw?.title,
  author: String(raw?.user_name || raw?.customer_name || raw?.name || "Anonymous"),
  createdAt: raw?.created_at || raw?.createdAt || raw?.date,
  media: normalizeMedia(raw),
  helpfulCount: toNumber(raw?.helpful_count ?? raw?.helpfuls ?? raw?.helpful, 0),
  isHelpfulByMe: Boolean(raw?.is_helpful_by_me ?? raw?.is_helpful),
});

const extractReviews = (response: any): ReviewItem[] => {
  const payload = response?.data ?? response;
  const list =
    (Array.isArray(payload) && payload) ||
    payload?.reviews ||
    payload?.items ||
    payload?.data ||
    [];

  if (!Array.isArray(list)) return [];
  return list.map(toReviewItem);
};

export default function CustomerReviewsView({
  productId,
  variantId,
  onWriteReview,
}: CustomerReviewsViewProps) {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [checkingReviewable, setCheckingReviewable] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [reviewOrderId, setReviewOrderId] = useState<number | null>(null);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchProductReviews(productId);
      setReviews(extractReviews(response));
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load reviews";
      Alert.alert("Reviews", String(message));
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    let mounted = true;
    const reviewTargetId = variantId ?? productId;

    const loadReviewableOrder = async () => {
      if (!reviewTargetId) {
        if (!mounted) return;
        setCanReview(false);
        setReviewOrderId(null);
        return;
      }

      try {
        setCheckingReviewable(true);
        const response = await fetchReviewableOrder(reviewTargetId);
        const payload = response?.data ?? response;
        const nextCanReview = Boolean(payload?.can_review);
        const nextOrderId = toNumber(payload?.order_id, 0);

        if (!mounted) return;
        setCanReview(nextCanReview && nextOrderId > 0);
        setReviewOrderId(nextOrderId > 0 ? nextOrderId : null);
      } catch {
        if (!mounted) return;
        setCanReview(false);
        setReviewOrderId(null);
      } finally {
        if (mounted) {
          setCheckingReviewable(false);
        }
      }
    };

    loadReviewableOrder();

    return () => {
      mounted = false;
    };
  }, [productId, variantId]);

  const summary = useMemo(() => {
    const total = reviews.length;
    if (!total) {
      return {
        average: 0,
        stars: [5, 4, 3, 2, 1].map((star) => ({ star, count: 0, percent: 0 })),
      };
    }

    const totalRating = reviews.reduce((acc, item) => acc + item.rating, 0);
    const average = totalRating / total;
    const stars = [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((item) => Math.round(item.rating) === star).length;
      return { star, count, percent: Math.round((count / total) * 100) };
    });

    return { average, stars };
  }, [reviews]);

  const toggleHelpful = async (review: ReviewItem) => {
    const previous = reviews;

    setReviews((curr) =>
      curr.map((item) => {
        if (item.id !== review.id) return item;
        const nextHelpful = !item.isHelpfulByMe;
        const nextCount = nextHelpful
          ? item.helpfulCount + 1
          : Math.max(0, item.helpfulCount - 1);
        return { ...item, isHelpfulByMe: nextHelpful, helpfulCount: nextCount };
      })
    );

    try {
      if (review.isHelpfulByMe) {
        await removeHelpfulReview(review.id);
      } else {
        await markReviewHelpful(review.id);
      }
    } catch {
      setReviews(previous);
      Alert.alert("Review", "Unable to update helpful status right now.");
    }
  };

  const handleShare = async (review: ReviewItem) => {
    try {
      await Share.share({
        message: `${review.author}: ${review.text}`,
      });
    } catch {
      // no-op
    }
  };

  const handleWriteReviewPress = () => {
    if (checkingReviewable) {
      return;
    }

    if (!canReview || !reviewOrderId) {
      Alert.alert("Write Review", "You can review this product only after a delivered order.");
      return;
    }

    if (onWriteReview) {
      onWriteReview(reviewOrderId);
      return;
    }
    Alert.alert("Write Review", "Review form is not available right now.");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Customer Reviews</Text>

      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <>
          <View style={styles.summaryRow}>
            <Text style={styles.ratingValue}>{summary.average.toFixed(1)}</Text>
            <Text style={styles.subtitle}>out of 5 • {reviews.length} ratings</Text>
          </View>

          <View style={styles.breakdownContainer}>
            {summary.stars.map((item) => (
              <View style={styles.starRow} key={item.star}>
                <Text style={styles.rowLabel}>{item.star} Star</Text>
                <View style={styles.progressTrack}>
                  {item.percent > 0 && (
                    <LinearGradient
                      colors={["#A855F7", "#EC4899"]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={[styles.progressFill, { width: `${item.percent}%` }]}
                    />
                  )}
                </View>
                <Text style={styles.rowPercentage}>{item.percent}%</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.writeReviewBtn,
              (!canReview || checkingReviewable) && styles.writeReviewBtnDisabled,
            ]}
            onPress={handleWriteReviewPress}
            activeOpacity={0.85}
            disabled={checkingReviewable || !canReview}
          >
            {checkingReviewable ? (
              <ActivityIndicator size="small" color="#64748B" />
            ) : (
              <Text style={styles.writeReviewText}>Write a Review</Text>
            )}
          </TouchableOpacity>

          {!checkingReviewable && !canReview && (
            <Text style={styles.reviewHintText}>
              Review is available only for delivered orders of this product.
            </Text>
          )}

          {reviews.slice(0, MAX_VISIBLE).map((review) => (
            <View style={styles.reviewCardContainer} key={String(review.id)}>
              <View style={styles.userHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{review.author.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{review.author}</Text>
                  <Text style={styles.reviewMeta}>
                    {review.createdAt || ""}</Text>
                </View>
              </View>

              <View style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <MaterialCommunityIcons
                    key={s}
                    name={s <= Math.round(review.rating) ? "star" : "star-outline"}
                    size={17}
                    color={s <= Math.round(review.rating) ? "#F59E0B" : "#D1D5DB"}
                  />
                ))}
              </View>

              {Boolean(review.title) && <Text style={styles.reviewHeadline}>{review.title}</Text>}
              <Text style={styles.reviewBody}>{review.text || "No comment"}</Text>

              {review.media.length > 0 && (
                <View style={styles.imageGrid}>
                  {review.media.slice(0, 3).map((image, index) => (
                    <Image key={`${review.id}-${index}`} source={{ uri: image }} style={styles.reviewContentImage} />
                  ))}
                </View>
              )}

              <View style={styles.interactionRow}>
                <TouchableOpacity style={styles.helpfulBtn} onPress={() => toggleHelpful(review)}>
                  <MaterialCommunityIcons
                    name={review.isHelpfulByMe ? "thumb-up" : "thumb-up-outline"}
                    size={16}
                    color={review.isHelpfulByMe ? "#7C3AED" : "#1E293B"}
                  />
                  <Text style={styles.btnText}>Helpful ({review.helpfulCount})</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareBtn} onPress={() => handleShare(review)}>
                  <MaterialCommunityIcons name="share-variant-outline" size={16} color="#1E293B" />
                  <Text style={styles.btnText}>Share</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.bottomDivider} />
            </View>
          ))}

          {!reviews.length && <Text style={styles.emptyText}>No reviews yet.</Text>}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#FFFFFF", borderRadius: 16, marginTop: 12 },
  loader: { paddingVertical: 22 },
  mainTitle: { fontSize: 20, fontWeight: "800", color: "#1E293B", marginBottom: 16 },
  summaryRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  ratingValue: { fontSize: 26, fontWeight: "800", color: "#1E293B", marginRight: 8 },
  subtitle: { fontSize: 14, color: "#64748B", fontWeight: "500" },
  breakdownContainer: { marginBottom: 20 },
  starRow: { flexDirection: "row", alignItems: "center", marginVertical: 4 },
  rowLabel: { width: 56, fontSize: 13, fontWeight: "600", color: "#1E293B" },
  progressTrack: {
    flex: 1,
    height: 12,
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 999,
    marginHorizontal: 10,
    overflow: "hidden",
  },
  progressFill: { height: "100%" },
  rowPercentage: { width: 40, fontSize: 12, color: "#1E293B", textAlign: "right", fontWeight: "600" },
  writeReviewBtn: {
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  writeReviewBtnDisabled: { opacity: 0.7 },
  writeReviewText: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  reviewHintText: {
    marginTop: -6,
    marginBottom: 12,
    fontSize: 12,
    color: "#64748B",
  },
  reviewCardContainer: { paddingTop: 12 },
  userHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 14, fontWeight: "700", color: "#334155" },
  userInfo: { marginLeft: 10 },
  userName: { fontSize: 14, fontWeight: "700", color: "#1E293B" },
  reviewMeta: { fontSize: 12, color: "#94A3B8", marginTop: 1 },
  starContainer: { flexDirection: "row", marginBottom: 8 },
  reviewHeadline: { fontSize: 14, fontWeight: "800", color: "#1E293B", marginBottom: 4 },
  reviewBody: { fontSize: 13, color: "#475569", lineHeight: 18, marginBottom: 10 },
  imageGrid: { flexDirection: "row", marginBottom: 12 },
  reviewContentImage: {
    width: 92,
    height: 92,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
  },
  interactionRow: { flexDirection: "row", marginBottom: 12 },
  helpfulBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFF",
    marginRight: 12,
  },
  shareBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 6 },
  btnText: { fontSize: 13, fontWeight: "600", color: "#1E293B", marginLeft: 6 },
  bottomDivider: { height: 1, backgroundColor: "#F1F5F9", width: "100%" },
  emptyText: { fontSize: 13, color: "#64748B", textAlign: "center", paddingVertical: 18 },
});