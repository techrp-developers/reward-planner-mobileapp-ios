import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { checkAppVersion } from './checkAppVersion';
import { applyPendingOtaUpdate, checkForOtaUpdate } from './checkOtaUpdate';

type StoreUpdate = {
  visible: boolean;
  forceUpdate: boolean;
  maintenance: boolean;
  updateUrl: string;
};

const HIDDEN_STORE: StoreUpdate = {
  visible: false, forceUpdate: false, maintenance: false, updateUrl: '',
};

export function useUpdateGates() {
  const [storeUpdate, setStoreUpdate] = useState<StoreUpdate>(HIDDEN_STORE);
  const [otaPrompt, setOtaPrompt] = useState<{ visible: boolean; releaseNotes?: string }>({ visible: false });
  const checking = useRef(false);
  const mounted = useRef(true);
  const otaAfterStorePrompt = useRef(false);

  const checkOta = useCallback(async () => {
    const otaResult = await checkForOtaUpdate();
    if (mounted.current && otaResult.updateAvailable && !otaResult.mandatory) {
      setOtaPrompt({ visible: true, releaseNotes: otaResult.releaseNotes });
    }
  }, []);

  const runChecks = useCallback(async () => {
    if (checking.current) return;
    checking.current = true;
    try {
      const nativeResult = await checkAppVersion();
      if (!mounted.current || !nativeResult.success) return;
      if (nativeResult.maintenance || nativeResult.updateAvailable) {
        setStoreUpdate({
          visible: true,
          forceUpdate: nativeResult.forceUpdate,
          maintenance: nativeResult.maintenance,
          updateUrl: nativeResult.updateUrl,
        });
        setOtaPrompt({ visible: false });
        otaAfterStorePrompt.current = nativeResult.updateAvailable && !nativeResult.forceUpdate && !nativeResult.maintenance;
        return;
      }
      setStoreUpdate(HIDDEN_STORE);
      await checkOta();
    } finally {
      checking.current = false;
    }
  }, [checkOta]);

  useEffect(() => {
    mounted.current = true;
    void runChecks();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void runChecks();
    });
    return () => {
      mounted.current = false;
      subscription.remove();
    };
  }, [runChecks]);

  return {
    storeUpdate,
    onStoreUpdateLater: () => {
      setStoreUpdate(HIDDEN_STORE);
      if (otaAfterStorePrompt.current) {
        otaAfterStorePrompt.current = false;
        void checkOta();
      }
    },
    otaPrompt,
    onOtaUpdate: () => {
      setOtaPrompt({ visible: false });
      void applyPendingOtaUpdate().catch(error => console.warn('[OTA] restart failed:', error));
    },
    onOtaLater: () => setOtaPrompt({ visible: false }),
  };
}
