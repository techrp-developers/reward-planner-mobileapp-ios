import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<Record<string, object | undefined>>();

let pendingNavigation: { name: string; params?: object } | null = null;

export function navigate(name: string, params?: object): void {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
    return;
  }

  // A notification may launch the app before NavigationContainer has mounted.
  // Retain the most recent tap instead of silently dropping it.
  pendingNavigation = { name, params };
}

export function flushPendingNavigation(): void {
  if (!navigationRef.isReady() || !pendingNavigation) return;

  const { name, params } = pendingNavigation;
  pendingNavigation = null;
  navigationRef.navigate(name, params);
}
