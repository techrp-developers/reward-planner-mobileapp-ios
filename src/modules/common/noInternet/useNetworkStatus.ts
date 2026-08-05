import { useEffect, useState } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected:        boolean;
  isInternetReachable: boolean | null;
  connectionType:     string;
}

// ─── Derive effective online/offline from a NetInfoState ─────────────────────
// isConnected=false  →  definitely offline (airplane mode, no signal)
// isInternetReachable is NOT used: on iOS it stays null unless NetInfo is
// configured with a reachabilityUrl, making it unreliable for gate logic.
function deriveStatus(state: NetInfoState): NetworkStatus {
  return {
    isConnected:         state.isConnected !== false,
    isInternetReachable: state.isInternetReachable ?? null,
    connectionType:      state.type,
  };
}

const OPTIMISTIC_DEFAULT: NetworkStatus = {
  isConnected:        true,   // avoid a NoInternet flash on cold start
  isInternetReachable: null,
  connectionType:     'unknown',
};

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(OPTIMISTIC_DEFAULT);

  useEffect(() => {
    // Immediately resolve the real state — updates the optimistic default
    NetInfo.fetch().then((state) => setStatus(deriveStatus(state)));

    // Subscribe to all subsequent changes
    const unsubscribe = NetInfo.addEventListener((state) =>
      setStatus(deriveStatus(state)),
    );

    return unsubscribe;
  }, []);

  return status;
}
