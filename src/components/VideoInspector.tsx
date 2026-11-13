import React, { useRef, useState } from 'react';
import { Check } from 'lucide-react';
import type { VideoConfig, VideoQuality } from '../types';
import { ReadOnlyChoice, ReadOnlyChoiceRow } from './ui/Choice';
import { FieldNote, FieldSection } from './ui/FieldSection';
import { Checkbox } from './ui/Checkbox';
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

const WIDTHS = [720, 1080, 2160];

/** Borderless value that still reads as plain text, but is editable. */
const InlineValue = React.forwardRef<
  HTMLInputElement,
  {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    'aria-label': string;
    numeric?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
  }
>(({ value, onChange, disabled, numeric = false, ...rest }, ref) => (
  <input
    {...rest}
    ref={ref}
    value={value}
    disabled={disabled}
    inputMode={numeric ? 'numeric' : undefined}
    onChange={(event) => onChange(numeric ? event.target.value.replace(/[^\d]/g, '') : event.target.value)}
    className="w-full min-w-0 bg-transparent t-control text-ink placeholder:text-muted focus:outline-none disabled:cursor-not-allowed"
  />
));

InlineValue.displayName = 'InlineValue';

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
 * Video recipe. At rest the recipe reads as a sequence of underline choices
 * with resolved values; while a batch runs it is replaced by the locked
 * read-only record.
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
            value: config.outputFormat === 'webm' ? 'WebM / VP9' : config.outputFormat === 'original' ? 'Original' : 'MP4 / H.264 + AAC',
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
    config.destinationMode === 'subfolder'
      ? config.subfolderName
      : config.destinationMode === 'suffix'
        ? config.suffix
        : (config.customFolderPath ?? '');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="t-section text-ink">Video recipe</h2>
        <p className="t-small text-muted">Shared settings · applies to every video</p>
      </div>

      <FieldSection index="01" title="Maximum width">
        <div className="flex h-11 items-center">
          <InlineValue
            ref={widthRef}
            aria-label="Maximum width"
            numeric
            value={widthValue}
            onFocus={() => setDraft(String(config.maxWidth))}
            onBlur={() => setDraft(null)}
            onChange={(raw) => {
              setDraft(raw);
              const parsed = Number(raw);
              if (raw && Number.isFinite(parsed) && parsed > 0) onCustomWidthChange(parsed);
            }}
          />
        </div>
        <ReadOnlyChoiceRow>
          {WIDTHS.map((width) => (
            <ReadOnlyChoice
              key={width}
              selected={!widthIsCustom && config.maxWidth === width}
              onClick={() => onSelectWidth(width)}
              role="button"
            >
              {width}
            </ReadOnlyChoice>
          ))}
          <ReadOnlyChoice
            selected={widthIsCustom}
            role="button"
            onClick={() => {
              onSelectCustomWidth();
              widthRef.current?.focus();
            }}
          >
            Custom
          </ReadOnlyChoice>
        </ReadOnlyChoiceRow>
      </FieldSection>

      <div className="flex items-center gap-2">
        <Check className="h-4 w-4 shrink-0 text-ink" strokeWidth={2.5} />
        <span className="t-control text-ink">Smaller videos are never enlarged</span>
      </div>

      <FieldSection index="02" title="Compression">
        <ReadOnlyChoiceRow>
          {QUALITY.map((option) => (
            <ReadOnlyChoice
              key={option.id}
              selected={config.quality === option.id}
              role="button"
              onClick={() => onPatch({ quality: option.id })}
            >
              {option.label}
            </ReadOnlyChoice>
          ))}
        </ReadOnlyChoiceRow>
        <FieldNote>{QUALITY_NOTES[config.quality]}</FieldNote>
      </FieldSection>

      <FieldSection index="03" title="Output format">
        <ReadOnlyChoiceRow>
          <ReadOnlyChoice
            selected={config.outputFormat === 'mp4'}
            role="button"
            onClick={() => onPatch({ outputFormat: 'mp4' })}
          >
            MP4 / H.264
          </ReadOnlyChoice>
          <ReadOnlyChoice
            selected={config.outputFormat === 'webm'}
            role="button"
            onClick={() => onPatch({ outputFormat: 'webm' })}
          >
            WebM / VP9
          </ReadOnlyChoice>
          <ReadOnlyChoice
            selected={config.outputFormat === 'original'}
            role="button"
            onClick={() => onPatch({ outputFormat: 'original' })}
          >
            Original
          </ReadOnlyChoice>
        </ReadOnlyChoiceRow>
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

      <FieldSection index="04" title="Save new files to">
        <ReadOnlyChoiceRow>
          <ReadOnlyChoice
            selected={config.destinationMode === 'subfolder'}
            role="button"
            onClick={() => onPatch({ destinationMode: 'subfolder' })}
          >
            Subfolder
          </ReadOnlyChoice>
          <ReadOnlyChoice
            selected={config.destinationMode === 'suffix'}
            role="button"
            onClick={() => onPatch({ destinationMode: 'suffix' })}
          >
            Suffix
          </ReadOnlyChoice>
          <ReadOnlyChoice
            selected={config.destinationMode === 'custom_folder'}
            role="button"
            onClick={() => onPatch({ destinationMode: 'custom_folder' })}
          >
            Custom
          </ReadOnlyChoice>
        </ReadOnlyChoiceRow>
        <div className="flex h-11 items-center">
          <InlineValue
            aria-label="Destination"
            value={destinationValue}
            onChange={(value) => {
              if (config.destinationMode === 'subfolder') onPatch({ subfolderName: value });
              else if (config.destinationMode === 'suffix') onPatch({ suffix: value });
              else onPatch({ customFolderPath: value });
            }}
          />
        </div>
        <FieldNote>Next to each source. Originals stay untouched.</FieldNote>
        <FieldNote>MP4 uses H.264 + AAC. WebM uses VP9 + Opus.</FieldNote>
      </FieldSection>
    </div>
  );
};
