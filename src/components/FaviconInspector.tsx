import React, { useState } from 'react';
import type { FaviconConfig, FaviconSize } from '../types';
import { FAVICON_SIZES } from '../types';
import { Choice, ChoiceRow, ChoiceStack } from './ui/Choice';
import { FieldSection } from './ui/FieldSection';
import { Slider, SliderRow } from './ui/Slider';
import { Checkbox } from './ui/Checkbox';
import { ResolvedValue } from './ui/TextInput';
import { displayColor, isCssColor, toHexColor } from '../utils/colors';

const BACKGROUNDS: { id: FaviconConfig['backgroundMode']; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'white', label: 'White' },
  { id: 'black', label: 'Black' },
  { id: 'color', label: 'Custom' },
  { id: 'transparent', label: 'Transparent' },
];

const RADIUS_PRESETS = [
  { value: 0, label: 'Square' },
  { value: 0.12, label: '12%' },
  { value: 0.22, label: '22%' },
  { value: 0.5, label: 'Circle' },
];

const RESOLVED_BACKGROUNDS: Record<FaviconConfig['backgroundMode'], string> = {
  auto: 'Auto',
  white: 'White',
  black: 'Black',
  color: 'Custom',
  transparent: 'Transparent',
};

const PRESET_COLORS: Record<'white' | 'black', string> = {
  white: '#FFFFFF',
  black: '#000000',
};

export interface FaviconInspectorProps {
  config: FaviconConfig;
  onPatch: (patch: Partial<FaviconConfig>) => void;
  /** Mirrors every edit to all logos instead of the selected one. */
  applyToAll?: boolean;
  onToggleApplyToAll?: (value: boolean) => void;
  logoCount?: number;
  /** Resolved hex reported by the preview render (`Auto → #FFFFFF`). */
  resolvedBackground?: string;
  disabled?: boolean;
}

export const FaviconInspector: React.FC<FaviconInspectorProps> = ({
  config,
  onPatch,
  applyToAll = false,
  onToggleApplyToAll,
  logoCount = 0,
  resolvedBackground,
  disabled = false,
}) => {
  /** Local text while the hex/colour field is being typed into. */
  const [colorDraft, setColorDraft] = useState<string | null>(null);

  const allSizesSelected = FAVICON_SIZES.every((size) => config.sizes.includes(size));
  const leanSelected =
    config.sizes.length === 3 && [16, 32, 64].every((size) => config.sizes.includes(size as FaviconSize));

  /**
   * Choosing Custom starts from the colour already in use: the resolved
   * background for Auto, the fixed value for White/Black, the current custom
   * value when re-selected.
   */
  const colorInUse = (): string => {
    if (config.backgroundMode === 'white') return PRESET_COLORS.white;
    if (config.backgroundMode === 'black') return PRESET_COLORS.black;
    if (config.backgroundMode === 'color') return config.backgroundColor ?? PRESET_COLORS.white;
    return toHexColor(resolvedBackground ?? '', PRESET_COLORS.white);
  };

  const storedColor = config.backgroundColor ?? PRESET_COLORS.white;
  const colorText = colorDraft ?? displayColor(storedColor);
  const swatch = toHexColor(colorDraft && isCssColor(colorDraft) ? colorDraft : storedColor, PRESET_COLORS.white);

  const toggleSize = (size: FaviconSize) => {
    const selected = config.sizes.includes(size);
    if (selected && config.sizes.length === 1) return; // keep at least one
    onPatch({
      sizes: selected
        ? config.sizes.filter((entry) => entry !== size)
        : [...config.sizes, size].sort((a, b) => a - b),
    });
  };

  return (
    <div className="flex flex-col gap-[var(--d-section)]">
      <div className="flex flex-col gap-1">
        <h2 className="t-section text-ink">Favicon recipe</h2>
        <p className="short:hidden t-small text-muted">
          {logoCount === 0
            ? 'Settings for the next logos'
            : applyToAll
              ? 'Applied to every logo'
              : 'Applies to the selected logo'}
        </p>
      </div>

      {logoCount > 1 && onToggleApplyToAll && (
        <Checkbox
          checked={applyToAll}
          onChange={onToggleApplyToAll}
          label="Apply to all logos"
          description={`Every one of the ${logoCount} logos uses this recipe.`}
          disabled={disabled}
        />
      )}

      <FieldSection index="01" title="Fit" note="Keep the whole logo. Crop may trim the edges.">
        <ChoiceRow>
          <Choice
            selected={config.fit === 'contain'}
            disabled={disabled}
            onClick={() => onPatch({ fit: 'contain' })}
          >
            Fit inside
          </Choice>
          <Choice
            selected={config.fit === 'cover'}
            disabled={disabled}
            onClick={() => onPatch({ fit: 'cover' })}
          >
            Crop to fill
          </Choice>
        </ChoiceRow>
        <SliderRow label="Padding · Fit inside only" value={`${Math.round(config.padding * 100)}%`}>
          <Slider
            min={0}
            max={30}
            value={Math.round(config.padding * 100)}
            disabled={disabled || config.fit === 'cover'}
            aria-label="Padding"
            onChange={(event) => onPatch({ padding: Number(event.target.value) / 100 })}
          />
        </SliderRow>
      </FieldSection>

      <FieldSection index="02" title="Corner radius" trailing={`${Math.round(config.radius * 100)}%`}>
        <Slider
          min={0}
          max={50}
          value={Math.round(config.radius * 100)}
          disabled={disabled}
          aria-label="Corner radius"
          onChange={(event) => onPatch({ radius: Number(event.target.value) / 100 })}
        />
        <ChoiceRow>
          {RADIUS_PRESETS.map((preset) => (
            <Choice
              key={preset.label}
              disabled={disabled}
              selected={config.radius === preset.value}
              onClick={() => onPatch({ radius: preset.value })}
            >
              {preset.label}
            </Choice>
          ))}
        </ChoiceRow>
      </FieldSection>

      <FieldSection index="03" title="Background" note="Choose Custom to edit the hex color.">
        <ChoiceStack>
          <ChoiceRow>
            {BACKGROUNDS.slice(0, 3).map((option) => (
              <Choice
                key={option.id}
                disabled={disabled}
                selected={config.backgroundMode === option.id}
                onClick={() => onPatch({ backgroundMode: option.id })}
              >
                {option.label}
              </Choice>
            ))}
          </ChoiceRow>
          <ChoiceRow>
            {BACKGROUNDS.slice(3).map((option) => (
              <Choice
                key={option.id}
                disabled={disabled}
                selected={config.backgroundMode === option.id}
                onClick={() =>
                  onPatch(
                    option.id === 'color'
                      ? { backgroundMode: 'color', backgroundColor: colorInUse() }
                      : { backgroundMode: option.id }
                  )
                }
              >
                {option.label}
              </Choice>
            ))}
          </ChoiceRow>
        </ChoiceStack>

        {config.backgroundMode === 'color' ? (
          <div className="flex items-center gap-3">
            <input
              type="color"
              aria-label="Pick custom background colour"
              value={swatch}
              disabled={disabled}
              onChange={(event) => {
                setColorDraft(null);
                onPatch({ backgroundColor: event.target.value.toUpperCase() });
              }}
              className="fieldwork-color-input h-11 w-11 shrink-0 cursor-pointer border border-control bg-surface disabled:cursor-not-allowed"
            />
            <div className="flex h-11 flex-1 items-center rounded-md border border-control bg-surface px-2.5 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink">
              <input
                aria-label="Custom background colour"
                value={colorText}
                disabled={disabled}
                spellCheck={false}
                placeholder="#FFFFFF"
                onFocus={() => setColorDraft(String(storedColor))}
                onBlur={() => {
                  // Keep a valid value, otherwise fall back to what is applied.
                  setColorDraft(null);
                }}
                onChange={(event) => {
                  const next = event.target.value;
                  setColorDraft(next);
                  if (isCssColor(next)) onPatch({ backgroundColor: next });
                }}
                className="w-full min-w-0 bg-transparent t-mono text-ink placeholder:text-muted focus:outline-none disabled:cursor-not-allowed"
              />
            </div>
          </div>
        ) : (
          <ResolvedValue>
            {RESOLVED_BACKGROUNDS[config.backgroundMode]} → {resolvedBackground ?? '#FFFFFF'}
          </ResolvedValue>
        )}
      </FieldSection>

      <FieldSection
        index="04"
        title="Sizes in each .ico"
        note="Raster sizes above the source are skipped."
      >
        <ChoiceStack>
          <ChoiceRow>
            {FAVICON_SIZES.map((size) => (
              <Choice
                key={size}
                mono
                disabled={disabled}
                selected={config.sizes.includes(size)}
                onClick={() => toggleSize(size)}
              >
                {size}
              </Choice>
            ))}
          </ChoiceRow>
          <ChoiceRow>
            <Choice
              disabled={disabled}
              selected={allSizesSelected}
              onClick={() => onPatch({ sizes: [...FAVICON_SIZES] })}
            >
              {allSizesSelected ? 'All sizes ✓' : 'All sizes'}
            </Choice>
            <Choice
              disabled={disabled}
              selected={leanSelected}
              onClick={() => onPatch({ sizes: [16, 32, 64] })}
            >
              Lean · 16–64
            </Choice>
          </ChoiceRow>
        </ChoiceStack>
      </FieldSection>
    </div>
  );
};
