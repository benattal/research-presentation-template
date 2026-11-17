import { prefixAssetPaths } from './model.js';

/**
 * URL of a file in the presentation's `public/` directory, for layouts that
 * build asset paths in code: `assetUrl('/slides/intro/photo.jpg')`. Paths in
 * `content.json` are already resolved this way when the presentation loads.
 */
export function assetUrl(path) {
  return prefixAssetPaths(path, import.meta.env.BASE_URL);
}
