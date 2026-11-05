import { useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  DEFAULT_DASHBOARD_LAYOUTS,
  type DashboardLayout,
  type DashboardLayoutId,
  normaliseDashboardLayout,
} from './dashboardLayout';
import { API_V1_URL } from '../../../config/apiConfig';
import { saveCmsSnapshot } from './cmsSnapshotCache';
import { useCmsQuery } from './useCmsQuery';

type LayoutResponse = { success: boolean; data?: DashboardLayout };

export function useDashboardLayout(id: DashboardLayoutId, supportedKeys: readonly string[]) {
  const key = `dashboard-layout:${id}`;
  const load = useCallback(async () => {
    const { data } = await axios.get<LayoutResponse>(`${API_V1_URL}/cms/dashboard-layouts/${id}`, { timeout: 10000 });
    if (!data.success || !data.data) throw new Error('Dashboard layout unavailable');
    saveCmsSnapshot(key, data.data);
    return data.data;
  }, [id, key]);
  const query = useCmsQuery(key, load);
  return useMemo(() => query.data
    ? normaliseDashboardLayout(query.data, id, supportedKeys)
    : DEFAULT_DASHBOARD_LAYOUTS[id], [query.data, id, supportedKeys]);
}
