import { useQuery } from '@tanstack/react-query';
import { getCheckoutPreview, getServiceCartItems } from '../api/CartAPI';
import { SERVICE_CART_QUERY_KEY } from '../constant/queryKeys';
import { useAuth } from '../../common/auth/context/AuthContext';

type ServiceCartCounts = {
  bundles: number;
  individual_items: number;
};

const THIRTY_SECONDS = 30 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

// checkout-preview is the endpoint CartScreen relies on as its primary
// source — the dedicated /service-cart/* endpoints are flaky/404 in this
// backend, so going straight to those on every mount made the badge slow
// to update (or stuck at 0) right after navigating to a new screen.
async function fetchServiceCartCounts(): Promise<ServiceCartCounts> {
  try {
    const preview = await getCheckoutPreview();
    const data = preview?.data ?? preview;
    const bundles = Array.isArray(data?.bundles) ? data.bundles.length : 0;
    const individualItems = Array.isArray(data?.individual_items) ? data.individual_items.length : 0;
    return { bundles, individual_items: individualItems };
  } catch {
    const fallback = await getServiceCartItems();
    return {
      bundles: Array.isArray(fallback?.bundles) ? fallback.bundles.length : 0,
      individual_items: Array.isArray(fallback?.individual_items) ? fallback.individual_items.length : 0,
    };
  }
}

/**
 * Item count for the services-module cart only.
 * Kept separate from the ecommerce CartContext so the services cart badge
 * never reflects products added in the ecommerce module (and vice versa).
 */
export function useServiceCartCount(enabled = true): number {
  const { isAuthenticated } = useAuth();

  const { data } = useQuery({
    // A dedicated sub-key (not the bare SERVICE_CART_QUERY_KEY) so this
    // hook's {bundles, individual_items} *counts* never collide in the
    // cache with CartScreen's own raw cart-items *arrays* stored under the
    // exact same key. invalidateQueries({ queryKey: SERVICE_CART_QUERY_KEY })
    // still matches this key by prefix, so add/remove actions elsewhere
    // continue to trigger a refetch here too.
    queryKey: [...SERVICE_CART_QUERY_KEY, 'count'],
    queryFn: fetchServiceCartCounts,
    enabled: isAuthenticated && enabled,
    staleTime: THIRTY_SECONDS,
    gcTime: THIRTY_MINUTES,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return (data?.bundles ?? 0) + (data?.individual_items ?? 0);
}
