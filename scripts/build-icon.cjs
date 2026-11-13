/*
 * Dev-only: rebuild the application icon from the Figma artwork exported as
 * SVG ("leve / l. — Refined", node 78:469).
 *
 *   node scripts/build-icon.cjs [svg-dir]
 *
 * The design ships a 512 master plus optical drawings for 64/32/24/16 px, so
 * the small slots use their own artwork instead of a scaled-down master. The
 * .ico is written directly (PNG-in-ICO container) so no dependency is added.
 *
 * Writes assets/icon.png (1024 source of truth), assets/icon.icns,
 * assets/icon.ico and public/icon.png (64 px favicon).
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const sharp = require('sharp');

const svgDir = process.argv[2] || process.env.LEVE_ICON_SVGS || __dirname;
const root = path.join(__dirname, '..');
const assets = path.join(root, 'assets');

const FILES = {
  master: 'icon-l-512.svg',
  opt64: 'icon-l-64.svg',
  opt32: 'icon-l-32.svg',
  opt24: 'icon-l-24.svg',
  opt16: 'icon-l-16.svg',
};

/** The design's small-size drawings: shorter stem, tighter dot. */
const opticalFor = (size) =>
  size <= 16 ? 'opt16' : size <= 24 ? 'opt24' : size <= 32 ? 'opt32' : size <= 64 ? 'opt64' : 'master';

const cache = new Map();
const source = (key) => {
  if (!cache.has(key)) cache.set(key, fs.readFileSync(path.join(svgDir, FILES[key])));
  return cache.get(key);
};

/** Rasterise the drawing meant for `size` into PNG bytes. */
const render = (size) =>
  sharp(source(opticalFor(size)), { density: 384 })
    .resize(size, size, { fit: 'fill' })
    .png()
    .toBuffer();

/**
 * PNG-in-ICO container: ICONDIR + 16-byte entries + PNG payloads.
 * 256 px is written as 0 per the ICO spec. Largest first, like the previous
 * asset, so Windows picks the high-resolution entry.
 */
const buildIco = (entries) => {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  let offset = 6 + entries.length * 16;
  const directory = [];
  for (const { size, buffer } of entries) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // palette size
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buffer.length, 8);
    entry.writeUInt32LE(offset, 12);
    directory.push(entry);
    offset += buffer.length;
  }

  return Buffer.concat([header, ...directory, ...entries.map((entry) => entry.buffer)]);
};

(async () => {
  // 1. Source of truth (1024 master) + favicon (64 optical).
  fs.writeFileSync(path.join(assets, 'icon.png'), await render(1024));
  fs.writeFileSync(path.join(root, 'public', 'icon.png'), await render(64));

  // 2. macOS .icns through an .iconset.
  const iconset = path.join(assets, 'icon.iconset');
  fs.rmSync(iconset, { recursive: true, force: true });
  fs.mkdirSync(iconset, { recursive: true });

  const slots = [
    ['icon_16x16.png', 16],
    ['icon_16x16@2x.png', 32],
    ['icon_32x32.png', 32],
    ['icon_32x32@2x.png', 64],
    ['icon_128x128.png', 128],
    ['icon_128x128@2x.png', 256],
    ['icon_256x256.png', 256],
    ['icon_256x256@2x.png', 512],
    ['icon_512x512.png', 512],
    ['icon_512x512@2x.png', 1024],
  ];
  for (const [file, size] of slots) {
    fs.writeFileSync(path.join(iconset, file), await render(size));
  }
  execFileSync('iconutil', ['-c', 'icns', iconset, '-o', path.join(assets, 'icon.icns')]);
  fs.rmSync(iconset, { recursive: true, force: true });

  // 3. Windows .ico.
  const icoSizes = [256, 128, 64, 48, 32, 24, 16];
  const entries = [];
  for (const size of icoSizes) entries.push({ size, buffer: await render(size) });
  fs.writeFileSync(path.join(assets, 'icon.ico'), buildIco(entries));

  for (const file of ['assets/icon.png', 'assets/icon.icns', 'assets/icon.ico', 'public/icon.png']) {
    const full = path.join(root, file);
    console.log(`${file.padEnd(20)} ${(fs.statSync(full).size / 1024).toFixed(1)} KB`);
  }
  console.log('optical drawings used for 16/24/32/64; master for 128 and above');
})();
