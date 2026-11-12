import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Crop,
  FileImage,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Sparkles,
  Square,
  Wand2,
} from 'lucide-react';
import type {
  FaviconBackgroundMode,
  FaviconConfig,
  FaviconItem,
  FaviconPreviewResult,
} from '../types';
import { formatBytes, formatDimensions } from '../utils/formatters';
import { getCachedThumbnail } from '../utils/thumbnailCache';

const HEX_PATTERN = /^#?([0-9a-f]{6})$/i;

export function isVectorFile(nameOrPath?: string): boolean {
  return Boolean(nameOrPath && nameOrPath.toLowerCase().endsWith('.svg'));
}

interface FaviconEditorProps {
  items: FaviconItem[];
  selectedItem: FaviconItem | null;
  config: FaviconConfig;
  onChangeConfig: (config: FaviconConfig) => void;
  onSelectItem: (id: string) => void;
  disabled?: boolean;
}

const BACKGROUND_OPTIONS: { id: FaviconBackgroundMode; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'white', label: 'White' },
  { id: 'black', label: 'Black' },
  { id: 'color', label: 'Custom' },
  { id: 'transparent', label: 'Transparent' },
];

const CONTEXT_SIZES = [
  { size: 16, label: 'Tab' },
  { size: 32, label: 'Bookmark' },
  { size: 48, label: 'App' },
] as const;

const FaviconThumb: React.FC<{ item: FaviconItem }> = ({ item }) => {
  const [thumb, setThumb] = useState<string | null>(item.previewUrl || null);

  useEffect(() => {
    let mounted = true;
    if (!thumb) {
      getCachedThumbnail(item.path).then((data) => {
        if (mounted && data) setThumb(data);
      });
    }
    return () => {
      mounted = false;
    };
  }, [item.path, thumb]);

  if (!thumb) {
    return <FileImage className="w-4 h-4 text-slate-400 dark:text-slate-500" />;
  }

  return (
    <img
      src={thumb}
      alt=""
      className="h-full w-full object-cover"
      loading="lazy"
      draggable={false}
    />
  );
};

export const FaviconEditor: React.FC<FaviconEditorProps> = ({
  items,
  selectedItem,
  config,
  onChangeConfig,
  onSelectItem,
  disabled = false,
}) => {
  const [preview, setPreview] = useState<FaviconPreviewResult | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [hexDraft, setHexDraft] = useState(config.backgroundColor || '#ffffff');
  const requestRef = useRef(0);
  const previewPathRef = useRef<string | null>(null);

  useEffect(() => {
    setHexDraft(config.backgroundColor || '#ffffff');
  }, [config.backgroundColor]);

  const update = (patch: Partial<FaviconConfig>) =>
    onChangeConfig({ ...config, ...patch });

  const isContain = config.fit === 'contain';
  const paddingPercent = Math.round(config.padding * 100);
  const paddingPx = Math.round(256 * config.padding);
  const selectedIndex = items.findIndex((item) => item.id === selectedItem?.id);
  const displayIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const canStepBack = selectedIndex > 0;
  const canStepForward = selectedIndex >= 0 && selectedIndex < items.length - 1;

  const stepSelection = (direction: -1 | 1) => {
    const next = items[selectedIndex + direction];
    if (next) onSelectItem(next.id);
  };

  useEffect(() => {
    if (!selectedItem || !window.electronAPI) {
      setPreview(null);
      setPreviewError(selectedItem ? 'Electron engine connecting...' : null);
      setIsRendering(false);
      return;
    }

    let cancelled = false;
    const requestId = ++requestRef.current;
    if (previewPathRef.current !== selectedItem.path) {
      previewPathRef.current = selectedItem.path;
      setPreview(null);
    }
    setIsRendering(true);
    setPreviewError(null);

    const timer = window.setTimeout(async () => {
      try {
        const result = await window.electronAPI!.renderFaviconPreview(
          selectedItem.path,
          config
        );
        if (cancelled || requestId !== requestRef.current) return;
        if (result.success) {
          setPreview(result);
        } else {
          setPreview(null);
          setPreviewError(result.error || 'Could not render preview.');
        }
      } catch (err: any) {
        if (cancelled || requestId !== requestRef.current) return;
        setPreview(null);
        setPreviewError(err?.message || 'Could not render preview.');
      } finally {
        if (!cancelled && requestId === requestRef.current) {
          setIsRendering(false);
        }
      }
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    selectedItem?.path,
    config.fit,
    config.padding,
    config.backgroundMode,
    config.backgroundColor,
    config.sizes,
  ]);

  const sourceWidth = selectedItem?.originalWidth ?? 0;
  const sourceHeight = selectedItem?.originalHeight ?? 0;
  const isVector = isVectorFile(selectedItem?.name ?? selectedItem?.path);
  const usefulDimension =
    sourceWidth && sourceHeight
      ? isContain
        ? Math.max(sourceWidth, sourceHeight)
        : Math.min(sourceWidth, sourceHeight)
      : 0;
  const smallestSelected = Math.min(...config.sizes);
  const largestSelected = Math.max(...config.sizes);
  const tooSmall =
    !isVector && usefulDimension > 0 && usefulDimension < smallestSelected;
  const skippedSizes =
    !isVector && usefulDimension > 0
      ? config.sizes.filter((size) => size > usefulDimension)
      : [];

  const autoLabel =
    preview?.resolvedBackground === '#000000'
      ? 'black'
      : preview?.resolvedBackground === '#ffffff'
      ? 'white'
      : null;

  const backgroundLabel = !isContain
    ? 'Image fills square'
    : config.backgroundMode === 'auto'
    ? preview
      ? `Auto · ${autoLabel}`
      : 'Auto'
    : config.backgroundMode === 'white'
    ? 'White'
    : config.backgroundMode === 'black'
    ? 'Black'
    : config.backgroundMode === 'transparent'
    ? 'Transparent'
    : `Custom · ${config.backgroundColor || '#ffffff'}`;

  const backgroundSwatchStyle =
    config.backgroundMode === 'color'
      ? { backgroundColor: config.backgroundColor || '#ffffff' }
      : undefined;

  const backgroundSwatchClass = !isContain
    ? 'bg-gradient-to-br from-slate-300 via-slate-400 to-slate-600 border-slate-400'
    : config.backgroundMode === 'white'
    ? 'bg-white border-slate-300'
    : config.backgroundMode === 'black'
    ? 'bg-black border-slate-500'
    : config.backgroundMode === 'transparent'
    ? 'favicon-checkerboard border-slate-300 dark:border-slate-600'
    : config.backgroundMode === 'color'
    ? 'border-slate-300 dark:border-slate-600'
    : 'bg-gradient-to-br from-white via-slate-400 to-slate-900 border-slate-300';

  const handleReset = () => {
    update({
      fit: 'contain',
      padding: 0,
      backgroundMode: 'auto',
      backgroundColor: '#ffffff',
    });
  };

  const handleBackgroundChange = (mode: FaviconBackgroundMode) => {
    update({ backgroundMode: mode });
  };

  const handleHexChange = (value: string) => {
    setHexDraft(value);
    const match = value.trim().match(HEX_PATTERN);
    if (match) {
      const hex = `#${match[1].toLowerCase()}`;
      if (hex !== config.backgroundColor) update({ backgroundColor: hex });
    }
  };

  const commitHex = () => {
    const match = hexDraft.trim().match(HEX_PATTERN);
    if (match) {
      const hex = `#${match[1].toLowerCase()}`;
      setHexDraft(hex);
      if (hex !== config.backgroundColor) update({ backgroundColor: hex });
    } else {
      setHexDraft(config.backgroundColor || '#ffffff');
    }
  };

  const hexIsValid = HEX_PATTERN.test(hexDraft.trim());

  const previewUrl = preview?.dataUrl;
  const hasPreview = Boolean(previewUrl);
  const totalSizes = config.sizes.length;

  return (
    <div className="favicon-studio-reveal relative overflow-hidden bg-white dark:bg-[#151c30] border border-slate-200 dark:border-[#283254] rounded-2xl shadow-sm">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-blue-500/10 dark:bg-blue-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 top-24 h-48 w-48 rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 blur-3xl" />

      {/* Header */}
      <div className="relative flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-blue-500/40 blur-lg" />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
              <Wand2 className="w-4 h-4" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                Favicon Editor
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">
                <span className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
                Live
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100/80 px-1.5 py-0.5 text-[8px] font-semibold text-slate-500 dark:border-[#2b3658] dark:bg-[#1c2339] dark:text-slate-400">
                {items.length} {items.length === 1 ? 'logo' : 'logos'}
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-darkTextMuted truncate">
              {items.length === 1
                ? '256 px live preview · settings apply to this logo'
                : `Editing ${displayIndex + 1} of ${items.length} · settings apply to the whole batch`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          disabled={disabled}
          className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-[10px] font-medium text-slate-500 transition-all hover:text-slate-800 dark:border-[#2b3658] dark:bg-[#1c2339] dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Reset fit, padding and background"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Batch filmstrip */}
      {items.length > 1 && (
        <div className="relative mx-4 mb-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-2 dark:border-[#283254] dark:bg-[#10162b]/60">
          <div className="flex items-center justify-between gap-2 px-1 pb-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              Batch preview
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => stepSelection(-1)}
                disabled={disabled || !canStepBack}
                className="rounded-md p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-[#202944] dark:hover:text-slate-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous logo"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="min-w-[38px] text-center text-[10px] font-mono text-slate-500 dark:text-darkTextMuted">
                {displayIndex + 1} / {items.length}
              </span>
              <button
                type="button"
                onClick={() => stepSelection(1)}
                disabled={disabled || !canStepForward}
                className="rounded-md p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-[#202944] dark:hover:text-slate-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next logo"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {items.map((item, index) => {
              const selected = item.id === selectedItem?.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectItem(item.id)}
                  disabled={disabled}
                  aria-pressed={selected}
                  aria-label={`Preview ${item.name}`}
                  title={item.name}
                  className={`group relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border bg-slate-100 transition-all dark:bg-[#182035] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    selected
                      ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-sm shadow-blue-500/20'
                      : 'border-slate-200 hover:border-blue-400/60 dark:border-[#2b3658]'
                  }`}
                >
                  <div className="flex h-full w-full items-center justify-center">
                    <FaviconThumb item={item} />
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 rounded-tl-md px-1 py-0.5 text-[8px] font-bold leading-none ${
                      selected
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/85 text-slate-500 dark:bg-[#10162b]/85 dark:text-slate-400'
                    }`}
                  >
                    {index + 1}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="px-1 pt-1.5 text-[9px] text-slate-500 dark:text-darkTextMuted">
            One preview at a time. Padding, fit and background apply to all{' '}
            {items.length} logos; Auto background is resolved per logo.
          </p>
        </div>
      )}

      {/* Main composition */}
      <div className="relative grid gap-4 px-4 pb-4 sm:grid-cols-[256px_minmax(0,1fr)]">
        {/* Preview column */}
        <div className="min-w-0">
          <div className="relative mx-auto w-full max-w-[256px] sm:mx-0">
            <div className="absolute -inset-2 rounded-[28px] bg-gradient-to-br from-blue-500/20 via-transparent to-emerald-500/20 blur-lg" />

            <div className="relative rounded-2xl bg-gradient-to-br from-slate-200 via-white to-slate-200 p-1.5 shadow-lg shadow-slate-900/5 dark:from-[#33406b] dark:via-[#1a2238] dark:to-[#0f1525] dark:shadow-black/30">
              <div className="relative aspect-square overflow-hidden rounded-xl favicon-checkerboard ring-1 ring-black/5 dark:ring-white/10">
                {hasPreview ? (
                  <img
                    key={selectedItem?.id ?? 'preview'}
                    src={previewUrl}
                    alt={`${selectedItem?.name ?? 'Logo'} favicon preview`}
                    className="favicon-preview-fade h-full w-full object-contain"
                    draggable={false}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
                    {previewError ? (
                      <>
                        <AlertCircle className="w-6 h-6 text-rose-500" />
                        <p className="text-[11px] leading-snug text-rose-500">
                          {previewError}
                        </p>
                      </>
                    ) : isRendering ? (
                      <>
                        <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
                        <p className="text-[11px] text-slate-500 dark:text-darkTextMuted">
                          Rendering 256 px preview...
                        </p>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-7 h-7 text-slate-400" />
                        <p className="text-[11px] text-slate-500 dark:text-darkTextMuted">
                          Preparing preview...
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Top overlay chips */}
                <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/80 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-slate-700 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#0f1525]/75 dark:text-slate-200">
                    <span className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
                    256 px
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/80 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-slate-600 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#0f1525]/75 dark:text-slate-300">
                    {isContain ? 'Fit inside' : 'Crop'}
                  </span>
                </div>

                {/* Live padding guide */}
                {isContain && paddingPercent > 0 && (
                  <div
                    className="pointer-events-none absolute rounded-md border border-dashed border-blue-500/70 transition-all duration-150"
                    style={{ inset: `${paddingPercent}%` }}
                  />
                )}

                {/* Bottom background chip */}
                <div className="pointer-events-none absolute inset-x-2 bottom-2 flex justify-center">
                  <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/40 bg-white/85 px-2 py-0.5 text-[8px] font-semibold text-slate-600 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#0f1525]/80 dark:text-slate-300">
                    <span
                      className={`h-2.5 w-2.5 flex-shrink-0 rounded-full border ${backgroundSwatchClass}`}
                      style={backgroundSwatchStyle}
                    />
                    <span className="truncate">{backgroundLabel}</span>
                  </span>
                </div>

                {isRendering && hasPreview && (
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-blue-500/70 animate-pulse" />
                )}
              </div>
            </div>
          </div>

          {/* File details */}
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span
                className="truncate text-[11px] font-medium text-slate-700 dark:text-slate-300"
                title={selectedItem?.path}
              >
                {selectedItem?.name ?? 'No logo selected'}
              </span>
              <span className="flex flex-shrink-0 items-center gap-1">
                {isVector && (
                  <span
                    className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400"
                    title="Vector source: rendered at every selected size, including upscaling"
                  >
                    Vector · upscales
                  </span>
                )}
                <span className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] text-slate-500 dark:border-[#2b3658] dark:bg-[#1c2339] dark:text-slate-400">
                  256²
                </span>
              </span>
            </div>

            <p className="text-[10px] text-slate-500 dark:text-darkTextMuted">
              {formatDimensions(selectedItem?.originalWidth, selectedItem?.originalHeight) ||
                'Original size'}{' '}
              · {formatBytes(selectedItem?.size ?? 0)}
              {isVector && ' · SVG renders at any size'}
            </p>

            {/* Context preview */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2 dark:border-[#283254] dark:bg-[#10162b]/50">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  In context
                </span>
                <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500">
                  {totalSizes} sizes · up to {largestSelected}px
                </span>
              </div>

              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {CONTEXT_SIZES.map(({ size, label }) => (
                  <div
                    key={size}
                    className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 bg-white px-1 py-1.5 dark:border-[#263150] dark:bg-[#182035]"
                  >
                    <div className="flex h-9 items-center justify-center">
                      {hasPreview ? (
                        <img
                          src={previewUrl}
                          alt=""
                          width={size}
                          height={size}
                          className="rounded-[3px] shadow-sm"
                          draggable={false}
                        />
                      ) : (
                        <div
                          className="rounded-[3px] bg-slate-200 dark:bg-[#283254]"
                          style={{ width: size, height: size }}
                        />
                      )}
                    </div>
                    <span className="text-[8px] font-medium text-slate-400 dark:text-slate-500">
                      {label} · {size}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {tooSmall && (
              <p className="text-[10px] leading-snug text-amber-600 dark:text-amber-400">
                Source supports up to {usefulDimension}px; the smallest selected
                size is {smallestSelected}px. Choose smaller sizes or a larger
                source.
              </p>
            )}

            {!tooSmall && skippedSizes.length > 0 && (
              <p className="text-[10px] leading-snug text-amber-600 dark:text-amber-400">
                {skippedSizes.join('/')} px will be skipped (source supports up
                to {usefulDimension}px).
              </p>
            )}
          </div>
        </div>

        {/* Controls column */}
        <div className="min-w-0 space-y-4">
          {/* Fit */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
              Fit
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => update({ fit: 'cover' })}
                className={`flex flex-col gap-0.5 rounded-xl border p-2.5 text-left transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  !isContain
                    ? 'border-blue-500 bg-blue-500/10 text-blue-900 shadow-sm ring-1 ring-blue-500/30 dark:border-blue-500 dark:bg-blue-600/20 dark:text-blue-200'
                    : 'border-slate-200 bg-slate-100/70 text-slate-700 hover:bg-slate-200/60 dark:border-[#283254] dark:bg-[#1b2238] dark:text-slate-300 dark:hover:bg-[#222b46]'
                }`}
              >
                <span className="flex items-center gap-1.5 text-[11px] font-semibold">
                  <Crop className="w-3.5 h-3.5" />
                  Crop to fill
                </span>
                <span className="text-[10px] leading-tight text-slate-500 dark:text-darkTextMuted">
                  Fills the square; may trim edges
                </span>
              </button>

              <button
                type="button"
                disabled={disabled}
                onClick={() => update({ fit: 'contain' })}
                className={`flex flex-col gap-0.5 rounded-xl border p-2.5 text-left transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  isContain
                    ? 'border-blue-500 bg-blue-500/10 text-blue-900 shadow-sm ring-1 ring-blue-500/30 dark:border-blue-500 dark:bg-blue-600/20 dark:text-blue-200'
                    : 'border-slate-200 bg-slate-100/70 text-slate-700 hover:bg-slate-200/60 dark:border-[#283254] dark:bg-[#1b2238] dark:text-slate-300 dark:hover:bg-[#222b46]'
                }`}
              >
                <span className="flex items-center gap-1.5 text-[11px] font-semibold">
                  <Square className="w-3.5 h-3.5" />
                  Fit inside
                </span>
                <span className="text-[10px] leading-tight text-slate-500 dark:text-darkTextMuted">
                  Keeps the whole logo
                </span>
              </button>
            </div>
          </div>

          {/* Padding */}
          <div className={`space-y-1.5 ${isContain ? '' : 'opacity-50'}`}>
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                Padding
              </label>
              <span className="font-mono text-[10px] text-slate-500 dark:text-darkTextMuted">
                {paddingPercent}% · {paddingPx}px @256
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={paddingPercent}
              onChange={(event) =>
                update({ padding: Number(event.target.value) / 100 })
              }
              disabled={disabled || !isContain}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600 disabled:cursor-not-allowed dark:bg-[#283254]"
            />
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 dark:text-slate-500">
              <span>0</span>
              <span>15</span>
              <span>30</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-darkTextMuted">
              {isContain
                ? 'Space between the logo and the icon edges. The dashed guide shows the safe area.'
                : 'Padding applies to Fit inside only.'}
            </p>
          </div>

          {/* Background */}
          <div className={`space-y-2 ${isContain ? '' : 'opacity-50'}`}>
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                Background
              </label>
              {config.backgroundMode === 'auto' && preview && (
                <span className="text-[10px] text-blue-600 dark:text-blue-400">
                  Auto → {autoLabel}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {BACKGROUND_OPTIONS.map((option) => {
                const selected = config.backgroundMode === option.id;
                const swatchStyle =
                  option.id === 'color'
                    ? { backgroundColor: config.backgroundColor || '#ffffff' }
                    : undefined;
                const swatchClass =
                  option.id === 'white'
                    ? 'bg-white border-slate-300'
                    : option.id === 'black'
                    ? 'bg-black border-slate-600'
                    : option.id === 'transparent'
                    ? 'favicon-checkerboard border-slate-300 dark:border-slate-600'
                    : option.id === 'color'
                    ? 'border-slate-300 dark:border-slate-600'
                    : 'bg-gradient-to-br from-white via-slate-400 to-slate-900 border-slate-300';

                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={disabled || !isContain}
                    onClick={() => handleBackgroundChange(option.id)}
                    aria-pressed={selected}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[10px] font-medium transition-all cursor-pointer disabled:cursor-not-allowed ${
                      selected
                        ? 'border-blue-500 bg-blue-500/10 text-blue-900 ring-1 ring-blue-500/30 dark:bg-blue-600/20 dark:text-blue-200'
                        : 'border-slate-200 bg-slate-100/70 text-slate-700 hover:bg-slate-200/60 dark:border-[#283254] dark:bg-[#1b2238] dark:text-slate-300 dark:hover:bg-[#222b46]'
                    }`}
                  >
                    <span
                      className={`h-3 w-3 flex-shrink-0 rounded-full border ${swatchClass}`}
                      style={swatchStyle}
                    />
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })}
            </div>

            {config.backgroundMode === 'color' && (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.backgroundColor || '#ffffff'}
                  onChange={(event) => handleHexChange(event.target.value)}
                  disabled={disabled || !isContain}
                  title="Custom background color"
                  className="h-8 w-8 flex-shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-transparent disabled:opacity-50 dark:border-[#2b3658]"
                />
                <div className="relative flex-1 min-w-0">
                  <input
                    type="text"
                    value={hexDraft}
                    onChange={(event) => handleHexChange(event.target.value)}
                    onBlur={commitHex}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        commitHex();
                      }
                      if (event.key === 'Escape') {
                        setHexDraft(config.backgroundColor || '#ffffff');
                      }
                    }}
                    disabled={disabled || !isContain}
                    spellCheck={false}
                    autoComplete="off"
                    aria-label="Background hex color"
                    aria-invalid={!hexIsValid}
                    placeholder="#ffffff"
                    className={`w-full rounded-lg border bg-white px-2 py-1.5 font-mono text-[11px] uppercase text-slate-700 outline-none transition-all disabled:opacity-50 dark:bg-[#181e32] dark:text-slate-200 ${
                      hexIsValid
                        ? 'border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 dark:border-[#2b3658]'
                        : 'border-rose-500/70 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/40'
                    }`}
                  />
                </div>
              </div>
            )}

            {!isContain && (
              <p className="text-[10px] text-slate-500 dark:text-darkTextMuted">
                Crop to fill uses the image itself; padding and background are
                ignored.
              </p>
            )}
          </div>

          {/* Batch note */}
          <div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5 dark:bg-blue-500/10">
            <Sparkles className="mt-0.5 w-3.5 h-3.5 flex-shrink-0 text-blue-500" />
            <p className="text-[10px] leading-relaxed text-slate-600 dark:text-slate-300">
              {items.length > 1
                ? `These settings apply to all ${items.length} logos. Auto background is resolved per logo, so every icon gets the right contrast.`
                : 'The logo is centered and never cropped in Fit inside. Auto picks white for dark logos and black for light logos.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
