import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
  Pressable,
  FlatList,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { HomeStackParamList } from '../../navigation/types'

import ProductHeadColor from '../../constants/heading/Poduct_Head_Color'
import CartItemCard from '../../constants/itemcart/CartItemCard'
import BillDetailsCard from '../../constants/itemcart/BillDetailsCard'
// import CouponsSection from '../../constants/coupan/CouponsSection'
import AddressPage from './AddressPage'
import { fetchCartItems, fetchCartSummary, updateCartQty, deleteCartItem } from '../../api/CartApi'
import { getProductImageUrl } from '../../api/ProductApi'
import EmptyCart from '../cart/EmptyCart'
import { useAuth } from '../../../common/auth/context/AuthContext'
import RecommendedProducts from '../Promotion/RecommendedProducts'
import RecentProduct from '../Promotion/RecentProduct'
import SkeletonBox from '../../../services/component/constant/SkeletonBox'
import {
  cartItemsQueryKey,
  cartSummaryQueryKey,
  checkoutPreviewQueryKey,
  prefetchCheckoutScreenData,
} from '../../navigation/navigationPerformance'
import StickyBottomCTA from '../../../../bottombar/StickyBottomCTA'
import { useStickyBottomCTA } from '../../../../bottombar/hooks/useStickyBottomCTA'
import { useAppTheme } from '../../../../theme/ThemeContext'

type Nav = NativeStackNavigationProp<HomeStackParamList>
const { height } = Dimensions.get('window')
const THIRTY_SECONDS = 30 * 1000
const THIRTY_MINUTES = 30 * 60 * 1000

const getCartItems = (cartData: any) => {
  return (
    (Array.isArray(cartData?.items) && cartData.items) ||
    (Array.isArray(cartData?.data?.items) && cartData.data.items) ||
    (Array.isArray(cartData?.cart_items) && cartData.cart_items) ||
    (Array.isArray(cartData?.data?.cart_items) && cartData.data.cart_items) ||
    []
  )
}

// const COUPONS = [
//   { id: 1, code: 'RPSLAY200', title: 'Add ₹248 more to avail this offer', subtitle: 'Get Flat ₹200 off' },
//   { id: 2, code: 'RPCC200', title: 'Buy for ₹7777 to avail', subtitle: 'BOB Credit Card Offer' },
// ]

type CartRowProps = {
  item: any
  navigation: Nav
  goToCheckout: (params?: HomeStackParamList['OrderStepUI']) => void
  onIncrease: (item: any) => void
  onDecrease: (item: any) => void
  onRemove: (item: any) => void
}

const CartRow = React.memo(function CartRow({
  item,
  navigation,
  goToCheckout,
  onIncrease,
  onDecrease,
  onRemove,
}: CartRowProps) {
  const mrp = Number(item.mrp)
  const price = Number(item.sale_price)
  const discount = Math.max(0, mrp - price)

  return (
    <CartItemCard
      title={item.product_name}
      image={getProductImageUrl(item.image)}
      deliveryText="Delivery in 3–5 days"
      returnText="7 Days Returnable"
      mrp={mrp}
      price={price}
      discountText={`₹${discount} off`}
      quantity={item.quantity}
      onIncrease={() => onIncrease(item)}
      onDecrease={() => onDecrease(item)}
      onRemove={() => onRemove(item)}
      onPress={() =>
        Number(item?.product_id) > 0 &&
        navigation.navigate('ProductDescription', {
          productId: Number(item.product_id),
        })
      }
      onBuyNow={() =>
        goToCheckout({
          mode: 'buy_now',
          product_id: item.product_id,
          variant_id: item.variant_id,
          qty: item.quantity,
        })
      }
    />
  )
})

export default function WithoutAddress() {
  const navigation = useNavigation<Nav>()
  const stickyCTA = useStickyBottomCTA({ tabBarAware: false, extraSpacing: 0 })
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [useRewards, setUseRewards] = useState(true)
  const { isDark, theme } = useAppTheme()

  const slideAnim = useRef(new Animated.Value(height)).current
  const pulse = useRef(new Animated.Value(0)).current

  const goToCheckout = useCallback((params?: HomeStackParamList['OrderStepUI']) => {
    const checkoutParams = params ?? { mode: 'cart' as const }

    prefetchCheckoutScreenData({
      mode: checkoutParams.mode === 'buy_now' ? 'buy_now' : 'cart',
      product_id: checkoutParams.product_id,
      variant_id: checkoutParams.variant_id,
      qty: checkoutParams.qty,
    }).catch(() => {
      // Ignore prefetch failures and continue navigation.
    })

    navigation.push('OrderStepUI', checkoutParams)
  }, [navigation])

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    )

    animation.start()
    return () => animation.stop()
  }, [pulse])

  const {
    data: cartData,
    isLoading: isCartLoading,
  } = useQuery({
    queryKey: cartItemsQueryKey,
    queryFn: fetchCartItems,
    enabled: isAuthenticated,
    staleTime: THIRTY_SECONDS,
    gcTime: THIRTY_MINUTES,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

  const items = useMemo(() => {
    return getCartItems(cartData)
  }, [cartData])

  const rewardSummaryQuery = useQuery({
    queryKey: cartSummaryQueryKey(true),
    queryFn: () => fetchCartSummary(true),
    enabled: isAuthenticated && items.length > 0,
    staleTime: THIRTY_SECONDS,
    gcTime: THIRTY_MINUTES,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

  const noRewardSummaryQuery = useQuery({
    queryKey: cartSummaryQueryKey(false),
    queryFn: () => fetchCartSummary(false),
    enabled: isAuthenticated && items.length > 0 && !useRewards,
    staleTime: THIRTY_SECONDS,
    gcTime: THIRTY_MINUTES,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

  const cartSummaryData = useMemo(() => {
    if (useRewards) return rewardSummaryQuery.data
    if (noRewardSummaryQuery.data) return noRewardSummaryQuery.data

    // Keep the cart visible while the first no-reward summary refreshes.
    const current = rewardSummaryQuery.data
    if (!current) return undefined
    return {
      ...current,
      finalPayable: Number(current.cartTotal || 0),
      totalRedeemed: 0,
    }
  }, [noRewardSummaryQuery.data, rewardSummaryQuery.data, useRewards])

  const cartSummary = useMemo(() => {
    return {
      cartTotal: Number(cartSummaryData?.cartTotal || 0),
      finalPayable: Number(cartSummaryData?.finalPayable || 0),
      totalRewardEarn: Number(cartSummaryData?.totalRewardEarn || 0),
      totalRedeemed: Number(cartSummaryData?.totalRedeemed || 0),
    }
  }, [cartSummaryData])

  const rewardCoinsAvailable = Math.max(
    0,
    Number(rewardSummaryQuery.data?.totalRedeemed || 0)
  )
  const rewardsEnabled = useRewards && rewardCoinsAvailable > 0

  useEffect(() => {
    if (rewardSummaryQuery.data && rewardCoinsAvailable <= 0 && useRewards) {
      setUseRewards(false)
    }
  }, [rewardCoinsAvailable, rewardSummaryQuery.data, useRewards])

  const loading =
    isAuthenticated &&
    (isCartLoading && !cartData)

  const syncCartAfterMutation = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: cartItemsQueryKey }).catch(() => {
      // Ignore sync failures; optimistic cache is still usable.
    })
    queryClient.invalidateQueries({ queryKey: cartSummaryQueryKey(true) }).catch(() => {
      // Summary will retry on the next query refresh.
    })
    queryClient.invalidateQueries({ queryKey: cartSummaryQueryKey(false) }).catch(() => {
      // Summary will retry on the next query refresh.
    })
    queryClient.invalidateQueries({ queryKey: checkoutPreviewQueryKey({ mode: 'cart', use_rewards: true }) }).catch(() => {
      // Checkout preview should not block cart UI updates.
    })
    queryClient.invalidateQueries({ queryKey: checkoutPreviewQueryKey({ mode: 'cart', use_rewards: false }) }).catch(() => {
      // Checkout preview should not block cart UI updates.
    })
  }, [queryClient])

  const updateQtyMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      updateCartQty(itemId, quantity),
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: cartItemsQueryKey })
      const previous = queryClient.getQueryData<any>(cartItemsQueryKey)

      queryClient.setQueryData(cartItemsQueryKey, (old: any) => {
        if (!old) return old
        const oldItems = Array.isArray(old?.items) ? old.items : []
        const nextItems = oldItems.map((it: any) => {
          if (Number(it?.cart_item_id) !== itemId) return it
          const salePrice = Number(it?.sale_price || it?.price || 0)
          return {
            ...it,
            quantity,
            item_total: salePrice * quantity,
          }
        })

        return {
          ...old,
          items: nextItems,
        }
      })

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cartItemsQueryKey, context.previous)
      }
    },
    onSuccess: () => {
      syncCartAfterMutation()
    },
  })

  const removeItemMutation = useMutation({
    mutationFn: (itemId: number) => deleteCartItem(itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: cartItemsQueryKey })
      const previous = queryClient.getQueryData<any>(cartItemsQueryKey)

      queryClient.setQueryData(cartItemsQueryKey, (old: any) => {
        if (!old) return old
        const oldItems = Array.isArray(old?.items) ? old.items : []
        return {
          ...old,
          items: oldItems.filter((it: any) => Number(it?.cart_item_id) !== itemId),
        }
      })

      return { previous }
    },
    onError: (_error, _itemId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cartItemsQueryKey, context.previous)
      }
    },
    onSuccess: () => {
      syncCartAfterMutation()
    },
  })

  const increaseQty = useCallback((item: any) => {
    if (!isAuthenticated) return
    const itemId = Number(item?.cart_item_id)
    const nextQty = Number(item?.quantity || 0) + 1
    if (!itemId || nextQty <= 0) return
    updateQtyMutation.mutate({ itemId, quantity: nextQty })
  }, [isAuthenticated, updateQtyMutation])

  const decreaseQty = useCallback((item: any) => {
    if (!isAuthenticated) return

    const itemId = Number(item?.cart_item_id)
    const currentQty = Number(item?.quantity || 0)
    if (!itemId || currentQty <= 0) return

    if (currentQty <= 1) {
      removeItemMutation.mutate(itemId)
      return
    }

    updateQtyMutation.mutate({ itemId, quantity: currentQty - 1 })
  }, [isAuthenticated, removeItemMutation, updateQtyMutation])

  const removeItem = useCallback((item: any) => {
    if (!isAuthenticated) return
    const itemId = Number(item?.cart_item_id)
    if (!itemId) return
    removeItemMutation.mutate(itemId)
  }, [isAuthenticated, removeItemMutation])

  const renderItem = useCallback(({ item }: { item: any }) => {
    return (
      <CartRow
        item={item}
        navigation={navigation}
        goToCheckout={goToCheckout}
        onIncrease={increaseQty}
        onDecrease={decreaseQty}
        onRemove={removeItem}
      />
    )
  }, [decreaseQty, goToCheckout, increaseQty, navigation, removeItem])

  const keyExtractor = useCallback((item: any, index: number) => {
    return String(item?.cart_item_id ?? item?.id ?? index)
  }, [])

  const footer = useMemo(() => {
    return (
      <>
        {/* <View style={styles.wrapper}>
          <View style={styles.headerRow}>
            <Text style={styles.headerText}>Coupons and Offers</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Coupan')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <CouponsSection coupons={COUPONS.slice(0, 1)} />
        </View> */}

        <BillDetailsCard
          cartTotal={cartSummary.cartTotal}
          finalPayable={cartSummary.finalPayable}
          totalRewardEarn={cartSummary.totalRewardEarn}
          totalRedeemed={cartSummary.totalRedeemed}
          useRewards={rewardsEnabled}
          onUseRewardsChange={setUseRewards}
          rewardCoinsAvailable={rewardCoinsAvailable}
          showShippingCharges={false}
        />

        <RecommendedProducts />
        <RecentProduct />

        <View style={styles.listBottomSpace} />
      </>
    )
  }, [
    cartSummary.cartTotal,
    cartSummary.finalPayable,
    cartSummary.totalRedeemed,
    cartSummary.totalRewardEarn,
    rewardCoinsAvailable,
    rewardsEnabled,
  ])

  if (!loading && items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ProductHeadColor title="Cart" onBackPress={() => navigation.goBack()} />
        <EmptyCart onBrowse={() => navigation.navigate('Home')} />
      </View>
    )
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ProductHeadColor title="Cart" onBackPress={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={[styles.skeletonScrollContent, { paddingBottom: stickyCTA.scrollContentPaddingBottom, backgroundColor: theme.background }]}>
          <SkeletonBox pulse={pulse} width="100%" height={118} borderRadius={14} />
          <SkeletonBox pulse={pulse} width="100%" height={118} borderRadius={14} style={styles.skeletonGap} />
          <SkeletonBox pulse={pulse} width="100%" height={126} borderRadius={14} style={styles.skeletonGap} />
          <SkeletonBox pulse={pulse} width="100%" height={52} borderRadius={12} style={styles.skeletonGapLg} />
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ProductHeadColor title="Cart" onBackPress={() => navigation.goBack()} />

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListFooterComponent={footer}
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: stickyCTA.scrollContentPaddingBottom, backgroundColor: theme.background }]}
        removeClippedSubviews={true}
        windowSize={7}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        updateCellsBatchingPeriod={60}
        showsVerticalScrollIndicator={false}
      />

      <StickyBottomCTA bottomOffset={0} onLayout={stickyCTA.onCtaLayout}>
      <View style={[styles.bottomBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.navigate('AddressSelect')}>
          <LinearGradient colors={['#8665FF', '#5B47A3']} style={styles.button}>
            <Text style={styles.buttonText}>Select Address</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      </StickyBottomCTA>

      <Modal visible={false} transparent animationType="none">
        <Pressable style={styles.overlay} />
        <Animated.View style={[styles.sheet, { top: slideAnim, backgroundColor: theme.card }]}>
          <View style={[styles.handle, { backgroundColor: isDark ? '#52525B' : '#CCC' }]} />
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>Select Address</Text>
            <TouchableOpacity>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>
          <AddressPage />
        </Animated.View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#F9FAFB',
  },
  scrollContent: { paddingBottom: 24 },
  skeletonScrollContent: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 24 },
  skeletonGap: { marginTop: 14 },
  skeletonGapLg: { marginTop: 20 },
  wrapper: { paddingHorizontal: 14, marginTop: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  headerText: { fontSize: 15, fontWeight: '600', color: '#111' },
  viewAllText: { fontSize: 14, fontWeight: '600', color: '#3585FF' },
  button: {
    height: 50,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 16,
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: height * 0.75,
    backgroundColor: '#F5F6FB',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCC',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    alignItems: 'center',
  },
  sheetTitle: { fontSize: 16, fontWeight: '600' },
  close: { fontSize: 24, fontWeight: '600' },
  bottomBar: {
    backgroundColor: '#FFF',
    paddingBottom: 16,
    elevation: 10,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  listBottomSpace: { height: 12 },

})
