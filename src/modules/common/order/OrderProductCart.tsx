import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../ecommerce/navigation/types";
import { getProductImageUrl } from "../../ecommerce/api/ProductApi";


type Nav = NativeStackNavigationProp<HomeStackParamList>;

type Props = {
  item: any;
  cardWidth: number;
};

export default function OrderProductCart({ item, cardWidth }: Props) {  const navigation = useNavigation<Nav>();

  const resolvedProductId = item?.product_id ?? item?.id;
  const brandText = item?.brand_name ?? item?.brand ?? "Brand";
  const titleText = item?.product_name ?? item?.title ?? "Product";
  const salePrice = item?.sale_price ?? item?.price ?? item?.variants?.[0]?.sale_price;
  const mrpPrice = item?.mrp ?? item?.original_price ?? item?.variants?.[0]?.mrp;

  const goToDetails = () => {
    if (!resolvedProductId) return;
    navigation.navigate("ProductDescription", { productId: resolvedProductId });
  };

  const imgUrl = getProductImageUrl(
    item?.images?.[0]?.image_url ?? item?.images?.[0] ?? item?.image
  );

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.card, { width: cardWidth }]}
      onPress={goToDetails}
    >
      {/* Image Section */}
      <View style={styles.imageWrap}>
        {item?.isBestSeller !== false && ( // Showing by default for demo
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Bestseller</Text>
          </View>
        )}
        <Image
          source={{ uri: imgUrl }}
          resizeMode="contain"
          style={{ width: cardWidth * 0.7, height: cardWidth * 0.7 }}
        />
        
        {/* Rating Floating on Image or right below */}
        <View style={styles.ratingBadge}>
           <Text style={styles.ratingText}>{item?.rating ?? "4.3"} ★</Text>
        </View>
      </View>

      {/* Text Section - Left Aligned */}
      <View style={styles.detailsContainer}>
        <Text style={styles.brand} numberOfLines={1}>
          {brandText}
        </Text>

        <Text style={styles.title} numberOfLines={2}>
          {titleText}
        </Text>

        {/* Price Row */}
        <View style={styles.priceRow}>
          {!!mrpPrice && <Text style={styles.oldPrice}>{mrpPrice}</Text>}
          {!!salePrice && <Text style={styles.price}>{salePrice}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "transparent", 
  },
  imageWrap: {
    backgroundColor: "#F9F5FF", 
    borderRadius: 12,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: 'hidden'
  },
  badge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#6B2FB9", // Darker purple
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFF",
  },
  ratingBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: '#FFF',
    paddingHorizontal: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: "bold",
    color: '#333'
  },
  detailsContainer: {
    paddingTop: 8,
    paddingHorizontal: 2,
  },
  brand: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  title: {
    fontSize: 12,
    color: "#666",
    marginVertical: 2,
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  oldPrice: {
    fontSize: 11,
    color: "#999",
    textDecorationLine: "line-through",
    marginRight: 8,
  },
  price: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#00A35C", // Green from image
  },
});