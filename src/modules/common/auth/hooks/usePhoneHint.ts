type UsePhoneHintResult = {
  requestHint: () => Promise<string | null>;
  unavailable: boolean;
};

// Dependency-free fallback. Callers continue with manual phone-number entry.
export function usePhoneHint(): UsePhoneHintResult {
  return {
    requestHint: async () => null,
    unavailable: true,
  };
}
