import type { ReactNode } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import NoInternetScreen from './NoInternet';

interface Props {
  children: ReactNode;
}

export default function NetworkGuard({ children }: Props) {
  const { isConnected } = useNetworkStatus();

  if (!isConnected) {
    return <NoInternetScreen />;
  }

  return <>{children}</>;
}
