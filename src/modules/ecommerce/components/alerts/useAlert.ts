import { useContext, useMemo } from "react";
import { AlertContext } from "./AlertContext";

export function useAlert() {
  const context = useContext(AlertContext);

  if (!context) {
    throw new Error("useAlert must be used within AlertProvider");
  }

  // Returning a plain object literal here would give a new reference on every
  // render. Any useCallback that lists this hook's return value as a dependency
  // would then be recreated every render, causing infinite re-render loops.
  // context.show / dismiss / dismissAll are already stable (useCallback in
  // AlertContext), so memoizing the wrapper object makes the whole hook stable.
  return useMemo(
    () => ({
      success: (title: string, message: string, duration = 3000) =>
        context.show({ type: "success", title, message, duration }),
      error: (title: string, message: string, duration = 4000) =>
        context.show({ type: "error", title, message, duration }),
      warning: (title: string, message: string, duration = 3500) =>
        context.show({ type: "warning", title, message, duration }),
      info: (title: string, message: string, duration = 3000) =>
        context.show({ type: "info", title, message, duration }),
      show: context.show,
      dismiss: context.dismiss,
      dismissAll: context.dismissAll,
    }),
    [context.show, context.dismiss, context.dismissAll]
  );
}
