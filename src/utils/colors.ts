/**
 * Colour helpers for the favicon background field.
 *
 * The field accepts anything CSS can parse (hex, rgb(), hsl(), named
 * colours). The swatch next to it is a native `<input type="color">`, which
 * only understands `#rrggbb`, so the current value is normalised for it.
 */

/** True when the browser accepts the value as a CSS colour. */
export const isCssColor = (value: string): boolean => {
  if (!value || !value.trim()) return false;
  try {
    return CSS.supports('color', value);
  } catch {
    return false;
  }
};

/**
 * Normalise any accepted colour to `#RRGGBB` (alpha dropped, `transparent`
 * falls back to white) so a native colour input can display it.
 */
export const toHexColor = (value: string, fallback = '#FFFFFF'): string => {
  if (!isCssColor(value)) return fallback;
  if (value.trim().toLowerCase() === 'transparent') return fallback;

  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return fallback;

  ctx.fillStyle = '#000000';
  ctx.fillStyle = value; // invalid values keep the previous fill
  const resolved = ctx.fillStyle;

  if (typeof resolved === 'string' && resolved.startsWith('#')) return resolved.toUpperCase();

  const match = typeof resolved === 'string' ? resolved.match(/rgba?\(([^)]+)\)/) : null;
  if (!match) return fallback;

  const [r, g, b, a] = match[1].split(',').map((part) => Number(part.trim()));
  if (a === 0) return fallback;
  const channel = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase();
};

/** Uppercases hex values so the field reads like the design (`#FFFFFF`). */
export const displayColor = (value: string): string =>
  /^#[0-9a-f]{3,8}$/i.test(value.trim()) ? value.trim().toUpperCase() : value;
