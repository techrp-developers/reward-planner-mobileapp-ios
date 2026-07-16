import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {
  launchCamera,
  launchImageLibrary,
  type Asset as PickerAsset,
} from "react-native-image-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import ProductHead from "../constants/heading/Product_Head_Img";
import { createReview } from "../api/ReviewApi";
import { useAuth } from "../../common/auth/context/AuthContext";
import type { HomeStackParamList } from "../navigation/types";
import SkeletonBox from "../../services/component/constant/SkeletonBox";

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type ReviewRoute = RouteProp<HomeStackParamList, "ReviewScreen">;
type ReviewMediaAsset = PickerAsset & { uri: string };

type Sentiment = -1 | 0 | 1;
const MAX_REVIEW_MEDIA = 6;

function StarRow({ rating, onRate }: { rating: number; onRate: (value: number) => void }) {
  return (
    <View style={styles.starRow}>
      {Array.from({ length: 5 }).map((_, index) => {
        const star = index + 1;
        const active = star <= rating;

        return (
          <TouchableOpacity key={star} onPress={() => onRate(star)} activeOpacity={0.85}>
            <MaterialCommunityIcons
              name={active ? "star" : "star-outline"}
              size={38}
              color="#EC4899"
              style={styles.starIcon}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function StarRowSkeleton({ pulse }: { pulse: Animated.Value }) {
  return (
    <View style={styles.starRow}>
      {Array.from({ length: 5 }).map((_, index) => (
        <SkeletonBox
          key={`star-skeleton-${index}`}
          pulse={pulse}
          width={38}
          height={38}
          borderRadius={19}
          style={styles.starSkeleton}
        />
      ))}
    </View>
  );
}

function PreferenceRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Sentiment;
  onChange: (next: Sentiment) => void;
}) {
  return (
    <View style={styles.optionRow}>
      <Text style={styles.optionText}>{label}</Text>

      <View style={styles.iconRow}>
        <TouchableOpacity activeOpacity={0.75} onPress={() => onChange(value === 1 ? 0 : 1)}>
          <MaterialCommunityIcons
            name={value === 1 ? "thumb-up" : "thumb-up-outline"}
            size={24}
            color={value === 1 ? "#16A34A" : "#6B7280"}
          />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.75} onPress={() => onChange(value === -1 ? 0 : -1)}>
          <MaterialCommunityIcons
            name={value === -1 ? "thumb-down" : "thumb-down-outline"}
            size={24}
            color={value === -1 ? "#DC2626" : "#6B7280"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ReviewScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ReviewRoute>();
  const { isAuthenticated } = useAuth();
  const bottomTabHeight = useBottomTabBarHeight();

  const {
    product_id,
    variant_id,
    order_id,
    product_name,
    image,
    delivered_on,
  } = route.params;

  const [rating, setRating] = useState(0);
  const [valueForMoney, setValueForMoney] = useState<Sentiment>(0);
  const [goodQuality, setGoodQuality] = useState<Sentiment>(0);
  const [smoothExperience, setSmoothExperience] = useState<Sentiment>(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewMedia, setReviewMedia] = useState<ReviewMediaAsset[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: false }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const deliveredText = useMemo(() => {
    if (!delivered_on) {
      return "Delivered order";
    }
    return delivered_on;
  }, [delivered_on]);

  const isSubmitDisabled =
    submitting || rating === 0 || reviewText.trim().length === 0;
  const showReviewHeaderSkeleton = !product_name && !image;

  const appendMedia = (assets: PickerAsset[] = []) => {
    const normalized = assets.filter((item): item is ReviewMediaAsset => Boolean(item?.uri));
    if (!normalized.length) return;

    setReviewMedia((current) => {
      const merged = [...current];
      normalized.forEach((asset) => {
        if (merged.some((item) => item.uri === asset.uri)) return;
        if (merged.length < MAX_REVIEW_MEDIA) {
          merged.push(asset);
        }
      });
      return merged;
    });
  };

  const handleOpenCamera = async () => {
    if (reviewMedia.length >= MAX_REVIEW_MEDIA) {
      Alert.alert("Media Limit", `You can upload up to ${MAX_REVIEW_MEDIA} photos.`);
      return;
    }

    try {
      const result = await launchCamera({
        mediaType: "photo",
        cameraType: "back",
        quality: 0.8,
        saveToPhotos: false,
      });

      if (result.didCancel) return;
      if (result.errorMessage) {
        Alert.alert("Camera", result.errorMessage);
        return;
      }

      if (!result.assets?.length) {
        Alert.alert("Camera", "Could not capture photo. Please try again.");
        return;
      }

      appendMedia(result.assets);
    } catch {
      Alert.alert("Camera", "Unable to open camera right now.");
    }
  };

  const handlePickFromGallery = async () => {
    if (reviewMedia.length >= MAX_REVIEW_MEDIA) {
      Alert.alert("Media Limit", `You can upload up to ${MAX_REVIEW_MEDIA} photos.`);
      return;
    }

    try {
      const remaining = MAX_REVIEW_MEDIA - reviewMedia.length;
      const result = await launchImageLibrary({
        mediaType: "photo",
        selectionLimit: remaining,
        quality: 0.8,
      });

      if (result.didCancel) return;
      if (result.errorMessage) {
        Alert.alert("Gallery", result.errorMessage);
        return;
      }

      if (!result.assets?.length) {
        Alert.alert("Gallery", "No photos selected.");
        return;
      }

      appendMedia(result.assets);
    } catch {
      Alert.alert("Gallery", "Unable to open gallery right now.");
    }
  };

  const onSubmit = async () => {
    if (isSubmitDisabled) {
      if (rating === 0) {
        Alert.alert("Rating Required", "Please select a star rating.");
        return;
      }
      if (!reviewText.trim()) {
        Alert.alert("Review Required", "Please write your review.");
      }
      return;
    }

    if (!isAuthenticated) {
      Alert.alert("Login Required", "Please login to submit your review.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        product_id: Number(product_id),
        variant_id: Number(variant_id),
        order_id: Number(order_id),
        rating: Number(rating),
        value_for_money: valueForMoney === 1 ? 1 : 0,
        good_quality: goodQuality === 1 ? 1 : 0,
        smooth_experience: smoothExperience === 1 ? 1 : 0,
        review_text: reviewText.trim(),
        media: reviewMedia.map((media, index) => {
          const mediaName = media.fileName || `review-${Date.now()}-${index}.jpg`;
          return {
            uri: media.uri,
            type: media.type || "image/jpeg",
            fileName: mediaName,
            name: mediaName,
          };
        }),
      } as const;

      const res = await createReview(payload);

      if (res?.success === false) {
        Alert.alert("Review", String(res?.message || "Failed to submit review"));
        return;
      }

      Alert.alert("Thank You", "Your review has been submitted.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to submit review";
      Alert.alert("Review", String(message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <ProductHead cartCount={0} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomTabHeight + 28 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.productCard}>
          {showReviewHeaderSkeleton ? (
            <>
              <SkeletonBox pulse={pulse} width={64} height={64} borderRadius={8} />
              <View style={styles.productTextWrap}>
                <SkeletonBox pulse={pulse} width="80%" height={14} borderRadius={999} />
                <SkeletonBox pulse={pulse} width="56%" height={12} borderRadius={999} style={styles.reviewTextSkeleton} />
              </View>
            </>
          ) : (
            <>
              <Image
                source={{
                  uri:
                    image ||
                    "https://static.nike.com/a/images/t_default/air-force-1-07-shoe.jpg",
                }}
                style={styles.image}
              />

              <View style={styles.productTextWrap}>
                <Text numberOfLines={1} style={styles.productTitle}>
                  {product_name || "Product"}
                </Text>
                <Text style={styles.productSubtitle}>{deliveredText}</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Your Experience Matters</Text>

          {showReviewHeaderSkeleton ? <StarRowSkeleton pulse={pulse} /> : <StarRow rating={rating} onRate={setRating} />}

          <Text style={styles.sectionTitle}>Add Photos</Text>
          <View style={styles.photoBox}>
            <Text style={styles.photoText}>Add up to 6 photos like Amazon reviews.</Text>
            <View style={styles.mediaActionRow}>
              <TouchableOpacity
                style={styles.galleryButton}
                activeOpacity={0.75}
                onPress={handlePickFromGallery}
              >
                <MaterialCommunityIcons name="image-multiple-outline" size={20} color="#D946EF" />
                <Text style={styles.galleryButtonText}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cameraButton} activeOpacity={0.75} onPress={handleOpenCamera}>
                <MaterialCommunityIcons name="camera-outline" size={22} color="#D946EF" />
              </TouchableOpacity>
            </View>
          </View>

          {reviewMedia.length ? (
            <View style={styles.mediaPreviewList}>
              {reviewMedia.map((media, index) => (
                <View key={`${media.uri}-${index}`} style={styles.mediaPreviewWrap}>
                  <Image source={{ uri: media.uri }} style={styles.mediaPreview} />
                  <TouchableOpacity
                    onPress={() =>
                      setReviewMedia((current) => current.filter((item) => item.uri !== media.uri))
                    }
                    style={styles.removeMediaBtn}
                  >
                    <MaterialCommunityIcons name="close-circle" size={22} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}

          {reviewMedia.length < MAX_REVIEW_MEDIA ? (
            <TouchableOpacity
              style={styles.addMoreChip}
              activeOpacity={0.8}
              onPress={handlePickFromGallery}
            >
              <MaterialCommunityIcons name="plus" size={16} color="#5B47A3" />
              <Text style={styles.addMoreText}>Add more photos</Text>
            </TouchableOpacity>
          ) : null}

          <Text style={styles.sectionTitle}>What did you love about it?</Text>
          <PreferenceRow
            label="Value for Money"
            value={valueForMoney}
            onChange={setValueForMoney}
          />
          <PreferenceRow label="Good Quality" value={goodQuality} onChange={setGoodQuality} />
          <PreferenceRow
            label="Smooth Experience (Delivery + Product Use)"
            value={smoothExperience}
            onChange={setSmoothExperience}
          />

          <Text style={styles.sectionTitle}>Tell us more</Text>
          <TextInput
            value={reviewText}
            onChangeText={setReviewText}
            placeholder="Share what you loved about this product"
            placeholderTextColor="#9CA3AF"
            multiline
            style={styles.textInput}
          />

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.submitWrap}
            onPress={onSubmit}
            disabled={isSubmitDisabled}
          >
            <LinearGradient
              colors={isSubmitDisabled ? ["#B8AFE8", "#A39ACA"] : ["#8665FF", "#5B47A3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButton}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>Submit</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { paddingHorizontal: 14, paddingBottom: 24 },

  productCard: {
    marginTop: 8,
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  image: { width: 64, height: 64, borderRadius: 8, marginRight: 12 },
  productTextWrap: { flex: 1 },
  productTitle: { fontSize: 28 / 2, fontWeight: "700", color: "#111827" },
  productSubtitle: { marginTop: 4, fontSize: 13, color: "#4B5563" },

  formCard: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
  },
  formTitle: {
    fontSize: 30 / 2,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
  },

  starRow: { flexDirection: "row", justifyContent: "center", marginBottom: 14 },
  starIcon: { marginHorizontal: 4 },
  starSkeleton: { marginHorizontal: 4 },
  reviewTextSkeleton: { marginTop: 8 },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    marginTop: 4,
  },

  photoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9ECF8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  photoText: { flex: 1, fontSize: 14, color: "#4B5563", paddingRight: 10 },
  mediaActionRow: { flexDirection: "row", alignItems: "center" },
  galleryButton: {
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D946EF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    flexDirection: "row",
    marginRight: 8,
  },
  galleryButtonText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#D946EF",
  },
  cameraButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#D946EF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 8,
  },
  optionText: { flex: 1, fontSize: 16, color: "#1F2937" },
  iconRow: { flexDirection: "row", gap: 16 },

  textInput: {
    minHeight: 92,
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: "top",
    backgroundColor: "#FFFFFF",
    marginBottom: 14,
    color: "#111827",
  },

  submitWrap: { marginTop: 2, marginBottom: 4 },
  submitButton: {
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  mediaPreviewList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  mediaPreviewWrap: {
    width: 96,
    height: 96,
    borderRadius: 10,
    marginBottom: 10,
    marginRight: 10,
    position: "relative",
  },
  mediaPreview: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  removeMediaBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FFFFFF",
    borderRadius: 11,
  },
  addMoreChip: {
    marginBottom: 12,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    backgroundColor: "#EEF2FF",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  addMoreText: {
    marginLeft: 4,
    color: "#5B47A3",
    fontWeight: "700",
    fontSize: 12,
  },
});
