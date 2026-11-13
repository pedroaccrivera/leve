import React from 'react';
import type { FaviconConfig, FaviconSize } from '../types';
import { FAVICON_SIZES } from '../types';
import { Choice, ChoiceRow } from './ui/Choice';
import { FieldNote, FieldSection } from './ui/FieldSection';
import { Slider, SliderRow } from './ui/Slider';
import { ResolvedValue } from './ui/TextInput';

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

export interface FaviconInspectorProps {
  config: FaviconConfig;
  onPatch: (patch: Partial<FaviconConfig>) => void;
  /** Resolved hex reported by the preview render (`Auto → #FFFFFF`). */
  resolvedBackground?: string;
  disabled?: boolean;
}

export const FaviconInspector: React.FC<FaviconInspectorProps> = ({
  config,
  onPatch,
  resolvedBackground,
  disabled = false,
}) => {
  const allSizesSelected = FAVICON_SIZES.every((size) => config.sizes.includes(size));
  const leanSelected =
    config.sizes.length === 3 && [16, 32, 64].every((size) => config.sizes.includes(size as FaviconSize));

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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="t-section text-ink">Favicon recipe</h2>
        <p className="t-small text-muted">Shared settings · applies to every logo</p>
      </div>

      <FieldSection index="01" title="Fit">
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
        <FieldNote>Keep the whole logo. Crop may trim the edges.</FieldNote>
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

      <FieldSection index="03" title="Background">
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
              onClick={() => onPatch({ backgroundMode: option.id })}
            >
              {option.label}
            </Choice>
          ))}
        </ChoiceRow>

        {config.backgroundMode === 'color' ? (
          <div className="flex items-center gap-3">
            <span
              className="h-11 w-11 shrink-0 border border-control"
              style={{ backgroundColor: config.backgroundColor }}
              aria-hidden="true"
            />
            <div className="flex h-11 flex-1 items-center rounded-md border border-control bg-surface px-2.5">
              <input
                aria-label="Custom background colour"
                value={config.backgroundColor}
                disabled={disabled}
                onChange={(event) => onPatch({ backgroundColor: event.target.value })}
                className="w-full min-w-0 bg-transparent t-mono text-ink uppercase focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <ResolvedValue>
            {RESOLVED_BACKGROUNDS[config.backgroundMode]} → {resolvedBackground ?? '#FFFFFF'}
          </ResolvedValue>
        )}
        <FieldNote>Choose Custom to edit the hex color.</FieldNote>
      </FieldSection>

      <FieldSection index="04" title="Sizes in each .ico">
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
        <FieldNote>Raster sizes above the source are skipped.</FieldNote>
      </FieldSection>
    </div>
  );
};
