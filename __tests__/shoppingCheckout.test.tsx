import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TouchableOpacity } from 'react-native';
import CheckoutSummary from '../src/modules/ecommerce/components/ItemCardAddress/CheckoutSummary';
import { useCheckoutFlow } from '../src/modules/ecommerce/hooks/useCheckoutFlow';
import { fetchBuyNowCheckout } from '../src/modules/ecommerce/api/CheckoutApi';
import { checkoutPreviewQueryKey, prefetchCheckoutScreenData } from '../src/modules/ecommerce/navigation/navigationPerformance';
import { formatCurrency } from '../src/modules/ecommerce/utils/formatCurrency';

const mockNavigation = { navigate: jest.fn(), getState: jest.fn() };
const mockAlert = { error: jest.fn() };
const mockLogout = jest.fn().mockResolvedValue(undefined);
let mockAuthenticated = true;
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useFocusEffect: (callback: () => void) => require('react').useEffect(callback, [callback]),
}));
jest.mock('../src/modules/common/auth/context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: mockAuthenticated, logout: mockLogout }),
}));
jest.mock('../src/modules/ecommerce/components/alerts', () => ({ useAlert: () => mockAlert }));
jest.mock('../src/modules/ecommerce/api/CheckoutApi', () => ({ fetchBuyNowCheckout: jest.fn() }));
jest.mock('../src/modules/ecommerce/api/ProductApi', () => ({}));
jest.mock('../src/modules/ecommerce/api/CartApi', () => ({}));
jest.mock('../src/modules/ecommerce/api/AddressApi', () => ({}));
jest.mock('../src/modules/ecommerce/navigation/navigationPerformance', () => ({
  ...jest.requireActual('../src/modules/ecommerce/navigation/navigationPerformance'),
  prefetchCheckoutScreenData: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-linear-gradient', () => 'Gradient');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('../src/theme/ThemeContext', () => ({ useAppTheme: () => ({ theme: {} }) }));
jest.mock('../src/bottombar/hooks/useStickyBottomCTA', () => ({
  useStickyBottomCTA: () => ({ bottomOffset: 34, onCtaLayout: jest.fn() }),
}));

let renderer: ReactTestRenderer;
let client: QueryClient;
let flow: ReturnType<typeof useCheckoutFlow>;
const params = { mode: 'buy_now' as const, product_id: 1302, variant_id: 1491, qty: 1 };
const preview = { items: [{ product_id: 1302, variant_id: 1491, quantity: 1 }], payableAmount: 949 };
function Screen() { flow = useCheckoutFlow(); return null; }

beforeEach(async () => {
  jest.clearAllMocks();
  mockAuthenticated = true;
  mockNavigation.getState.mockReturnValue({ routeNames: ['Home', 'ProductDescription', 'OrderStepUI'] });
  (fetchBuyNowCheckout as jest.Mock).mockResolvedValue(preview);
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  await act(async () => { renderer = create(<QueryClientProvider client={client}><Screen /></QueryClientProvider>); });
});
afterEach(async () => {
  await act(async () => renderer.unmount());
  client.clear();
  jest.restoreAllMocks();
});

it.each([
  [7789.280000000001, '₹7,789.28'], [730.7199999999998, '₹730.72'],
  [3114.28, '₹3,114.28'], [949, '₹949'], [949.5, '₹949.50'], [NaN, '₹0'],
])('formats %s as %s', (value, expected) => expect(formatCurrency(value)).toBe(expected));

it.each(['OrderStepUI', 'Checkout'])('awaits preview then opens registered %s route', async destination => {
  mockNavigation.getState.mockReturnValue({ routeNames: [destination] });
  let resolve!: (value: unknown) => void;
  (fetchBuyNowCheckout as jest.Mock).mockReturnValue(new Promise(done => { resolve = done; }));
  let pending!: Promise<void>;
  await act(async () => { pending = flow.goToCheckout(params); });
  expect(flow.isCheckingOut).toBe(true);
  expect(mockNavigation.navigate).not.toHaveBeenCalled();
  await act(async () => { await flow.goToCheckout(params); });
  expect(fetchBuyNowCheckout).toHaveBeenCalledTimes(1);
  await act(async () => { resolve(preview); await pending; });
  expect(fetchBuyNowCheckout).toHaveBeenCalledWith(1302, 1491, 1, true, undefined, undefined);
  expect(client.getQueryData(checkoutPreviewQueryKey(params))).toEqual(preview);
  expect(mockNavigation.navigate).toHaveBeenCalledWith(destination, params);
  await act(async () => { await flow.goToCheckout(params); });
  expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
});

it('passes the selected cart item quantity and campaign unchanged', async () => {
  const selected = { ...params, product_id: 22, variant_id: 33, qty: 4, campaign_id: 7 };
  await act(async () => { await flow.goToCheckout(selected); });
  expect(fetchBuyNowCheckout).toHaveBeenCalledWith(22, 33, 4, true, undefined, 7);
  expect(mockNavigation.navigate).toHaveBeenCalledWith('OrderStepUI', selected);
});

it('keeps Proceed To Buy in multi-item cart mode', async () => {
  await act(async () => { await flow.goToCheckout(); });
  expect(fetchBuyNowCheckout).not.toHaveBeenCalled();
  expect(prefetchCheckoutScreenData).toHaveBeenCalledWith({ mode: 'cart' });
  expect(mockNavigation.navigate).toHaveBeenCalledWith('OrderStepUI', { mode: 'cart' });
});

it.each([{ items: [] }, { success: false, message: 'Out of stock' }])('rejects unavailable previews and allows retry', async response => {
  (fetchBuyNowCheckout as jest.Mock).mockResolvedValueOnce(response);
  await act(async () => { await flow.goToCheckout(params); });
  expect(mockNavigation.navigate).not.toHaveBeenCalled();
  expect(mockAlert.error).toHaveBeenCalled();
  expect(flow.isCheckingOut).toBe(false);
  await act(async () => { await flow.goToCheckout(params); });
  expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
});

it('reports API failure and clears the loading state', async () => {
  (fetchBuyNowCheckout as jest.Mock).mockRejectedValueOnce(new Error('Network unavailable'));
  await act(async () => { await flow.goToCheckout(params); });
  expect(mockAlert.error).toHaveBeenCalledWith('Unable to continue', 'Network unavailable', 3500);
  expect(flow.isCheckingOut).toBe(false);
  expect(mockNavigation.navigate).not.toHaveBeenCalled();
});

it('uses existing session logout on an unauthorized preview', async () => {
  (fetchBuyNowCheckout as jest.Mock).mockRejectedValueOnce({ response: { status: 401 } });
  await act(async () => { await flow.goToCheckout(params); });
  expect(mockLogout).toHaveBeenCalledTimes(1);
  expect(mockNavigation.navigate).not.toHaveBeenCalled();
});

it('does not request checkout while logged out', async () => {
  mockAuthenticated = false;
  await act(async () => renderer.update(<QueryClientProvider client={client}><Screen /></QueryClientProvider>));
  await act(async () => { await flow.goToCheckout(params); });
  expect(fetchBuyNowCheckout).not.toHaveBeenCalled();
  expect(mockAlert.error).toHaveBeenCalledWith('Login Required', expect.any(String), 3000);
});

it('rejects invalid IDs and quantity before the request', async () => {
  await act(async () => { await flow.goToCheckout({ ...params, qty: Infinity }); });
  expect(fetchBuyNowCheckout).not.toHaveBeenCalled();
  expect(mockNavigation.navigate).not.toHaveBeenCalled();
});

it('pressing the actual Proceed To Buy footer navigates to cart checkout', async () => {
  function CartFooter() {
    const { goToCheckout, isCheckingOut } = useCheckoutFlow();
    return <CheckoutSummary address={null} total={7789.28} count={4}
      loading={isCheckingOut} onProceedToBuy={() => goToCheckout()} />;
  }
  await act(async () => renderer.update(<QueryClientProvider client={client}><CartFooter /></QueryClientProvider>));
  const proceed = renderer.root.findAllByType(TouchableOpacity).find(button => button.props.disabled === false)!;
  expect(proceed).toBeDefined();
  await act(async () => { await proceed.props.onPress(); });
  expect(mockNavigation.navigate).toHaveBeenCalledWith('OrderStepUI', { mode: 'cart' });
});
