import React from "react";
import {
  View,
  TextInput,
  StyleSheet,
  useWindowDimensions,
  Image,
} from "react-native";
import BackgroundImage from "../../../../assets/homepage/navbar_bg.jpg";
import AppIconButton from "../icons/AppIconButton";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";
import {
  handleNavigateWithPrefetch,
  prefetchCartScreenData,
} from "../../navigation/navigationPerformance";
import { useCart } from "../../context/CartContext";

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const BASE_HEADER_RATIO = 0.45;

export default function ProductHead({
  headerHeight,
  onBackPress,
  onSearchPress,
  onCartPress,
  // cartCount = 0,
}: {
  headerHeight?: number;
  onBackPress?: () => void;
  onSearchPress?: () => void;
  onCartPress?: () => void;
  cartCount?: number;
}) {
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const { totalQuantity: cartCount } = useCart();

  const calculatedHeaderHeight = Math.round(width * BASE_HEADER_RATIO);
  const HEADER_HEIGHT = headerHeight ?? calculatedHeaderHeight;
  const ICON = width * 0.085;
  const SEARCH_HEIGHT = width * 0.1;

  const handleBack = () => {
    if (onBackPress) {
      handleNavigateWithPrefetch({ navigate: onBackPress });
      return;
    }

    handleNavigateWithPrefetch({ navigate: () => navigation.goBack() });
  };

  const handleSearch = () => {
    if (onSearchPress) {
      handleNavigateWithPrefetch({ navigate: onSearchPress });
      return;
    }

    handleNavigateWithPrefetch({
      navigate: () => {
        try {
          navigation.navigate("SearchScreen");
        } catch {
          const parentNav = (navigation as any).getParent?.();
          parentNav?.navigate?.("SearchScreen");
        }
      },
    });
  };

  const handleCart = () => {
    prefetchCartScreenData().catch(() => {
      // Ignore prefetch errors; navigation should still be instant.
    });

    handleNavigateWithPrefetch({
      navigate: onCartPress ?? (() => navigation.navigate("Cart")),
    });
  };

  return (
    <>
      {/* 🔥 Background SVG */}
      <View style={[styles.bgWrap, { height: HEADER_HEIGHT }]}>
        <Image
          source={BackgroundImage}
          style={[styles.absoluteFill, { width, height: HEADER_HEIGHT }]}
          resizeMode="cover"
        />
      </View>

      {/* 🔥 Top Bar */}
      <View
        style={[
          styles.topBar,
          { marginTop: HEADER_HEIGHT * 0.38, paddingHorizontal: width * 0.055 },
        ]}
      >
        <AppIconButton
          type="back"
          variant="ghost"
          onPress={handleBack}
          style={{ width: ICON, height: ICON }}
        />

        <View
          style={[
            styles.searchBox,
            {
              height: SEARCH_HEIGHT,
              borderRadius: SEARCH_HEIGHT * 0.35,
              paddingHorizontal: width * 0.03,
            },
          ]}
        >
          <AppIconButton
            type="search"
            variant="ghost"
            color="#777"
            onPress={handleSearch}
          />



          <TextInput
            placeholder='Search "TRF Bling"'
            placeholderTextColor="#777"
            style={[styles.searchInput, { fontSize: width * 0.038 }]}
            onFocus={handleSearch}
            showSoftInputOnFocus={false}
            caretHidden
          />
        </View>

        <AppIconButton
          type="cart"
          onPress={handleCart}
          badgeCount={cartCount}
          style={{ width: ICON, height: ICON }}
        />
      </View>
    </>
  );
}
const styles = StyleSheet.create({
  bgWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
    zIndex: -10,
  },

  absoluteFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingBottom: 15,
  },

  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },

  searchInput: {
    flex: 1,
    paddingVertical: 0,
    color: "#222",
  },
});
