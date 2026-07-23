import { useContext, useMemo } from "react";
import { AlertContext } from "./AlertContext";

export function useAlert() {
  const context = useContext(AlertContext);

  if (!context) {
    throw new Error("useAlert must be used within AlertProvider");
  }

  const { show, dismiss, dismissAll } = context;

  // Memoized on the (stable) context methods so the returned object keeps
  // the same identity across renders. Without this, every render produced a
  // brand-new object/functions here, which made any `useCallback`/`useEffect`
  // depending on `alert` re-run on every render — this was the root cause of
  // AddressSelectScreen's infinite fetch loop.
  return useMemo(
    () => ({
      success: (title: string, message: string, duration = 3000) =>
        show({ type: "success", title, message, duration }),
      error: (title: string, message: string, duration = 4000) =>
        show({ type: "error", title, message, duration }),
      warning: (title: string, message: string, duration = 3500) =>
        show({ type: "warning", title, message, duration }),
      info: (title: string, message: string, duration = 3000) =>
        show({ type: "info", title, message, duration }),
      show,
      dismiss,
      dismissAll,
    }),
    [show, dismiss, dismissAll]
  );
}
