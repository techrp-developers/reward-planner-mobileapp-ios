import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';
import { IconService, resolveIconName } from '../services/iconService';

// Matches the existing CMS router prefix in cmsContentApi.ts.
const APP_ICON_URL = `${API_BASE_URL}/content/resolved/app-icon?platform=ios`;

export function useFestivalIcon() {
  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    let previousState = AppState.currentState;
    let disposed = false;
    let running = false;
    let pending = false;
    const controller = new AbortController();

    const refresh = async () => {
      // Serialize foreground events, including events caused by the OS icon alert.
      pending = true;
      if (running) return;
      running = true;
      try {
        while (pending && !disposed) {
          pending = false;
          try {
            const response = await axios.get(APP_ICON_URL, {
              signal: controller.signal,
              timeout: 10000,
            });
            const payload = response.data;
            if (payload?.success !== true || payload?.data?.platform !== 'ios' ||
                typeof payload?.data?.icon_key !== 'string') {
              throw new Error('Invalid resolved app-icon response');
            }
            if (disposed || AppState.currentState !== 'active') continue;
            const target = resolveIconName(payload.data.icon_key);
            if (!(await IconService.isSupported()) || disposed) continue;
            const current = await IconService.getCurrentIcon();
            if (!disposed && AppState.currentState === 'active' && target !== current) {
              await IconService.setIcon(target);
            }
          } catch (error) {
            if (!disposed) console.warn('[useFestivalIcon] Could not resolve/apply icon:', error);
          }
        }
      } finally {
        running = false;
      }
    };

    void refresh();
    const subscription = AppState.addEventListener('change', nextState => {
      const becameActive = nextState === 'active' &&
        (previousState == null || previousState === 'background' || previousState === 'inactive');
      previousState = nextState;
      if (becameActive) void refresh();
    });

    return () => {
      disposed = true;
      controller.abort();
      subscription.remove();
    };
  }, []);
}
