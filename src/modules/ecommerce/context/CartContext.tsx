import React, { createContext, useContext, useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCartItems, addToCart, deleteCartItem, updateCartQty } from "../api/CartApi";
import { useAuth } from "../../common/auth/context/AuthContext";
import {
  cartItemsQueryKey,
  cartSummaryQueryKey,
  checkoutPreviewQueryKey,
} from "../navigation/navigationPerformance";

const TEN_MINUTES = 10 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

export type CartItem = {
  id: string;
  product_id: string | number;
  variant_id: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  attributes?: Record<string, string>;
};

type CartContextType = {
  count: number;
  totalQuantity: number;
  items: CartItem[];
  refresh: () => Promise<void>;
  addItem: (productId: string | number, variantId: string | number, quantity: number) => Promise<void>;
  removeItem: (itemId: string | number) => Promise<void>;
  updateQuantity: (itemId: string | number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
};


const CartContext = createContext<CartContextType>({
  count: 0,
  totalQuantity: 0,
  items: [],
  refresh: async () => { },
  addItem: async () => { },
  removeItem: async () => { },
  updateQuantity: async () => { },
  clearCart: async () => { },
});

const toCartItems = (rawItems: any[]): CartItem[] => {
  return rawItems.map((item: any) => ({
    id: String(item.id || item.cart_item_id || ""),
    product_id:
      item.product_id ??
      item.productId ??
      item.product?.product_id ??
      item.product?.id,
    variant_id:
      item.variant_id ??
      item.variantId ??
      item.product_variant_id ??
      item.productVariantId ??
      item.variant?.variant_id ??
      item.variant?.id,
    name: item.product_name || item.name,
    price: Number(item.sale_price || item.price || 0),
    quantity: Number(item.quantity || 1),
    image: item.image || item.product_image,
    attributes: item.attributes || item.variant_attributes || {},
  }));
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // ✅ PRODUCT CART (API)
  const { data: cartData } = useQuery({
    queryKey: cartItemsQueryKey,
    queryFn: fetchCartItems,
    enabled: isAuthenticated,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });

  const items = useMemo(() => {
    const rawItems =
      (Array.isArray(cartData?.items) && cartData.items) ||
      (Array.isArray(cartData?.data?.items) && cartData.data.items) ||
      (Array.isArray(cartData?.cart_items) && cartData.cart_items) ||
      (Array.isArray(cartData?.data?.cart_items) && cartData.data.cart_items) ||
      [];
    return toCartItems(rawItems);
  }, [cartData]);

  const count = items.length;

  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [items]);

  const syncProductCartQueries = useCallback(async () => {
    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: cartItemsQueryKey }),
      queryClient.invalidateQueries({ queryKey: cartSummaryQueryKey(true) }),
      queryClient.invalidateQueries({ queryKey: cartSummaryQueryKey(false) }),
      queryClient.invalidateQueries({ queryKey: checkoutPreviewQueryKey({ mode: "cart", use_rewards: true }) }),
      queryClient.invalidateQueries({ queryKey: checkoutPreviewQueryKey({ mode: "cart", use_rewards: false }) }),
    ]);
  }, [queryClient]);

  // 🔄 REFRESH
  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      queryClient.setQueryData(cartItemsQueryKey, { items: [] });
      return;
    }
    await syncProductCartQueries();
  }, [isAuthenticated, queryClient, syncProductCartQueries]);

  // 🔄 BACKGROUND SYNC
  // ➕ ADD PRODUCT
  const addMutation = useMutation({
    mutationFn: ({ productId, variantId, quantity }: any) =>
      addToCart({
        product_id: productId,
        variant_id: variantId,
        quantity,
      }),
    onSuccess: () => {
      syncProductCartQueries();
    },
  });

  // ❌ REMOVE PRODUCT
  const removeMutation = useMutation({
    mutationFn: (itemId: number) => deleteCartItem(itemId),
    onSuccess: () => {
      syncProductCartQueries();
    },
  });

  // 🔄 UPDATE PRODUCT
  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: any) =>
      updateCartQty(itemId, quantity),
    onSuccess: () => {
      syncProductCartQueries();
    },
  });

  const addItem = useCallback(
    async (productId: string | number, variantId: string | number, quantity: number) => {
      if (!isAuthenticated) return;
      await addMutation.mutateAsync({
        productId: Number(productId),
        variantId: Number(variantId),
        quantity,
      });
    },
    [addMutation, isAuthenticated]
  );

  const removeItem = useCallback(
    async (itemId: string | number) => {
      if (!isAuthenticated) return;
      await removeMutation.mutateAsync(Number(itemId));
    },
    [isAuthenticated, removeMutation]
  );

  const updateQuantity = useCallback(
    async (itemId: string | number, quantity: number) => {
      if (!isAuthenticated) return;

      if (quantity <= 0) {
        await removeMutation.mutateAsync(Number(itemId));
        return;
      }

      await updateMutation.mutateAsync({ itemId: Number(itemId), quantity });
    },
    [isAuthenticated, removeMutation, updateMutation]
  );

  const clearCart = useCallback(async () => {
    queryClient.setQueryData(cartItemsQueryKey, { items: [] });
    const emptySummary = {
      cartTotal: 0,
      finalPayable: 0,
      totalRewardEarn: 0,
      totalRedeemed: 0,
    };
    queryClient.setQueryData(cartSummaryQueryKey(true), emptySummary);
    queryClient.setQueryData(cartSummaryQueryKey(false), emptySummary);
    queryClient.invalidateQueries({ queryKey: checkoutPreviewQueryKey({ mode: "cart", use_rewards: true }) });
    queryClient.invalidateQueries({ queryKey: checkoutPreviewQueryKey({ mode: "cart", use_rewards: false }) });
  }, [queryClient]);

  return (
    <CartContext.Provider
      value={{
        count,
        totalQuantity,
        items,
        refresh,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
