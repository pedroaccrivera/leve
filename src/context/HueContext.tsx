import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTheme } from './ThemeContext';
import { applyHue, BASE_HUE, clampHue, loadHue, saveHue } from '../utils/hue';

interface HueContextValue {
  /** Current tone, 0–360 (absolute hue of the signal colour). */
  hue: number;
  setHue: (hue: number) => void;
  resetHue: () => void;
  isDefault: boolean;
}

const HueContext = createContext<HueContextValue | undefined>(undefined);

/**
 * App tone. Rotates the semantic colour tokens of the active theme, so every
 * surface, border and state colour follows the chosen hue. Persisted on
 * change — there is nothing to confirm.
 */
export const HueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { resolvedTheme } = useTheme();
  const [hue, setHueState] = useState<number>(() => loadHue());

  useEffect(() => {
    applyHue(hue, resolvedTheme === 'dark');
  }, [hue, resolvedTheme]);

  const setHue = useCallback((value: number) => {
    const next = clampHue(value);
    setHueState(next);
    saveHue(next);
  }, []);

  const resetHue = useCallback(() => setHue(BASE_HUE), [setHue]);

  const value = useMemo<HueContextValue>(
    () => ({ hue, setHue, resetHue, isDefault: Math.abs(hue - BASE_HUE) < 0.5 }),
    [hue, setHue, resetHue]
  );

  return <HueContext.Provider value={value}>{children}</HueContext.Provider>;
};

export const useHue = (): HueContextValue => {
  const context = useContext(HueContext);
  if (!context) throw new Error('useHue must be used within a HueProvider');
  return context;
};

export { BASE_HUE };
