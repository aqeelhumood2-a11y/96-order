/**
 * Module-level (not React state) so it survives across every mount of
 * `ProductImage`/`ProductGallery` for the lifetime of the page — switching
 * back to an image already viewed this session should never show a loading
 * spinner again, and preloading (see `preloadImage`) needs somewhere to
 * record what already finished before any component asking about it exists.
 */
const loadedImageUrls = new Set<string>();

export function isImageCached(url: string): boolean {
  return loadedImageUrls.has(url);
}

export function markImageLoaded(url: string): void {
  loadedImageUrls.add(url);
}

/**
 * Fetches `url` into the browser's image cache ahead of time (e.g. every
 * image in a gallery, as soon as it mounts) so that switching the visible
 * image later never has to wait on the network — `ProductImage` checks
 * `isImageCached` to skip its own loading spinner once this resolves.
 * Resolves rather than rejects on failure: a preload failing is not this
 * caller's problem, `ProductImage`'s own `onError` handling is what
 * actually surfaces a broken image.
 */
export function preloadImage(url: string): Promise<void> {
  if (loadedImageUrls.has(url)) return Promise.resolve();
  return new Promise((resolve) => {
    const image = new window.Image();
    image.onload = () => {
      loadedImageUrls.add(url);
      resolve();
    };
    image.onerror = () => resolve();
    image.src = url;
  });
}
