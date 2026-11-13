/*
 * Dev-only screenshot harness: opens the renderer at the design window size
 * (1280 × 800) and writes a PNG, so a screen can be compared with the Figma
 * reference. Not part of the app.
 *
 *   LEVE_FIXTURE=images-ready LEVE_THEME=ink LEVE_OUT=/tmp/shot.png \
 *     npx electron scripts/screenshot.cjs
 */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const url = process.env.LEVE_URL || 'http://localhost:5199/';
const fixture = process.env.LEVE_FIXTURE || '';
const theme = process.env.LEVE_THEME || 'ink';
const out = process.env.LEVE_OUT || path.join(process.cwd(), 'shot.png');
const tab = process.env.LEVE_TAB || '';

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: true,
    frame: false,
    backgroundColor: '#171b18',
    webPreferences: {
      preload: path.join(__dirname, '..', 'electron', 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const params = new URLSearchParams();
  if (fixture) params.set('fixture', fixture);
  if (theme) params.set('theme', theme);
  if (tab) params.set('tab', tab);

  await win.loadURL(`${url}?${params.toString()}`);
  await new Promise((resolve) => setTimeout(resolve, 2200));

  const image = await win.webContents.capturePage();
  fs.writeFileSync(out, image.toPNG());
  console.log('saved', out);
  app.quit();
});
