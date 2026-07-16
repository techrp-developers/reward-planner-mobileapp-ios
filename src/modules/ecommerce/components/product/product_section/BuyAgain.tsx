import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import OrderHeading from "../../../constants/heading/OrderHeading";
import ProductCard from "../../../constants/product_cart/ProductCard";
import { fetchBuyAgainOrders } from "../../../api/OrderApi";

const SORT_OPTIONS = [
  { label: "Recently Bought", value: "recent" },
  { label: "Most Frequent", value: "frequent" },
  { label: "Price: Low to High", value: "price_low" },
  { label: "Price: High to Low", value: "price_high" },
];

function BuyAgain() {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState("recent");

  const loadProducts = async () => {
    try {
      setLoading(true);

      const res = await fetchBuyAgainOrders(1, "", sortBy);

      if (res?.success && Array.isArray(res.products)) {
        setProducts(res.products);
      }

    } catch (error) {
      console.log("Error loading Buy Again", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [sortBy]);

  const changeSort = () => {
    const index = SORT_OPTIONS.findIndex(o => o.value === sortBy);
    const nextIndex = (index + 1) % SORT_OPTIONS.length;
    setSortBy(SORT_OPTIONS[nextIndex].value);
  };

  const formattedProducts = useMemo(() => {

    return products.map((item) => {

      const salePrice = Number(item.sale_price);
      const mrp = Number(item.mrp);

      const dateDisplay = new Date(item.last_purchased).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );

      return {
        ...item,
        id: item.product_id,
        title: item.product_name,
        brand: item.brand_name,
        price: `₹${salePrice.toFixed(2)}`,
        originalPrice: mrp > salePrice ? `₹${mrp.toFixed(2)}` : undefined,
        discount:
          mrp > salePrice
            ? `${Math.round(((mrp - salePrice) / mrp) * 100)}% Off`
            : "",

        purchaseMeta: {
          date: dateDisplay,
          count: item.purchase_count,
        },
      };

    });

  }, [products]);

  return (
    <SafeAreaView style={styles.safe}>

      <OrderHeading
        title="Buy Again"
        onBackPress={() => navigation.goBack()}
      />

      {/* Sort Row */}

      <View style={styles.filterRow}>

        <Text style={styles.countText}>
          {products.length} Products
        </Text>

        <View style={styles.sortContainer}>

          <MaterialCommunityIcons
            name="sort-variant"
            size={18}
            color="#5B47A3"
          />

          <Text style={styles.sortLabel}>
            Sort:
          </Text>

          <TouchableOpacity onPress={changeSort}>
            <Text style={styles.activeSort}>
              {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
            </Text>
          </TouchableOpacity>

        </View>

      </View>

      {loading ? (

        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#8665FF" />
        </View>

      ) : (

        <FlatList
          data={formattedProducts}
          keyExtractor={(item) =>
            `${item.product_id}-${item.variant_id}`
          }
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}

          renderItem={({ item }) => (

            <View style={styles.cardWrapper}>

              <ProductCard item={item} />

              <View style={styles.metaContainer}>

                <View style={styles.countBadge}>
                  <Text style={styles.countTextSmall}>
                    Bought {item.purchaseMeta.count} times
                  </Text>
                </View>

                <Text style={styles.dateText}>
                  Last: {item.purchaseMeta.date}
                </Text>

              </View>

            </View>

          )}
        />

      )}

    </SafeAreaView>
  );
}

export default BuyAgain;
const styles = StyleSheet.create({

  safe: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },

  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  sortLabel: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
  },

  activeSort: {
    fontSize: 13,
    color: "#5B47A3",
    fontWeight: "700",
    marginLeft: 4,
  },

  countText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },

  listContent: {
    padding: 12,
  },

  row: {
    justifyContent: "space-between",
  },

  cardWrapper: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },

  metaContainer: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
    backgroundColor: "#FAFAFA",
  },

  countBadge: {
    backgroundColor: "#E9E4FF",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 4,
  },

  countTextSmall: {
    fontSize: 10,
    color: "#5B47A3",
    fontWeight: "700",
  },

  dateText: {
    fontSize: 10,
    color: "#999",
    fontWeight: "500",
  },

  centered: {
    flex: 1,
    justifyContent: "center",
  },

});