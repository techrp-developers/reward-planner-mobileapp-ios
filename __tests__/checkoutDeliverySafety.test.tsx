import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Animated, InteractionManager } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OrderStepUI from '../src/modules/ecommerce/components/checkout/OrderStepUI';
import { fetchCheckoutCart, fetchBuyNowCheckout, addCartOrder, addBuyNowOrder } from '../src/modules/ecommerce/api/CheckoutApi';
import { addressesQueryKey, cartItemsQueryKey } from '../src/modules/ecommerce/navigation/navigationPerformance';
import { fetchAllAddress } from '../src/modules/ecommerce/api/AddressApi';
import { updateCartQty } from '../src/modules/ecommerce/api/CartApi';
import { createPaymentOrder } from '../src/modules/ecommerce/api/Payment';
import RazorpayCheckout from 'react-native-razorpay';
import DeliveryOptions from '../src/modules/ecommerce/components/checkout/DeliveryOptions';
let mockParams: any = { mode: 'cart' };
const mockRefreshCart = jest.fn(async () => {});
const mockAlert = { info: jest.fn(), warning: jest.fn(), error: jest.fn() };
const mockNavigation = { goBack: jest.fn(), navigate: jest.fn(), addListener: () => () => {}, getState: () => ({ index: 1 }), dispatch: jest.fn() };
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation, useRoute: () => ({ params: mockParams }),
  useFocusEffect: (callback: () => void) => require('react').useEffect(callback, [callback]),
  StackActions: { pop: jest.fn(), replace: jest.fn() }, CommonActions: { reset: jest.fn() },
}));
jest.mock('../src/modules/common/auth/context/AuthContext', () => ({ useAuth: () => ({ isAuthenticated: true, user: {}, logout: jest.fn() }) }));
jest.mock('../src/modules/ecommerce/context/CartContext', () => ({ useCart: () => ({ removeItem: jest.fn(), refresh: mockRefreshCart }) }));
jest.mock('../src/modules/ecommerce/components/alerts/useAlert', () => ({ useAlert: () => mockAlert }));
jest.mock('../src/theme/ThemeContext', () => ({ useAppTheme: () => ({ isDark: false, theme: require('../src/theme/colors').LightTheme }) }));
jest.mock('../src/bottombar/hooks/useStickyBottomCTA', () => ({ useStickyBottomCTA: () => ({ bottomOffset: 0, scrollContentPaddingBottom: 100, onCtaLayout: jest.fn() }) }));
jest.mock('../src/modules/ecommerce/api/CheckoutApi', () => ({ fetchCheckoutCart: jest.fn(), fetchBuyNowCheckout: jest.fn(), addCartOrder: jest.fn(), addBuyNowOrder: jest.fn() }));
jest.mock('../src/modules/ecommerce/api/AddressApi', () => ({ fetchAllAddress: jest.fn() }));
jest.mock('../src/modules/ecommerce/api/CartApi', () => ({ fetchCartItems: jest.fn(), addToCart: jest.fn(), deleteAllCartItems: jest.fn(), updateCartQty: jest.fn() }));
jest.mock('../src/modules/ecommerce/api/ProductApi', () => ({}));
jest.mock('../src/modules/ecommerce/api/Payment', () => ({ createPaymentOrder: jest.fn(), verifyPayment: jest.fn(), checkPaymentStatus: jest.fn(), cancelPendingPaymentOrder: jest.fn() }));
jest.mock('react-native-razorpay', () => ({ open: jest.fn() }));
jest.mock('react-native-linear-gradient', () => 'Gradient');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('../src/modules/ecommerce/constants/heading/Poduct_Head_Color', () => 'Header');
jest.mock('../src/modules/ecommerce/constants/itemcart/BillDetailsCard', () => 'Bill');
jest.mock('../src/modules/ecommerce/components/home/productgrid', () => 'Products');
jest.mock('../src/modules/ecommerce/components/checkout/OrderProcedbutton', () => 'Proceed');
jest.mock('../src/modules/ecommerce/components/checkout/CheckoutItemCart', () => 'Item');
jest.mock('../src/modules/ecommerce/components/cart/EmptyCart', () => 'Empty');
jest.mock('../src/modules/ecommerce/components/Promotion/RecommendedProducts', () => 'Recommended');
jest.mock('../src/modules/services/component/constant/SkeletonBox', () => 'Skeleton');
let renderer: ReactTestRenderer;
let client: QueryClient;
const quote = { items: [{ product_id: 1, variant_id: 2, quantity: 1, cart_item_id: 3 }], productTotal: 100,
  shippingTotal: 40, payableAmount: 125, reward: { redeemCoins: 15, earnCoins: 2 } };
const flush = async () => { for (let i = 0; i < 5; i++) await act(async () => { jest.advanceTimersByTime(10); }); };
beforeEach(() => {
  jest.useFakeTimers(); jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(Animated, 'loop').mockReturnValue({ start: jest.fn(), stop: jest.fn() } as any);
  jest.spyOn(InteractionManager, 'runAfterInteractions').mockReturnValue({ cancel: jest.fn() } as any);
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  mockParams = { mode: 'cart' };
  jest.mocked(fetchAllAddress).mockResolvedValue({ data: [{ address_id: 10, is_default: 1, address1: 'Road', zipcode: '400001' }] });
  jest.mocked(fetchCheckoutCart).mockResolvedValue(quote);
  jest.mocked(fetchBuyNowCheckout).mockResolvedValue(quote);
});
afterEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
  client.clear(); jest.restoreAllMocks(); jest.useRealTimers();
});
const mount = async () => {
  await act(async () => { renderer = create(<QueryClientProvider client={client}><OrderStepUI /></QueryClientProvider>); });
  await flush();
};
it.each(['cart', 'buy_now'])('prevents order and Razorpay calls for an incomplete %s server quote', async mode => {
  jest.mocked(fetchCheckoutCart).mockResolvedValue({ ...quote, shippingTotal: undefined });
  jest.mocked(fetchBuyNowCheckout).mockResolvedValue({ ...quote, shippingTotal: undefined });
  mockParams = { mode, product_id: 1, variant_id: 2, qty: 1, campaign_id: 7 };
  await mount();
  const proceed = renderer.root.findByType('Proceed' as any);
  expect(proceed.props.disabled).toBe(true);
  await act(async () => proceed.props.onPlaceOrder());
  expect(addCartOrder).not.toHaveBeenCalled();
  expect(addBuyNowOrder).not.toHaveBeenCalled();
  expect(RazorpayCheckout.open).not.toHaveBeenCalled();
  if (mode === 'cart') expect(fetchCheckoutCart).toHaveBeenCalledWith(true, 10, 'cheapest');
  else expect(fetchBuyNowCheckout).toHaveBeenCalledWith(1, 2, 1, true, 10, 7, undefined, 'cheapest');
});
it('refreshes the quote for a new address without reusing the old total', async () => {
  await mount();
  let finish!: (value: any) => void;
  jest.mocked(fetchCheckoutCart).mockReturnValue(new Promise(resolve => { finish = resolve; }));
  await act(async () => client.setQueryData(addressesQueryKey, { data: [{ address_id: 20, is_default: 1 }] }));
  await flush();
  expect(fetchCheckoutCart).toHaveBeenLastCalledWith(true, 20, 'cheapest');
  expect(renderer.root.findAllByType('Proceed' as any)).toHaveLength(0);
  await act(async () => finish({ ...quote, shippingTotal: 90, payableAmount: 175 }));
  await flush();
  expect(renderer.root.findByType('Bill' as any).props.shippingCharges).toBe(90);
  expect(renderer.root.findByType('Proceed' as any).props.total).toBe(175);
});
it('recalculates rewards without keeping the old payable amount on screen', async () => {
  await mount();
  await act(async () => renderer.root.findByType('Bill' as any).props.onUseRewardsChange(false));
  await flush();
  expect(fetchCheckoutCart).toHaveBeenLastCalledWith(false, 10, 'cheapest');
  expect(renderer.root.findByType('Proceed' as any).props.disabled).toBe(false);
});

it('preserves multiple cart products and quantities in the quote', async () => {
  jest.mocked(fetchCheckoutCart).mockResolvedValue({ ...quote, items: [
    ...quote.items, { product_id: 8, variant_id: 9, quantity: 3, cart_item_id: 4 },
  ] });
  await mount();
  expect(renderer.root.findAllByType('Item' as any)).toHaveLength(2);
  expect(renderer.root.findByType('Proceed' as any).props.count).toBe(4);
  expect(fetchBuyNowCheckout).not.toHaveBeenCalled();
});
it('preserves campaign and content context in Buy Now', async () => {
  mockParams = { mode: 'buy_now', product_id: 1, variant_id: 2, qty: 1, campaign_id: 7, content_id: 12 };
  await mount();
  expect(fetchBuyNowCheckout).toHaveBeenCalledWith(1, 2, 1, true, 10, 7, 12, 'cheapest');
});
it('blocks order placement during a quantity mutation', async () => {
  await mount();
  let finish!: () => void;
  jest.mocked(updateCartQty).mockReturnValue(new Promise(resolve => { finish = () => resolve(undefined); }));
  let update!: Promise<void>;
  await act(async () => { update = renderer.root.findByType('Item' as any).props.onIncrease(); });
  expect(renderer.root.findByType('Proceed' as any).props.loading).toBe(true);
  await act(async () => renderer.root.findByType('Proceed' as any).props.onPlaceOrder());
  expect(addCartOrder).not.toHaveBeenCalled();
  await act(async () => { finish(); });
  await flush();
  await update;
});
it('does not leave an order button available after a preview error', async () => {
  jest.mocked(fetchCheckoutCart).mockRejectedValue({ response: { status: 400, data: { message: 'NOT_SERVICEABLE' } } });
  await mount();
  expect(renderer.root.findAllByType('Proceed' as any)).toHaveLength(0);
  expect(addCartOrder).not.toHaveBeenCalled();
});

it.each(['cart', 'buy_now'])('allows the existing %s checkout with a valid server quote without sending a delivery preference', async mode => {
  mockParams = { mode, product_id: 1, variant_id: 2, qty: 1, campaign_id: 7 };
  jest.mocked(addCartOrder).mockResolvedValue({ success: true, order_id: 44 });
  jest.mocked(addBuyNowOrder).mockResolvedValue({ success: true, order_id: 44 });
  jest.mocked(createPaymentOrder).mockResolvedValue({ key: 'test-key', orderId: 'razorpay-order', amount: 12500, currency: 'INR' });
  jest.mocked(RazorpayCheckout.open).mockReturnValue(new Promise(() => {}));
  await mount();
  const button = renderer.root.findByType('Proceed' as any);
  expect(button.props.disabled).toBe(false);
  await act(async () => button.props.onPlaceOrder());
  const order = mode === 'cart' ? jest.mocked(addCartOrder) : jest.mocked(addBuyNowOrder);
  expect(order).toHaveBeenCalledWith(expect.objectContaining({ address_id: 10, expected_total: 125, expected_redeemable: 15, use_rewards: true }));
  expect(order.mock.calls[0][0]).not.toHaveProperty('delivery_preference');
  expect(RazorpayCheckout.open).toHaveBeenCalledWith(expect.objectContaining({ amount: 12500, order_id: 'razorpay-order' }));
});
it('requires review instead of ordering when the latest server price changes', async () => {
  await mount();
  jest.mocked(fetchCheckoutCart).mockResolvedValue({ ...quote, payableAmount: 130 });
  await act(async () => renderer.root.findByType('Proceed' as any).props.onPlaceOrder());
  expect(addCartOrder).not.toHaveBeenCalled();
  expect(RazorpayCheckout.open).not.toHaveBeenCalled();
  expect(mockAlert.warning).toHaveBeenCalled();
});
it.each(['cart', 'buy_now'])('reprices %s checkout for Quick Delivery and orders with the server total', async mode => {
  mockParams = { mode, product_id: 1, variant_id: 2, qty: 1, campaign_id: 7 };
  const deliveryChoices = [
    { preference: 'cheapest', label: 'Standard delivery', shipping_total: 40, payable_amount: 125, delivery_days: 5 },
    { preference: 'fastest', label: 'Fastest delivery', shipping_total: 90, payable_amount: 175, delivery_days: 2 },
  ];
  const quoteFor = async (preference?: string) => preference === 'fastest'
    ? { ...quote, shippingTotal: 90, payableAmount: 175, deliveryChoices }
    : { ...quote, deliveryChoices };
  jest.mocked(fetchCheckoutCart).mockImplementation((_r, _a, preference) => quoteFor(preference));
  jest.mocked(fetchBuyNowCheckout).mockImplementation((...args: any[]) => quoteFor(args[7]));
  jest.mocked(addCartOrder).mockResolvedValue({ success: true, order_id: 44 });
  jest.mocked(addBuyNowOrder).mockResolvedValue({ success: true, order_id: 44 });
  jest.mocked(createPaymentOrder).mockResolvedValue({ key: 'test-key', orderId: 'razorpay-order', amount: 17500, currency: 'INR' });
  jest.mocked(RazorpayCheckout.open).mockReturnValue(new Promise(() => {}));
  await mount();
  const options = renderer.root.findByType(DeliveryOptions);
  expect(options.props.choices.map((choice: any) => choice.preference)).toEqual(['cheapest', 'fastest']);
  expect(renderer.root.findByType('Proceed' as any).props.total).toBe(125);
  await act(async () => options.props.onSelect('fastest'));
  await flush();
  const button = renderer.root.findByType('Proceed' as any);
  expect(button.props.total).toBe(175);
  expect(button.props.disabled).toBe(false);
  await act(async () => button.props.onPlaceOrder());
  const order = mode === 'cart' ? jest.mocked(addCartOrder) : jest.mocked(addBuyNowOrder);
  expect(order).toHaveBeenCalledWith(expect.objectContaining({ delivery_preference: 'fastest', expected_total: 175 }));
  expect(RazorpayCheckout.open).toHaveBeenCalledWith(expect.objectContaining({ amount: 17500 }));
});
it('falls back to Standard Delivery when Quick Delivery is not offered', async () => {
  const deliveryChoices = [{ preference: 'cheapest', shipping_total: 40, payable_amount: 125, delivery_days: 5 }];
  jest.mocked(fetchCheckoutCart).mockResolvedValue({ ...quote, deliveryChoices });
  await mount();
  expect(renderer.root.findByType(DeliveryOptions).props.choices).toHaveLength(1);
  expect(renderer.root.findByType(DeliveryOptions).props.preference).toBe('cheapest');
  expect(renderer.root.findByType('Proceed' as any).props.disabled).toBe(false);
});
it('empties the shared cart cache once the server has created a cart order, even before payment is verified', async () => {
  client.setQueryData(cartItemsQueryKey, { items: [{ cart_item_id: 3, product_id: 1, variant_id: 2, quantity: 1 }] });
  jest.mocked(addCartOrder).mockResolvedValue({ success: true, order_id: 44 });
  jest.mocked(createPaymentOrder).mockResolvedValue({ key: 'test-key', orderId: 'razorpay-order', amount: 12500, currency: 'INR' });
  jest.mocked(RazorpayCheckout.open).mockReturnValue(new Promise(() => {}));
  await mount();
  await act(async () => renderer.root.findByType('Proceed' as any).props.onPlaceOrder());
  expect(client.getQueryData(cartItemsQueryKey)).toEqual({ items: [] });
  expect(renderer.root.findAllByType('Empty' as any)).toHaveLength(0);
});
it('leaves the cart cache alone for Buy Now', async () => {
  mockParams = { mode: 'buy_now', product_id: 1, variant_id: 2, qty: 1 };
  const cart = { items: [{ cart_item_id: 3, product_id: 5, variant_id: 6, quantity: 1 }] };
  client.setQueryData(cartItemsQueryKey, cart);
  jest.mocked(addBuyNowOrder).mockResolvedValue({ success: true, order_id: 44 });
  jest.mocked(createPaymentOrder).mockResolvedValue({ key: 'test-key', orderId: 'razorpay-order', amount: 12500, currency: 'INR' });
  jest.mocked(RazorpayCheckout.open).mockReturnValue(new Promise(() => {}));
  await mount();
  await act(async () => renderer.root.findByType('Proceed' as any).props.onPlaceOrder());
  expect(client.getQueryData(cartItemsQueryKey)).toEqual(cart);
});
