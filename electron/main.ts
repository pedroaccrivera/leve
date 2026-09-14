import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
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
import type { ImageItem, ResizeConfig, VideoItem, VideoConfig } from '../src/types';

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

const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = path.join(process.env.DIST, 'index.html');

async function createWindow() {
  win = new BrowserWindow({
    title: 'leve — 100% Local Image Resizer & Compressor',
    width: 1080,
    height: 860,
    minWidth: 840,
    minHeight: 680,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: process.platform === 'darwin' ? { x: 18, y: 18 } : undefined,
    backgroundColor: '#121624',
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
