/**
 * Shared thumbnail cache.
 *
 * Both the favicon editor filmstrip and the queue ask for thumbnails of the
 * same files. Caching the in-flight promise avoids duplicate Sharp/IPC work
 * when both components mount at once. Failed requests are evicted so a later
 * retry can succeed.
 */
const cache = new Map<string, Promise<string>>();

export function getCachedThumbnail(filePath: string): Promise<string> {
  const cached = cache.get(filePath);
  if (cached) return cached;

  if (!window.electronAPI) return Promise.resolve('');

  const request = window.electronAPI
    .getImageThumbnail(filePath)
    .catch(() => {
      cache.delete(filePath);
      return '';
    });

  cache.set(filePath, request);
  return request;
}
