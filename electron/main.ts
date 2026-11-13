import { app, BrowserWindow, dialog, ipcMain, nativeImage, screen, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { tintIcon } from './services/appIcon';
import {
  processSingleImage,
  getImageMetadata,
  SUPPORTED_EXTENSIONS
} from './services/imageProcessor';
import {
  processSingleVideo,
  getVideoMetadata,
  getVideoThumbnail,
  SUPPORTED_VIDEO_EXTENSIONS,
} from './services/videoProcessor';
import { processSingleFavicon, renderFaviconPreview } from './services/icoProcessor';
import type { ImageItem, ResizeConfig, VideoItem, VideoConfig, FaviconItem, FaviconConfig } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The built directory structure
//
// ├─┬ dist-electron
// │ ├── main.js
// │ └── preload.cjs / preload.js
// ├─┬ dist
// │ └── index.html

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null = null;

// Dynamically locate the native preload file
function resolvePreloadPath(): string {
  const direct = path.join(process.cwd(), 'electron/preload.cjs');
  if (fsSync.existsSync(direct)) {
    return direct;
  }
  const dist = path.join(__dirname, 'preload.cjs');
  if (fsSync.existsSync(dist)) {
    return dist;
  }
  return path.join(__dirname, 'preload.cjs');
}

const preload = resolvePreloadPath();
console.log('[Main Process] Using preload script at:', preload, 'exists:', fsSync.existsSync(preload));

// App icon: packaged resources in production, project build/ dir in dev.
// (macOS dock icon comes from the bundle .icns; this covers dev + Windows.)
function resolveAppIcon(): string | undefined {
  const candidates = [
    path.join(process.resourcesPath, 'assets/icon.png'),
    path.join(process.cwd(), 'assets/icon.png'),
  ];
  return candidates.find((p) => fsSync.existsSync(p));
}

// App icon: the artwork is re-tinted whenever the tone changes, so the dock /
// taskbar icon matches the window. `toneShift` is the same rotation the
// renderer applies to its colour tokens (hue - 66), sent over IPC.
let baseIconBuffer: Buffer | undefined;

async function applyToneShift(shift: number): Promise<void> {
  if (!baseIconBuffer) {
    const iconPath = resolveAppIcon();
    if (!iconPath) return;
    baseIconBuffer = fsSync.readFileSync(iconPath);
  }

  try {
    const png = await tintIcon(baseIconBuffer, shift);
    const image = nativeImage.createFromBuffer(png);
    if (process.platform === 'darwin') app.dock?.setIcon(image);
    else win?.setIcon(image);
    console.log(`[Tone] app icon shifted by ${shift} degrees`);
  } catch (error) {
    console.error('[Tone] Could not tint the app icon:', error);
  }
}

ipcMain.on('tone:setShift', (_event, shift: number) => {
  void applyToneShift(Number(shift) || 0);
});

const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = path.join(process.env.DIST, 'index.html');

async function createWindow() {
  const appIcon = resolveAppIcon();
  // macOS takes the dock icon from the bundle, which in dev is Electron's own;
  // set it explicitly so the artwork is what you see while running the app.
  if (appIcon && process.platform === 'darwin' && !app.isPackaged) {
    app.dock?.setIcon(appIcon);
  }
  // The renderer reports the stored tone right after boot; this paints the
  // designed artwork first so there is no flash of the previous colour.
  void applyToneShift(0);

  // Open at the design window (1280 × 800) but never larger than the screen's
  // work area, so the app never has to be resized just to be usable.
  const workArea = screen.getPrimaryDisplay().workAreaSize;
  const width = Math.min(1280, workArea.width);
  const height = Math.min(800, workArea.height);

  win = new BrowserWindow({
    title: 'leve — 100% Local Image Resizer & Compressor',
    ...(appIcon ? { icon: appIcon } : {}),
    width,
    height,
    minWidth: 1040,
    minHeight: 640,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    // The 28 px window bar carries the identity line at x = 76, so the real
    // traffic lights sit at x = 20 (design) and stay inside the bar.
    trafficLightPosition: process.platform === 'darwin' ? { x: 20, y: 8 } : undefined,
    backgroundColor: '#171b18',
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (url) {
    console.log('[Main Process] Loading Dev URL:', url);
    await win.loadURL(url);
  } else {
    console.log('[Main Process] Loading Production File:', indexHtml);
    await win.loadFile(indexHtml);
  }

  win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Helper to recursively collect images from a directory
async function getImagesFromDirectory(dirPath: string): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const subImages = await getImagesFromDirectory(fullPath);
        results.push(...subImages);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          results.push(fullPath);
        }
      }
    }
  } catch (err) {
    console.error('[Main Process] Error reading directory:', dirPath, err);
  }
  return results;
}

// Convert file path list to ImageItem objects
async function buildImageItems(filePaths: string[]): Promise<ImageItem[]> {
  const items: ImageItem[] = [];
  for (const filePath of filePaths) {
    const parsed = path.parse(filePath);
    const meta = await getImageMetadata(filePath);
    items.push({
      id: `${filePath}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      path: filePath,
      name: parsed.base,
      size: meta.size,
      originalWidth: meta.width,
      originalHeight: meta.height,
      status: 'pending',
    });
  }
  return items;
}

// IPC Handlers
ipcMain.handle('dialog:selectFiles', async () => {
  console.log('[Main Process] IPC: dialog:selectFiles requested');
  if (!win) return [];
  const result = await dialog.showOpenDialog(win, {
    title: 'Select Images to Resize',
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Images',
        extensions: ['jpg', 'jpeg', 'png', 'webp', 'avif', 'tiff', 'tif', 'gif', 'svg'],
      },
    ],
  });

  console.log('[Main Process] dialog:selectFiles result count:', result.filePaths.length);
  if (result.canceled || result.filePaths.length === 0) {
    return [];
  }
  return buildImageItems(result.filePaths);
});

ipcMain.handle('dialog:selectFolder', async () => {
  console.log('[Main Process] IPC: dialog:selectFolder requested');
  if (!win) return [];
  const result = await dialog.showOpenDialog(win, {
    title: 'Select Folder with Images',
    properties: ['openDirectory'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return [];
  }

  const folderPath = result.filePaths[0];
  console.log('[Main Process] Scanning directory:', folderPath);
  const images = await getImagesFromDirectory(folderPath);
  console.log('[Main Process] Found images:', images.length);
  return buildImageItems(images);
});

ipcMain.handle('dialog:selectDestinationFolder', async () => {
  console.log('[Main Process] IPC: dialog:selectDestinationFolder requested');
  if (!win) return null;
  const result = await dialog.showOpenDialog(win, {
    title: 'Select Output Destination Folder',
    properties: ['openDirectory', 'createDirectory'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('app:scanDroppedPaths', async (_event, paths: string[]) => {
  console.log('[Main Process] IPC: app:scanDroppedPaths received paths:', paths);
  const allImages: string[] = [];
  for (const p of paths) {
    try {
      const stat = await fs.stat(p);
      if (stat.isDirectory()) {
        const dirImages = await getImagesFromDirectory(p);
        allImages.push(...dirImages);
      } else if (stat.isFile()) {
        const ext = path.extname(p).toLowerCase();
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          allImages.push(p);
        }
      }
    } catch (e) {
      console.error('[Main Process] Error stating dropped path:', p, e);
    }
  }
  console.log('[Main Process] app:scanDroppedPaths resolved image count:', allImages.length);
  return buildImageItems(allImages);
});

ipcMain.handle('image:getMetadata', async (_event, filePath: string) => {
  return getImageMetadata(filePath);
});

ipcMain.handle('image:getThumbnail', async (_event, filePath: string) => {
  try {
    const buffer = await sharp(filePath)
      .resize({ width: 140, height: 140, fit: 'cover' })
      .jpeg({ quality: 70 })
      .toBuffer();
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  } catch (err) {
    return '';
  }
});

ipcMain.handle('image:process', async (_event, item: ImageItem, config: ResizeConfig) => {
  return processSingleImage(item, config);
});

// ---------------------------------------------------------------------------
// Favicon generation (`feat/favicon-ico`)
// ---------------------------------------------------------------------------

ipcMain.handle('favicon:process', async (_event, item: FaviconItem, config: FaviconConfig) => {
  return processSingleFavicon(item, config);
});

ipcMain.handle('favicon:preview', async (_event, filePath: string, config: FaviconConfig) => {
  return renderFaviconPreview(filePath, config);
});

// ---------------------------------------------------------------------------
// Video compression for web (feat/video-compression)
// ---------------------------------------------------------------------------

async function getVideosFromDirectory(dirPath: string): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const subVideos = await getVideosFromDirectory(fullPath);
        results.push(...subVideos);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_VIDEO_EXTENSIONS.has(ext)) {
          results.push(fullPath);
        }
      }
    }
  } catch (err) {
    console.error('[Main Process] Error reading directory:', dirPath, err);
  }
  return results;
}

async function buildVideoItems(filePaths: string[]): Promise<VideoItem[]> {
  const items: VideoItem[] = [];
  for (const filePath of filePaths) {
    const parsed = path.parse(filePath);
    const meta = await getVideoMetadata(filePath);
    items.push({
      id: `${filePath}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      path: filePath,
      name: parsed.base,
      size: meta.size,
      originalWidth: meta.width,
      originalHeight: meta.height,
      durationSec: meta.durationSec,
      status: 'pending',
    });
  }
  return items;
}

ipcMain.handle('dialog:selectVideoFiles', async () => {
  console.log('[Main Process] IPC: dialog:selectVideoFiles requested');
  if (!win) return [];
  const result = await dialog.showOpenDialog(win, {
    title: 'Select Videos to Compress',
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Videos',
        extensions: ['mp4', 'mov', 'mkv', 'webm', 'avi', 'm4v'],
      },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return [];
  }
  return buildVideoItems(result.filePaths);
});

ipcMain.handle('dialog:selectVideoFolder', async () => {
  console.log('[Main Process] IPC: dialog:selectVideoFolder requested');
  if (!win) return [];
  const result = await dialog.showOpenDialog(win, {
    title: 'Select Folder with Videos',
    properties: ['openDirectory'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return [];
  }

  const videos = await getVideosFromDirectory(result.filePaths[0]);
  return buildVideoItems(videos);
});

ipcMain.handle('app:scanDroppedVideoPaths', async (_event, paths: string[]) => {
  const allVideos: string[] = [];
  for (const p of paths) {
    try {
      const stat = await fs.stat(p);
      if (stat.isDirectory()) {
        const dirVideos = await getVideosFromDirectory(p);
        allVideos.push(...dirVideos);
      } else if (stat.isFile()) {
        const ext = path.extname(p).toLowerCase();
        if (SUPPORTED_VIDEO_EXTENSIONS.has(ext)) {
          allVideos.push(p);
        }
      }
    } catch (e) {
      console.error('[Main Process] Error stating dropped path:', p, e);
    }
  }
  return buildVideoItems(allVideos);
});

ipcMain.handle('video:getThumbnail', async (_event, filePath: string) => {
  return getVideoThumbnail(filePath);
});

ipcMain.handle('video:process', async (event, item: VideoItem, config: VideoConfig) => {
  return processSingleVideo(item, config, (percent) => {
    // Live progress: the renderer subscribes via `onVideoProgress`.
    event.sender.send('video:progress', item.id, percent);
  });
});

ipcMain.handle('app:openInFolder', async (_event, targetPath: string) => {
  try {
    const stat = await fs.stat(targetPath).catch(() => null);
    if (stat && stat.isDirectory()) {
      await shell.openPath(targetPath);
    } else {
      shell.showItemInFolder(targetPath);
    }
  } catch (e) {
    console.error('[Main Process] Error opening in folder:', e);
  }
});
