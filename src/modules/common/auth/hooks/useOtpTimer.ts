import { useCallback, useEffect, useState } from "react";

type UseOtpTimerResult = {
  secondsLeft: number;
  canResend: boolean;
  reset: (seconds?: number) => void;
};

export function useOtpTimer(initialSeconds: number): UseOtpTimerResult {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft]);

  const reset = useCallback(
    (seconds: number = initialSeconds) => {
      setSecondsLeft(seconds);
    },
    [initialSeconds],
  );

  return { secondsLeft, canResend: secondsLeft <= 0, reset };
}
