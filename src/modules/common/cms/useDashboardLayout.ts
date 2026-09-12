import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
  DEFAULT_DASHBOARD_LAYOUTS,
  type DashboardLayout,
  type DashboardLayoutId,
  normaliseDashboardLayout,
} from './dashboardLayout';
import { API_V1_URL } from '../../../config/apiConfig';
const cacheKey = (id: DashboardLayoutId) => `cms:dashboard-layout:${id}`;

type LayoutResponse = { success: boolean; data?: DashboardLayout };

export function useDashboardLayout(id: DashboardLayoutId, supportedKeys: readonly string[]) {
  const stableKeys = useMemo(() => [...supportedKeys], [supportedKeys]);
  const [layout, setLayout] = useState<DashboardLayout>(DEFAULT_DASHBOARD_LAYOUTS[id]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const cached = await AsyncStorage.getItem(cacheKey(id)).catch(() => null);
      if (active && cached) {
        try {
          setLayout(normaliseDashboardLayout(JSON.parse(cached), id, stableKeys));
        } catch { /* Ignore an invalid cache entry. */ }
      }

      try {
        const response = await axios.get<LayoutResponse>(`${API_V1_URL}/cms/dashboard-layouts/${id}`);
        if (!response.data?.success || !response.data.data) return;
        const next = normaliseDashboardLayout(response.data.data, id, stableKeys);
        if (active) setLayout(next);
        await AsyncStorage.setItem(cacheKey(id), JSON.stringify(next));
      } catch {
        // Offline, an older server, or an unpublished layout uses cache/defaults.
      }
    };

    load();
    return () => { active = false; };
  }, [id, stableKeys]);

  return layout;
}
