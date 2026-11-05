import ReactNativeBlobUtil from "react-native-blob-util";

// Keeps launch artwork on disk between launches. Measured on an iPhone 12:
// the 2 MB campaign PNG took 268 ms on one cold launch and 2,430 ms on the
// next, because the CDN sends no cache headers and the platform image cache
// did not keep it. A file on disk opens instantly on every later launch.
//
// Only the image bytes are cached, keyed by URL. Whether to show a campaign
// is still decided by the live (or validated cached) API response, so expiry
// and frequency rules are unaffected. A new artwork has a new URL.
const MAX_FILES = 3;
const inFlight = new Map<string, Promise<string | null>>();

const dir = () => `${ReactNativeBlobUtil.fs.dirs.CacheDir}/rp-launch-artwork`;

// CDN names are already unique ("21/content-<time>-<random>.png"); the last two
// path segments, made filesystem-safe, identify the artwork.
function fileName(url: string): string {
  const path = url.split(/[?#]/)[0].split("/").slice(-2).join("_");
  return path.replace(/[^A-Za-z0-9._-]/g, "_").slice(-120) || "artwork.img";
}

const toUri = (path: string) => `file://${path}`;

/** The artwork's local file, if a previous launch downloaded it. */
export async function cachedArtwork(url: string): Promise<string | null> {
  const path = `${dir()}/${fileName(url)}`;
  return (await ReactNativeBlobUtil.fs.exists(path)) ? toUri(path) : null;
}

async function prune(keep: string): Promise<void> {
  const names = await ReactNativeBlobUtil.fs.ls(dir());
  const stale = names.filter((name) => name !== keep && !name.endsWith(".part"));
  // Oldest first is unknown without stat calls; any extra file is safe to drop.
  await Promise.all(stale.slice(0, Math.max(0, stale.length - (MAX_FILES - 1)))
    .map((name) => ReactNativeBlobUtil.fs.unlink(`${dir()}/${name}`).catch(() => {})));
}

/**
 * Downloads the artwork to disk and returns its local URI, or null when the
 * response is not an image. It is never cancelled: when a launch gives up
 * waiting, the file is still saved for the next launch. Concurrent calls for
 * one URL share a single download.
 */
export function downloadArtwork(url: string): Promise<string | null> {
  const existing = inFlight.get(url);
  if (existing) return existing;
  const name = fileName(url);
  const path = `${dir()}/${name}`;
  const partial = `${path}.part`;
  const task = (async () => {
    if (!(await ReactNativeBlobUtil.fs.isDir(dir()))) await ReactNativeBlobUtil.fs.mkdir(dir());
    const existingUri = await cachedArtwork(url);
    if (existingUri) return existingUri;
    const response = await ReactNativeBlobUtil.config({ path: partial, timeout: 15000 }).fetch("GET", url);
    const info = response.info();
    const headers = info.headers ?? {};
    const type = String(headers["Content-Type"] ?? headers["content-type"] ?? "");
    if (info.status !== 200 || !type.toLowerCase().startsWith("image/")) {
      await ReactNativeBlobUtil.fs.unlink(partial).catch(() => {});
      return null;
    }
    if (await ReactNativeBlobUtil.fs.exists(path)) await ReactNativeBlobUtil.fs.unlink(path).catch(() => {});
    await ReactNativeBlobUtil.fs.mv(partial, path);
    await prune(name).catch(() => {});
    return toUri(path);
  })().catch(async () => {
    await ReactNativeBlobUtil.fs.unlink(partial).catch(() => {});
    return null;
  }).finally(() => inFlight.delete(url));
  inFlight.set(url, task);
  return task;
}
