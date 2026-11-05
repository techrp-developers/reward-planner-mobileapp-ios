import api from '../src/modules/common/auth/api/axios';
import { fetchCheckoutCart, fetchBuyNowCheckout, addCartOrder, addBuyNowOrder } from '../src/modules/ecommerce/api/CheckoutApi';
jest.mock('../src/modules/common/auth/api/axios', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
beforeEach(() => { jest.clearAllMocks(); jest.mocked(api.get).mockResolvedValue({ data: {} }); jest.mocked(api.post).mockResolvedValue({ data: {} }); });
it('omits delivery_preference when no preference is given', async () => {
  await fetchCheckoutCart(false, 10);
  expect(api.get).toHaveBeenCalledWith('/v1/checkout/get-cart', { params: { use_rewards: false, address_id: 10 } });
});
it('preserves product, campaign and content fields supported by the inspected backend', async () => {
  await fetchBuyNowCheckout(1, 2, 3, false, 10, 7, 12);
  expect(api.get).toHaveBeenCalledWith('/v1/checkout/get-buy-now', { params: {
    product_id: 1, variant_id: 2, qty: 3, use_rewards: false, address_id: 10, campaign_id: 7, content_id: 12,
  } });
});
it.each(['cheapest', 'fastest'] as const)('sends %s as delivery_preference on preview and order', async preference => {
  await fetchCheckoutCart(true, 10, preference);
  expect(api.get).toHaveBeenCalledWith('/v1/checkout/get-cart', { params: { use_rewards: true, address_id: 10, delivery_preference: preference } });
  await fetchBuyNowCheckout(1, 2, 1, true, 10, 7, 12, preference);
  expect(api.get).toHaveBeenCalledWith('/v1/checkout/get-buy-now', { params: {
    product_id: 1, variant_id: 2, qty: 1, use_rewards: true, address_id: 10, campaign_id: 7, content_id: 12, delivery_preference: preference,
  } });
  const payload = { address_id: 10, expected_total: 125, expected_redeemable: 15, use_rewards: true, delivery_preference: preference };
  await addCartOrder(payload);
  expect(api.post).toHaveBeenCalledWith('/v1/checkout/cart', payload);
  const buyNow = { ...payload, product_id: 1, variant_id: 2, quantity: 1 };
  await addBuyNowOrder(buyNow);
  expect(api.post).toHaveBeenCalledWith('/v1/checkout/buy-now', buyNow);
});
it('forwards existing final-order totals and reward fields unchanged', async () => {
  const payload = { address_id: 10, expected_total: 125, expected_redeemable: 15, use_rewards: true };
  await addCartOrder(payload);
  expect(api.post).toHaveBeenCalledWith('/v1/checkout/cart', payload);
});
