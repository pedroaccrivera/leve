import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import type {
  BatchSummary,
  FaviconConfig,
  FaviconItem,
  ImageItem,
  MediaTab,
  ResizeConfig,
  VideoConfig,
  VideoItem,
} from './types';
import { FAVICON_SIZES } from './types';
import { useTheme } from './context/ThemeContext';
import { WindowBar } from './components/WindowBar';
import { Header } from './components/Header';
import { MediaTabs } from './components/MediaTabs';
import { WorkbenchLayout } from './components/WorkbenchLayout';
import { ActionFooter } from './components/ActionFooter';
import { IntroBlock, OutputBlock, PrincipleList, Principles } from './components/WorkspaceBlocks';
import { DropZone, useFilePickers } from './components/DropZone';
import { QueueActions } from './components/QueueActions';
import { ImageQueueRow, QueueList, VideoQueueRow } from './components/QueueRow';
import { ProcessingCard } from './components/ProcessingCard';
import { BatchReport, RecipeUsed, type ReportRow } from './components/BatchReport';
import { ImageInspector } from './components/ImageInspector';
import { VideoInspector } from './components/VideoInspector';
import { FaviconInspector } from './components/FaviconInspector';
import { FaviconEditor } from './components/FaviconEditor';
import { Button } from './components/ui/Button';
import { STATUS_MARKS } from './components/ui/StatusChip';
import { formatBytes, formatDuration } from './utils/formatters';
import { fixtureName, fixtureState } from './utils/devFixtures';
import {
  STORAGE_KEYS,
  loadBoolean,
  loadNumber,
  saveValue,
} from './utils/presets';

const DEFAULT_IMAGE_CONFIG: ResizeConfig = {
  targetWidth: 1920,
  withoutEnlargement: true,
  compressionLevel: 'balanced',
  stripMetadata: false,
  outputFormat: 'original',
  destinationMode: 'subfolder',
  subfolderName: 'resized',
  suffix: '-resized',
  customFolderPath: '',
};

const DEFAULT_VIDEO_CONFIG: VideoConfig = {
  maxWidth: 1920,
  withoutEnlargement: true,
  quality: 'balanced',
  outputFormat: 'mp4',
  stripMetadata: false,
  muteAudio: false,
  destinationMode: 'subfolder',
  subfolderName: 'compressed',
  suffix: '-web',
  customFolderPath: '',
};

const DEFAULT_FAVICON_CONFIG: FaviconConfig = {
  sizes: [...FAVICON_SIZES],
  fit: 'contain',
  padding: 0.08,
  radius: 0.22,
  backgroundMode: 'auto',
  backgroundColor: '#FFFFFF',
  nameMode: 'favicon',
  destinationMode: 'subfolder',
  subfolderName: 'favicons',
  customFolderPath: '',
};

const countLabel = (count: number, singular: string, plural: string) =>
  count === 1 ? `1 ${singular}` : `${count} ${plural}`;

export const App: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const isMac = useMemo(
    () => typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent),
    []
  );

  const [mediaTab, setMediaTab] = useState<MediaTab>(() => {
    if (import.meta.env.DEV) {
      const forced = new URLSearchParams(window.location.search).get('tab');
      if (forced === 'videos' || forced === 'favicon' || forced === 'images') return forced;
    }
    return 'images';
  });
  const [reportOpen, setReportOpen] = useState(false);

  /* ---------------------------------------------------------------- images */
  const [items, setItems] = useState<ImageItem[]>([]);
  const [config, setConfig] = useState<ResizeConfig>(DEFAULT_IMAGE_CONFIG);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeStage, setActiveStage] = useState('Preparing…');
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [widthIsCustom, setWidthIsCustom] = useState(() =>
    loadBoolean(STORAGE_KEYS.customWidthSelected, false)
  );
  const [customWidth, setCustomWidth] = useState(() =>
    loadNumber(STORAGE_KEYS.customWidth, 1920)
  );

  /* ---------------------------------------------------------------- videos */
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [videoConfig, setVideoConfig] = useState<VideoConfig>(DEFAULT_VIDEO_CONFIG);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState({ current: 0, total: 0 });
  const [videoSummary, setVideoSummary] = useState<BatchSummary | null>(null);
  const [videoWidthIsCustom, setVideoWidthIsCustom] = useState(false);
  const [videoCustomWidth, setVideoCustomWidth] = useState(1920);

  /* --------------------------------------------------------------- favicon */
  const [faviconItems, setFaviconItems] = useState<FaviconItem[]>([]);
  const [selectedFaviconId, setSelectedFaviconId] = useState<string | null>(null);
  const [faviconConfig, setFaviconConfig] = useState<FaviconConfig>(DEFAULT_FAVICON_CONFIG);
  const [isProcessingFavicon, setIsProcessingFavicon] = useState(false);
  const [faviconProgress, setFaviconProgress] = useState({ current: 0, total: 0 });
  const [faviconSummary, setFaviconSummary] = useState<BatchSummary | null>(null);
  const [resolvedFaviconBackground, setResolvedFaviconBackground] = useState<string>('#FFFFFF');

  const cancelRef = useRef(false);

  /* Dev-only: reproduce a reference screen with `?fixture=<name>`. */
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const name = fixtureName();
    if (!name) return;
    const state = fixtureState(name);
    if (!state) return;
    if (state.items) setItems(state.items);
    if (state.config) setConfig((prev) => ({ ...prev, ...state.config }));
    if (state.isProcessing != null) setIsProcessing(state.isProcessing);
    if (state.progress) setProgress(state.progress);
    if (state.activeIndex != null) setActiveIndex(state.activeIndex);
    if (state.summary !== undefined) setSummary(state.summary);
    if (state.reportOpen) setReportOpen(true);
    if (state.videoItems) setVideoItems(state.videoItems);
    if (state.videoConfig) setVideoConfig((prev) => ({ ...prev, ...state.videoConfig }));
    if (state.isProcessingVideo != null) setIsProcessingVideo(state.isProcessingVideo);
    if (state.videoProgress) setVideoProgress(state.videoProgress);
    if (state.videoSummary !== undefined) setVideoSummary(state.videoSummary);
    if (state.faviconItems) setFaviconItems(state.faviconItems);
    if (state.selectedFaviconId !== undefined) setSelectedFaviconId(state.selectedFaviconId);
    if (state.faviconConfig) setFaviconConfig((prev) => ({ ...prev, ...state.faviconConfig }));
    if (state.isProcessingFavicon != null) setIsProcessingFavicon(state.isProcessingFavicon);
    if (state.faviconProgress) setFaviconProgress(state.faviconProgress);
    if (state.faviconSummary !== undefined) setFaviconSummary(state.faviconSummary);
  }, []);

  /* ------------------------------------------------------- video progress */
  useEffect(() => {
    if (!window.electronAPI?.onVideoProgress) return;
    return window.electronAPI.onVideoProgress((id, pct) => {
      setVideoItems((prev) => prev.map((item) => (item.id === id ? { ...item, progress: pct } : item)));
    });
  }, []);

  /* ----------------------------------------------------------- image flow */
  const patchConfig = useCallback((patch: Partial<ResizeConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const selectWidthPreset = useCallback(
    (width: number) => {
      setWidthIsCustom(false);
      saveValue(STORAGE_KEYS.customWidthSelected, false);
      patchConfig({ targetWidth: width });
    },
    [patchConfig]
  );

  const selectCustomWidth = useCallback(() => {
    setWidthIsCustom(true);
    saveValue(STORAGE_KEYS.customWidthSelected, true);
    patchConfig({ targetWidth: customWidth });
  }, [customWidth, patchConfig]);

  const changeCustomWidth = useCallback(
    (width: number) => {
      setWidthIsCustom(true);
      setCustomWidth(width);
      saveValue(STORAGE_KEYS.customWidth, width);
      saveValue(STORAGE_KEYS.customWidthSelected, true);
      patchConfig({ targetWidth: width });
    },
    [patchConfig]
  );

  const addItems = useCallback((incoming: ImageItem[]) => {
    setItems((prev) => {
      const known = new Set(prev.map((item) => item.path));
      return [...prev, ...incoming.filter((item) => !known.has(item.path))];
    });
  }, []);

  const addFaviconItems = useCallback((incoming: ImageItem[]) => {
    setFaviconItems((prev) => {
      const known = new Set(prev.map((item) => item.path));
      const added = incoming.filter((item) => !known.has(item.path));
      if (added.length) setSelectedFaviconId((current) => current ?? added[0].id);
      return [...prev, ...added];
    });
  }, []);

  const startImages = async () => {
    if (!items.length || isProcessing || !window.electronAPI) return;
    cancelRef.current = false;
    setIsProcessing(true);
    setReportOpen(false);
    setProgress({ current: 0, total: items.length });

    const started = Date.now();
    let saved = 0;
    let skipped = 0;
    let failed = 0;
    let originalBytes = 0;
    let newBytes = 0;

    for (let index = 0; index < items.length; index++) {
      if (cancelRef.current) break;
      const item = items[index];
      originalBytes += item.size || 0;
      setActiveIndex(index);
      setActiveStage('Resizing & compressing…');
      setProgress({ current: index + 1, total: items.length });
      setItems((prev) => prev.map((entry, i) => (i === index ? { ...entry, status: 'processing' } : entry)));

      const result = await window.electronAPI.processImage(item, config);

      if (result.skipped) {
        skipped++;
        newBytes += item.size || 0;
        setItems((prev) =>
          prev.map((entry, i) =>
            i === index ? { ...entry, status: 'skipped', newSize: item.size } : entry
          )
        );
      } else if (result.success) {
        saved++;
        newBytes += result.newSize || 0;
        setItems((prev) =>
          prev.map((entry, i) =>
            i === index
              ? {
                  ...entry,
                  status: 'done',
                  outputPath: result.outputPath,
                  newSize: result.newSize,
                  newWidth: result.newWidth,
                  newHeight: result.newHeight,
                }
              : entry
          )
        );
      } else {
        failed++;
        setItems((prev) =>
          prev.map((entry, i) => (i === index ? { ...entry, status: 'error', error: result.error } : entry))
        );
      }
    }

    setIsProcessing(false);
    if (cancelRef.current) {
      setItems((prev) => prev.map((entry) => (entry.status === 'processing' ? { ...entry, status: 'pending' } : entry)));
      return;
    }

    const totalSaved = Math.max(0, originalBytes - newBytes);
    setSummary({
      totalImages: items.length,
      processedCount: saved,
      failedCount: failed,
      skippedCount: skipped,
      originalTotalBytes: originalBytes,
      newTotalBytes: newBytes,
      totalSavedBytes: totalSaved,
      percentageSaved: originalBytes > 0 ? Math.round((totalSaved / originalBytes) * 100) : 0,
      durationMs: Date.now() - started,
      mediaLabel: 'Images',
    });
    setReportOpen(true);
  };

  /* ----------------------------------------------------------- video flow */
  const patchVideoConfig = useCallback((patch: Partial<VideoConfig>) => {
    setVideoConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const addVideoItems = useCallback((incoming: VideoItem[]) => {
    setVideoItems((prev) => {
      const known = new Set(prev.map((item) => item.path));
      return [...prev, ...incoming.filter((item) => !known.has(item.path))];
    });
  }, []);

  const startVideos = async () => {
    if (!videoItems.length || isProcessingVideo || !window.electronAPI) return;
    cancelRef.current = false;
    setIsProcessingVideo(true);
    setReportOpen(false);
    setVideoProgress({ current: 0, total: videoItems.length });

    const started = Date.now();
    let saved = 0;
    let skipped = 0;
    let failed = 0;
    let originalBytes = 0;
    let newBytes = 0;

    for (let index = 0; index < videoItems.length; index++) {
      if (cancelRef.current) break;
      const item = videoItems[index];
      originalBytes += item.size || 0;
      setVideoProgress({ current: index + 1, total: videoItems.length });
      setVideoItems((prev) =>
        prev.map((entry, i) => (i === index ? { ...entry, status: 'processing', progress: 0 } : entry))
      );

      const result = await window.electronAPI.processVideo(item, videoConfig);

      if (result.skipped) {
        skipped++;
        newBytes += item.size || 0;
        setVideoItems((prev) =>
          prev.map((entry, i) =>
            i === index ? { ...entry, status: 'skipped', progress: 100, newSize: item.size } : entry
          )
        );
      } else if (result.success) {
        saved++;
        newBytes += result.newSize || 0;
        setVideoItems((prev) =>
          prev.map((entry, i) =>
            i === index
              ? {
                  ...entry,
                  status: 'done',
                  progress: 100,
                  outputPath: result.outputPath,
                  newSize: result.newSize,
                  newWidth: result.newWidth,
                  newHeight: result.newHeight,
                }
              : entry
          )
        );
      } else {
        failed++;
        setVideoItems((prev) =>
          prev.map((entry, i) => (i === index ? { ...entry, status: 'error', error: result.error } : entry))
        );
      }
    }

    setIsProcessingVideo(false);
    if (cancelRef.current) {
      setVideoItems((prev) =>
        prev.map((entry) => (entry.status === 'processing' ? { ...entry, status: 'pending', progress: 0 } : entry))
      );
      return;
    }

    const totalSaved = Math.max(0, originalBytes - newBytes);
    setVideoSummary({
      totalImages: videoItems.length,
      processedCount: saved,
      failedCount: failed,
      skippedCount: skipped,
      originalTotalBytes: originalBytes,
      newTotalBytes: newBytes,
      totalSavedBytes: totalSaved,
      percentageSaved: originalBytes > 0 ? Math.round((totalSaved / originalBytes) * 100) : 0,
      durationMs: Date.now() - started,
      mediaLabel: 'Videos',
    });
    setReportOpen(true);
  };

  /* --------------------------------------------------------- favicon flow */
  const patchFaviconConfig = useCallback((patch: Partial<FaviconConfig>) => {
    setFaviconConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const startFavicons = async () => {
    if (!faviconItems.length || isProcessingFavicon || !window.electronAPI) return;
    cancelRef.current = false;
    setIsProcessingFavicon(true);
    setReportOpen(false);
    setFaviconProgress({ current: 0, total: faviconItems.length });

    const started = Date.now();
    let saved = 0;
    let failed = 0;
    let originalBytes = 0;
    let newBytes = 0;
    const generated = new Set<number>();
    let skippedSizes = 0;

    for (let index = 0; index < faviconItems.length; index++) {
      if (cancelRef.current) break;
      const item = faviconItems[index];
      originalBytes += item.size || 0;
      setFaviconProgress({ current: index + 1, total: faviconItems.length });
      setFaviconItems((prev) =>
        prev.map((entry, i) => (i === index ? { ...entry, status: 'processing' } : entry))
      );

      const result = await window.electronAPI.generateFavicon(item, faviconConfig);

      if (result.success) {
        saved++;
        newBytes += result.newSize || 0;
        result.generatedSizes?.forEach((size) => generated.add(size));
        skippedSizes += result.skippedSizes?.length ?? 0;
        setFaviconItems((prev) =>
          prev.map((entry, i) =>
            i === index
              ? {
                  ...entry,
                  status: 'done',
                  outputPath: result.outputPath,
                  newSize: result.newSize,
                  generatedSizes: result.generatedSizes,
                  skippedSizes: result.skippedSizes,
                }
              : entry
          )
        );
      } else {
        failed++;
        setFaviconItems((prev) =>
          prev.map((entry, i) => (i === index ? { ...entry, status: 'error', error: result.error } : entry))
        );
      }
    }

    setIsProcessingFavicon(false);
    if (cancelRef.current) {
      setFaviconItems((prev) =>
        prev.map((entry) => (entry.status === 'processing' ? { ...entry, status: 'pending' } : entry))
      );
      return;
    }

    setFaviconSummary({
      totalImages: faviconItems.length,
      processedCount: saved,
      failedCount: failed,
      skippedCount: 0,
      originalTotalBytes: originalBytes,
      newTotalBytes: newBytes,
      totalSavedBytes: 0,
      percentageSaved: 0,
      durationMs: Date.now() - started,
      mediaLabel: 'Favicons',
      mode: 'favicon',
      generatedSizes: Array.from(generated).sort((a, b) => a - b),
      skippedSizes,
    } as BatchSummary & { skippedSizes?: number });
    setReportOpen(true);
  };

  /* ------------------------------------------------------------- derived */
  const isVideoTab = mediaTab === 'videos';
  const isFaviconTab = mediaTab === 'favicon';
  const anyProcessing = isProcessing || isProcessingVideo || isProcessingFavicon;
  const activeSummary = isVideoTab ? videoSummary : isFaviconTab ? faviconSummary : summary;
  const selectedFaviconItem =
    faviconItems.find((item) => item.id === selectedFaviconId) ?? faviconItems[0] ?? null;

  const openOutputFolder = () => {
    if (!window.electronAPI) return;
    if (isVideoTab) {
      const first = videoItems.find((item) => item.status === 'done' && item.outputPath);
      if (first?.outputPath) window.electronAPI.openInFolder(first.outputPath);
      return;
    }
    if (isFaviconTab) {
      const first = faviconItems.find((item) => item.status === 'done' && item.outputPath);
      if (first?.outputPath) window.electronAPI.openInFolder(first.outputPath);
      return;
    }
    if (config.destinationMode === 'custom_folder' && config.customFolderPath) {
      window.electronAPI.openInFolder(config.customFolderPath);
      return;
    }
    const first = items.find((item) => item.status === 'done' && item.outputPath);
    if (first?.outputPath) window.electronAPI.openInFolder(first.outputPath);
  };

  const clearQueue = () => {
    if (isVideoTab) {
      setVideoItems([]);
      setVideoSummary(null);
    } else if (isFaviconTab) {
      setFaviconItems([]);
      setFaviconSummary(null);
      setSelectedFaviconId(null);
    } else {
      setItems([]);
      setSummary(null);
    }
    setReportOpen(false);
  };

  const imagePickers = useFilePickers('images', addItems);
  const videoPickers = useFilePickers('videos', addItems, addVideoItems);

  /* --------------------------------------------------------- image screen */
  const imageQueueBytes = items.reduce((sum, item) => sum + (item.size || 0), 0);
  const imageTotal = formatBytes(imageQueueBytes);

  const imageReportRows: ReportRow[] = items.map((item) => {
    if (item.status === 'done') {
      return {
        tone: 'success',
        mark: STATUS_MARKS.done,
        label: 'Done',
        name: item.name,
        lines: [item.outputPath ? `Saved as ${item.outputPath.split('/').slice(-2).join('/')}` : 'Saved'],
      };
    }
    if (item.status === 'skipped') {
      return {
        tone: 'warning',
        mark: STATUS_MARKS.skipped,
        label: 'Skipped',
        name: item.name,
        lines: ['Output would be larger than the source. No new file saved.'],
      };
    }
    if (item.status === 'error') {
      return {
        tone: 'danger',
        mark: STATUS_MARKS.failed,
        label: 'Failed',
        name: item.name,
        lines: [item.error || 'Could not read this image. Original untouched.'],
      };
    }
    return {
      tone: 'muted',
      mark: STATUS_MARKS.pending,
      label: 'Pending',
      name: item.name,
      lines: ['Not processed.'],
    };
  });

  const imageIntro = () => {
    if (summary && reportOpen) {
      return {
        label: 'IMAGES / BATCH REPORT',
        title: 'Finished.\nNothing overwritten.',
        subtitle: [
          countLabel(summary.processedCount, 'saved', 'saved'),
          summary.skippedCount ? `${summary.skippedCount} skipped` : null,
          summary.failedCount ? `${summary.failedCount} ${summary.failedCount === 1 ? 'needs' : 'need'} attention` : null,
        ]
          .filter(Boolean)
          .join(' · '),
      };
    }
    if (isProcessing) {
      return {
        label: 'IMAGES / LOCAL PROCESSING',
        title: 'Resizing.\nNot uploading.',
        subtitle: 'One file at a time. No source is overwritten.',
      };
    }
    if (!items.length) {
      return {
        label: 'IMAGES / LOCAL WORKBENCH',
        title: 'Less weight.\nSame image.',
        subtitle: 'Resize and compress in batches. Keep the originals.',
      };
    }
    return {
      label: `IMAGES / ${String(items.length).padStart(2, '0')} FILES / ${imageTotal}`,
      title: `${items.length} ${items.length === 1 ? 'image' : 'images'}.\nOne lighter batch.`,
      subtitle: 'Set the recipe once. Apply it to the whole queue.',
    };
  };

  const activeImage = items[Math.min(activeIndex, items.length - 1)];
  const doneImages = items.filter((item) => item.status === 'done');
  const waitingImages = items.filter((item) => item.status === 'pending');

  const imageWorkspace = () => {
    if (summary && reportOpen) {
      return (
        <BatchReport
          introLabel="IMAGES / BATCH REPORT"
          title={'Finished.\nNothing overwritten.'}
          subtitle={imageIntro().subtitle}
          receiptVariant="panel"
          receipt={[
            { label: 'Files saved', value: `${summary.processedCount} / ${summary.totalImages}` },
            {
              label: 'Space saved',
              value: summary.totalSavedBytes > 0 ? formatBytes(summary.totalSavedBytes) : '—',
            },
            { label: 'Elapsed time', value: summary.durationMs > 0 ? formatDuration(summary.durationMs / 1000) : '—' },
          ]}
          note="Only successful outputs are saved. Skipped and failed keep their originals."
          rows={imageReportRows}
          onStartNewBatch={clearQueue}
          onDismiss={() => setReportOpen(false)}
        />
      );
    }

    return (
      <div className="flex flex-col gap-[var(--d-block)]">
        <IntroBlock {...imageIntro()} />

        {isProcessing && activeImage ? (
          <>
            <ProcessingCard
              index={`${String(activeIndex + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`}
              heading="PROCESSING CURRENT FILE"
              name={activeImage.name}
              percent={((activeIndex + 1) / Math.max(1, items.length)) * 100}
              stage={activeStage}
              stages={[
                { label: '01 / Prepare', state: 'done' },
                { label: '02 / Resize & compress', state: 'current' },
                { label: '03 / Save', state: 'todo' },
              ]}
            />
            <QueueList>
              {doneImages.map((item) => (
                <ImageQueueRow
                  key={item.id}
                  name={item.name}
                  meta={
                    item.outputPath
                      ? item.outputPath.split('/').slice(-2).join('/')
                      : `${item.originalWidth ?? '—'} × ${item.originalHeight ?? '—'} px · ${formatBytes(item.size)}`
                  }
                  status={{ tone: 'success', mark: STATUS_MARKS.saved, label: 'Saved' }}
                />
              ))}
              {waitingImages.map((item) => (
                <ImageQueueRow
                  key={item.id}
                  name={item.name}
                  meta={`${item.originalWidth ?? '—'} × ${item.originalHeight ?? '—'} px · ${formatBytes(item.size)}`}
                  note={activeImage ? `Starts after ${activeImage.name}.` : undefined}
                  status={{ tone: 'muted', mark: STATUS_MARKS.waiting, label: 'Waiting' }}
                />
              ))}
            </QueueList>
            <OutputBlock
              label="Your output / recipe locked"
              summary={`${config.outputFormat === 'original' ? 'Original format' : config.outputFormat.toUpperCase()} · ${config.targetWidth} px maximum · ${config.compressionLevel === 'aggressive' ? 'Smallest' : config.compressionLevel === 'light' ? 'Light' : config.compressionLevel === 'lossless' ? 'Lossless' : 'Balanced'}`}
              note={`New copies in ${config.destinationMode === 'subfolder' ? config.subfolderName : config.destinationMode === 'suffix' ? 'the source folder' : 'your chosen folder'} next to each source.`}
            />
          </>
        ) : !items.length ? (
          <>
            <DropZone
              variant="large"
              mediaType="images"
              title="Make room for what's next."
              subtitle="Drop images or folders anywhere in this area."
              onAddItems={addItems}
            />
            <Principles
              items={[
                'All on your machine. No upload step.',
                'Smaller sources stay sharp. Never enlarged.',
                'New files only. Never overwrite an original.',
              ]}
            />
          </>
        ) : (
          <>
            <QueueActions
              onSelectFiles={imagePickers.selectFiles}
              onSelectFolder={imagePickers.selectFolder}
              disabled={isProcessing}
              total={`${imageTotal} total`}
            />
            <QueueList>
              {items.map((item) => (
                <ImageQueueRow
                  key={item.id}
                  name={item.name}
                  meta={`${item.originalWidth ?? '—'} × ${item.originalHeight ?? '—'} px · ${formatBytes(item.size)}`}
                  note={
                    item.status === 'done'
                      ? item.outputPath
                        ? `Saved as ${item.outputPath.split('/').slice(-2).join('/')}`
                        : undefined
                      : `→ ${item.name.replace(/\.[^.]+$/, '')}.${config.outputFormat === 'original' ? 'webp' : config.outputFormat === 'jpeg' ? 'jpg' : config.outputFormat}`
                  }
                  status={
                    item.status === 'done'
                      ? { tone: 'success', mark: STATUS_MARKS.saved, label: 'Saved' }
                      : item.status === 'skipped'
                        ? { tone: 'warning', mark: STATUS_MARKS.skipped, label: 'Skipped' }
                        : item.status === 'error'
                          ? { tone: 'danger', mark: STATUS_MARKS.failed, label: 'Failed' }
                          : { tone: 'muted', mark: STATUS_MARKS.pending, label: 'Pending' }
                  }
                  onRemove={() => setItems((prev) => prev.filter((entry) => entry.id !== item.id))}
                />
              ))}
            </QueueList>
            <Button
              variant="secondary"
              size="md"
              className="w-[164px] self-start"
              onClick={clearQueue}
              disabled={isProcessing}
            >
              Clear queue ({items.length})
            </Button>
            <DropZone
              variant="compact"
              mediaType="images"
              compactTitle="Drop more images or folders here."
              compactSubtitle="Everything stays on this machine."
              onAddItems={addItems}
            />
          </>
        )}
      </div>
    );
  };

  /* --------------------------------------------------------- video screen */
  const videoQueueBytes = videoItems.reduce((sum, item) => sum + (item.size || 0), 0);
  const videoReportRows: ReportRow[] = videoItems.map((item) => ({
    tone: item.status === 'error' ? 'danger' : item.status === 'skipped' ? 'warning' : 'success',
    mark: item.status === 'error' ? STATUS_MARKS.failed : item.status === 'skipped' ? STATUS_MARKS.skipped : STATUS_MARKS.saved,
    label: item.status === 'error' ? 'Failed' : item.status === 'skipped' ? 'Skipped' : 'Saved',
    name: item.name,
    lines: [
      item.outputPath
        ? `Saved as ${item.outputPath.split('/').slice(-2).join('/')}`
        : item.error || 'Original untouched.',
    ],
  }));

  const videoFormatLabel =
    videoConfig.outputFormat === 'webm'
      ? 'WebM / VP9'
      : videoConfig.outputFormat === 'original'
        ? 'Original format'
        : 'MP4 / H.264 + AAC';

  const videoWorkspace = () => {
    if (videoSummary && reportOpen) {
      return (
        <BatchReport
          introLabel="VIDEOS / BATCH REPORT"
          title={'Finished.\nNothing overwritten.'}
          subtitle={`${countLabel(videoSummary.processedCount, 'video saved', 'videos saved')}. Originals are untouched.`}
          receipt={[
            { label: 'Videos saved', value: `${videoSummary.processedCount} / ${videoSummary.totalImages}` },
            { label: 'Output format', value: videoConfig.outputFormat === 'webm' ? 'WebM' : videoConfig.outputFormat === 'original' ? 'Original' : 'MP4' },
            {
              label: 'Destination',
              value: videoConfig.destinationMode === 'subfolder' ? `${videoConfig.subfolderName}/` : videoConfig.suffix,
            },
          ]}
          note="Only completed outputs are saved. Your source videos stay in place."
          rows={videoReportRows}
          onStartNewBatch={clearQueue}
          onDismiss={() => setReportOpen(false)}
        />
      );
    }

    const activeVideo = videoItems[Math.min(videoProgress.current - 1, videoItems.length - 1)];
    const doneVideos = videoItems.filter((item) => item.status === 'done');
    const waitingVideos = videoItems.filter((item) => item.status === 'pending');

    return (
      <div className="flex flex-col gap-[var(--d-block)]">
        <IntroBlock
          label={
            isProcessingVideo
              ? 'VIDEOS / LOCAL PROCESSING'
              : !videoItems.length
                ? 'VIDEOS / LOCAL WORKBENCH'
                : `VIDEOS / ${String(videoItems.length).padStart(2, '0')} FILES`
          }
          title={
            isProcessingVideo
              ? 'Compressing.\nNot uploading.'
              : videoItems.length
                ? `${videoItems.length} ${videoItems.length === 1 ? 'video' : 'videos'}.\nOne lighter batch.`
                : 'Less weight.\nKeep the motion.'
          }
          subtitle={
            isProcessingVideo
              ? 'One video at a time. No file leaves your machine.'
              : videoItems.length
                ? 'Set the recipe once. Process the queue one video at a time.'
                : 'Compress videos in batches. Keep the originals.'
          }
        />

        {isProcessingVideo && activeVideo ? (
          <>
            <ProcessingCard
              index={`${String(videoProgress.current).padStart(2, '0')} / ${String(videoItems.length).padStart(2, '0')}`}
              heading="PROCESSING CURRENT FILE"
              name={activeVideo.name}
              percent={activeVideo.progress ?? 0}
              stage={activeVideo.progress ? 'Encoding video…' : 'Preparing video…'}
              stages={[
                { label: '01 / Read source', state: 'done' },
                { label: '02 / Encode', state: 'current' },
                { label: '03 / Save', state: 'todo' },
              ]}
            />
            <QueueList>
              {[...doneVideos, ...waitingVideos].map((item) => (
                <VideoQueueRow
                  key={item.id}
                  index={`${String(videoItems.indexOf(item) + 1).padStart(2, '0')} / ${String(videoItems.length).padStart(2, '0')}`}
                  name={item.name}
                  meta={
                    item.status === 'done' && item.outputPath
                      ? item.outputPath.split('/').slice(-2).join('/')
                      : `${item.originalWidth ?? '—'} × ${item.originalHeight ?? '—'} px · ${formatBytes(item.size)}`
                  }
                  note={
                    item.status === 'done'
                      ? undefined
                      : activeVideo
                        ? `Starts after ${activeVideo.name}.`
                        : undefined
                  }
                  status={
                    item.status === 'done'
                      ? { tone: 'success', mark: STATUS_MARKS.saved, label: 'Saved' }
                      : { tone: 'muted', mark: STATUS_MARKS.waiting, label: 'Waiting' }
                  }
                />
              ))}
            </QueueList>
            <OutputBlock
              label="Your output / recipe locked"
              summary={`${videoFormatLabel} · ${videoConfig.maxWidth} px maximum · ${videoConfig.quality === 'aggressive' ? 'Smallest' : videoConfig.quality === 'light' ? 'Good quality' : 'Balanced'}`}
              note={`New copies in ${videoConfig.destinationMode === 'subfolder' ? videoConfig.subfolderName : 'the source folder'} next to each source.`}
            />
          </>
        ) : !videoItems.length ? (
          <>
            <DropZone
              variant="large"
              mediaType="videos"
              showIcon={false}
              title="Make room for the next cut."
              subtitle="Drop videos or folders anywhere in this area."
              onAddItems={addItems}
              onAddVideoItems={addVideoItems}
            />
            <PrincipleList
              items={[
                { label: '01 / Stays local', description: 'No uploads. Video is processed on your machine.' },
                { label: '02 / Keeps the original', description: 'New copies only. Smaller sources are never enlarged.' },
                { label: '03 / One queue, one recipe', description: 'Pick the width, compression and format before starting.' },
              ]}
            />
          </>
        ) : (
          <>
            <QueueActions
              onSelectFiles={videoPickers.selectFiles}
              onSelectFolder={videoPickers.selectFolder}
              total={`${formatBytes(videoQueueBytes)} total`}
            />
            <QueueList>
              {videoItems.map((item) => (
                <VideoQueueRow
                  key={item.id}
                  index={`${String(videoItems.indexOf(item) + 1).padStart(2, '0')} / ${String(videoItems.length).padStart(2, '0')}`}
                  name={item.name}
                  meta={`${(item.name.split('.').pop() || '').toUpperCase()} · ${item.originalWidth ?? '—'} × ${item.originalHeight ?? '—'} px`}
                  note={
                    item.outputPath
                      ? `→ ${item.outputPath.split('/').slice(-2).join('/')}`
                      : `→ ${videoConfig.destinationMode === 'subfolder' ? `${videoConfig.subfolderName}/` : ''}${item.name.replace(/\.[^.]+$/, '')}.${videoConfig.outputFormat === 'webm' ? 'webm' : 'mp4'}`
                  }
                  status={
                    item.status === 'done'
                      ? { tone: 'success', mark: STATUS_MARKS.saved, label: 'Saved' }
                      : item.status === 'skipped'
                        ? { tone: 'warning', mark: STATUS_MARKS.skipped, label: 'Skipped' }
                        : item.status === 'error'
                          ? { tone: 'danger', mark: STATUS_MARKS.failed, label: 'Failed' }
                          : { tone: 'muted', mark: STATUS_MARKS.pending, label: 'Pending' }
                  }
                  onRemove={() => setVideoItems((prev) => prev.filter((entry) => entry.id !== item.id))}
                />
              ))}
            </QueueList>
            <Button
              variant="secondary"
              size="md"
              className="w-[164px] self-start"
              onClick={clearQueue}
              disabled={isProcessingVideo}
            >
              Clear queue ({videoItems.length})
            </Button>
            <OutputBlock
              label="Your output"
              summary={`${videoFormatLabel} · ${videoConfig.quality === 'aggressive' ? 'Smallest' : videoConfig.quality === 'light' ? 'Good quality' : 'Balanced'} · ${videoConfig.muteAudio ? 'Audio muted' : 'Audio kept'}`}
              note={`New copies in ${videoConfig.destinationMode === 'subfolder' ? videoConfig.subfolderName : 'the source folder'} next to each source.`}
            />
          </>
        )}
      </div>
    );
  };

  /* ------------------------------------------------------- favicon screen */
  const faviconGenerated = faviconItems.flatMap((item) => item.generatedSizes ?? []);
  const faviconSkipped = faviconItems.reduce((sum, item) => sum + (item.skippedSizes?.length ?? 0), 0);
  const faviconReportRows: ReportRow[] = faviconItems.map((item) => {
    const outputName = item.outputPath ? item.outputPath.split('/').pop() : 'favicon.ico';
    const generated = item.generatedSizes ?? [];
    const skipped = item.skippedSizes ?? [];
    return {
      tone: item.status === 'error' ? 'danger' : 'success',
      mark: item.status === 'error' ? STATUS_MARKS.failed : STATUS_MARKS.saved,
      label: item.status === 'error' ? 'Failed' : 'Saved',
      name: `${item.name} → ${outputName}`,
      lines: [
        generated.length ? `${generated.join(' · ')} px` : 'No sizes generated.',
        skipped.length
          ? `${skipped.join(' · ')} px skipped · source is ${item.originalWidth ?? '—'} × ${item.originalHeight ?? '—'} px.`
          : `All ${generated.length} sizes included.`,
      ],
    };
  });

  const faviconWorkspace = () => {
    if (faviconSummary && reportOpen) {
      return (
        <BatchReport
          introLabel="FAVICON / BATCH REPORT"
          title={'Small files.\nReady for the web.'}
          subtitle={`${countLabel(faviconSummary.processedCount, 'favicon saved', 'favicons saved')}.${
            faviconSkipped ? ' Larger raster sizes were skipped.' : ''
          }`}
          receipt={[
            { label: 'Icons saved', value: `${faviconSummary.processedCount} / ${faviconSummary.totalImages}` },
            { label: 'Sizes included', value: String(faviconGenerated.length) },
            { label: 'Sizes skipped', value: String(faviconSkipped) },
          ]}
          note={`Saved in ${faviconConfig.subfolderName}/ next to the sources. No raster size was enlarged.`}
          rows={faviconReportRows}
          onStartNewBatch={clearQueue}
          onDismiss={() => setReportOpen(false)}
        />
      );
    }

    return (
      <div className="flex flex-col gap-[var(--d-block)]">
        <IntroBlock
          label={
            isProcessingFavicon
              ? 'FAVICON / LOCAL PROCESSING'
              : !faviconItems.length
                ? 'FAVICON / LOCAL WORKBENCH'
                : `FAVICON / ${String(faviconItems.length).padStart(2, '0')} ${faviconItems.length === 1 ? 'LOGO' : 'LOGOS'} / LIVE PREVIEW`
          }
          title={
            isProcessingFavicon
              ? 'Small sizes.\nMade right here.'
              : 'Small icon.\nFull character.'
          }
          subtitle={
            isProcessingFavicon
              ? 'One file at a time. No source is overwritten.'
              : faviconItems.length
                ? 'Turn your logos into multi-size .ico files.'
                : 'Turn your logos into multi-size .ico files.'
          }
        />

        {isProcessingFavicon && selectedFaviconItem ? (
          <>
            <ProcessingCard
              index={`${String(faviconProgress.current).padStart(2, '0')} / ${String(faviconItems.length).padStart(2, '0')}`}
              heading="PROCESSING CURRENT FILE"
              name={selectedFaviconItem.name}
              percent={(faviconProgress.current / Math.max(1, faviconItems.length)) * 100}
              stage="Packing selected sizes…"
              stages={[
                { label: '01 / Prepare', state: 'done' },
                { label: '02 / Render & pack', state: 'current' },
                { label: '03 / Save', state: 'todo' },
              ]}
            />
            <QueueList>
              {faviconItems.map((item) => (
                <ImageQueueRow
                  key={item.id}
                  name={item.name}
                  meta={
                    item.status === 'done'
                      ? `${faviconConfig.destinationMode === 'subfolder' ? `${faviconConfig.subfolderName}/` : ''}${item.outputPath ? item.outputPath.split('/').pop() : ''} · ${item.generatedSizes?.length ?? 0} sizes`
                      : `${item.originalWidth ?? '—'} × ${item.originalHeight ?? '—'} px · ${formatBytes(item.size)}`
                  }
                  note={
                    item.status === 'done'
                      ? undefined
                      : selectedFaviconItem
                        ? `Starts after ${selectedFaviconItem.name}.`
                        : undefined
                  }
                  status={
                    item.status === 'done'
                      ? { tone: 'success', mark: STATUS_MARKS.saved, label: 'Saved' }
                      : { tone: 'muted', mark: STATUS_MARKS.waiting, label: 'Waiting' }
                  }
                />
              ))}
            </QueueList>
            <OutputBlock
              label="Your output / recipe locked"
              summary={`${faviconConfig.fit === 'contain' ? 'Fit inside' : 'Crop to fill'} · ${Math.round(faviconConfig.padding * 100)}% padding · ${Math.round(faviconConfig.radius * 100)}% corners`}
              note={`One .ico per logo in ${faviconConfig.subfolderName}/ · larger sizes skipped.`}
            />
          </>
        ) : !faviconItems.length ? (
          <>
            <DropZone
              variant="large"
              mediaType="favicon"
              showIcon={false}
              title="Give your logo a smaller home."
              subtitle="Drop logos or folders anywhere in this area."
              onAddItems={addFaviconItems}
            />
            <PrincipleList
              items={[
                { label: '01 / One logo, one .ico', description: 'Each source becomes one .ico with the selected sizes.' },
                { label: '02 / Preview before saving', description: 'Check the fit, padding and background before generating.' },
                { label: '03 / No upscaling', description: 'Raster sizes larger than the source are skipped and reported.' },
              ]}
            />
          </>
        ) : (
          <FaviconEditor
            items={faviconItems}
            selectedItem={selectedFaviconItem}
            config={faviconConfig}
            onPatchConfig={patchFaviconConfig}
            onSelectItem={setSelectedFaviconId}
            onRemoveItem={(id) =>
              setFaviconItems((prev) => prev.filter((entry) => entry.id !== id))
            }
            onClearQueue={clearQueue}
            onAddItems={addFaviconItems}
            onResetRecipe={() => setFaviconConfig(DEFAULT_FAVICON_CONFIG)}
            onResolvedBackground={setResolvedFaviconBackground}
            disabled={isProcessingFavicon}
          />
        )}
      </div>
    );
  };

  /* -------------------------------------------------------------- footer */
  const footer = () => {
    if (anyProcessing) {
      return (
        <ActionFooter
          title="Working on this machine."
          subtitle="Sequential processing · settings locked until complete."
        >
          <Button
            variant="secondary"
            size="lg"
            className="w-[130px]"
            onClick={() => {
              cancelRef.current = true;
            }}
          >
            Cancel batch
          </Button>
          <Button variant="primary" size="lg" className="w-[280px]" disabled>
            Processing {progress.current || videoProgress.current || faviconProgress.current} of{' '}
            {progress.total || videoProgress.total || faviconProgress.total}…
          </Button>
        </ActionFooter>
      );
    }

    if (activeSummary && reportOpen) {
      return (
        <ActionFooter
          title={isVideoTab || isFaviconTab ? 'Batch finished. Originals untouched.' : 'Batch finished. Originals untouched.'}
          subtitle={
            isVideoTab
              ? `${activeSummary.processedCount} new files saved in ${videoConfig.subfolderName}/.`
              : isFaviconTab
                ? `${faviconSkipped} raster sizes skipped to avoid upscaling.`
                : 'New files only · name collisions never overwrite.'
          }
        >
          <Button variant="primary" size="lg" className="w-[280px]" onClick={openOutputFolder}>
            <span>Open output folder</span>
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </Button>
        </ActionFooter>
      );
    }

    if (isVideoTab) {
      return (
        <ActionFooter
          title={videoItems.length ? 'One recipe for the whole batch.' : 'Ready when you are.'}
          subtitle={
            videoItems.length
              ? 'New files only · name collisions never overwrite.'
              : 'Add videos to begin · nothing is uploaded.'
          }
        >
          <Button
            variant="primary"
            size="lg"
            className="w-[280px]"
            disabled={!videoItems.length}
            onClick={startVideos}
          >
            {videoItems.length ? (
              <>
                <span>
                  Compress {videoItems.length} {videoItems.length === 1 ? 'video' : 'videos'}
                </span>
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </>
            ) : (
              'No videos selected'
            )}
          </Button>
        </ActionFooter>
      );
    }

    if (isFaviconTab) {
      return (
        <ActionFooter
          title={
            faviconItems.length
              ? `${countLabel(faviconItems.length, 'logo', 'logos')}. One shared recipe.`
              : 'Ready when you are.'
          }
          subtitle={
            faviconItems.length
              ? 'Smaller raster sources skip larger sizes · originals stay untouched.'
              : 'Add logos to begin · everything stays local.'
          }
        >
          <Button
            variant="primary"
            size="lg"
            className="w-[280px]"
            disabled={!faviconItems.length}
            onClick={startFavicons}
          >
            {faviconItems.length ? (
              <>
                <span>
                  Generate {faviconItems.length} {faviconItems.length === 1 ? 'favicon' : 'favicons'}
                </span>
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </>
            ) : (
              'No logos selected'
            )}
          </Button>
        </ActionFooter>
      );
    }

    return (
      <ActionFooter
        title={items.length ? 'One recipe for the whole batch.' : 'Ready when you are.'}
        subtitle={
          items.length
            ? 'New files only · name collisions never overwrite.'
            : 'Add files to begin · nothing is uploaded.'
        }
      >
        <Button
          variant="primary"
          size="lg"
          className="w-[280px]"
          disabled={!items.length}
          onClick={startImages}
        >
          {items.length ? (
            <>
              <span>
                Resize {items.length} {items.length === 1 ? 'image' : 'images'}
              </span>
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </>
          ) : (
            'No images selected'
          )}
        </Button>
      </ActionFooter>
    );
  };

  /* ----------------------------------------------------------- inspector */
  const inspector = () => {
    if (anyProcessing) {
      const label = isVideoTab ? 'Video' : isFaviconTab ? 'Favicon' : 'Image';
      const rows = isFaviconTab
        ? [
            {
              label: 'Fit & padding',
              value: `${faviconConfig.fit === 'contain' ? 'Fit inside' : 'Crop to fill'} · ${Math.round(faviconConfig.padding * 100)}% padding`,
            },
            { label: 'Corner radius', value: `${Math.round(faviconConfig.radius * 100)}%` },
            {
              label: 'Background',
              value:
                faviconConfig.backgroundMode === 'auto'
                  ? 'Auto · resolved per logo'
                  : faviconConfig.backgroundMode === 'color'
                    ? (faviconConfig.backgroundColor ?? '#FFFFFF').toUpperCase()
                    : faviconConfig.backgroundMode.charAt(0).toUpperCase() + faviconConfig.backgroundMode.slice(1),
            },
            { label: 'Requested sizes', value: `${faviconConfig.sizes.join(' · ')} px` },
            {
              label: 'Output names',
              value:
                faviconConfig.nameMode === 'favicon'
                  ? 'favicon.ico · numbered on collision'
                  : 'Source name · numbered on collision',
            },
            { label: 'Destination', value: `Subfolder · ${faviconConfig.subfolderName}/` },
          ]
        : isVideoTab
          ? [
              { label: 'Maximum width', value: `${videoConfig.maxWidth} px` },
              { label: 'Smaller sources', value: 'Kept at their original size' },
              {
                label: 'Compression',
                value:
                  videoConfig.quality === 'aggressive'
                    ? 'Smallest'
                    : videoConfig.quality === 'light'
                      ? 'Good quality'
                      : 'Balanced',
              },
              { label: 'Output format', value: videoFormatLabel },
              { label: 'Metadata', value: videoConfig.stripMetadata ? 'Stripped' : 'Kept' },
              { label: 'Destination', value: `Subfolder · ${videoConfig.subfolderName}/` },
            ]
          : [
              { label: 'Output width', value: `${config.targetWidth} px` },
              { label: 'Smaller sources', value: 'Kept at their original size' },
              {
                label: 'Compression',
                value:
                  config.compressionLevel === 'aggressive'
                    ? 'Smallest'
                    : config.compressionLevel === 'light'
                      ? 'Light'
                      : config.compressionLevel === 'lossless'
                        ? 'Lossless'
                        : 'Balanced',
              },
              {
                label: 'Output format',
                value: config.outputFormat === 'original' ? 'Original' : config.outputFormat.toUpperCase(),
              },
              { label: 'Metadata', value: config.stripMetadata ? 'EXIF, camera details and GPS removed' : 'Kept' },
              {
                label: 'Destination',
                value: `Subfolder · ${config.destinationMode === 'subfolder' ? config.subfolderName : config.suffix}`,
              },
            ];

      return (
        <RecipeUsed
          title={`${label} recipe in use · locked`}
          subtitle="Settings unlock when this batch finishes."
          rows={rows}
          callout="Originals stay untouched."
          calloutBody="The queue continues if one file fails. Completed files stay saved."
        />
      );
    }

    if (activeSummary && reportOpen) {
      if (isFaviconTab) {
        return (
          <RecipeUsed
            rows={[
              {
                label: 'Fit & padding',
                value: `${faviconConfig.fit === 'contain' ? 'Fit inside' : 'Crop to fill'} · ${Math.round(faviconConfig.padding * 100)}% padding`,
              },
              { label: 'Corner radius', value: `${Math.round(faviconConfig.radius * 100)}%` },
              { label: 'Background', value: faviconConfig.backgroundMode === 'auto' ? 'Auto · resolved per logo' : (faviconConfig.backgroundColor ?? '#FFFFFF').toUpperCase() },
              { label: 'Requested sizes', value: `${faviconConfig.sizes.join(' · ')} px` },
              {
                label: 'Output names',
                value: faviconConfig.nameMode === 'favicon' ? 'favicon.ico · numbered on collision' : 'Source name · numbered on collision',
              },
              { label: 'Destination', value: `Subfolder · ${faviconConfig.subfolderName}/` },
            ]}
            callout="Originals stay untouched."
            calloutBody="The recipe is a record of this run. Start a new batch to change the settings."
          />
        );
      }
      if (isVideoTab) {
        return (
          <RecipeUsed
            rows={[
              { label: 'Maximum width', value: `${videoConfig.maxWidth} px` },
              { label: 'Smaller sources', value: 'Kept at their original size' },
              {
                label: 'Compression',
                value: videoConfig.quality === 'aggressive' ? 'Smallest' : videoConfig.quality === 'light' ? 'Good quality' : 'Balanced',
              },
              { label: 'Output format', value: videoFormatLabel },
              { label: 'Metadata', value: videoConfig.stripMetadata ? 'Removed · original audio kept' : 'Kept' },
              { label: 'Destination', value: `Subfolder · ${videoConfig.subfolderName}/` },
            ]}
            callout="Originals stay untouched."
            calloutBody="The recipe is a record of this run. Start a new batch to change the settings."
          />
        );
      }
      return (
        <RecipeUsed
          rows={[
            { label: 'Output width', value: `${config.targetWidth} px` },
            { label: 'Smaller sources', value: 'Kept at their original size' },
            {
              label: 'Compression',
              value: config.compressionLevel === 'aggressive' ? 'Smallest' : config.compressionLevel === 'light' ? 'Light' : config.compressionLevel === 'lossless' ? 'Lossless' : 'Balanced',
            },
            { label: 'Output format', value: config.outputFormat === 'original' ? 'Original' : config.outputFormat.toUpperCase() },
            { label: 'Metadata', value: config.stripMetadata ? 'EXIF, camera details and GPS removed' : 'Kept' },
            { label: 'Destination', value: `Subfolder · ${config.destinationMode === 'subfolder' ? config.subfolderName : config.suffix}` },
          ]}
          callout="Originals stay untouched."
          calloutBody="The recipe is a record of this run. Start a new batch to change the settings."
        />
      );
    }

    if (isVideoTab) {
      return (
        <VideoInspector
          config={videoConfig}
          onPatch={patchVideoConfig}
          widthIsCustom={videoWidthIsCustom}
          onSelectWidth={(width) => {
            setVideoWidthIsCustom(false);
            patchVideoConfig({ maxWidth: width });
          }}
          onSelectCustomWidth={() => {
            setVideoWidthIsCustom(true);
            patchVideoConfig({ maxWidth: videoCustomWidth });
          }}
          onCustomWidthChange={(width) => {
            setVideoWidthIsCustom(true);
            setVideoCustomWidth(width);
            patchVideoConfig({ maxWidth: width });
          }}
        />
      );
    }

    if (isFaviconTab) {
      return (
        <FaviconInspector
          config={faviconConfig}
          onPatch={patchFaviconConfig}
          resolvedBackground={resolvedFaviconBackground}
        />
      );
    }

    return (
      <ImageInspector
        config={config}
        onPatch={patchConfig}
        widthIsCustom={widthIsCustom}
        onSelectPreset={selectWidthPreset}
        onSelectCustom={selectCustomWidth}
        onCustomWidthChange={changeCustomWidth}
      />
    );
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-paper text-ink" data-theme={resolvedTheme}>
      {isMac && <WindowBar />}
      <Header
        tabs={
          <MediaTabs activeTab={mediaTab} onChange={setMediaTab} disabled={anyProcessing} />
        }
      />
      <WorkbenchLayout
        workspace={
          isVideoTab ? videoWorkspace() : isFaviconTab ? faviconWorkspace() : imageWorkspace()
        }
        inspector={inspector()}
      />
      {footer()}
    </div>
  );
};

export default App;
