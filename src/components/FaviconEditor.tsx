import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import type { FaviconConfig, FaviconItem, ImageItem } from '../types';
import { Button } from './ui/Button';
import { Choice, ChoiceRow } from './ui/Choice';
import { FieldLabel } from './ui/FieldSection';
import { TextInput } from './ui/TextInput';
import { FolderPickerField } from './ui/FolderPickerField';
import { QueueActions } from './QueueActions';
import { cx } from '../utils/cx';
import { formatBytes } from '../utils/formatters';
import { getCachedThumbnail } from '../utils/thumbnailCache';

interface FaviconPreviewState {
  dataUrl: string;
  resolvedBackground: string;
}

export interface FaviconEditorProps {
  items: FaviconItem[];
  selectedItem: FaviconItem | null;
  config: FaviconConfig;
  onPatchConfig: (patch: Partial<FaviconConfig>) => void;
  onSelectItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onClearQueue: () => void;
  onAddItems: (items: ImageItem[]) => void;
  onResetRecipe: () => void;
  /** Reports the background the renderer resolved for `Auto`. */
  onResolvedBackground?: (hex: string) => void;
  disabled?: boolean;
}

/**
 * Favicon studio: 256 px master preview with a dashed safe area, the sizes the
 * .ico will carry, the logo strip and the naming / destination blocks.
 */
export const FaviconEditor: React.FC<FaviconEditorProps> = ({
  items,
  selectedItem,
  config,
  onPatchConfig,
  onSelectItem,
  onRemoveItem,
  onClearQueue,
  onAddItems,
  onResetRecipe,
  onResolvedBackground,
  disabled = false,
}) => {
  const [preview, setPreview] = useState<FaviconPreviewState | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    if (!selectedItem || !window.electronAPI) {
      setPreview(null);
      return;
    }
    const requestId = ++requestRef.current;
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        const result = await window.electronAPI!.renderFaviconPreview(selectedItem.path, config);
        if (cancelled || requestId !== requestRef.current) return;
        if (result.success && result.dataUrl) {
          const resolved = result.resolvedBackground ?? '#FFFFFF';
          setPreview({ dataUrl: result.dataUrl, resolvedBackground: resolved });
          setPreviewError(null);
          onResolvedBackground?.(resolved);
        } else {
          setPreview(null);
          setPreviewError(result.error || 'Could not render preview.');
        }
      } catch (err) {
        if (cancelled || requestId !== requestRef.current) return;
        setPreview(null);
        setPreviewError(err instanceof Error ? err.message : 'Could not render preview.');
      }
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [selectedItem, config, onResolvedBackground]);

  /** One folder for the whole batch, chosen from an explicit action. */
  const chooseFolder = async () => {
    const folder = await window.electronAPI?.selectDestinationFolder?.();
    if (folder) onPatchConfig({ destinationMode: 'custom_folder', customFolderPath: folder });
  };

  const sourceBaseName = useMemo(
    () => (selectedItem ? selectedItem.name.replace(/\.[^.]+$/, '') : ''),
    [selectedItem]
  );

  // Source thumbnails for the filmstrip (cached across the editor and the queue).
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const loaded = await Promise.all(
        items.map(async (item) => [item.id, await getCachedThumbnail(item.path)] as const)
      );
      if (cancelled) return;
      setThumbs((prev) => {
        const next = { ...prev };
        for (const [id, url] of loaded) if (url) next[id] = url;
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const sortedItems = items;
  const previewSizes = useMemo(
    () => config.sizes.filter((size) => size <= 64),
    [config.sizes]
  );

  if (!selectedItem) return null;

  const collisionPreview = sortedItems
    .map((item, index) =>
      config.nameMode === 'source'
        ? `${item.name.replace(/\.[^.]+$/, '')}.ico`
        : index === 0
          ? 'favicon.ico'
          : `favicon-${index + 1}.ico`
    )
    .join(' · ');

  return (
    <div className="flex flex-col gap-6">
      {/* Master preview + resolved details */}
      <div className="flex gap-4">
        <div className="flex h-64 w-[330px] shrink-0 items-center justify-center bg-panel">
          <div className="relative h-64 w-64">
            {preview ? (
              <img
                src={preview.dataUrl}
                alt={`${selectedItem.name} preview`}
                className="favicon-checkerboard favicon-preview-fade h-64 w-64 object-contain"
              />
            ) : (
              <div className="favicon-checkerboard flex h-64 w-64 items-center justify-center">
                <ImageIcon className="h-10 w-10 text-muted" strokeWidth={1.5} />
              </div>
            )}
            <div
              className="pointer-events-none absolute border border-dashed border-line"
              style={{ inset: `${config.padding * 100}%` }}
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="t-section truncate text-ink">{selectedItem.name}</h3>
            <p className="t-small text-muted">
              {selectedItem.originalWidth ?? '—'} × {selectedItem.originalHeight ?? '—'} px ·{' '}
              {formatBytes(selectedItem.size)}
            </p>
            <p className="t-small text-muted">256 px master · live preview</p>
          </div>

          <TextInput
            value={sourceBaseName}
            readOnly
            aria-label="Selected logo"
            leading={<ImageIcon className="h-4 w-4 shrink-0 text-muted" strokeWidth={2} />}
          />

          <div className="flex flex-col gap-3">
            <FieldLabel>Actual sizes</FieldLabel>
            <div className="flex items-end gap-5">
              {previewSizes.map((size) => (
                <div key={size} className="flex flex-col items-center gap-2">
                  {preview ? (
                    <img
                      src={preview.dataUrl}
                      alt={`${size} px`}
                      width={size}
                      height={size}
                      style={{ imageRendering: size <= 48 ? 'pixelated' : 'auto' }}
                    />
                  ) : (
                    <span style={{ width: size, height: size }} className="bg-panel" />
                  )}
                  <span className="t-small text-muted">{size} px</span>
                </div>
              ))}
            </div>
          </div>

          <Button variant="secondary" size="md" className="self-start" onClick={onResetRecipe} disabled={disabled}>
            Reset recipe
          </Button>
        </div>
      </div>

      {/* Logo strip */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          {sortedItems.map((item, index) => {
            const active = item.id === selectedItem.id;
            return (
              <React.Fragment key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelectItem(item.id)}
                  onDoubleClick={() => onRemoveItem(item.id)}
                  title={`Remove ${item.name}`}
                  className={cx(
                    'flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden border bg-panel transition-colors',
                    active ? 'border-signal' : 'border-control hover:border-ink'
                  )}
                >
                  {thumbs[item.id] ? (
                    <img
                      src={thumbs[item.id]}
                      alt={item.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-muted" strokeWidth={2} />
                  )}
                </button>
                {active && (
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="t-control truncate text-ink">
                      <span className="t-mono text-muted">
                        {String(index + 1).padStart(2, '0')} / {String(sortedItems.length).padStart(2, '0')} ·{' '}
                      </span>
                      {item.name}
                    </span>
                    <span className="t-small text-muted">
                      {sortedItems.length > 1
                        ? `Select a logo. The recipe applies to all ${sortedItems.length}.`
                        : 'Select a logo. The recipe applies to every logo.'}
                    </span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Naming and destination */}
      <div className="flex gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <FieldLabel>Output name</FieldLabel>
          <ChoiceRow>
            <Choice
              selected={config.nameMode === 'favicon'}
              disabled={disabled}
              onClick={() => onPatchConfig({ nameMode: 'favicon' })}
            >
              favicon.ico
            </Choice>
            <Choice
              selected={config.nameMode === 'source'}
              disabled={disabled}
              onClick={() => onPatchConfig({ nameMode: 'source' })}
            >
              Source name
            </Choice>
          </ChoiceRow>
          <p className="t-small text-muted">{collisionPreview}</p>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <FieldLabel>Save new files to</FieldLabel>
          <ChoiceRow>
            <Choice
              selected={config.destinationMode === 'subfolder'}
              disabled={disabled}
              onClick={() => onPatchConfig({ destinationMode: 'subfolder' })}
            >
              Subfolder
            </Choice>
            <Choice
              selected={config.destinationMode === 'same_folder'}
              disabled={disabled}
              onClick={() => onPatchConfig({ destinationMode: 'same_folder' })}
            >
              Source
            </Choice>
            <Choice
              selected={config.destinationMode === 'custom_folder'}
              disabled={disabled}
              onClick={() => void chooseFolder()}
            >
              Custom
            </Choice>
          </ChoiceRow>
          {config.destinationMode === 'custom_folder' ? (
            <FolderPickerField
              path={config.customFolderPath}
              onPick={() => void chooseFolder()}
              disabled={disabled}
            />
          ) : (
            <TextInput
              aria-label="Destination"
              disabled={disabled}
              value={config.destinationMode === 'subfolder' ? config.subfolderName : sourceBaseName}
              onChange={(event) => {
                if (config.destinationMode === 'subfolder')
                  onPatchConfig({ subfolderName: event.target.value });
              }}
            />
          )}
        </div>
      </div>

      {/* Batch actions */}
      <div className="flex items-center gap-4">
        <Button variant="secondary" size="md" className="w-[164px]" onClick={onClearQueue} disabled={disabled}>
          Clear queue ({items.length})
        </Button>
        <QueueActions
          onSelectFiles={async () => {
            const picked = await window.electronAPI?.selectFiles();
            if (picked?.length) onAddItems(picked);
          }}
          onSelectFolder={async () => {
            const picked = await window.electronAPI?.selectFolder();
            if (picked?.length) onAddItems(picked);
          }}
          disabled={disabled}
        />
      </div>

      {previewError && <p className="t-small text-danger">{previewError}</p>}
    </div>
  );
};
