/**
 * App tone (hue).
 *
 * Every colour in the shell is a semantic CSS variable, so shifting the tone
 * is a rotation of those variables' hues: with a delta of 0 the palette is
 * byte-identical to the design, and any other value rotates `signal`,
 * `success`, `warning`, `danger` and the green-tinted neutrals together.
 *
 * The palettes below mirror `src/styles/tokens.css`; they are only read to
 * derive the rotated values.
 */

/** Hue of the signal colour (#E6F45C) — the app's default tone. */
export const BASE_HUE = 66;

const PAPER = {
  paper: '#f5f3ec',
  panel: '#eceae1',
  surface: '#fffef9',
  subtle: '#d5d6c9',
  line: '#9a9f91',
  control: '#879681',
  ink: '#1b241d',
  muted: '#586153',
  signal: '#e6f45c',
  'on-signal': '#1b241d',
  danger: '#9c3428',
  warning: '#775016',
  success: '#28643d',
} as const;

const INK = {
  paper: '#171b18',
  panel: '#222823',
  surface: '#2b322c',
  subtle: '#3d483e',
  line: '#737f71',
  control: '#76816d',
  ink: '#f5f3ec',
  muted: '#b9c2b5',
  signal: '#e6f45c',
  'on-signal': '#1b241d',
  danger: '#ffada0',
  warning: '#f5cc84',
  success: '#a3d8ac',
} as const;

const TOKEN_NAMES = Object.keys(PAPER) as (keyof typeof PAPER)[];

const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: l * 100 };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;

  return { h: h * 60, s: s * 100, l: l * 100 };
};

/** HSL → linear-ish sRGB channels (0–1). */
const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  const sat = s / 100;
  const lig = l / 100;
  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1]: [number, number, number] =
    hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x]
    : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  const m = lig - c / 2;
  return [r1 + m, g1 + m, b1 + m];
};

/** WCAG relative luminance. */
const luminance = ([r, g, b]: [number, number, number]): number => {
  const channel = (value: number) =>
    value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

/** WCAG contrast ratio between two luminances. */
const contrast = (a: number, b: number): number =>
  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** WCAG AA for normal text — the accent labels are 13–14 px. */
const CONTRAST_TARGET = 4.6;

const clampHue = (value: number): number => {
  if (!Number.isFinite(value)) return BASE_HUE;
  return Math.min(360, Math.max(0, Math.round(value)));
};

/**
 * Rotate the palette by `hue - BASE_HUE`. At the default tone the inline
 * properties are removed so the stylesheet values (and the design) rule.
 */
export const applyHue = (hue: number, dark: boolean): void => {
  const root = document.documentElement;
  const palette = dark ? INK : PAPER;
  const delta = clampHue(hue) - BASE_HUE;

  if (Math.abs(delta) < 0.5) {
    for (const name of TOKEN_NAMES) root.style.removeProperty(`--c-${name}`);
    return;
  }

  const rotatedHsl = (hex: string) => {
    const { h, s, l } = hexToHsl(hex);
    return { h: ((h + delta) % 360 + 360) % 360, s, l };
  };

  /*
   * The signal keeps the design's character — a bright accent carrying dark
   * text — so its lightness is nudged until that pairing clears WCAG AA for
   * the label sizes we use. Rotating alone leaves mid-luminance hues (blue,
   * violet) at ~4.2:1, just under the bar.
   */
  const ink = rotatedHsl(palette.ink);
  const paper = rotatedHsl(palette.paper);
  const inkLum = luminance(hslToRgb(ink.h, ink.s, ink.l));
  const paperLum = luminance(hslToRgb(paper.h, paper.s, paper.l));

  const signal = rotatedHsl(palette.signal);
  let signalLightness = signal.l;
  let signalLum = luminance(hslToRgb(signal.h, signal.s, signalLightness));
  let steps = 0;
  while (contrast(signalLum, inkLum) < CONTRAST_TARGET && signalLightness < 90 && steps < 40) {
    signalLightness += 1;
    signalLum = luminance(hslToRgb(signal.h, signal.s, signalLightness));
    steps += 1;
  }

  // Fall back to the light neutral if the dark one still cannot be read.
  const usePaper = contrast(signalLum, inkLum) < contrast(signalLum, paperLum);
  const onSignal = usePaper ? paper : ink;

  for (const name of TOKEN_NAMES) {
    // `on-signal` is decided above: it follows the surface, not the rotation.
    if (name === 'on-signal') continue;
    const { h, s, l } = rotatedHsl(palette[name]);
    const lightness = name === 'signal' ? signalLightness : l;
    root.style.setProperty(
      `--c-${name}`,
      `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${lightness.toFixed(1)}%)`
    );
  }

  root.style.setProperty(
    '--c-on-signal',
    `hsl(${onSignal.h.toFixed(1)} ${onSignal.s.toFixed(1)}% ${onSignal.l.toFixed(1)}%)`
  );
};

export const HUE_STORAGE_KEY = 'leve_hue';

export const loadHue = (): number => {
  try {
    const raw = localStorage.getItem(HUE_STORAGE_KEY);
    return raw == null ? BASE_HUE : clampHue(Number(raw));
  } catch {
    return BASE_HUE;
  }
};

export const saveHue = (hue: number): void => {
  try {
    localStorage.setItem(HUE_STORAGE_KEY, String(clampHue(hue)));
  } catch {
    /* storage is best-effort */
  }
};

export { clampHue };
