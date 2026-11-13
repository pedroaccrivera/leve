import type {
  BatchSummary,
  FaviconConfig,
  FaviconItem,
  ImageItem,
  ResizeConfig,
  VideoConfig,
  VideoItem,
} from '../types';

/**
 * Dev-only fixtures that reproduce the exact queues shown in the Figma
 * reference screens, so a screen can be compared 1:1 at 1280 × 800.
 * Loaded with `?fixture=<name>` and never bundled into a production build.
 */

const image = (
  index: number,
  name: string,
  width: number,
  height: number,
  size: number,
  status: ImageItem['status'] = 'pending'
): ImageItem => ({
  id: `fixture-image-${index}`,
  path: `/Users/you/Pictures/${name}`,
  name,
  size,
  originalWidth: width,
  originalHeight: height,
  status,
});

const video = (
  index: number,
  name: string,
  width: number,
  height: number,
  size: number,
  status: VideoItem['status'] = 'pending'
): VideoItem => ({
  id: `fixture-video-${index}`,
  path: `/Users/you/Movies/${name}`,
  name,
  size,
  originalWidth: width,
  originalHeight: height,
  status,
});

const favicon = (
  index: number,
  name: string,
  width: number,
  height: number,
  size: number,
  status: ImageItem['status'] = 'pending'
): FaviconItem => ({
  id: `fixture-logo-${index}`,
  path: `/Users/you/Logos/${name}`,
  name,
  size,
  originalWidth: width,
  originalHeight: height,
  status,
});

const IMAGE_FILES: [string, number, number, number][] = [
  ['photo-01.jpg', 3000, 2000, 2.4 * 1024 * 1024],
  ['photo-02.jpg', 2400, 1600, 4.1 * 1024 * 1024],
  ['photo-03.jpg', 1800, 1200, 5.9 * 1024 * 1024],
];

const VIDEO_FILES: [string, number, number, number][] = [
  ['video-01.mp4', 1920, 1080, 48 * 1024 * 1024],
  ['video-02.mov', 3840, 2160, 220 * 1024 * 1024],
];

const LOGO_FILES: [string, number, number, number][] = [
  ['sample-logo.png', 512, 512, 12.4 * 1024],
  ['sample-logo-128.png', 128, 128, 4.2 * 1024],
  ['sample-logo-32.png', 32, 32, 1.1 * 1024],
];

export interface FixtureState {
  items?: ImageItem[];
  isProcessing?: boolean;
  progress?: { current: number; total: number };
  activeIndex?: number;
  summary?: BatchSummary | null;
  reportOpen?: boolean;
  videoItems?: VideoItem[];
  isProcessingVideo?: boolean;
  videoProgress?: { current: number; total: number };
  videoSummary?: BatchSummary | null;
  faviconItems?: FaviconItem[];
  selectedFaviconId?: string | null;
  isProcessingFavicon?: boolean;
  faviconProgress?: { current: number; total: number };
  faviconSummary?: BatchSummary | null;
  config?: Partial<ResizeConfig>;
  videoConfig?: Partial<VideoConfig>;
  faviconConfig?: Partial<FaviconConfig>;
}

const reportSummary = (mediaLabel: string): BatchSummary => ({
  totalImages: 3,
  processedCount: 1,
  failedCount: 1,
  skippedCount: 1,
  originalTotalBytes: 12.4 * 1024 * 1024,
  newTotalBytes: 5.2 * 1024 * 1024,
  totalSavedBytes: 7.2 * 1024 * 1024,
  percentageSaved: 58,
  durationMs: 8400,
  mediaLabel,
});

export function fixtureState(name: string): FixtureState | null {
  switch (name) {
    case 'images-start':
      return {};
    case 'images-ready':
      return {
        items: IMAGE_FILES.map(([file, w, h, size], index) => image(index + 1, file, w, h, size)),
        config: { outputFormat: 'webp' },
      };
    case 'images-processing':
      return {
        items: [
          image(1, 'photo-01.jpg', 3000, 2000, 2.4 * 1024 * 1024, 'done'),
          image(2, 'photo-02.jpg', 2400, 1600, 4.1 * 1024 * 1024, 'processing'),
          image(3, 'photo-03.jpg', 1800, 1200, 5.9 * 1024 * 1024, 'pending'),
        ],
        isProcessing: true,
        progress: { current: 2, total: 3 },
        activeIndex: 1,
        config: { outputFormat: 'webp' },
      };
    case 'images-report':
      return {
        items: [
          image(1, 'photo-01.jpg', 3000, 2000, 2.4 * 1024 * 1024, 'skipped'),
          {
            ...image(2, 'photo-02.jpg', 2400, 1600, 4.1 * 1024 * 1024, 'done'),
            outputPath: '/Users/you/Pictures/resized/photo-02.webp',
            newSize: 5.2 * 1024 * 1024,
          },
          {
            ...image(3, 'photo-03.jpg', 1800, 1200, 5.9 * 1024 * 1024, 'error'),
            error: "Couldn't read this image. Original untouched.",
          },
        ],
        summary: reportSummary('Images'),
        reportOpen: true,
        config: { outputFormat: 'webp' },
      };
    case 'videos-ready':
      return {
        videoItems: VIDEO_FILES.map(([file, w, h, size], index) => video(index + 1, file, w, h, size)),
      };
    case 'videos-processing':
      return {
        videoItems: [
          { ...video(1, 'video-01.mp4', 1920, 1080, 48 * 1024 * 1024, 'processing'), progress: 0 },
          video(2, 'video-02.mov', 3840, 2160, 220 * 1024 * 1024, 'pending'),
        ],
        isProcessingVideo: true,
        videoProgress: { current: 1, total: 2 },
      };
    case 'videos-report':
      return {
        videoItems: [
          {
            ...video(1, 'video-01.mp4', 1920, 1080, 48 * 1024 * 1024, 'done'),
            outputPath: '/Users/you/Movies/compressed/video-01.mp4',
            newSize: 18 * 1024 * 1024,
          },
          {
            ...video(2, 'video-02.mov', 3840, 2160, 220 * 1024 * 1024, 'done'),
            outputPath: '/Users/you/Movies/compressed/video-02.mp4',
            newSize: 92 * 1024 * 1024,
          },
        ],
        videoSummary: {
          ...reportSummary('Videos'),
          totalImages: 2,
          processedCount: 2,
          failedCount: 0,
          skippedCount: 0,
        },
        reportOpen: true,
      };
    case 'favicon-multiple':
      return {
        faviconItems: LOGO_FILES.map(([file, w, h, size], index) => favicon(index + 1, file, w, h, size)),
        selectedFaviconId: 'fixture-logo-1',
      };
    case 'favicon-processing':
      return {
        faviconItems: [
          {
            ...favicon(1, 'sample-logo.png', 512, 512, 12.4 * 1024, 'done'),
            outputPath: '/Users/you/Logos/favicons/favicon.ico',
            newSize: 21 * 1024,
            generatedSizes: [16, 32, 48, 64, 128, 256],
            skippedSizes: [],
          },
          { ...favicon(2, 'sample-logo-128.png', 128, 128, 4.2 * 1024, 'processing'), },
          favicon(3, 'sample-logo-32.png', 32, 32, 1.1 * 1024, 'pending'),
        ],
        selectedFaviconId: 'fixture-logo-2',
        isProcessingFavicon: true,
        faviconProgress: { current: 2, total: 3 },
      };
    case 'favicon-report':
      return {
        faviconItems: [
          {
            ...favicon(1, 'sample-logo.png', 512, 512, 12.4 * 1024, 'done'),
            outputPath: '/Users/you/Logos/favicons/favicon.ico',
            newSize: 21 * 1024,
            generatedSizes: [16, 32, 48, 64, 128, 256],
            skippedSizes: [],
          },
          {
            ...favicon(2, 'sample-logo-128.png', 128, 128, 4.2 * 1024, 'done'),
            outputPath: '/Users/you/Logos/favicons/favicon-2.ico',
            newSize: 12 * 1024,
            generatedSizes: [16, 32, 48, 64, 128],
            skippedSizes: [256],
          },
          {
            ...favicon(3, 'sample-logo-32.png', 32, 32, 1.1 * 1024, 'done'),
            outputPath: '/Users/you/Logos/favicons/favicon-3.ico',
            newSize: 3 * 1024,
            generatedSizes: [16, 32],
            skippedSizes: [48, 64, 128, 256],
          },
        ],
        faviconSummary: {
          ...reportSummary('Favicons'),
          totalImages: 3,
          processedCount: 3,
          failedCount: 0,
          skippedCount: 0,
          generatedSizes: [16, 32, 48, 64, 128, 256],
          skippedSizes: 5,
        },
        reportOpen: true,
      };
    default:
      return null;
  }
}

export const fixtureName = (): string | null => {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('fixture');
};
