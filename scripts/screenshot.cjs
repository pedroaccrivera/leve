/*
 * Dev-only screenshot harness: opens the renderer at the design window size
 * (1280 × 800) and writes a PNG, so a screen can be compared with the Figma
 * reference. Not part of the app.
 *
 *   LEVE_FIXTURE=images-ready LEVE_THEME=ink LEVE_OUT=/tmp/shot.png \
 *     npx electron scripts/screenshot.cjs
 */
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

const url = process.env.LEVE_URL || 'http://localhost:5199/';
const fixture = process.env.LEVE_FIXTURE || '';
const theme = process.env.LEVE_THEME || 'ink';
const out = process.env.LEVE_OUT || path.join(process.cwd(), 'shot.png');
const height = Number(process.env.LEVE_HEIGHT || 800);
const tab = process.env.LEVE_TAB || '';

app.disableHardwareAcceleration();

/*
 * Dev-only: this harness runs the renderer alone, so it has no main process
 * to answer IPC. Mirror the app's thumbnail handler (electron/main.ts) when a
 * state needs real filmstrip images.
 */
if (process.env.LEVE_STUB_THUMBNAILS === '1') {
  const sharp = require(path.join(__dirname, '..', 'node_modules', 'sharp'));
  ipcMain.handle('image:getThumbnail', async (_event, filePath) => {
    try {
      const buffer = await sharp(filePath)
        .resize({ width: 140, height: 140, fit: 'cover' })
        .jpeg({ quality: 70 })
        .toBuffer();
      return `data:image/jpeg;base64,${buffer.toString('base64')}`;
    } catch {
      return '';
    }
  });
}

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

  // Captures must not inherit the previous run's stored tone.
  await win.webContents.session.clearStorageData({ storages: ['localstorage'] });

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

  // Drive the tone control for captures: open it, and optionally set a hue.
  if (process.env.LEVE_HUE_OPEN === '1') {
    await win.webContents.executeJavaScript(`
      (() => {
        const buttons = [...document.querySelectorAll('button')];
        const palette = buttons.find((b) => (b.getAttribute('aria-label') || '') === 'Choose app tone');
        if (palette) palette.click();
      })();
    `);
    await new Promise((resolve) => setTimeout(resolve, 320));
  }
  if (process.env.LEVE_HUE) {
    await win.webContents.executeJavaScript(`
      (() => {
        const range = document.querySelector('input[aria-label="App tone"]');
        if (!range) return;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(range, '${process.env.LEVE_HUE}');
        range.dispatchEvent(new Event('input', { bubbles: true }));
        range.dispatchEvent(new Event('change', { bubbles: true }));
      })();
    `);
    await new Promise((resolve) => setTimeout(resolve, 450));
  }

  // Hover the hue value so it swaps to the reset glyph.
  if (process.env.LEVE_HOVER_RESET === '1') {
    const target = await win.webContents.executeJavaScript(`(() => {
      const button = [...document.querySelectorAll('button')].find((b) => (b.getAttribute('aria-label') || '').startsWith('App tone') || (b.getAttribute('aria-label') || '').startsWith('Reset app tone'));
      if (!button) return null;
      const r = button.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    })()`);
    if (target) {
      win.webContents.sendInputEvent({ type: 'mouseMove', x: target.x, y: target.y });
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }

  // Select a logo in the filmstrip (1-based) to check per-logo recipes.
  if (process.env.LEVE_SELECT_LOGO) {
    await win.webContents.executeJavaScript(`
      (() => {
        const buttons = [...document.querySelectorAll('button')].filter((b) => (b.getAttribute('title') || '').startsWith('Remove '));
        const target = buttons[Number('${process.env.LEVE_SELECT_LOGO}') - 1];
        if (target) target.click();
      })();
    `);
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  // Reveal the tone trigger. CSS :hover cannot be forced from a script, so a
  // capture-only rule gives the collapsed slot the width the hover rule gives
  // it (the element animates that width, hence the !important + settle time).
  if (process.env.LEVE_HOVER_THEME === '1') {
    await win.webContents.executeJavaScript(`
      (() => {
        const button = [...document.querySelectorAll('button')].find((b) => (b.getAttribute('aria-label') || '') === 'Choose app tone');
        if (!button || !button.parentElement) return;
        const style = document.createElement('style');
        const attr = button.parentElement.setAttribute('data-tone-trigger', '');
        style.textContent = '[data-tone-trigger] { width: 44px !important; transition: none !important; }';
        document.head.appendChild(style);
      })();
    `);
    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  // Seed or clear the dev fixture the real app reads on boot.
  if (process.env.LEVE_PERSIST_FIXTURE === '1' || process.env.LEVE_CLEAR_FIXTURE === '1') {
    const name = process.env.LEVE_CLEAR_FIXTURE === '1' ? null : fixture;
    await win.webContents.executeJavaScript(`
      (() => {
        const name = ${JSON.stringify(name)};
        if (name) localStorage.setItem('leve_dev_fixture', name);
        else localStorage.removeItem('leve_dev_fixture');
      })();
    `);
    console.log('fixture bridge ->', name);
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
        rootStyle: document.documentElement.getAttribute('style'),
        // Independent WCAG check on real elements: text colour vs its own
        // background, which is what the user actually reads.
        contrast: (() => {
          const lum = (css) => {
            const [r, g, b] = (css.match(/[\\d.]+/g) || ['0', '0', '0']).map(Number);
            const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
            return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
          };
          // Text is usually on an ancestor's fill, so resolve it upwards.
          const effectiveBg = (el) => {
            let node = el;
            while (node) {
              const bg = getComputedStyle(node).backgroundColor;
              const alpha = (bg.match(/[\\d.]+/g) || [])[3];
              if (bg && bg !== 'transparent' && alpha !== '0') return bg;
              node = node.parentElement;
            }
            return 'rgb(255, 255, 255)';
          };
          const ratio = (el) => {
            if (!el) return null;
            const a = lum(getComputedStyle(el).color); const b = lum(effectiveBg(el));
            return +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2);
          };
          const byClass = (needle, tag = 'button') =>
            [...document.querySelectorAll(tag)].find((el) => typeof el.className === 'string' && el.className.includes(needle));
          const dbg = (() => {
            const el = byClass('bg-signal');
            if (!el) return 'no cta element';
            const cs = getComputedStyle(el);
            return { cls: String(el.className).slice(0, 80), color: cs.color, bg: cs.backgroundColor };
          })();
          return {
            debug: dbg,
            cta: ratio(byClass('bg-signal')),
            ctaBg: byClass('bg-signal') ? getComputedStyle(byClass('bg-signal')).backgroundColor : null,
            activeTab: ratio(document.querySelector('button[role=tab][aria-selected=true]')),
            heading: ratio(document.querySelector('h2')),
            mutedLine: ratio(document.querySelector('main p, aside ~ div p')),
            stage: ratio(byClass('text-signal-text', 'span')),
          };
        })(),
        ctaBackground: (() => {
          const btn = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim().startsWith('No images selected'));
          return btn ? getComputedStyle(btn).backgroundColor : null;
        })(),
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
