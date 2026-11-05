import AsyncStorage from '@react-native-async-storage/async-storage';
import { CMS_FRESH_MS, readCmsSnapshot, saveCmsSnapshot } from '../src/modules/common/cms/cmsSnapshotCache';

beforeEach(async () => { await AsyncStorage.clear(); });
afterEach(() => jest.restoreAllMocks());

it('restores recent content and refuses expired snapshots', async () => {
  const now = Date.now();
  const clock = jest.spyOn(Date, 'now').mockReturnValue(now);
  saveCmsSnapshot('resolved:product', [{ module_key: 'product' }]);
  expect((await readCmsSnapshot('resolved:product'))?.data).toEqual([{ module_key: 'product' }]);
  clock.mockReturnValue(now + CMS_FRESH_MS);
  expect(await readCmsSnapshot('resolved:product')).toBeNull();
});

it('keeps module zones separate and tolerates unavailable storage', async () => {
  saveCmsSnapshot('resolved:product', { title: 'Product' });
  expect(await readCmsSnapshot('resolved:services')).toBeNull();
  jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('unavailable'));
  expect(await readCmsSnapshot('resolved:product')).toBeNull();
});

it('restores module icons after the short campaign TTL while revalidation runs', async () => {
  const now = Date.now();
  const clock = jest.spyOn(Date, 'now').mockReturnValue(now);
  saveCmsSnapshot('modules', [{ module_key: 'product' }]);
  clock.mockReturnValue(now + 60 * 60_000);
  expect((await readCmsSnapshot('modules'))?.data).toEqual([{ module_key: 'product' }]);
  clock.mockReturnValue(now + 24 * 60 * 60_000);
  expect(await readCmsSnapshot('modules')).toBeNull();
});
