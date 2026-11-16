/** A missing/empty device read must not erase steps already saved to the account. */
export function dashboardStepCount(live: number | null, ...saved: Array<number | null | undefined>) {
  return Math.max(0, ...[live, ...saved].map(value =>
    typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0,
  ));
}

/** The sync watermark belongs to an account, while Health permission belongs to the device. */
export const stepSyncStorageKey = (accountId: string | number) =>
  `@step_tracker/last_synced_steps:${accountId}`;
