import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../../config/apiConfig';

export const CMS_FRESH_MS = 5 * 60_000;
type Snapshot<T> = { data: T; savedAt: number };
const keyFor = (key: string) => `@cms:snapshot:v1:${API_BASE_URL}:${key}`;

const reads = new Map<string, Promise<Snapshot<unknown> | null>>();
async function readSnapshot<T>(key: string): Promise<Snapshot<T> | null> {
  try {
    const value = JSON.parse((await AsyncStorage.getItem(keyFor(key))) || 'null');
    const age = Date.now() - value?.savedAt;
    // Module configuration can render while revalidating after a cold launch.
    // Campaign zones keep the short lifetime so old promotions do not linger.
    const maxAge = key === 'modules' || key.startsWith('dashboard-layout:') ? 24 * 60 * 60_000 : CMS_FRESH_MS;
    return value?.data != null && Number.isFinite(age) && age >= 0 && age < maxAge ? value : null;
  } catch { return null; }
}

export function readCmsSnapshot<T>(key: string): Promise<Snapshot<T> | null> {
  const current = reads.get(key);
  if (current) return current as Promise<Snapshot<T> | null>;
  const request = readSnapshot<T>(key).finally(() => reads.delete(key));
  reads.set(key, request);
  return request;
}

export function saveCmsSnapshot<T>(key: string, data: T): void {
  // Local persistence must never delay publishing fresh CMS content.
  void AsyncStorage.setItem(keyFor(key), JSON.stringify({ data, savedAt: Date.now() })).catch(() => {});
}
