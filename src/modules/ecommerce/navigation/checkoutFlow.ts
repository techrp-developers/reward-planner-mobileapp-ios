import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../../navigation/RootNavigator';
import type { HomeStackParamList } from './types';

export type ShoppingNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  NativeStackNavigationProp<AppStackParamList>
>;
export type CheckoutParams = HomeStackParamList['OrderStepUI'];

export function navigateToCheckout(navigation: ShoppingNavigation, params: CheckoutParams) {
  if (navigation.getState().routeNames.includes('OrderStepUI')) {
    navigation.navigate('OrderStepUI', params);
  } else {
    navigation.navigate('Checkout', params);
  }
}

export function validateBuyNowParams(params: CheckoutParams): CheckoutParams {
  const product_id = Number(params.product_id);
  const variant_id = Number(params.variant_id);
  const qty = Number(params.qty ?? 1);
  if (![product_id, variant_id, qty].every(value => Number.isInteger(value) && value > 0)) {
    throw new Error('Please select a valid product option and quantity.');
  }
  return { ...params, mode: 'buy_now', product_id, variant_id, qty };
}

export function validateBuyNowPreview(response: any) {
  const data = response?.data ?? response;
  const items = Array.isArray(response?.items) && response.items.length > 0
    ? response.items : data?.items;
  if (response?.success === false || data?.success === false ||
      !(Array.isArray(items) && items.length > 0) && !response?.item && !data?.item) {
    throw new Error(response?.message || data?.message || 'This product is currently unavailable for checkout.');
  }
  return response;
}
