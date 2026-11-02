import { QueryClient } from "@tanstack/react-query";
import i18n from "../i18n";

const FIVE_MINUTES = 5 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: FIVE_MINUTES,
      gcTime: THIRTY_MINUTES,
      retry: 1,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

/**
 * Set to true once the backend returns localized content for Accept-Language.
 * Then a language change refetches what is on screen and marks the rest stale,
 * so cached English data is never shown after switching to Hindi (or back).
 * While the server ignores the header, refetching would only cost requests.
 */
export const SERVER_LOCALIZES_CONTENT = false;

i18n.on("languageChanged", () => {
  if (!SERVER_LOCALIZES_CONTENT) return;
  void queryClient.invalidateQueries({ refetchType: "active" });
});
