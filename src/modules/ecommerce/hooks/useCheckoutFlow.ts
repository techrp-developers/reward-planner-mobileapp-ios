import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../common/auth/context/AuthContext';
import { useAlert } from '../components/alerts';
import { fetchBuyNowCheckout } from '../api/CheckoutApi';
import { checkoutPreviewQueryKey, prefetchCheckoutScreenData } from '../navigation/navigationPerformance';
import { CheckoutParams, ShoppingNavigation, navigateToCheckout, validateBuyNowParams, validateBuyNowPreview } from '../navigation/checkoutFlow';

export function useCheckoutFlow() {
  const navigation = useNavigation<ShoppingNavigation>();
  const { isAuthenticated, logout } = useAuth();
  const alert = useAlert();
  const queryClient = useQueryClient();
  const locked = useRef(false);
  const mounted = useRef(true);
  const focusVersion = useRef(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useFocusEffect(useCallback(() => {
    mounted.current = true;
    locked.current = false;
    setIsCheckingOut(false);
    return () => { mounted.current = false; focusVersion.current += 1; };
  }, []));

  const goToCheckout = useCallback(async (input: CheckoutParams = { mode: 'cart' }) => {
    if (locked.current) return;
    if (!isAuthenticated) {
      // RootNavigator already switches to Auth when the session is absent.
      alert.error('Login Required', 'Please log in to buy products.', 3000);
      return;
    }
    locked.current = true;
    setIsCheckingOut(true);
    const requestVersion = focusVersion.current;
    const isCurrent = () => mounted.current && requestVersion === focusVersion.current;
    let navigated = false;
    try {
      const params = input.mode === 'buy_now' ? validateBuyNowParams(input) : { mode: 'cart' as const };
      if (params.mode === 'buy_now') {
        __DEV__ && console.log('[BUY NOW] starting preview', params);
        const response = validateBuyNowPreview(await fetchBuyNowCheckout(
          params.product_id!, params.variant_id!, params.qty!, true, undefined, params.campaign_id,
        ));
        if (!isCurrent()) return;
        queryClient.setQueryData(checkoutPreviewQueryKey(params), response);
        __DEV__ && console.log('[BUY NOW] preview ready; navigating to checkout');
      } else {
        void prefetchCheckoutScreenData(params);
      }
      if (!isCurrent()) return;
      navigateToCheckout(navigation, params);
      navigated = true;
    } catch (error: any) {
      if (!isCurrent()) return;
      __DEV__ && console.error('[CHECKOUT] failed', error?.message);
      alert.error('Unable to continue', String(error?.response?.data?.message || error?.message || 'Please try again.'), 3500);
      if (Number(error?.response?.status) === 401) await logout();
    } finally {
      // Keep the tap lock until the screen regains focus after navigation.
      if (isCurrent()) {
        if (!navigated) locked.current = false;
        setIsCheckingOut(false);
      }
    }
  }, [alert, isAuthenticated, logout, navigation, queryClient]);

  return { goToCheckout, isCheckingOut };
}
