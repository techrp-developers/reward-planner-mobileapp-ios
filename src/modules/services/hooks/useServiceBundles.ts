import { useQuery } from '@tanstack/react-query';
import { getServiceBundles } from '../api/BundleAPI';

export const useServiceBundles = () => {
  return useQuery({
    queryKey: ['serviceBundles'],
    queryFn: getServiceBundles,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
