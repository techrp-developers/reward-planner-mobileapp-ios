import { useState, useCallback } from 'react';
import { fetchAllCategories } from '../api/ProductApi';
import { fetchBestSellers, fetchMostViewedProducts, fetchTopRatedProducts } from '../api/PromotionalApi';

interface LoadingState {
  homeData: boolean;
  images: boolean;
  categories: boolean;
  bestSellers: boolean;
  topRated: boolean;
  mostViewed: boolean;
}

/**
 * Hook to manage Home screen loading state
 * Tracks when all critical data and images are loaded
 */
export const useHomePageLoading = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    homeData: false,
    images: false,
    categories: false,
    bestSellers: false,
    topRated: false,
    mostViewed: false,
  });

  const [isHomeReady, setIsHomeReady] = useState(false);

  // Check if all critical components are loaded
  const checkIfReadyCallback = useCallback((updates: Partial<LoadingState>) => {
    setLoadingState((prev) => {
      const newState = { ...prev, ...updates };
      // Home is ready when all critical sections are loaded
      const allReady =
        newState.homeData &&
        newState.images &&
        newState.categories &&
        newState.bestSellers &&
        newState.topRated &&
        newState.mostViewed;

      if (allReady && !isHomeReady) {
        // Add small delay to ensure UI is truly ready
        setTimeout(() => setIsHomeReady(true), 300);
      }

      return newState;
    });
  }, [isHomeReady]);

  // Preload critical images
  const preloadImages = useCallback(async () => {
    try {
      // React Native Image component handles caching natively
      // No need for explicit preload
      checkIfReadyCallback({ images: true });
    } catch (error) {
      console.warn('Image load error:', error);
      checkIfReadyCallback({ images: true }); // Continue anyway
    }
  }, [checkIfReadyCallback]);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      await fetchAllCategories();
      checkIfReadyCallback({ categories: true });
    } catch (error) {
      console.warn('Categories load error:', error);
      checkIfReadyCallback({ categories: true }); // Continue anyway
    }
  }, [checkIfReadyCallback]);

  // Load best sellers
  const loadBestSellers = useCallback(async () => {
    try {
      await fetchBestSellers();
      checkIfReadyCallback({ bestSellers: true });
    } catch (error) {
      console.warn('Best sellers load error:', error);
      checkIfReadyCallback({ bestSellers: true }); // Continue anyway
    }
  }, [checkIfReadyCallback]);

  // Load top rated
  const loadTopRated = useCallback(async () => {
    try {
      await fetchTopRatedProducts();
      checkIfReadyCallback({ topRated: true });
    } catch (error) {
      console.warn('Top rated load error:', error);
      checkIfReadyCallback({ topRated: true }); // Continue anyway
    }
  }, [checkIfReadyCallback]);

  // Load most viewed
  const loadMostViewed = useCallback(async () => {
    try {
      await fetchMostViewedProducts();
      checkIfReadyCallback({ mostViewed: true });
    } catch (error) {
      console.warn('Most viewed load error:', error);
      checkIfReadyCallback({ mostViewed: true }); // Continue anyway
    }
  }, [checkIfReadyCallback]);

  // Start preloading all critical data in parallel
  const startPreloading = useCallback(async () => {
    checkIfReadyCallback({ homeData: true });
    
    // Load all in parallel for speed
    await Promise.all([
      preloadImages(),
      loadCategories(),
      loadBestSellers(),
      loadTopRated(),
      loadMostViewed(),
    ]);
  }, [
    checkIfReadyCallback,
    preloadImages,
    loadCategories,
    loadBestSellers,
    loadTopRated,
    loadMostViewed,
  ]);

  return {
    isHomeReady,
    loadingState,
    startPreloading,
    checkIfReadyCallback,
  };
};
