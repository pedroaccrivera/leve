export type CompressionLevel = 'light' | 'balanced' | 'aggressive' | 'lossless';

export type OutputFormat = 'original' | 'jpeg' | 'png' | 'webp';

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
  status: 'pending' | 'processing' | 'done' | 'error';
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
  originalTotalBytes: number;
  newTotalBytes: number;
  totalSavedBytes: number;
  percentageSaved: number;
  durationMs: number;
  /** Label for the processed media, e.g. 'Images' or 'Videos'. Defaults to 'Images'. */
  mediaLabel?: string;
}

// ---------------------------------------------------------------------------
// Video compression for web (feat/video-compression)
// ---------------------------------------------------------------------------

export type VideoQuality = 'light' | 'balanced' | 'aggressive';

export type VideoOutputFormat = 'mp4' | 'webm';

export interface VideoItem {
  id: string;
  path: string;
  name: string;
  size: number;
  originalWidth?: number;
  originalHeight?: number;
  durationSec?: number;
  status: 'pending' | 'processing' | 'done' | 'error';
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
  outputPath?: string;
  newSize?: number;
  newWidth?: number;
  newHeight?: number;
  durationSec?: number;
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
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
