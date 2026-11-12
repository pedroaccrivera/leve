import React, { useEffect, useRef, useState } from 'react';
import {
  Loader2,
  FolderOpen,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import type {
  ImageItem,
  ResizeConfig,
  ResizePreset,
  BatchSummary,
  VideoItem,
  VideoConfig,
  FaviconItem,
  FaviconConfig,
  FaviconSize,
  MediaTab,
} from './types';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { SettingsPanel } from './components/SettingsPanel';
import { ImageQueue } from './components/ImageQueue';
import { SummaryModal } from './components/SummaryModal';
import { VideoSettingsPanel } from './components/VideoSettingsPanel';
import { VideoQueue } from './components/VideoQueue';
import { FaviconSettingsPanel } from './components/FaviconSettingsPanel';
import { FaviconQueue } from './components/FaviconQueue';
import { FaviconEditor } from './components/FaviconEditor';
import { QueueClearButton } from './components/QueueClearButton';
import { MediaTabs } from './components/MediaTabs';

const DEFAULT_PRESETS: ResizePreset[] = [
  { id: 'web-800', name: 'Web Small', width: 800 },
  { id: 'hd-1280', name: 'HD', width: 1280 },
  { id: 'fhd-1920', name: 'Full HD', width: 1920 },
  { id: '2k-2560', name: '2K QHD', width: 2560 },
  { id: '4k-3840', name: '4K UHD', width: 3840 },
];

const PRESETS_STORAGE_KEY = 'user_custom_resize_presets';

export const App: React.FC = () => {
  const [mediaTab, setMediaTab] = useState<MediaTab>('images');
  const [items, setItems] = useState<ImageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [summary, setSummary] = useState<BatchSummary | null>(null);

  // Video compression state (feat/video-compression)
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState({ current: 0, total: 0 });
  const [videoSummary, setVideoSummary] = useState<BatchSummary | null>(null);
  const [videoConfig, setVideoConfig] = useState<VideoConfig>({
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
  });

  // Live ffmpeg progress → per-item progress bar.
  useEffect(() => {
    if (!window.electronAPI?.onVideoProgress) return;
    const unsubscribe = window.electronAPI.onVideoProgress((id, pct) => {
      setVideoItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, progress: pct } : item))
      );
    });
    return unsubscribe;
  }, []);

  // Favicon generation state (feat/favicon-ico)
  const [faviconItems, setFaviconItems] = useState<FaviconItem[]>([]);
  const [selectedFaviconId, setSelectedFaviconId] = useState<string | null>(null);
  const [isProcessingFavicon, setIsProcessingFavicon] = useState(false);
  const [faviconProgress, setFaviconProgress] = useState({ current: 0, total: 0 });
  const [faviconSummary, setFaviconSummary] = useState<BatchSummary | null>(null);
  const [faviconConfig, setFaviconConfig] = useState<FaviconConfig>({
    sizes: [16, 32, 48, 64, 128, 256],
    fit: 'contain',
    padding: 0,
    radius: 0,
    backgroundMode: 'auto',
    backgroundColor: '#ffffff',
    nameMode: 'favicon',
    destinationMode: 'subfolder',
    subfolderName: 'favicons',
    customFolderPath: '',
  });

  // User configurable options
  const [config, setConfig] = useState<ResizeConfig>({
    targetWidth: 1920,
    withoutEnlargement: true,
    compressionLevel: 'balanced',
    stripMetadata: false, // In default UI: "Keep metadata" is checked by default
    outputFormat: 'original',
    destinationMode: 'subfolder',
    subfolderName: 'resized',
    suffix: '-resized',
    customFolderPath: '',
  });

  // Presets management
  const [presets, setPresets] = useState<ResizePreset[]>(() => {
    try {
      const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (saved) {
        const customPresets: ResizePreset[] = JSON.parse(saved);
        return [...DEFAULT_PRESETS, ...customPresets];
      }
    } catch (e) {
      console.error('Error loading custom presets:', e);
    }
    return DEFAULT_PRESETS;
  });

  const handleAddPreset = (name: string, width: number) => {
    const newPreset: ResizePreset = {
      id: `custom_${Date.now()}`,
      name,
      width,
      isCustom: true,
    };
    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    try {
      const customOnly = updatedPresets.filter((p) => p.isCustom);
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(customOnly));
    } catch (e) {
      console.error('Error saving custom presets:', e);
    }
  };

  const handleDeletePreset = (id: string) => {
    const updatedPresets = presets.filter((p) => p.id !== id);
    setPresets(updatedPresets);
    try {
      const customOnly = updatedPresets.filter((p) => p.isCustom);
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(customOnly));
    } catch (e) {
      console.error('Error saving custom presets:', e);
    }
  };

  const handleAddItems = (newItems: ImageItem[]) => {
    setItems((prev) => {
      // Deduplicate by path
      const existingPaths = new Set(prev.map((i) => i.path));
      const filtered = newItems.filter((i) => !existingPaths.has(i.path));
      return [...prev, ...filtered];
    });
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearAll = () => {
    setItems([]);
    setSummary(null);
  };

  const handleAddVideoItems = (newItems: VideoItem[]) => {
    setVideoItems((prev) => {
      const existingPaths = new Set(prev.map((i) => i.path));
      const filtered = newItems.filter((i) => !existingPaths.has(i.path));
      return [...prev, ...filtered];
    });
  };

  const handleRemoveVideoItem = (id: string) => {
    setVideoItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearVideos = () => {
    setVideoItems([]);
    setVideoSummary(null);
  };

  const handleAddFaviconItems = (newItems: ImageItem[]) => {
    const existingPaths = new Set(faviconItems.map((i) => i.path));
    const firstNew = newItems.find((item) => !existingPaths.has(item.path));
    if (firstNew) setSelectedFaviconId(firstNew.id);

    setFaviconItems((prev) => {
      const prevPaths = new Set(prev.map((i) => i.path));
      const filtered = newItems.filter((i) => !prevPaths.has(i.path));
      return [...prev, ...filtered];
    });
  };

  const handleRemoveFaviconItem = (id: string) => {
    const index = faviconItems.findIndex((item) => item.id === id);
    const neighbor =
      index >= 0
        ? faviconItems[index + 1] ?? faviconItems[index - 1] ?? null
        : null;

    setFaviconItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedFaviconId((current) =>
      current === id ? neighbor?.id ?? null : current
    );
  };

  const handleClearFavicons = () => {
    setFaviconItems([]);
    setFaviconSummary(null);
    setSelectedFaviconId(null);
  };

  const handleStartProcessing = async () => {
    if (!items.length || isProcessing || !window.electronAPI) return;

    setIsProcessing(true);
    const startTime = Date.now();
    let processedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let originalTotalBytes = 0;
    let newTotalBytes = 0;

    setProgress({ current: 0, total: items.length });

    // Process sequentially to keep memory usage low and UI responsive
    for (let i = 0; i < items.length; i++) {
      const currentItem = items[i];
      originalTotalBytes += currentItem.size || 0;

      // Update state to processing
      setItems((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: 'processing' } : item
        )
      );
      setProgress({ current: i + 1, total: items.length });

      const result = await window.electronAPI.processImage(currentItem, config);

      if (result.skipped) {
        skippedCount++;
        newTotalBytes += currentItem.size || 0;
        setItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: 'skipped',
                  newSize: currentItem.size,
                }
              : item
          )
        );
      } else if (result.success) {
        processedCount++;
        newTotalBytes += result.newSize || 0;
        setItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: 'done',
                  outputPath: result.outputPath,
                  newSize: result.newSize,
                  newWidth: result.newWidth,
                  newHeight: result.newHeight,
                }
              : item
          )
        );
      } else {
        failedCount++;
        setItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: 'error',
                  error: result.error,
                }
              : item
          )
        );
      }
    }

    const durationMs = Date.now() - startTime;
    const totalSavedBytes = Math.max(0, originalTotalBytes - newTotalBytes);
    const percentageSaved =
      originalTotalBytes > 0
        ? Math.round((totalSavedBytes / originalTotalBytes) * 100)
        : 0;

    setSummary({
      totalImages: items.length,
      processedCount,
      failedCount,
      skippedCount,
      originalTotalBytes,
      newTotalBytes,
      totalSavedBytes,
      percentageSaved,
      durationMs,
      mediaLabel: 'Images',
    });

    setIsProcessing(false);
  };

  const handleStartVideoProcessing = async () => {
    if (!videoItems.length || isProcessingVideo || !window.electronAPI) return;

    setIsProcessingVideo(true);
    const startTime = Date.now();
    let processedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let originalTotalBytes = 0;
    let newTotalBytes = 0;

    setVideoProgress({ current: 0, total: videoItems.length });

    // Sequential: ffmpeg is already multi-threaded; parallel jobs would
    // thrash CPU and memory on large batches.
    for (let i = 0; i < videoItems.length; i++) {
      const currentItem = videoItems[i];
      originalTotalBytes += currentItem.size || 0;

      setVideoItems((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: 'processing', progress: 0 } : item
        )
      );
      setVideoProgress({ current: i + 1, total: videoItems.length });

      const result = await window.electronAPI.processVideo(currentItem, videoConfig);

      if (result.skipped) {
        skippedCount++;
        newTotalBytes += currentItem.size || 0;
        setVideoItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: 'skipped',
                  progress: 100,
                  newSize: currentItem.size,
                }
              : item
          )
        );
      } else if (result.success) {
        processedCount++;
        newTotalBytes += result.newSize || 0;
        setVideoItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: 'done',
                  progress: 100,
                  outputPath: result.outputPath,
                  newSize: result.newSize,
                  newWidth: result.newWidth,
                  newHeight: result.newHeight,
                }
              : item
          )
        );
      } else {
        failedCount++;
        setVideoItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? { ...item, status: 'error', error: result.error }
              : item
          )
        );
      }
    }

    const durationMs = Date.now() - startTime;
    const totalSavedBytes = Math.max(0, originalTotalBytes - newTotalBytes);
    const percentageSaved =
      originalTotalBytes > 0
        ? Math.round((totalSavedBytes / originalTotalBytes) * 100)
        : 0;

    setVideoSummary({
      totalImages: videoItems.length,
      processedCount,
      failedCount,
      skippedCount,
      originalTotalBytes,
      newTotalBytes,
      totalSavedBytes,
      percentageSaved,
      durationMs,
      mediaLabel: 'Videos',
    });

    setIsProcessingVideo(false);
  };

  const handleStartFaviconProcessing = async () => {
    if (!faviconItems.length || isProcessingFavicon || !window.electronAPI) return;

    setIsProcessingFavicon(true);
    const startTime = Date.now();
    let processedCount = 0;
    let failedCount = 0;
    let originalTotalBytes = 0;
    let newTotalBytes = 0;
    const generatedSizes = new Set<FaviconSize>();

    setFaviconProgress({ current: 0, total: faviconItems.length });

    // Sequential like the other flows: sharp is already multi-threaded and
    // this keeps memory predictable on large batches.
    for (let i = 0; i < faviconItems.length; i++) {
      const currentItem = faviconItems[i];
      originalTotalBytes += currentItem.size || 0;

      setFaviconItems((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: 'processing' } : item
        )
      );
      setFaviconProgress({ current: i + 1, total: faviconItems.length });

      const result = await window.electronAPI.generateFavicon(currentItem, faviconConfig);

      if (result.success) {
        processedCount++;
        newTotalBytes += result.newSize || 0;
        result.generatedSizes?.forEach((size) => generatedSizes.add(size));
        setFaviconItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: 'done',
                  outputPath: result.outputPath,
                  newSize: result.newSize,
                  generatedSizes: result.generatedSizes,
                  skippedSizes: result.skippedSizes,
                }
              : item
          )
        );
      } else {
        failedCount++;
        setFaviconItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? { ...item, status: 'error', error: result.error }
              : item
          )
        );
      }
    }

    const durationMs = Date.now() - startTime;

    setFaviconSummary({
      totalImages: faviconItems.length,
      processedCount,
      failedCount,
      skippedCount: 0,
      originalTotalBytes,
      newTotalBytes,
      totalSavedBytes: 0,
      percentageSaved: 0,
      durationMs,
      mediaLabel: 'Favicons',
      mode: 'favicon',
      generatedSizes: Array.from(generatedSizes).sort((a, b) => a - b),
    });

    setIsProcessingFavicon(false);
  };

  const handleOpenOutputFolder = () => {
    if (!window.electronAPI) return;
    if (config.destinationMode === 'custom_folder' && config.customFolderPath) {
      window.electronAPI.openInFolder(config.customFolderPath);
      return;
    }
    const firstDone = items.find((i) => i.status === 'done' && i.outputPath);
    if (firstDone?.outputPath) {
      window.electronAPI.openInFolder(firstDone.outputPath);
    }
  };

  const handleOpenVideoOutputFolder = () => {
    if (!window.electronAPI) return;
    if (videoConfig.destinationMode === 'custom_folder' && videoConfig.customFolderPath) {
      window.electronAPI.openInFolder(videoConfig.customFolderPath);
      return;
    }
    const firstDone = videoItems.find((i) => i.status === 'done' && i.outputPath);
    if (firstDone?.outputPath) {
      window.electronAPI.openInFolder(firstDone.outputPath);
    }
  };

  const handleOpenFaviconOutputFolder = () => {
    if (!window.electronAPI) return;
    if (
      faviconConfig.destinationMode === 'custom_folder' &&
      faviconConfig.customFolderPath
    ) {
      window.electronAPI.openInFolder(faviconConfig.customFolderPath);
      return;
    }
    const firstDone = faviconItems.find((i) => i.status === 'done' && i.outputPath);
    if (firstDone?.outputPath) {
      window.electronAPI.openInFolder(firstDone.outputPath);
    }
  };

  const doneCount = items.filter((i) => i.status === 'done').length;
  const videoDoneCount = videoItems.filter((i) => i.status === 'done').length;
  const faviconDoneCount = faviconItems.filter((i) => i.status === 'done').length;
  const selectedFaviconItem =
    faviconItems.find((item) => item.id === selectedFaviconId) ??
    faviconItems[0] ??
    null;
  const isVideoTab = mediaTab === 'videos';
  const isFaviconTab = mediaTab === 'favicon';
  const activeCount = isVideoTab
    ? videoItems.length
    : isFaviconTab
    ? faviconItems.length
    : items.length;
  const activeProcessing = isProcessing || isProcessingVideo || isProcessingFavicon;
  const activeSummary = isVideoTab
    ? videoSummary
    : isFaviconTab
    ? faviconSummary
    : summary;
  const mainRef = useRef<HTMLElement | null>(null);
  const closeSummary = () => {
    if (isVideoTab) setVideoSummary(null);
    else if (isFaviconTab) setFaviconSummary(null);
    else setSummary(null);
  };

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-darkBg text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Header
        scrollContainerRef={mainRef}
        tabs={
          <MediaTabs
            activeTab={mediaTab}
            onChange={setMediaTab}
            disabled={activeProcessing}
          />
        }
      />

      <main
        ref={mainRef}
        className="flex-1 min-h-0 overflow-y-auto px-8 pt-[5.75rem] pb-10 flex flex-col items-center"
      >
        <div className="w-full max-w-2xl flex flex-col gap-6">
          {/* Drop & Upload Area */}
          <DropZone
            onAddItems={isFaviconTab ? handleAddFaviconItems : handleAddItems}
            onAddVideoItems={handleAddVideoItems}
            mediaType={mediaTab}
            isCompact={activeCount > 0}
          />

          {/* Queue of selected media if any */}
          {!isVideoTab && !isFaviconTab && items.length > 0 && (
            <div className="flex flex-col gap-2">
              <ImageQueue
                items={items}
                config={config}
                onRemoveItem={handleRemoveItem}
                isProcessing={isProcessing}
              />
              <QueueClearButton
                count={items.length}
                noun="images"
                onClick={handleClearAll}
                disabled={isProcessing}
              />
            </div>
          )}
          {isVideoTab && videoItems.length > 0 && (
            <div className="flex flex-col gap-2">
              <VideoQueue
                items={videoItems}
                config={videoConfig}
                onRemoveItem={handleRemoveVideoItem}
                isProcessing={isProcessingVideo}
              />
              <QueueClearButton
                count={videoItems.length}
                noun="videos"
                onClick={handleClearVideos}
                disabled={isProcessingVideo}
              />
            </div>
          )}
          {isFaviconTab && faviconItems.length > 0 && (
            <FaviconEditor
              items={faviconItems}
              selectedItem={selectedFaviconItem}
              config={faviconConfig}
              onChangeConfig={setFaviconConfig}
              onSelectItem={setSelectedFaviconId}
              disabled={isProcessingFavicon}
            />
          )}
          {isFaviconTab && faviconItems.length > 0 && (
            <div className="flex flex-col gap-2">
              <FaviconQueue
                items={faviconItems}
                config={faviconConfig}
                selectedItemId={selectedFaviconItem?.id ?? null}
                onSelectItem={setSelectedFaviconId}
                onRemoveItem={handleRemoveFaviconItem}
                isProcessing={isProcessingFavicon}
              />
              <QueueClearButton
                count={faviconItems.length}
                noun="logos"
                onClick={handleClearFavicons}
                disabled={isProcessingFavicon}
              />
            </div>
          )}

          {/* Settings Panel */}
          {!isVideoTab && !isFaviconTab && (
            <SettingsPanel
              config={config}
              onChangeConfig={setConfig}
              presets={presets}
              onAddPreset={handleAddPreset}
              onDeletePreset={handleDeletePreset}
              disabled={isProcessing}
            />
          )}
          {isVideoTab && (
            <VideoSettingsPanel
              config={videoConfig}
              onChangeConfig={setVideoConfig}
              disabled={isProcessingVideo}
            />
          )}
          {isFaviconTab && (
            <FaviconSettingsPanel
              config={faviconConfig}
              onChangeConfig={setFaviconConfig}
              disabled={isProcessingFavicon}
            />
          )}

          {/* Processing and Status / Open Folder */}
          {!isVideoTab && !isFaviconTab && doneCount > 0 && !isProcessing && (
            <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>{doneCount} images successfully resized!</span>
              </div>
              <button
                type="button"
                onClick={handleOpenOutputFolder}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Open Folder</span>
              </button>
            </div>
          )}
          {isVideoTab && videoDoneCount > 0 && !isProcessingVideo && (
            <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>{videoDoneCount} videos successfully compressed!</span>
              </div>
              <button
                type="button"
                onClick={handleOpenVideoOutputFolder}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Open Folder</span>
              </button>
            </div>
          )}
          {isFaviconTab && faviconDoneCount > 0 && !isProcessingFavicon && (
            <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {faviconDoneCount}{' '}
                  {faviconDoneCount === 1 ? 'favicon' : 'favicons'} generated!
                </span>
              </div>
              <button
                type="button"
                onClick={handleOpenFaviconOutputFolder}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Open Folder</span>
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Sticky action footer — always visible regardless of queue length or window height */}
      <footer className="flex-shrink-0 border-t border-slate-200 dark:border-[#283254] bg-white/90 dark:bg-[#10162b]/95 backdrop-blur px-8 py-4">
        <div className="w-full max-w-2xl mx-auto">
          {!isVideoTab && !isFaviconTab ? (
              <button
                type="button"
                onClick={handleStartProcessing}
                disabled={isProcessing || items.length === 0}
                className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                  items.length === 0
                    ? 'bg-slate-200 dark:bg-[#1e263f] text-slate-400 dark:text-[#4f5f8b] cursor-not-allowed border border-transparent'
                    : isProcessing
                    ? 'bg-blue-600 text-white cursor-wait opacity-90'
                    : 'bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white shadow-blue-600/25 border border-blue-500'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>
                      Resizing {progress.current} of {progress.total} images...
                    </span>
                  </>
                ) : items.length === 0 ? (
                  <span>Resize Images</span>
                ) : doneCount > 0 ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Re-run Resize ({items.length} Images)</span>
                  </>
                ) : (
                  <span>Resize {items.length} {items.length === 1 ? 'Image' : 'Images'}</span>
                )}
              </button>
            ) : isVideoTab ? (
              <button
                type="button"
                onClick={handleStartVideoProcessing}
                disabled={isProcessingVideo || videoItems.length === 0}
                className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                  videoItems.length === 0
                    ? 'bg-slate-200 dark:bg-[#1e263f] text-slate-400 dark:text-[#4f5f8b] cursor-not-allowed border border-transparent'
                    : isProcessingVideo
                    ? 'bg-blue-600 text-white cursor-wait opacity-90'
                    : 'bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white shadow-blue-600/25 border border-blue-500'
                }`}
              >
                {isProcessingVideo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>
                      Compressing {videoProgress.current} of {videoProgress.total} videos...
                    </span>
                  </>
                ) : videoItems.length === 0 ? (
                  <span>Compress Videos</span>
                ) : videoDoneCount > 0 ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Re-run Compression ({videoItems.length} Videos)</span>
                  </>
                ) : (
                  <span>Compress {videoItems.length} {videoItems.length === 1 ? 'Video' : 'Videos'}</span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartFaviconProcessing}
                disabled={isProcessingFavicon || faviconItems.length === 0}
                className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                  faviconItems.length === 0
                    ? 'bg-slate-200 dark:bg-[#1e263f] text-slate-400 dark:text-[#4f5f8b] cursor-not-allowed border border-transparent'
                    : isProcessingFavicon
                    ? 'bg-blue-600 text-white cursor-wait opacity-90'
                    : 'bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white shadow-blue-600/25 border border-blue-500'
                }`}
              >
                {isProcessingFavicon ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>
                      Generating {faviconProgress.current} of {faviconProgress.total} favicons...
                    </span>
                  </>
                ) : faviconItems.length === 0 ? (
                  <span>Generate Favicon</span>
                ) : faviconDoneCount > 0 ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Re-run Generation ({faviconItems.length} {faviconItems.length === 1 ? 'Image' : 'Images'})</span>
                  </>
                ) : (
                  <span>Generate {faviconItems.length} {faviconItems.length === 1 ? 'Favicon' : 'Favicons'}</span>
                )}
              </button>
            )}
        </div>
      </footer>

      {/* Summary Modal on completion */}
      <SummaryModal
        summary={activeSummary}
        onClose={closeSummary}
        onOpenFolder={
          isVideoTab
            ? handleOpenVideoOutputFolder
            : isFaviconTab
            ? handleOpenFaviconOutputFolder
            : handleOpenOutputFolder
        }
      />
    </div>
  );
};
