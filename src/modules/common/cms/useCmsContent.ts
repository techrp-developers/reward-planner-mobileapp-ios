import { useModuleContent } from './useModuleContent';
import type { CmsModuleKey } from './cmsContentApi';

// All zone consumers share the same query, persistence and request deduplication.
export const useContentZones = (module: CmsModuleKey) => {
  const query = useModuleContent(module);
  return { data: query.moduleContent ?? {}, isLoading: query.isLoading, error: query.error };
};
