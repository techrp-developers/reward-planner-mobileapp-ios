import { useEffect, useState } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected:        boolean;
  isInternetReachable: boolean | null;
  connectionType:     string;
}

// ─── Derive effective online/offline from a NetInfoState ─────────────────────
// isConnected=false  →  definitely offline
// isInternetReachable=false  →  connected to router/mobile but no internet
// null values during transitions are treated as "not yet known" (pass-through)
function deriveStatus(state: NetInfoState): NetworkStatus {
  return {
    isConnected:        !(state.isConnected === false || state.isInternetReachable === false),
    isInternetReachable: state.isInternetReachable ?? null,
    connectionType:     state.type,
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
