const FULL_SCREEN_SHOPPING_ROUTES = new Set([
  'ProductDescription', 'ProductDetails', 'Cart', 'WithAddress',
  'OrderStepUI', 'Checkout', 'AddressSelect', 'AddAddressMap', 'AddressDetails',
  'OrderConfirm', 'OrderConfirmedScreen', 'OrderReceipt',
]);

// Multi-step insurance flows have their own bottom Continue button.
const FULL_SCREEN_SERVICES_ROUTES = new Set([
  'Health', 'SuperTopUp', 'PersonalAccident',
]);

export function shouldShowBottomTabs(activeMode: string, routeChain: string[]): boolean {
  if (activeMode === 'DineOut') return false;
  if (activeMode === 'Services')
    return !routeChain.some(name => FULL_SCREEN_SERVICES_ROUTES.has(name));
  if (activeMode !== 'Product') return true;
  return !routeChain.some(name => FULL_SCREEN_SHOPPING_ROUTES.has(name));
}
