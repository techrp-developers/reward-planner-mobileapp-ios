
import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Image as RNImage,
  Alert,
  Linking,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import HomeSectionSkeleton from "./HomeSectionSkeleton";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import LinearGradient from "react-native-linear-gradient";
import FontAwesome from "react-native-vector-icons/FontAwesome";

import {
  getProductImageUrl,
  fetchProductDetailsByID,
} from "../../api/ProductApi";
import { getCampaignHome, getCampaignProducts } from "../../api/CampaignAPI";
import { queryClient } from "../../../../query/queryClient";
import { HomeStackParamList } from "../../navigation/types";
import BgSales from "../../../../assets/homepage/Flash_Sale_Bg.svg";
import { checkWishlist, isWishlistPresent, setWishlistState } from "../../api/WishlistApi";
import {
  handleNavigateWithPrefetch,
  productDetailsQueryKey,
} from "../../navigation/navigationPerformance";
import { useAppTheme } from "../../../../theme/ThemeContext";
import { fetchResolvedZones } from "../../../common/cms/cmsContentApi";
import type { CmsModuleKey, CmsOfferImage as ContentZoneImage } from "../../../common/cms/cmsContentApi";
import { useModuleContent, moduleContentQueryKey } from "../../../common/cms/useModuleContent";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Responsive constants
const OFFER_WIDTH = SCREEN_WIDTH * 0.38;
const OFFER_HEIGHT = OFFER_WIDTH * 1.25;
const CARD_WIDTH = Math.round(Math.min(Math.max(SCREEN_WIDTH * 0.33, 120), 170));
const IMAGE_BOX_HEIGHT = Math.round(CARD_WIDTH * 0.72);
const CARD_MARGIN = 8;
const CAMPAIGN_HOME_QUERY_KEY = ["ecommerce", "home", "campaign-home"] as const;
const FLASH_PRODUCTS_QUERY_KEY = (campaignId: number | string) =>
  ["ecommerce", "home", "flash-products", campaignId] as const;
// The campaign-home endpoint can omit flash_sales even while the dedicated
// flash-sale campaign remains available. Keep the configured campaign visible
// until the API starts returning an active flash sale again.
const DEFAULT_FLASH_CAMPAIGN_ID = 4;

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const OfferSlideImage = React.memo(({ uri }: { uri: string | null | undefined }) => {
  const { isDark } = useAppTheme();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const showImage = !!uri && !failed;

  return (
    <View
      style={[
        styles.offerImage,
        { backgroundColor: isDark ? "#111827" : "#FFF8E7" },
      ]}
    >
      {showImage ? (
        <RNImage
          source={{ uri: uri as string }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
          onError={(event) => {
            console.log('[CMS] Offer image failed:', uri, event.nativeEvent);
            setFailed(true);
          }}
        />
      ) : null}
    </View>
  );
});

OfferSlideImage.displayName = "OfferSlideImage";

const hasWishlistFlag = (item: any) =>
  item?.is_wishlist !== undefined || item?.is_wishlisted !== undefined;

const getWishlistFlag = (item: any) => {
  const value = item?.is_wishlisted ?? item?.is_wishlist;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  const normalized = String(value ?? "").trim().toLowerCase();
  return ["1", "true", "yes", "y"].includes(normalized);
};

// ---------------------------------------------------------------------
// Product Card Component
// ---------------------------------------------------------------------
const FlashOfferProductCard = React.memo(({
  item,
  shouldLoadImage,
}: {
  item: any;
  shouldLoadImage: boolean;
}) => {
  const navigation = useNavigation<Nav>();
  const { isDark, theme } = useAppTheme();
  const [wishLoading, setWishLoading] = useState(false);
  const [wishlisted, setWishlisted] = useState(() => getWishlistFlag(item));

  const productId = item.product_id ?? item.id;
  const variantId =
    item?.variant_id ??
    item?.variantId ??
    item?.default_variant_id ??
    item?.variants?.[0]?.variant_id ??
    item?.variants?.[0]?.id;
  const [resolvedVariantId, setResolvedVariantId] = useState<any>(variantId);

  useEffect(() => {
    setWishlisted(getWishlistFlag(item));
    setResolvedVariantId(variantId);
  }, [item, variantId]);

  useEffect(() => {
    const parsedProductId = Number(productId);
    const initialVariantId = Number(variantId);

    if (
      hasWishlistFlag(item) ||
      !shouldLoadImage ||
      !parsedProductId ||
      Number.isNaN(parsedProductId)
    ) {
      return;
    }

    let cancelled = false;

    const syncWishlistState = async () => {
      const candidateVariantIds: number[] = [];
      const addCandidate = (value: unknown) => {
        const parsed = Number(value);
        if (parsed && !Number.isNaN(parsed) && !candidateVariantIds.includes(parsed)) {
          candidateVariantIds.push(parsed);
        }
      };

      addCandidate(initialVariantId);

      if (candidateVariantIds.length === 0) {
        try {
          const details = await fetchProductDetailsByID(parsedProductId);
          addCandidate(details?.default_variant_id);
          addCandidate(details?.variant_id);

          const variants = Array.isArray(details?.variants) ? details.variants : [];
          variants.forEach((variant: any) => addCandidate(variant?.variant_id ?? variant?.id));
        } catch {
          return;
        }
      }

      for (const candidateVariantId of candidateVariantIds) {
        try {
          const response = await checkWishlist(parsedProductId, candidateVariantId);

          if (cancelled) return;

          if (isWishlistPresent(response)) {
            setResolvedVariantId(candidateVariantId);
            setWishlisted(true);
            return;
          }
        } catch {
          // Ignore auth/check failures and keep the list-provided flag.
        }
      }

      if (!cancelled) {
        setWishlisted(false);
      }

      if (!cancelled && candidateVariantIds[0]) {
        setResolvedVariantId(candidateVariantIds[0]);
      }
    };

    syncWishlistState();

    return () => {
      cancelled = true;
    };
  }, [item, productId, shouldLoadImage, variantId]);

  const displayData = useMemo(() => {
    // Parse price values from API response (format: "₹1349" or 1349)
    const parsePrice = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const num = parseFloat(value.replace(/[^0-9.]/g, ''));
        return isNaN(num) ? 0 : num;
      }
      return 0;
    };

    // Parse discount from API (format: "21%" or number)
    const parseDiscount = (value: any): string => {
      if (typeof value === 'string' && value.includes('%')) {
        return value;
      }
      if (typeof value === 'number' && value > 0) {
        return `${value}%`;
      }
      return "0%";
    };

    const currentPrice = parsePrice(item.price);
    const originalPrice = parsePrice(item.originalPrice ?? item.mrp);
    const rawRpPrice =
      item?.rp_price ??
      item?.rpPrice ??
      item?.reward_price ??
      item?.redeem_price;

    const rpPriceValue = parsePrice(rawRpPrice);
    // Calculate discount if not provided by API
    let discountPercent = parseDiscount(item.discount);
    if (discountPercent === "0%" && originalPrice > currentPrice && originalPrice > 0) {
      const discountValue = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
      discountPercent = `${discountValue}%`;
    }

    return {
      priceText: currentPrice.toLocaleString(),
      originalPriceText: originalPrice > currentPrice ? originalPrice.toLocaleString() : null,
      discountPercent,
      rpPrice:
        rpPriceValue > 0
          ? `₹${rpPriceValue.toLocaleString()}`
          : null,
      brandName: item.brand || "brand_name",
      productTitle: item.title || item.product_name || "Product Title",
      imageUrl: getProductImageUrl(Array.isArray(item.images) ? item.images[0] : item.image),
    };
  }, [item]);

  const handlePress = () => {
    if (!productId) return;
    handleNavigateWithPrefetch({
      navigate: () => navigation.navigate("ProductDescription", { productId: String(productId) }),
      queryKey: productDetailsQueryKey(String(productId)),
      queryFn: () => fetchProductDetailsByID(String(productId)),
    });
  };

  const handleWishlist = async () => {
    if (wishLoading) return;
    const parsedProductId = Number(productId);
    const parsedVariantId = Number(resolvedVariantId ?? variantId);

    if (!parsedProductId || isNaN(parsedProductId)) {
      Alert.alert("Wishlist", "Invalid product");
      return;
    }

    if (!parsedVariantId || isNaN(parsedVariantId)) {
      Alert.alert("Wishlist", "Product variant is missing");
      return;
    }

    try {
      setWishLoading(true);
      const result = await setWishlistState(parsedProductId, parsedVariantId, !wishlisted);
      setWishlisted(result.wishlisted);
    } catch (error: any) {
      Alert.alert(
        "Wishlist",
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to update wishlist"
      );
    } finally {
      setWishLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.cardContainer,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
      activeOpacity={0.9}
      onPress={handlePress}
    >
      <View style={[styles.imageBox, { backgroundColor: isDark ? "#111827" : "#FFF8E7" }]}>
        {shouldLoadImage ? (
          <RNImage source={{ uri: displayData.imageUrl }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImagePlaceholder, { backgroundColor: theme.border }]} />
        )}

        {displayData.discountPercent !== "0%" && (
          <LinearGradient
            colors={['#FEB014', '#FFE486', '#F5B924']}
            style={styles.discountBadgeTopLeft}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.discountBadgeText}>{displayData.discountPercent}</Text>
          </LinearGradient>
        )}

        <TouchableOpacity
          style={[styles.heartIcon, { backgroundColor: theme.card }]}
          activeOpacity={0.85}
          onPress={handleWishlist}
          disabled={wishLoading}
        >
          <FontAwesome
            name={wishlisted ? "heart" : "heart-o"}
            size={14}
            color={wishlisted ? "#E53935" : theme.text}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.infoArea}>
        <Text style={[styles.brandText, { color: theme.text }]} numberOfLines={1}>{displayData.brandName.toUpperCase()}</Text>
        <Text style={[styles.titleText, { color: theme.secondaryText }]} numberOfLines={1}>{displayData.productTitle}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.currentPrice}>₹{displayData.priceText}</Text>
          {displayData.originalPriceText && (
            <Text style={[styles.oldPrice, { color: theme.secondaryText }]}>₹{displayData.originalPriceText}</Text>
          )}
        </View>

        {!!displayData.rpPrice && (
          <View style={styles.pointsButtonWrapper}>
            <LinearGradient
              colors={['#714DF3', '#4D34A6']}
              style={styles.gradientContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.rpBadge}>
                <Text style={styles.rpLabel}>RP</Text>
                <Text style={styles.rewardPriceText} numberOfLines={1} adjustsFontSizeToFit>
                  {displayData.rpPrice}
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

FlashOfferProductCard.displayName = 'FlashOfferProductCard';

// ---------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------
type Props = {
  module?: CmsModuleKey;
};

// The CMS offers-banner carousel below is module-generic; the flash-sale /
// campaign / wishlist section is ecommerce (Product) specific business
// logic and is intentionally NOT parameterized by module.
export default function OfferHome({ module = "product" }: Props) {
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const { moduleContent } = useModuleContent(module);
  const cmsOffersBanner = moduleContent?.offers_banner ?? null;

  console.log('[CMS] Offers banner module:', module);
  console.log('[CMS] Offers banner:', JSON.stringify(cmsOffersBanner));
  console.log('[CMS] Offers images:', JSON.stringify(cmsOffersBanner?.images));

  const { data: campaignHome, isLoading: isCampaignLoading } = useQuery({
    queryKey: CAMPAIGN_HOME_QUERY_KEY,
    queryFn: getCampaignHome,
    staleTime: 10 * 60 * 1000,
  });

  const flashCampaignId =
    campaignHome?.data?.flash_sales?.[0]?.campaign_id ?? DEFAULT_FLASH_CAMPAIGN_ID;

  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: FLASH_PRODUCTS_QUERY_KEY(flashCampaignId!),
    queryFn: () => getCampaignProducts(flashCampaignId!),
    enabled: flashCampaignId != null,
    staleTime: 5 * 60 * 1000,
    select: (res) =>
      (res.data ?? []).map((p) => ({
        id: p.id,
        product_id: p.product_id,
        variant_id: p.variant_id,
        product_name: p.product_name,
        title: p.product_name,
        brand: p.brand_name || '',
        price: p.price ?? p.final_price,
        mrp: p.mrp,
        originalPrice: p.originalPrice ?? p.mrp,
        discount: p.discount,
        rp_price: p.rp_price,
        image: p.image || null,
        images: p.image ? [p.image] : [],
        is_wishlisted: false,
      })),
  });

  const banner = useMemo(() =>
    (campaignHome?.data?.posters ?? []).map(p => ({
      id: p.campaign_id,
      title: p.title,
      image: p.banner_image,
      redirectType: p.redirect_type,
      redirectId: p.redirect_id,
      redirectUrl: p.redirect_url,
    })),
    [campaignHome]
  );

  const cmsOffersSlides = useMemo(() => {
    if (cmsOffersBanner?.content_type !== "image") return [];

    const gallery: ContentZoneImage[] = Array.isArray(cmsOffersBanner.images)
      ? cmsOffersBanner.images
      : [];

    return gallery
      .filter((img) => Number(img?.is_active) === 1)
      .slice()
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
      .map((img) => {
        console.log('[CMS] Offer image:', {
          imageId: img.image_id,
          imageUrl: img.image_url,
          sortOrder: img.sort_order,
          isActive: img.is_active,
        });
        return {
          id: String(img.image_id ?? `${cmsOffersBanner.content_id}_${img.sort_order}`),
          image: img.image_url,
        };
      })
      .filter((slide) => !!slide.image);
  }, [cmsOffersBanner]);

  const hasCmsOffersColor =
    cmsOffersSlides.length === 0 &&
    cmsOffersBanner?.content_type === "color" &&
    !!cmsOffersBanner.color_value;
  const shouldShowCmsOffersBanner =
    cmsOffersSlides.length > 0 || hasCmsOffersColor;

  const flashSalesPoster = useMemo(() => {
    const flash = campaignHome?.data?.flash_sales?.[0];
    return flash?.banner_image ?? null;
  }, [campaignHome]);

  const handleBannerPress = (offer: typeof banner[number]) => {
    if (offer.redirectType === 'category' && offer.redirectId != null) {
      navigation.navigate('Category', {
        categoryId: offer.redirectId,
        title: offer.title,
      });
    } else if (offer.redirectType === 'url' && offer.redirectUrl) {
      Linking.openURL(offer.redirectUrl);
    }
  };

  if (isProductsLoading || isCampaignLoading) {
    return <HomeSectionSkeleton height={390} backgroundColor={theme.background} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Banner Carousel */}
      {shouldShowCmsOffersBanner ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.offersScroll}
        >
          {cmsOffersSlides.length > 0 ? (
            cmsOffersSlides.map((offer) => (
              <TouchableOpacity
                key={offer.id}
                style={[styles.offerCard, { backgroundColor: theme.card }]}
                activeOpacity={cmsOffersBanner?.redirect_link ? 0.85 : 1}
                onPress={() => {
                  if (cmsOffersBanner?.redirect_link) {
                    Linking.openURL(cmsOffersBanner.redirect_link).catch(() => undefined);
                  }
                }}
                disabled={!cmsOffersBanner?.redirect_link}
              >
                <OfferSlideImage uri={offer.image} />
              </TouchableOpacity>
            ))
          ) : (
            <TouchableOpacity
              style={[
                styles.offerCard,
                { backgroundColor: cmsOffersBanner!.color_value! },
              ]}
              activeOpacity={cmsOffersBanner?.redirect_link ? 0.85 : 1}
              onPress={() => {
                if (cmsOffersBanner?.redirect_link) {
                  Linking.openURL(cmsOffersBanner.redirect_link).catch(() => undefined);
                }
              }}
              disabled={!cmsOffersBanner?.redirect_link}
            />
          )}
        </ScrollView>
      ) : banner.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.offersScroll}
        >
          {banner.map((offer) => (
            <TouchableOpacity
              key={offer.id}
              style={[styles.offerCard, { backgroundColor: theme.card }]}
              activeOpacity={0.85}
              onPress={() => handleBannerPress(offer)}
            >
              <OfferSlideImage uri={offer.image} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      {/* Flash Sales Section */}
      <View style={styles.flashSectionContainer}>
        <BgSales style={StyleSheet.absoluteFillObject} preserveAspectRatio="xMidYMid slice" />
        <View style={styles.flashContentRow}>
          <View style={styles.flashLeft}>
            {flashSalesPoster ? (
              <RNImage source={{ uri: flashSalesPoster }} style={styles.flashPosterImage} resizeMode="contain" />
            ) : (
              <View style={styles.placeholderFlash}>
                <RNImage
                  source={require('../../../../assets/homepage/flash_sale_title.png')}
                  style={styles.flashSaleTitleImage}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.innerProductsScroll}
            snapToInterval={CARD_WIDTH + CARD_MARGIN}
            decelerationRate="fast"
            nestedScrollEnabled
          >
            {products.map((item: any, index: number) => (
              <View
                key={String(item?.id ?? item?.product_id ?? index)}
                style={index < products.length - 1 ? styles.flashProductItem : undefined}
              >
                <FlashOfferProductCard item={item} shouldLoadImage />
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

export const prefetchOfferHomeSection = async (module: CmsModuleKey = "product") => {
  await queryClient.prefetchQuery({
    queryKey: moduleContentQueryKey(module),
    queryFn: () => fetchResolvedZones(module),
    staleTime: 5 * 60 * 1000,
  });

  const campaignHome = await queryClient.fetchQuery({
    queryKey: CAMPAIGN_HOME_QUERY_KEY,
    queryFn: getCampaignHome,
    staleTime: 10 * 60 * 1000,
  });

  const flashCampaignId = campaignHome?.data?.flash_sales?.[0]?.campaign_id;
  if (flashCampaignId == null) return;

  await queryClient.prefetchQuery({
    queryKey: FLASH_PRODUCTS_QUERY_KEY(flashCampaignId),
    queryFn: () => getCampaignProducts(flashCampaignId),
    staleTime: 5 * 60 * 1000,
  });
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  offersScroll: {
    paddingHorizontal: 12,
  },
  offerCard: {
    width: OFFER_WIDTH,
    height: OFFER_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 12,
  },
  offerImage: {
    width: "100%",
    height: "100%",
  },
  flashSectionContainer: {
    width: "100%",
    height: CARD_WIDTH * 1.95,
    marginTop: 20,
    marginBottom: 10,
    position: "relative",
  },
  flashContentRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  flashLeft: {
    width: SCREEN_WIDTH * 0.34,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  flashPosterImage: {
    width: "90%",
    height: "90%",
  },
  placeholderFlash: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  flashSaleTitleImage: {
    width: "92%",
    height: "72%",
  },
  innerProductsScroll: {
    alignItems: "center",
    paddingLeft: CARD_MARGIN,
    paddingRight: CARD_MARGIN + 20,
  },
  flashProductItem: {
    marginRight: CARD_MARGIN,
  },
  cardContainer: {
    width: CARD_WIDTH,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  imageBox: {
    width: "100%",
    height: IMAGE_BOX_HEIGHT,
    backgroundColor: "#FFF8E7",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  productImage: {
    width: "85%",
    height: "85%",
    resizeMode: "contain",
  },
  productImagePlaceholder: {
    width: "85%",
    height: "85%",
    borderRadius: 10,
    backgroundColor: "#F2E8CC",
  },
  discountBadgeTopLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    zIndex: 10,
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#333",
  },
  heartIcon: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#FFF",
    borderRadius: 14,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  infoArea: {
    marginTop: 8,
  },
  brandText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#333",
  },
  titleText: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  currentPrice: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#00A36C",
  },
  oldPrice: {
    fontSize: 10,
    color: "#999",
    textDecorationLine: "line-through",
    marginLeft: 6,
  },
  pointsButtonWrapper: {
    width: "100%",
    marginTop: 8,
  },
  gradientContainer: {
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  rewardPriceText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "800",
  },
  rpBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 1,
  },

  rpLabel: {
    color: "#FFE082",
    fontSize: 10,
    fontWeight: "900",
    marginRight: 4,
  },
});
