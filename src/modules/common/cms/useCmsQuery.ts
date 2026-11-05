import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CMS_FRESH_MS, readCmsSnapshot } from './cmsSnapshotCache';

// Hydrate while the live request runs. A slow disk read cannot overwrite a
// newer response. Persisted snapshots are scoped to the selected API host.
export function useCmsQuery<T>(key: string, queryFn: () => Promise<T>, enabled = true) {
  const client = useQueryClient();
  const queryKey = useMemo(() => key.startsWith('resolved:')
    ? ['cms', 'resolved', key.slice('resolved:'.length)]
    : ['cms', 'snapshot', key], [key]);
  const query = useQuery({
    queryKey, queryFn, enabled,
    staleTime: CMS_FRESH_MS,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
  useEffect(() => {
    let active = true;
    void readCmsSnapshot<T>(key).then(snapshot => {
      if (!active || !snapshot) return;
      const current = client.getQueryState(queryKey);
      if ((current?.dataUpdatedAt ?? 0) < snapshot.savedAt) {
        client.setQueryData(queryKey, snapshot.data, { updatedAt: snapshot.savedAt });
      }
    });
    return () => { active = false; };
  }, [client, key, queryKey]);
  return query;
}
