const FULL_SCREEN_SUPPORT_ROUTES = new Set(['HelpForm', 'MyTickets']);

const FULL_SCREEN_SHOPPING_ROUTES = new Set([
  'ProductDescription', 'ProductDetails', 'Cart', 'WithAddress',
  'OrderStepUI', 'Checkout', 'AddressSelect', 'AddAddressMap', 'AddressDetails',
  'OrderConfirm', 'OrderConfirmedScreen', 'OrderReceipt',
]);

// Cart, checkout and multi-step insurance flows own their bottom actions.
const FULL_SCREEN_SERVICES_ROUTES = new Set([
  'CartScreen', 'ServiceCheckoutScreen',
  'Health', 'SuperTopUp', 'PersonalAccident',
]);

export function shouldShowBottomTabs(activeMode: string, routeChain: string[]): boolean {
  if (routeChain.some(name => FULL_SCREEN_SUPPORT_ROUTES.has(name))) return false;
  if (activeMode === 'DineOut') return false;
  if (activeMode === 'Services')
    return !routeChain.some(name => FULL_SCREEN_SERVICES_ROUTES.has(name));
  if (activeMode !== 'Product') return true;
  return !routeChain.some(name => FULL_SCREEN_SHOPPING_ROUTES.has(name));
}
