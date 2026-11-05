import ReactNativeBlobUtil from 'react-native-blob-util';

let cache: typeof import('../src/modules/common/cms/cmsImageCache');
let blob: typeof ReactNativeBlobUtil;
let fs: any;
let fetchImage: jest.Mock;
const response = { info: () => ({ status: 200, headers: { 'Content-Type': 'image/png' } }) };
const url = 'https://cdn.example.test/public/image.png';

beforeEach(() => {
  jest.isolateModules(() => {
    cache = require('../src/modules/common/cms/cmsImageCache');
    const nativeModule = require('react-native-blob-util');
    blob = nativeModule.default ?? nativeModule;
  });
  fs = blob.fs;
  Object.assign(fs, {
    exists: jest.fn(async () => false), isDir: jest.fn(async () => true),
    mkdir: jest.fn(async () => {}), mv: jest.fn(async () => {}),
    ls: jest.fn(async () => []), unlink: jest.fn(async () => {}),
  });
  fetchImage = jest.fn(async () => response);
  (blob.config as jest.Mock).mockReturnValue({ fetch: fetchImage });
});

it('shares one download and serves subsequent callers from memory', async () => {
  const first = cache.getCmsImageUri(url);
  expect(cache.getCmsImageUri(url)).toBe(first);
  const uri = await first;
  expect(uri).toMatch(/^file:\/\/.*rp-cms-images-v1\//);
  expect(await cache.getCmsImageUri(url)).toBe(uri);
  expect(fetchImage).toHaveBeenCalledTimes(1);
  expect(fs.mv).toHaveBeenCalledWith(expect.stringMatching(/\.part$/), uri.replace('file://', ''));
});

it('loads a previous-launch file without downloading it again', async () => {
  fs.exists.mockResolvedValue(true);
  expect(await cache.getCmsImageUri(url)).toMatch(/^file:\/\//);
  expect(fetchImage).not.toHaveBeenCalled();
});

it('keeps version query strings and hosts in separate cache entries', async () => {
  const first = await cache.getCmsImageUri(`${url}?v=1`);
  expect(await cache.getCmsImageUri(`${url}?v=2`)).not.toBe(first);
  expect(await cache.getCmsImageUri(`${url.replace('cdn.example', 'other.example')}?v=1`)).not.toBe(first);
});

it('falls back to the remote URI and allows retry after an invalid response', async () => {
  fetchImage.mockResolvedValueOnce({ info: () => ({ status: 200, headers: { 'content-type': 'text/html' } }) });
  expect(await cache.getCmsImageUri(url)).toBe(url);
  expect(fs.mv).not.toHaveBeenCalled();
  expect(await cache.getCmsImageUri(url)).toMatch(/^file:\/\//);
  expect(fetchImage).toHaveBeenCalledTimes(2);
});

it('limits concurrent image downloads to three', async () => {
  const complete: Array<() => void> = [];
  fetchImage.mockImplementation(() => new Promise(resolve => complete.push(() => resolve(response))));
  const images = Array.from({ length: 5 }, (_, i) => cache.getCmsImageUri(`${url}?batch=${i}`));
  // Flush the disk checks and directory setup before checking active downloads.
  for (let i = 0; i < 12; i++) await Promise.resolve();
  expect(fetchImage).toHaveBeenCalledTimes(3);
  complete.splice(0).forEach(resolve => resolve());
  for (let i = 0; i < 20; i++) await Promise.resolve();
  expect(fetchImage).toHaveBeenCalledTimes(5);
  complete.splice(0).forEach(resolve => resolve());
  await Promise.all(images);
});

it('evicts oldest files when the disk budget is exceeded', async () => {
  fs.ls.mockResolvedValue(['old-a.img', 'old-b.img']);
  fs.stat = jest.fn(async () => ({ size: 40 * 1024 * 1024, lastModified: 1 }));
  for (let i = 0; i < 8; i++) await cache.getCmsImageUri(`${url}?prune=${i}`);
  for (let i = 0; i < 15; i++) await Promise.resolve();
  expect(fs.unlink).toHaveBeenCalledWith(expect.stringMatching(/old-a.img$/));
});
