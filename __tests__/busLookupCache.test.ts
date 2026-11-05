import { createBusLookupCache } from '../src/modules/busbooking/utils/busLookupCache';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('shares concurrent lookups and reuses successful data until it expires', async () => {
  const lookup = createBusLookupCache<string[]>(1000, 2);
  const load = jest.fn(async () => ['Mumbai']);
  const first = lookup('mumbai', load);
  expect(lookup('mumbai', load)).toBe(first);
  await expect(first).resolves.toEqual(['Mumbai']);
  await lookup('mumbai', load);
  expect(load).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(1001);
  await lookup('mumbai', load);
  expect(load).toHaveBeenCalledTimes(2);
});

it('retries failed requests instead of caching the failure', async () => {
  const lookup = createBusLookupCache<string[]>(1000, 2);
  const load = jest.fn().mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(['Pune']);
  await expect(lookup('pune', load)).rejects.toThrow('Offline');
  await expect(lookup('pune', load)).resolves.toEqual(['Pune']);
  expect(load).toHaveBeenCalledTimes(2);
});

it('bounds lookup storage and keeps different city queries separate', async () => {
  const lookup = createBusLookupCache<string[]>(1000, 2);
  const mumbai = jest.fn(async () => ['Mumbai']);
  await lookup('mumbai', mumbai);
  await lookup('pune', async () => ['Pune']);
  await lookup('delhi', async () => ['Delhi']);
  await lookup('mumbai', mumbai);
  expect(mumbai).toHaveBeenCalledTimes(2);
});
