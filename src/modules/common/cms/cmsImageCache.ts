import ReactNativeBlobUtil from 'react-native-blob-util';

const MAX_FILES = 80;
const MAX_BYTES = 64 * 1024 * 1024;
const CONCURRENCY = 3;
const localUris = new Map<string, string>();
const pending = new Map<string, Promise<string>>();
const queue: Array<{ url: string; run: () => void }> = [];
let running = 0;
let downloads = 0;
let directoryReady: Promise<void> | null = null;
const directory = () => `${ReactNativeBlobUtil.fs.dirs.CacheDir}/rp-cms-images-v1`;

// Include the entire URL, including its version/query string and host.
function nameFor(url: string) {
  let first = 2166136261;
  let second = 5381;
  for (let i = 0; i < url.length; i++) {
    first = Math.imul(first ^ url.charCodeAt(i), 16777619);
    second = Math.imul(second, 33) ^ url.charCodeAt(i);
  }
  return `${(first >>> 0).toString(16)}-${(second >>> 0).toString(16)}.img`;
}
function remember(url: string, uri: string) {
  localUris.set(url, uri);
  while (localUris.size > MAX_FILES) localUris.delete(localUris.keys().next().value!);
}
function drain() {
  while (running < CONCURRENCY && queue.length) {
    running++;
    queue.shift()!.run();
  }
}
function schedule<T>(url: string, foreground: boolean, load: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const job = { url, run: () => {
      void load().then(resolve, reject).finally(() => { running--; drain(); });
    } };
    if (foreground) queue.unshift(job); else queue.push(job);
    drain();
  });
}
async function ensureDirectory() {
  if (!directoryReady) {
    directoryReady = (async () => {
      if (!(await ReactNativeBlobUtil.fs.isDir(directory()))) await ReactNativeBlobUtil.fs.mkdir(directory());
    })().catch(error => { directoryReady = null; throw error; });
  }
  await directoryReady;
}
async function prune(keep: string) {
  const names = (await ReactNativeBlobUtil.fs.ls(directory())).filter(name => !name.endsWith('.part'));
  const files = await Promise.all(names.map(async name => {
    const path = `${directory()}/${name}`;
    const stat = await ReactNativeBlobUtil.fs.stat(path);
    return { name, path, size: Number(stat.size) || 0, modified: Number(stat.lastModified) || 0 };
  }));
  files.sort((a, b) => a.modified - b.modified);
  let bytes = files.reduce((sum, file) => sum + file.size, 0);
  let count = files.length;
  for (const file of files) {
    if (count <= MAX_FILES && bytes <= MAX_BYTES) break;
    if (file.name === keep) continue;
    await ReactNativeBlobUtil.fs.unlink(file.path).catch(() => {});
    for (const [url, uri] of localUris) if (uri === `file://${file.path}`) localUris.delete(url);
    count--; bytes -= file.size;
  }
}

export function peekCmsImageUri(url: string): string | undefined {
  return localUris.get(url);
}

// One disk lookup/download per URL, shared by banners, sizing and module icons.
// On any disk/CDN failure the native Image can still try the original URL.
export function getCmsImageUri(url: string, foreground = true): Promise<string> {
  if (!/^https?:\/\//i.test(url)) return Promise.resolve(url);
  const cached = localUris.get(url);
  if (cached) return Promise.resolve(cached);
  const active = pending.get(url);
  if (active) {
    if (foreground) {
      const index = queue.findIndex(job => job.url === url);
      if (index > 0) queue.unshift(queue.splice(index, 1)[0]);
    }
    return active;
  }
  const path = `${directory()}/${nameFor(url)}`;
  const partial = `${path}.part`;
  const request = (async () => {
    if (await ReactNativeBlobUtil.fs.exists(path)) {
      remember(url, `file://${path}`);
      return `file://${path}`;
    }
    return schedule(url, foreground, async () => {
      await ensureDirectory();
      const response = await ReactNativeBlobUtil.config({ path: partial, timeout: 15000 }).fetch('GET', url);
      const { status, headers = {} } = response.info();
      const type = String(headers['Content-Type'] ?? headers['content-type'] ?? '');
      if (status !== 200 || !type.toLowerCase().startsWith('image/')) throw new Error('Invalid CMS image');
      await ReactNativeBlobUtil.fs.mv(partial, path);
      const uri = `file://${path}`;
      remember(url, uri);
      if (++downloads % 8 === 0) void prune(nameFor(url)).catch(() => {});
      return uri;
    });
  })().catch(async () => {
    await ReactNativeBlobUtil.fs.unlink(partial).catch(() => {});
    return url;
  }).finally(() => pending.delete(url));
  pending.set(url, request);
  return request;
}

export function warmCmsImages(urls: Array<string | null | undefined>) {
  for (const url of new Set(urls)) if (url) void getCmsImageUri(url, false);
}

export function forgetCmsImage(url: string) {
  localUris.delete(url);
  void ReactNativeBlobUtil.fs.unlink(`${directory()}/${nameFor(url)}`).catch(() => {});
}
