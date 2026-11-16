import { dashboardStepCount, stepSyncStorageKey } from '../src/modules/step_counter/utils/stepData';

it('does not erase account activity when HealthKit returns zero', () => {
  expect(dashboardStepCount(0, 4200, 4000)).toBe(4200);
});
it('shows new device activity before the server finishes syncing', () => {
  expect(dashboardStepCount(4800, 4200, 4000)).toBe(4800);
});
it('uses saved activity when health reads fail', () => {
  expect(dashboardStepCount(null, undefined, 3200)).toBe(3200);
});
it('does not add overlapping device and server totals', () => {
  expect(dashboardStepCount(4200, 4200, 4200)).toBe(4200);
});
it('rejects invalid counts and keeps valid zero', () => {
  expect(dashboardStepCount(NaN, -1, Infinity)).toBe(0);
});
it('never shares a sync watermark between accounts', () => {
  expect(stepSyncStorageKey(1)).not.toBe(stepSyncStorageKey(2));
  expect(stepSyncStorageKey(1)).not.toBe('@step_tracker/last_synced_steps');
});
