import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSearchSuggestions, type SearchData } from '../api/GlobalSearchAPI';

const DEBOUNCE_MS = 150;
const MIN_CHARS   = 2;
const MAX_CACHE   = 50;

// Module-level LRU cache: instant results on repeated/backspaced queries.
const resultCache = new Map<string, SearchData>();

function setCache(key: string, data: SearchData) {
  if (resultCache.size >= MAX_CACHE) {
    // Maps preserve insertion order — delete the oldest entry
    const oldest = resultCache.keys().next().value;
    if (oldest !== undefined) resultCache.delete(oldest);
  }
  resultCache.set(key, data);
}

export function useGlobalSearch(query: string) {
  const [results, setResults] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    controllerRef.current?.abort();

    const trimmed = query.trim();

    if (trimmed.length < MIN_CHARS) {
      setResults(null);
      setLoading(false);
      return;
    }

    // Cache hit — respond immediately with no loading flash
    const cacheKey = trimmed.toLowerCase();
    const cached = resultCache.get(cacheKey);
    if (cached) {
      setResults(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    controllerRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const data = await fetchSearchSuggestions(trimmed, controller.signal);
        if (!controller.signal.aborted) {
          setCache(cacheKey, data);
          setResults(data);
        }
      } catch {
        if (!controller.signal.aborted) {
          setResults(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setResults(null);
    setLoading(false);
  }, []);

  const hasProducts = (results?.products.length ?? 0) > 0;
  const hasServices = (results?.services.length ?? 0) > 0;
  const hasResults  = hasProducts || hasServices;
  const isEmpty     = !loading && results !== null && !hasResults;

  return { results, loading, hasResults, isEmpty, reset };
}
