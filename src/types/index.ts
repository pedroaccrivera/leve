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
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
