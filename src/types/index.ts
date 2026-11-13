export type CompressionLevel = 'light' | 'balanced' | 'aggressive' | 'lossless';

export type OutputFormat = 'original' | 'jpeg' | 'png' | 'webp';

export type MediaTab = 'images' | 'videos' | 'favicon';

export type OutputDestinationMode = 'subfolder' | 'suffix' | 'custom_folder';

export interface ResizePreset {
  id: string;
  name: string;
  width: number;
  isCustom?: boolean;
}

export interface ImageItem {
  id: string;
  path: string;
  name: string;
  size: number;
  originalWidth?: number;
  originalHeight?: number;
  status: 'pending' | 'processing' | 'done' | 'skipped' | 'error';
  newSize?: number;
  newWidth?: number;
  newHeight?: number;
  outputPath?: string;
  error?: string;
  previewUrl?: string;
}

export interface ResizeConfig {
  targetWidth: number;
  withoutEnlargement: boolean;
  compressionLevel: CompressionLevel;
  stripMetadata: boolean;
  outputFormat: OutputFormat;
  destinationMode: OutputDestinationMode;
  customFolderPath?: string;
  subfolderName: string;
  suffix: string;
}

export interface ProcessResult {
  id: string;
  success: boolean;
  /** True when the output was larger than the original and was discarded. */
  skipped?: boolean;
  outputPath?: string;
  newSize?: number;
  newWidth?: number;
  newHeight?: number;
  error?: string;
}

export interface BatchSummary {
  totalImages: number;
  processedCount: number;
  failedCount: number;
  /** Items refused because the output would be larger than the original. */
  skippedCount: number;
  originalTotalBytes: number;
  newTotalBytes: number;
  totalSavedBytes: number;
  percentageSaved: number;
  durationMs: number;
  /** Label for the processed media, e.g. 'Images' or 'Videos'. Defaults to 'Images'. */
  mediaLabel?: string;
  /** Rendering mode for the summary modal. Defaults to 'media'. */
  mode?: 'media' | 'favicon';
  /** Sizes packed into the generated favicon (favicon mode only). */
  generatedSizes?: number[];
  /** Selected sizes skipped because the source was smaller (favicon mode only). */
  skippedSizes?: number;
}

// ---------------------------------------------------------------------------
// Video compression for web (feat/video-compression)
// ---------------------------------------------------------------------------

export type VideoQuality = 'light' | 'balanced' | 'aggressive';

export type VideoOutputFormat = 'mp4' | 'webm' | 'original';

export interface VideoItem {
  id: string;
  path: string;
  name: string;
  size: number;
  originalWidth?: number;
  originalHeight?: number;
  durationSec?: number;
  status: 'pending' | 'processing' | 'done' | 'skipped' | 'error';
  /** Live 0–100 progress of the in-flight ffmpeg job. */
  progress?: number;
  newSize?: number;
  newWidth?: number;
  newHeight?: number;
  outputPath?: string;
  error?: string;
  previewUrl?: string;
}

export interface VideoConfig {
  maxWidth: number;
  withoutEnlargement: boolean;
  quality: VideoQuality;
  outputFormat: VideoOutputFormat;
  stripMetadata: boolean;
  muteAudio: boolean;
  destinationMode: OutputDestinationMode;
  customFolderPath?: string;
  subfolderName: string;
  suffix: string;
}

export interface VideoProcessResult {
  id: string;
  success: boolean;
  /** True when the output was larger than the original and was discarded. */
  skipped?: boolean;
  outputPath?: string;
  newSize?: number;
  newWidth?: number;
  newHeight?: number;
  durationSec?: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Favicon generation (`feat/favicon-ico`)
// ---------------------------------------------------------------------------

export const FAVICON_SIZES = [16, 32, 48, 64, 128, 256] as const;

export type FaviconSize = (typeof FAVICON_SIZES)[number];

export type FaviconFit = 'cover' | 'contain';

export type FaviconBackgroundMode = 'auto' | 'white' | 'black' | 'color' | 'transparent';

export type FaviconNameMode = 'favicon' | 'source';

export type FaviconDestinationMode = 'same_folder' | 'subfolder' | 'custom_folder';

export interface FaviconConfig {
  sizes: FaviconSize[];
  fit: FaviconFit;
  /** Fraction of the canvas inset on each side (0–0.3). Only used with `contain`. */
  padding: number;
  /** Corner radius as a fraction of the icon side (0–0.5); 0.5 renders a circle. */
  radius: number;
  backgroundMode: FaviconBackgroundMode;
  /** Hex color used when `backgroundMode` is `color`. */
  backgroundColor?: string;
  nameMode: FaviconNameMode;
  destinationMode: FaviconDestinationMode;
  subfolderName: string;
  customFolderPath?: string;
}

export interface FaviconItem extends ImageItem {
  /** Sizes actually written into the generated ICO. */
  generatedSizes?: FaviconSize[];
  /** Selected sizes skipped because the source is smaller than them. */
  skippedSizes?: FaviconSize[];
}

export interface FaviconResult {
  id: string;
  success: boolean;
  outputPath?: string;
  newSize?: number;
  generatedSizes?: FaviconSize[];
  skippedSizes?: FaviconSize[];
  error?: string;
}

export interface FaviconPreviewResult {
  success: boolean;
  /** PNG data URL used by the mini editor. */
  dataUrl?: string;
  width?: number;
  height?: number;
  /** Resolved background, e.g. `#ffffff`, `#000000` or `transparent`. */
  resolvedBackground?: string;
  error?: string;
}

export interface ElectronAPI {
  selectFiles: () => Promise<ImageItem[]>;
  selectFolder: () => Promise<ImageItem[]>;
  selectDestinationFolder: () => Promise<string | null>;
  scanDroppedPaths: (paths: string[]) => Promise<ImageItem[]>;
  getImageMetadata: (filePath: string) => Promise<{ width?: number; height?: number; size: number }>;
  processImage: (item: ImageItem, config: ResizeConfig) => Promise<ProcessResult>;
  openInFolder: (path: string) => Promise<void>;
  getImageThumbnail: (filePath: string) => Promise<string>;
  getPathForFile: (file: File) => string;
  // Video compression for web
  selectVideoFiles: () => Promise<VideoItem[]>;
  selectVideoFolder: () => Promise<VideoItem[]>;
  scanDroppedVideoPaths: (paths: string[]) => Promise<VideoItem[]>;
  getVideoThumbnail: (filePath: string) => Promise<string>;
  processVideo: (item: VideoItem, config: VideoConfig) => Promise<VideoProcessResult>;
  onVideoProgress: (callback: (id: string, progress: number) => void) => () => void;
  // Favicon generation
  generateFavicon: (item: FaviconItem, config: FaviconConfig) => Promise<FaviconResult>;
  renderFaviconPreview: (
    filePath: string,
    config: FaviconConfig
  ) => Promise<FaviconPreviewResult>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
