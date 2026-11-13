/** Width presets shared by the inspector and the report. */
export interface WidthPreset {
  width: number;
  /** Human name shown next to the value: `1920 px · Full HD`. */
  name: string;
}

export const WIDTH_PRESETS: WidthPreset[] = [
  { width: 800, name: 'Web Small' },
  { width: 1280, name: 'HD' },
  { width: 1920, name: 'Full HD' },
  { width: 2560, name: '2K QHD' },
  { width: 3840, name: '4K UHD' },
];

export const presetNameFor = (width: number): string | undefined =>
  WIDTH_PRESETS.find((preset) => preset.width === width)?.name;

/** Storage keys for the values that must survive an app restart. */
export const STORAGE_KEYS = {
  customWidth: 'leve_custom_width',
  customWidthSelected: 'leve_custom_width_selected',
} as const;

export const loadNumber = (key: string, fallback: number): number => {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
};

export const loadBoolean = (key: string, fallback: boolean): boolean => {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : raw === 'true';
  } catch {
    return fallback;
  }
};

export const saveValue = (key: string, value: string | number | boolean): void => {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* storage is best-effort */
  }
};
