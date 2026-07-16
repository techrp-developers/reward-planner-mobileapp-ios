import { Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isTablet = SCREEN_WIDTH >= 768;

export const PROMO_CARD_WIDTH = isTablet
  ? Math.round(SCREEN_WIDTH * 0.22)
  : Math.round(SCREEN_WIDTH * 0.42);
export const PROMO_CARD_GAP = 12;
export const PROMO_ESTIMATED_ITEM_SIZE = PROMO_CARD_WIDTH + PROMO_CARD_GAP;
