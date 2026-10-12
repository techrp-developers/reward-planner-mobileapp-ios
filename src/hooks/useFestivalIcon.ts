import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';
import { IconService, resolveIconName } from '../services/iconService';

const APP_ICON_URL = `${API_BASE_URL}/content/resolved/app-icon?platform=ios`;
let inFlight: Promise<string> | undefined;

// All hook instances and foreground events share the same pending request.
function resolveCampaign(): Promise<string> {
  if (inFlight) return inFlight;
  inFlight = axios.get(APP_ICON_URL, { timeout: 2500 }).then(response => {
    const payload = response.data;
    if (payload?.success !== true || payload?.data?.platform !== 'ios' ||
        typeof payload?.data?.icon_key !== 'string') {
      throw new Error('Invalid resolved app-icon response');
    }
    return payload.data.icon_key as string;
  }).finally(() => { inFlight = undefined; });
  return inFlight;
}

export function useFestivalIcon() {
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let previousState = AppState.currentState;
    let disposed = false;
    let running: Promise<void> | undefined;
    const refresh = () => {
      if (running) return running;
      running = (async () => {
        try {
          const key = await resolveCampaign();
          if (disposed || AppState.currentState !== 'active') return;
          const target = resolveIconName(key);
          if (!(await IconService.isSupported()) || disposed) return;
          const current = await IconService.getCurrentIcon();
          if (!disposed && AppState.currentState === 'active' &&
              target !== (current === 'Default' ? null : current)) {
            await IconService.setIcon(target);
          }
        } catch (error) {
          if (!disposed) console.warn('[useFestivalIcon] Could not resolve/apply icon:', error);
        }
      })().finally(() => { running = undefined; });
      return running;
    };
    void refresh();
    const subscription = AppState.addEventListener('change', nextState => {
      const becameActive = nextState === 'active' && previousState !== 'active';
      previousState = nextState;
      if (becameActive) void refresh();
    });
    return () => {
      disposed = true;
      subscription.remove();
    };
  }, []);
}
