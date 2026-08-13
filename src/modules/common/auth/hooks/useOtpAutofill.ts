type UseOtpAutofillResult = {
  code: string | null;
  starting: boolean;
  error: string | null;
};

// Manual OTP entry remains available on every platform. The input's native
// one-time-code metadata can still offer OS-level autofill without requiring
// an additional native module.
export function useOtpAutofill(_active: boolean): UseOtpAutofillResult {
  return { code: null, starting: false, error: null };
}
