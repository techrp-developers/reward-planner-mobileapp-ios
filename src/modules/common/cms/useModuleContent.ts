import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from '@react-navigation/native';
import { fetchResolvedZones, CmsModuleKey } from './cmsContentApi';

export const moduleContentQueryKey = (module: CmsModuleKey) =>
  ['cms', 'resolved', module] as const;

// Generalizes the old product-only content hook: promotional_banner +
// offers_banner for whichever module the screen is showing. Cached per
// module in the query client (staleTime keeps a revisited tab from
// refetching), gated on screen focus rather than fetching on every mount.
export const useModuleContent = (module: CmsModuleKey) => {
  const isFocused = useIsFocused();

  const query = useQuery({
    queryKey: moduleContentQueryKey(module),
    queryFn: () => fetchResolvedZones(module),
    staleTime: 5 * 60 * 1000,
    enabled: isFocused,
  });

  return {
    ...query,
    moduleContent: query.data ?? null,
  };
};
