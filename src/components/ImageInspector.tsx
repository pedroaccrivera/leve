import React, { useRef, useState } from 'react';
import type { CompressionLevel, OutputFormat, OutputDestinationMode, ResizeConfig } from '../types';
import { Choice, ChoiceRow, ChoiceStack } from './ui/Choice';
import { FieldSection } from './ui/FieldSection';
import { Checkbox } from './ui/Checkbox';
import { TextInput } from './ui/TextInput';
import { presetNameFor, WIDTH_PRESETS } from '../utils/presets';

const COMPRESSION: { id: CompressionLevel; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'aggressive', label: 'Smallest' },
  { id: 'lossless', label: 'Lossless' },
];

const COMPRESSION_NOTES: Record<CompressionLevel, string> = {
  light: 'Light: keeps the most detail, trims the easy weight.',
  balanced: 'Balanced: less weight, without the hard edges.',
  aggressive: 'Smallest: the lightest file that still reads well.',
  lossless: 'Lossless: identical pixels, smaller container.',
};

const FORMATS: { id: OutputFormat; label: string }[] = [
  { id: 'original', label: 'Original' },
  { id: 'jpeg', label: 'JPG' },
  { id: 'png', label: 'PNG' },
  { id: 'webp', label: 'WebP' },
];

const DESTINATIONS: { id: OutputDestinationMode; label: string }[] = [
  { id: 'subfolder', label: 'Subfolder' },
  { id: 'suffix', label: 'Suffix' },
  { id: 'custom_folder', label: 'Custom' },
];

export interface ImageInspectorProps {
  config: ResizeConfig;
  onPatch: (patch: Partial<ResizeConfig>) => void;
  widthIsCustom: boolean;
  onSelectPreset: (width: number) => void;
  onSelectCustom: () => void;
  onCustomWidthChange: (width: number) => void;
  disabled?: boolean;
}

/**
 * Image recipe (batch inspector).
 *
 * Width field behaviour: typing switches the selection to `Custom`, choosing
 * `Custom` focuses the field, and the typed value survives restarts.
 */
export const ImageInspector: React.FC<ImageInspectorProps> = ({
  config,
  onPatch,
  widthIsCustom,
  onSelectPreset,
  onSelectCustom,
  onCustomWidthChange,
  disabled = false,
}) => {
  const widthRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string | null>(null);

  const presetName = presetNameFor(config.targetWidth);
  const widthValue = draft ?? `${config.targetWidth} px${presetName ? ` · ${presetName}` : ''}`;

  const handleSelectCustom = () => {
    onSelectCustom();
    widthRef.current?.focus();
    widthRef.current?.select();
  };

  const destinationValue =
    config.destinationMode === 'subfolder'
      ? config.subfolderName
      : config.destinationMode === 'suffix'
        ? config.suffix
        : (config.customFolderPath ?? '');

  const handleDestinationChange = (value: string) => {
    if (config.destinationMode === 'subfolder') onPatch({ subfolderName: value });
    else if (config.destinationMode === 'suffix') onPatch({ suffix: value });
    else onPatch({ customFolderPath: value });
  };

  const pickFolder = async () => {
    const folder = await window.electronAPI?.selectDestinationFolder?.();
    if (folder) onPatch({ customFolderPath: folder, destinationMode: 'custom_folder' });
  };

  return (
    <div className="flex flex-col gap-[var(--d-section)]">
      <div className="flex flex-col gap-1">
        <h2 className="t-section text-ink">Image recipe</h2>
        <p className="short:hidden t-small text-muted">Shared settings · applies to every image</p>
      </div>

      <FieldSection index="01" title="Output width">
        <TextInput
          ref={widthRef}
          value={widthValue}
          inputMode="numeric"
          disabled={disabled}
          aria-label="Output width"
          onFocus={() => setDraft(String(config.targetWidth))}
          onBlur={() => setDraft(null)}
          onChange={(event) => {
            const raw = event.target.value.replace(/[^\d]/g, '');
            setDraft(raw);
            const parsed = Number(raw);
            if (raw && Number.isFinite(parsed) && parsed > 0) onCustomWidthChange(parsed);
          }}
        />
        <ChoiceStack>
          <ChoiceRow>
            {WIDTH_PRESETS.slice(0, 3).map((preset) => (
              <Choice
                key={preset.width}
                mono
                disabled={disabled}
                selected={!widthIsCustom && config.targetWidth === preset.width}
                onClick={() => onSelectPreset(preset.width)}
              >
                {preset.width}
              </Choice>
            ))}
          </ChoiceRow>
          <ChoiceRow>
            {WIDTH_PRESETS.slice(3).map((preset) => (
              <Choice
                key={preset.width}
                mono
                disabled={disabled}
                selected={!widthIsCustom && config.targetWidth === preset.width}
                onClick={() => onSelectPreset(preset.width)}
              >
                {preset.width}
              </Choice>
            ))}
            <Choice mono disabled={disabled} selected={widthIsCustom} onClick={handleSelectCustom}>
              Custom
            </Choice>
          </ChoiceRow>
        </ChoiceStack>
      </FieldSection>

      <Checkbox
        checked={config.withoutEnlargement}
        disabled={disabled}
        onChange={(checked) => onPatch({ withoutEnlargement: checked })}
        label="Never enlarge smaller files"
      />

      <FieldSection
        index="02"
        title="Compression"
        note={`${COMPRESSION_NOTES[config.compressionLevel]}\nLossless is available for PNG and WebP.`}
      >
        <ChoiceRow>
          {COMPRESSION.map((option) => (
            <Choice
              key={option.id}
              disabled={disabled}
              selected={config.compressionLevel === option.id}
              onClick={() => onPatch({ compressionLevel: option.id })}
            >
              {option.label}
            </Choice>
          ))}
        </ChoiceRow>
      </FieldSection>

      <FieldSection index="03" title="Output format">
        <ChoiceRow>
          {FORMATS.map((option) => (
            <Choice
              key={option.id}
              disabled={disabled}
              selected={config.outputFormat === option.id}
              onClick={() => onPatch({ outputFormat: option.id })}
            >
              {option.label}
            </Choice>
          ))}
        </ChoiceRow>
      </FieldSection>

      <Checkbox
        checked={config.stripMetadata}
        disabled={disabled}
        onChange={(checked) => onPatch({ stripMetadata: checked })}
        label="Remove metadata"
        description="Remove EXIF, camera details and GPS"
      />

      <FieldSection
        index="04"
        title="Save new files to"
        note="Next to each source. Originals stay untouched."
      >
        <ChoiceRow>
          {DESTINATIONS.map((option) => (
            <Choice
              key={option.id}
              disabled={disabled}
              selected={config.destinationMode === option.id}
              onClick={() => onPatch({ destinationMode: option.id })}
            >
              {option.label}
            </Choice>
          ))}
        </ChoiceRow>
        <TextInput
          value={destinationValue}
          disabled={disabled}
          aria-label="Destination"
          onChange={(event) => handleDestinationChange(event.target.value)}
          onFocus={() => {
            if (config.destinationMode === 'custom_folder') void pickFolder();
          }}
        />
      </FieldSection>
    </div>
  );
};
