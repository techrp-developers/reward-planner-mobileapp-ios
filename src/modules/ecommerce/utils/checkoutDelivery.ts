// Mirrors the backend courierPolicy.buildDeliveryChoices() entries. Callers must
// not infer availability from a label or price.
export type DeliveryPreference = 'cheapest' | 'fastest';
export type DeliveryChoice = {
  preference: DeliveryPreference;
  shipping_total: number;
  label?: string;
  payable_amount?: number;
  delivery_days?: number;
  estimated_delivery_date?: string;
  partner_name?: string;
  service_type?: string;
};

const validAmount = (value: unknown): boolean =>
  (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) &&
  Number.isFinite(Number(value)) && Number(value) >= 0;

export function parseDeliveryChoices(response: any): DeliveryChoice[] {
  const raw = response?.data?.deliveryChoices ?? response?.deliveryChoices;
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw.flatMap((value: any) => {
    if (!value || !['cheapest', 'fastest'].includes(value.preference) || seen.has(value.preference)) return [];
    if ([false, 0, '0', 'false'].includes(value.available) ||
        [false, 0, '0', 'false'].includes(value.is_available)) return [];
    if (!validAmount(value.shipping_total)) return [];
    seen.add(value.preference);
    const text = (field: unknown) => typeof field === 'string' && field.trim() ? field : undefined;
    const days = Number(value.delivery_days);
    return [{
      preference: value.preference, shipping_total: Number(value.shipping_total),
      payable_amount: validAmount(value.payable_amount) ? Number(value.payable_amount) : undefined,
      label: text(value.label), partner_name: text(value.partner_name), service_type: text(value.service_type),
      estimated_delivery_date: text(value.estimated_delivery_date),
      delivery_days: Number.isFinite(days) && days > 0 ? days : undefined,
    } as DeliveryChoice];
  });
}

export function matchesDeliveryQuote(response: any, preference: DeliveryPreference): boolean {
  const data = response?.data ?? response;
  const choice = parseDeliveryChoices(response).find(option => option.preference === preference);
  const totals = data?.summary ?? data;
  const amount = totals?.payableAmount;
  const shipping = totals?.shippingTotal;
  return !!choice && validAmount(amount) && validAmount(shipping) &&
    (choice.payable_amount === undefined || Math.round(Number(amount) * 100) === Math.round(choice.payable_amount * 100)) &&
    Math.round(Number(shipping) * 100) === Math.round(choice.shipping_total * 100);
}

// The existing checkout API already quotes its default courier and validates
// expected_total again at order creation. Optional preference selection is a
// separate capability and must not disable that established checkout flow.
export function isLegacyCheckoutQuoteValid(response: any): boolean {
  const data = response?.data ?? response;
  const items = data?.items ?? response?.items ?? (data?.item ? [data.item] : []);
  return response?.success !== false && data?.success !== false &&
    data?.addressRequired !== true && data?.shippingCalculated !== false &&
    data?.serviceable !== false && Array.isArray(items) && items.length > 0 &&
    validAmount(data?.productTotal) && validAmount(data?.shippingTotal) && validAmount(data?.payableAmount);
}

// Backends with courier selection return deliveryChoices and honour
// delivery_preference; older ones return neither and quote one default courier.
// So selection is offered only when this preview actually returned choices.
export function isCheckoutQuoteValid(response: any, preference: DeliveryPreference): boolean {
  return parseDeliveryChoices(response).length > 0
    ? matchesDeliveryQuote(response, preference)
    : preference === 'cheapest' && isLegacyCheckoutQuoteValid(response);
}
