import { QueryClient } from '@tanstack/react-query';
import { isCheckoutQuoteValid, matchesDeliveryQuote, parseDeliveryChoices, isLegacyCheckoutQuoteValid } from '../src/modules/ecommerce/utils/checkoutDelivery';
import { checkoutPreviewQueryKey } from '../src/modules/ecommerce/navigation/navigationPerformance';
jest.mock('../src/modules/ecommerce/api/ProductApi', () => ({}));
jest.mock('../src/modules/ecommerce/api/CartApi', () => ({}));
jest.mock('../src/modules/ecommerce/api/AddressApi', () => ({}));
jest.mock('../src/modules/ecommerce/api/CheckoutApi', () => ({}));

it.each([{}, { data: {} }, { deliveryChoices: null }])('does not invent missing delivery choices', response => {
  expect(parseDeliveryChoices(response)).toEqual([]);
  expect(matchesDeliveryQuote(response, 'cheapest')).toBe(false);
});
it('accepts only available, unique choices with valid server prices', () => {
  expect(parseDeliveryChoices({ data: { deliveryChoices: [
    { preference: 'cheapest', shipping_total: '40' },
    { preference: 'cheapest', shipping_total: 90 },
    { preference: 'fastest', shipping_total: 90, available: false },
    { preference: 'unknown', shipping_total: 1 },
  ] } })).toEqual([expect.objectContaining({ preference: 'cheapest', shipping_total: 40 })]);
});
it.each([null, '', ' ', false, NaN, Infinity, -1])('rejects an invalid shipping quote %s', shipping_total => {
  expect(parseDeliveryChoices({ deliveryChoices: [{ preference: 'cheapest', shipping_total }] })).toEqual([]);
});
it('accepts free delivery only when explicitly quoted as zero', () => {
  expect(matchesDeliveryQuote({ payableAmount: 100, shippingTotal: 0,
    deliveryChoices: [{ preference: 'cheapest', shipping_total: 0 }] }, 'cheapest')).toBe(true);
});
it('rejects a shipping total for a different preference', () => {
  const quote = { payableAmount: 1040, shippingTotal: 40, deliveryChoices: [
    { preference: 'cheapest', shipping_total: 40 }, { preference: 'fastest', shipping_total: 90 },
  ] };
  expect(matchesDeliveryQuote(quote, 'cheapest')).toBe(true);
  expect(matchesDeliveryQuote(quote, 'fastest')).toBe(false);
});
it('separates every preview context without changing cart invalidation prefixes', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  const base = { mode: 'buy_now' as const, product_id: 1, variant_id: 2, qty: 1, campaign_id: 3,
    address_id: 10, content_id: 12, delivery_preference: 'cheapest' as const, use_rewards: true };
  const keys = [base, { ...base, mode: 'cart' as const }, { ...base, product_id: 4 }, { ...base, variant_id: 5 },
    { ...base, qty: 2 }, { ...base, campaign_id: 6 }, { ...base, address_id: 11 },
    { ...base, content_id: 13 }, { ...base, delivery_preference: 'fastest' as const }, { ...base, use_rewards: false }]
    .map(params => checkoutPreviewQueryKey(params));
  expect(new Set(keys.map(key => JSON.stringify(key))).size).toBe(keys.length);
  const cartKey = checkoutPreviewQueryKey({ mode: 'cart', address_id: 10, delivery_preference: 'cheapest' });
  client.setQueryData(cartKey, { shippingTotal: 40 });
  await client.invalidateQueries({ queryKey: checkoutPreviewQueryKey({ mode: 'cart', use_rewards: true }) });
  expect(client.getQueryState(cartKey)?.isInvalidated).toBe(true);
  client.clear();
});

it('accepts the existing default-courier quote without inventing deliveryChoices', () => {
  expect(isLegacyCheckoutQuoteValid({ items: [{ product_id: 1 }], productTotal: 100, shippingTotal: 0, payableAmount: 100 })).toBe(true);
});
it.each([
  { shippingTotal: undefined }, { shippingTotal: -1 }, { payableAmount: NaN },
  { addressRequired: true }, { shippingCalculated: false }, { serviceable: false }, { items: [] },
])('rejects an invalid legacy quote %s', invalid => {
  expect(isLegacyCheckoutQuoteValid({ items: [{ product_id: 1 }], productTotal: 100, shippingTotal: 40, payableAmount: 140, ...invalid })).toBe(false);
});

describe('isCheckoutQuoteValid', () => {
  const base = { items: [{ product_id: 1 }], productTotal: 100 };
  it('falls back to the default-courier quote when the backend returns no choices', () => {
    const legacy = { ...base, shippingTotal: 40, payableAmount: 140 };
    expect(isCheckoutQuoteValid(legacy, 'cheapest')).toBe(true);
    expect(isCheckoutQuoteValid(legacy, 'fastest')).toBe(false);
  });
  it('requires the selected choice to match the quoted totals', () => {
    const deliveryChoices = [
      { preference: 'cheapest', shipping_total: 40, payable_amount: 140, delivery_days: 5 },
      { preference: 'fastest', shipping_total: 90, payable_amount: 190, delivery_days: 2 },
    ];
    expect(isCheckoutQuoteValid({ ...base, shippingTotal: 90, payableAmount: 190, deliveryChoices }, 'fastest')).toBe(true);
    expect(isCheckoutQuoteValid({ ...base, shippingTotal: 90, payableAmount: 190, deliveryChoices }, 'cheapest')).toBe(false);
    expect(isCheckoutQuoteValid({ ...base, shippingTotal: 40, payableAmount: 140, deliveryChoices: deliveryChoices.slice(0, 1) }, 'fastest')).toBe(false);
  });
});
