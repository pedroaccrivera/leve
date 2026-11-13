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
const height = Number(process.env.LEVE_HEIGHT || 800);
const tab = process.env.LEVE_TAB || '';

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1280,
    height,
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

  // The OS draws the traffic lights outside the web contents, so capturePage
  // never sees them. Draw them at the exact coordinates the window uses
  // (trafficLightPosition x=20, y=8; 12 px buttons with a 20 px pitch) to check
  // the window-bar spacing.
  if (process.env.LEVE_MOCK_TRAFFIC === '1') {
    await win.webContents.executeJavaScript(`
      (() => {
        const layer = document.createElement('div');
        layer.style.cssText = 'position:fixed;top:0;left:0;width:1280px;height:28px;z-index:9999;pointer-events:none';
        [0, 20, 40].forEach((offset, index) => {
          const dot = document.createElement('i');
          dot.style.cssText =
            'position:absolute;top:8px;width:12px;height:12px;border-radius:9999px;left:' + (20 + offset) + 'px;background:' +
            ['#ff5f57', '#febc2e', '#28c840'][index];
          layer.appendChild(dot);
        });
        document.body.appendChild(layer);
      })();
    `);
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  // Reveal the inspector tooltips for a visual check of their placement.
  if (process.env.LEVE_REVEAL_TOOLTIPS === '1') {
    await win.webContents.executeJavaScript(`
      document.querySelectorAll('[role=tooltip]').forEach((el) => { el.style.opacity = '1'; });
    `);
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  const image = await win.webContents.capturePage();
  fs.writeFileSync(out, image.toPNG());

  // Optional layout report: how much the two scrolling columns overflow.
  if (process.env.LEVE_MEASURE === '1') {
    const metrics = await win.webContents.executeJavaScript(`(() => {
      const aside = document.querySelector('aside');
      const workspace = aside && aside.previousElementSibling;
      const box = (el) => el ? {
        client: el.clientHeight,
        scroll: el.scrollHeight,
        overflow: el.scrollHeight - el.clientHeight,
        blocks: [...el.children].map((c) => Math.round(c.getBoundingClientRect().height)),
      } : null;
      // Vertical gap between stacked choice rows vs the horizontal gutter of
      // the rows themselves — the design keeps both at 4 px.
      const stacks = [...document.querySelectorAll('aside div')].filter(
        (el) => typeof el.className === 'string' && el.className.includes('flex-col') && el.className.includes('gap-1')
      );
      const gutters = stacks.map((el) => {
        const rows = [...el.children].map((c) => c.getBoundingClientRect());
        const vertical = rows.slice(1).map((r, i) => Math.round(r.top - rows[i].bottom));
        const columns = rows[0] ? [...rows[0] ? el.children[0].children : []].map((c) => c.getBoundingClientRect()) : [];
        const horizontal = columns.slice(1).map((c, i) => Math.round(c.left - columns[i].right));
        return { vertical, horizontal };
      });
      // Anything that makes a column wider than its own client box.
      const hOverflow = (el, label) => {
        if (!el) return null;
        const box = el.getBoundingClientRect();
        const offenders = [...el.querySelectorAll('*')]
          .map((child) => {
            const r = child.getBoundingClientRect();
            return { tag: child.tagName.toLowerCase(), cls: String(child.className).slice(0, 60), over: Math.round(r.right - box.right), w: Math.round(r.width) };
          })
          .filter((entry) => entry.over > 1)
          .sort((a, b) => b.over - a.over)
          .slice(0, 6);
        return { label, scrollW: el.scrollWidth, clientW: el.clientWidth, over: el.scrollWidth - el.clientWidth, offenders };
      };
      return {
        viewport: { w: window.innerWidth, h: window.innerHeight },
        workspace: box(workspace),
        inspector: box(aside),
        gutters,
        horizontal: [
          hOverflow(aside, 'inspector'),
          hOverflow(workspace, 'workspace'),
          hOverflow(document.documentElement, 'document'),
          hOverflow(document.body, 'body'),
        ],
      };
    })()`);
    console.log('MEASURE ' + JSON.stringify(metrics));
  }

  console.log('saved', out);
  app.quit();
});
