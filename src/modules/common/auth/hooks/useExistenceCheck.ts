import { useCallback, useState } from "react";
import { checkIdentifier, CheckExistenceResponse } from "../api/AuthAPI";

type UseExistenceCheckResult = {
  loading: boolean;
  error: string | null;
  check: (identifier: string) => Promise<CheckExistenceResponse | null>;
};

// Thin loading/error wrapper around the unified checkIdentifier call — the
// backend auto-detects phone vs. email itself now, so no method/type needs
// to be passed in.
export function useExistenceCheck(): UseExistenceCheckResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async (identifier: string) => {
    setLoading(true);
    setError(null);
    try {
      return await checkIdentifier(identifier);
    } catch (err: any) {
      // The backend 404s (not 200 + registered:false) when the identifier
      // isn't a known employee — treat that as a normal "not registered"
      // result, not an error. Its 404 body has no `type` field, so the
      // caller should already know the type from its own client-side
      // parseIdentifier() detection.
      if (err?.response?.status === 404) {
        if (__DEV__) console.log("[useExistenceCheck] not registered (404)", { identifier });
        return { success: false, registered: false };
      }
      if (__DEV__) console.log("[useExistenceCheck] check failed", err);
      setError(
        err?.response?.data?.message ||
          (err?.message === "Network Error"
            ? "No internet connection. Please try again."
            : "Something went wrong. Please try again."),
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, check };
}
