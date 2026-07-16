import { useQuery } from '@tanstack/react-query';
import { getServiceHome } from '../api/ServiceAPI';

export const SERVICE_HOME_QUERY_KEY = ['service-home'];

export const useServiceHome = () => {
  return useQuery({
    queryKey: SERVICE_HOME_QUERY_KEY,
    queryFn: getServiceHome,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 1,
  });
};