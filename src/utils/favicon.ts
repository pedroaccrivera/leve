/**
 * Favicon helpers shared by the editor UI.
 *
 * Kept out of `FaviconEditor.tsx` so that file only exports a component and
 * React Fast Refresh keeps working during development.
 */

/** SVG sources are vector art and can be rendered at any size. */
export function isVectorFile(nameOrPath?: string): boolean {
  return Boolean(nameOrPath && nameOrPath.toLowerCase().endsWith('.svg'));
}
