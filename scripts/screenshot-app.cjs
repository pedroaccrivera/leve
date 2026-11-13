/*
 * Dev-only: capture the REAL application (its own main process, with every IPC
 * handler registered) so states that need the main process — filmstrip
 * thumbnails, favicon previews, dialogs — can be verified.
 *
 *   LEVE_FIXTURE=favicon-real LEVE_OUT=/tmp/shot.png \
 *     npx electron scripts/screenshot-app.cjs
 *
 * The fixture is injected through the dev bridge in localStorage and the page
 * is reloaded, because the app loads index.html without query parameters.
 */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const fixture = process.env.LEVE_FIXTURE || '';
const out = process.env.LEVE_OUT || path.join(process.cwd(), 'shot-app.png');
const clear = process.env.LEVE_CLEAR_FIXTURE === '1';

// Boot the application itself: it creates its window and registers the IPC.
require(path.join(root, 'dist-electron', 'main.js'));

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.whenReady().then(async () => {
  await wait(2500);
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) {
    console.error('no application window');
    app.exit(1);
    return;
  }

  await win.webContents.executeJavaScript(`
    (() => {
      const name = ${JSON.stringify(clear ? null : fixture)};
      if (name) localStorage.setItem('leve_dev_fixture', name);
      else localStorage.removeItem('leve_dev_fixture');
    })();
  `);
  win.webContents.reload();
  await wait(3000);

  const image = await win.webContents.capturePage();
  fs.writeFileSync(out, image.toPNG());

  const report = await win.webContents.executeJavaScript(`
    (() => {
      const thumbs = [...document.querySelectorAll('aside ~ * img, img')].length;
      const strip = [...document.querySelectorAll('button img')].length;
      const broken = [...document.querySelectorAll('img')].filter((i) => !i.src || i.src.length < 32).length;
      return { images: thumbs, stripImages: strip, broken };
    })()
  `);
  console.log('APP_CAPTURE ' + JSON.stringify({ fixture: clear ? null : fixture, ...report }));
  console.log('saved', out);
  app.exit(0);
});
