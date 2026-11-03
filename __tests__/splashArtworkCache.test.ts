import ReactNativeBlobUtil from 'react-native-blob-util';
import { cachedArtwork, downloadArtwork } from '../src/modules/common/cms/splash/splashArtworkCache';

const fs = ReactNativeBlobUtil.fs as any;
const url = 'https://cdn.rewardplanners.com/public/content-zone-entries/21/a.png';
const fetchWith = (status: number, type: string) => {
  const fetch = jest.fn(async () => ({ info: () => ({ status, headers: { 'Content-Type': type } }) }));
  (ReactNativeBlobUtil.config as jest.Mock).mockReturnValue({ fetch });
  return fetch;
};

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(fs, {
    exists: jest.fn(async () => false),
    isDir: jest.fn(async () => true),
    mkdir: jest.fn(async () => undefined),
    mv: jest.fn(async () => undefined),
    ls: jest.fn(async () => []),
    unlink: jest.fn(async () => undefined),
  });
});

it('returns the local file only when it exists', async () => {
  expect(await cachedArtwork(url)).toBeNull();
  fs.exists.mockResolvedValue(true);
  expect(await cachedArtwork(url)).toBe('file:///tmp/rp-launch-artwork/21_a.png');
});

it('saves an image download under a stable name, through a temporary file', async () => {
  const fetch = fetchWith(200, 'image/png');
  const uri = await downloadArtwork(url);
  expect(fetch).toHaveBeenCalledWith('GET', url);
  expect(ReactNativeBlobUtil.config).toHaveBeenCalledWith({ path: expect.stringMatching(/\.png\.part$/) });
  expect(fs.mv).toHaveBeenCalledWith(expect.stringMatching(/\.part$/), uri!.replace('file://', ''));
  expect(uri).toBe(await (async () => { fs.exists.mockResolvedValue(true); return cachedArtwork(url); })());
});

it.each([[404, 'image/png'], [200, 'text/html']])('keeps nothing for a %i %s response', async (status, type) => {
  fetchWith(status, type);
  expect(await downloadArtwork(url)).toBeNull();
  expect(fs.mv).not.toHaveBeenCalled();
  expect(fs.unlink).toHaveBeenCalledWith(expect.stringMatching(/\.part$/));
});

it('shares one download between concurrent callers', async () => {
  const fetch = fetchWith(200, 'image/png');
  const [a, b] = await Promise.all([downloadArtwork(url), downloadArtwork(url)]);
  expect(a).toBe(b);
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('returns null instead of throwing when the disk fails', async () => {
  (ReactNativeBlobUtil.config as jest.Mock).mockReturnValue({ fetch: jest.fn(async () => { throw new Error('disk full'); }) });
  expect(await downloadArtwork(url)).toBeNull();
});
