import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

export function useOtpTimer(initialSeconds: number, initialDeadline?: number) {
  const [deadline, setDeadline] = useState(
    () => initialDeadline ?? Date.now() + initialSeconds * 1000,
  );
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = setInterval(tick, 1000);
    // Reconcile elapsed time after returning from WhatsApp or email.
    const subscription = AppState.addEventListener("change", state => {
      if (state === "active") tick();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  const reset = useCallback((seconds = initialSeconds) => {
    const current = Date.now();
    setNow(current);
    setDeadline(current + seconds * 1000);
  }, [initialSeconds]);

  const secondsLeft = Math.max(0, Math.ceil((deadline - now) / 1000));
  return { secondsLeft, canResend: secondsLeft === 0, reset };
}
