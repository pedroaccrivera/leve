import React, { useRef, useState } from 'react';
import type { VideoConfig, VideoQuality } from '../types';
import { Choice, ChoiceRow } from './ui/Choice';
import { FieldSection } from './ui/FieldSection';
import { Checkbox } from './ui/Checkbox';
import { TextInput } from './ui/TextInput';
import { FolderPickerField } from './ui/FolderPickerField';
import { RecipeUsed } from './BatchReport';

const QUALITY: { id: VideoQuality; label: string }[] = [
  { id: 'light', label: 'Good quality' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'aggressive', label: 'Smallest' },
];

const QUALITY_NOTES: Record<VideoQuality, string> = {
  light: 'Good quality: keeps more detail for larger screens.',
  balanced: 'Balanced quality for smaller web videos.',
  aggressive: 'Smallest: the lightest file that still reads well.',
};

/** Maximum-width presets are widths (720/1080/2160 are the heights of these). */
const WIDTHS = [1280, 1920, 3840];

export interface VideoInspectorProps {
  config: VideoConfig;
  onPatch: (patch: Partial<VideoConfig>) => void;
  widthIsCustom: boolean;
  onSelectWidth: (width: number) => void;
  onSelectCustomWidth: () => void;
  onCustomWidthChange: (width: number) => void;
  /** True while a batch runs: the recipe becomes a read-only record. */
  locked?: boolean;
}

/**
 * Video recipe.
 *
 * Uses the same control vocabulary as the image and favicon recipes: boxed
 * choices, boxed values and boxed checkboxes. While a batch runs it is
 * replaced by the locked read-only record (shared with the other tabs).
 */
export const VideoInspector: React.FC<VideoInspectorProps> = ({
  config,
  onPatch,
  widthIsCustom,
  onSelectWidth,
  onSelectCustomWidth,
  onCustomWidthChange,
  locked = false,
}) => {
  const widthRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string | null>(null);

  if (locked) {
    return (
      <RecipeUsed
        title="Recipe in use · locked"
        subtitle="Settings unlock when this batch finishes."
        rows={[
          { label: 'Maximum width', value: `${config.maxWidth} px` },
          { label: 'Smaller sources', value: 'Kept at their original size' },
          { label: 'Compression', value: QUALITY.find((q) => q.id === config.quality)?.label ?? 'Balanced' },
          {
            label: 'Output format',
            value:
              config.outputFormat === 'webm'
                ? 'WebM / VP9'
                : config.outputFormat === 'original'
                  ? 'Original'
                  : 'MP4 / H.264 + AAC',
          },
          { label: 'Metadata', value: config.stripMetadata ? 'Stripped' : 'Kept' },
          {
            label: 'Destination',
            value:
              config.destinationMode === 'subfolder'
                ? `Subfolder · ${config.subfolderName}`
                : config.destinationMode === 'suffix'
                  ? `Suffix · ${config.suffix}`
                  : `Custom folder · ${config.customFolderPath || '—'}`,
          },
        ]}
        callout="Originals stay untouched."
        calloutBody="The queue continues if one file fails. Completed files stay saved."
      />
    );
  }

  const widthValue = draft ?? (widthIsCustom ? String(config.maxWidth) : `${config.maxWidth} px · maximum width`);

  const destinationValue =
    config.destinationMode === 'subfolder' ? config.subfolderName : config.suffix;

  const handleDestinationChange = (value: string) => {
    if (config.destinationMode === 'subfolder') onPatch({ subfolderName: value });
    else onPatch({ suffix: value });
  };

  /** One folder for the whole batch, chosen from an explicit action. */
  const chooseFolder = async () => {
    const folder = await window.electronAPI?.selectDestinationFolder?.();
    if (folder) onPatch({ destinationMode: 'custom_folder', customFolderPath: folder });
  };

  return (
    <div className="flex flex-col gap-[var(--d-section)]">
      <div className="flex flex-col gap-1">
        <h2 className="t-section text-ink">Video recipe</h2>
        <p className="short:hidden t-small text-muted">Shared settings · applies to every video</p>
      </div>

      <FieldSection index="01" title="Maximum width">
        <TextInput
          ref={widthRef}
          value={widthValue}
          inputMode="numeric"
          aria-label="Maximum width"
          onFocus={() => setDraft(String(config.maxWidth))}
          onBlur={() => setDraft(null)}
          onChange={(event) => {
            const raw = event.target.value.replace(/[^\d]/g, '');
            setDraft(raw);
            const parsed = Number(raw);
            if (raw && Number.isFinite(parsed) && parsed > 0) onCustomWidthChange(parsed);
          }}
        />
        <ChoiceRow>
          {WIDTHS.map((width) => (
            <Choice
              key={width}
              mono
              selected={!widthIsCustom && config.maxWidth === width}
              onClick={() => onSelectWidth(width)}
            >
              {width}
            </Choice>
          ))}
          <Choice
            mono
            selected={widthIsCustom}
            onClick={() => {
              onSelectCustomWidth();
              widthRef.current?.focus();
              widthRef.current?.select();
            }}
          >
            Custom
          </Choice>
        </ChoiceRow>
      </FieldSection>

      <Checkbox
        checked={config.withoutEnlargement}
        onChange={(checked) => onPatch({ withoutEnlargement: checked })}
        label="Never enlarge smaller videos"
      />

      <FieldSection index="02" title="Compression" note={QUALITY_NOTES[config.quality]}>
        <ChoiceRow>
          {QUALITY.map((option) => (
            <Choice
              key={option.id}
              selected={config.quality === option.id}
              onClick={() => onPatch({ quality: option.id })}
            >
              {option.label}
            </Choice>
          ))}
        </ChoiceRow>
      </FieldSection>

      <FieldSection index="03" title="Output format">
        <ChoiceRow>
          <Choice selected={config.outputFormat === 'mp4'} onClick={() => onPatch({ outputFormat: 'mp4' })}>
            MP4 / H.264
          </Choice>
          <Choice selected={config.outputFormat === 'webm'} onClick={() => onPatch({ outputFormat: 'webm' })}>
            WebM / VP9
          </Choice>
          <Choice
            selected={config.outputFormat === 'original'}
            onClick={() => onPatch({ outputFormat: 'original' })}
          >
            Original
          </Choice>
        </ChoiceRow>
      </FieldSection>

      <Checkbox
        checked={config.stripMetadata}
        onChange={(checked) => onPatch({ stripMetadata: checked })}
        label="Remove metadata"
        description="Strip embedded metadata"
      />

      <Checkbox
        checked={config.muteAudio}
        onChange={(checked) => onPatch({ muteAudio: checked })}
        label="Mute audio"
        description="Keep the original audio"
      />

      <FieldSection
        index="04"
        title="Save new files to"
        note={
          config.destinationMode === 'custom_folder'
            ? 'Every file in the batch is saved to this folder. Originals stay untouched.\nMP4 uses H.264 + AAC. WebM uses VP9 + Opus.'
            : 'Next to each source. Originals stay untouched.\nMP4 uses H.264 + AAC. WebM uses VP9 + Opus.'
        }
      >
        <ChoiceRow>
          <Choice
            selected={config.destinationMode === 'subfolder'}
            onClick={() => onPatch({ destinationMode: 'subfolder' })}
          >
            Subfolder
          </Choice>
          <Choice
            selected={config.destinationMode === 'suffix'}
            onClick={() => onPatch({ destinationMode: 'suffix' })}
          >
            Suffix
          </Choice>
          <Choice selected={config.destinationMode === 'custom_folder'} onClick={() => void chooseFolder()}>
            Custom
          </Choice>
        </ChoiceRow>
        {config.destinationMode === 'custom_folder' ? (
          <FolderPickerField
            path={config.customFolderPath}
            onPick={() => void chooseFolder()}
          />
        ) : (
          <TextInput
            value={destinationValue}
            aria-label="Destination"
            onChange={(event) => handleDestinationChange(event.target.value)}
          />
        )}
      </FieldSection>
    </div>
  );
};
