const FULL_SCREEN_SHOPPING_ROUTES = new Set([
  'ProductDescription', 'ProductDetails', 'Cart', 'WithAddress',
  'OrderStepUI', 'Checkout', 'AddressSelect', 'AddAddressMap', 'AddressDetails',
  'OrderConfirm', 'OrderConfirmedScreen', 'OrderReceipt',
]);

export function shouldShowBottomTabs(activeMode: string, routeChain: string[]): boolean {
  if (activeMode === 'DineOut') return false;
  if (activeMode !== 'Product') return true;
  return !routeChain.some(name => FULL_SCREEN_SHOPPING_ROUTES.has(name));
}
