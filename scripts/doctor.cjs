#!/usr/bin/env node
/**
 * leve — environment doctor.
 *
 * Validates the native/runtime dependencies that `npm install` must have
 * fetched (Electron binary, Sharp binding, ffmpeg/ffprobe binaries) and
 * prints the exact remediation when something is missing.
 *
 * Exit 0 when everything is healthy, 1 otherwise.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
let failures = 0;

function ok(label, detail) {
  console.log(`  ✓ ${label}${detail ? ` (${detail})` : ''}`);
}

function fail(label, fix) {
  failures += 1;
  console.log(`  ✗ ${label}`);
  for (const line of fix) console.log(`      → ${line}`);
}

function isExecutable(file) {
  try {
    fs.accessSync(file, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

console.log('leve doctor — checking dev environment...\n');

// 1. Node version
{
  const major = Number(process.versions.node.split('.')[0]);
  if (major >= 20) ok(`Node.js ${process.versions.node}`, '>= 20 required');
  else {
    fail(`Node.js ${process.versions.node} is too old`, [
      'Install Node.js 20 LTS or newer (see .nvmrc, `nvm use`).',
    ]);
  }
}

// 2. Electron binary (downloaded by the electron package postinstall)
{
  try {
    const electronPath = require('electron');
    if (typeof electronPath === 'string' && fs.existsSync(electronPath)) {
      ok('Electron binary', electronPath);
    } else {
      fail('Electron binary path missing', [
        'Delete node_modules/electron and reinstall: `npm install electron --force`.',
      ]);
    }
  } catch (err) {
    fail('Electron failed to install correctly', [
      'The Electron postinstall download did not complete.',
      '1. Check network access to github.com (corporate proxy is the usual suspect).',
      '2. If you need a mirror: `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ npm install`.',
      '3. Then: `rm -rf node_modules/electron && npm install`.',
      `   Original error: ${String((err && err.message) || err).split('\n')[0]}`,
    ]);
  }
}

// 3. Sharp native binding
{
  try {
    require('sharp');
    ok('Sharp native binding', 'loads correctly');
  } catch (err) {
    fail('Sharp failed to load', [
      'Reinstall for your platform/arch: `rm -rf node_modules/sharp && npm install`.',
      'On install, npm needs network access to download the libvips prebuilt.',
      `   Original error: ${String((err && err.message) || err).split('\n')[0]}`,
    ]);
  }
}

// 4. ffmpeg / ffprobe static binaries
for (const pkg of ['ffmpeg-static', 'ffprobe-static']) {
  let bin = null;
  try {
    const mod = require(pkg);
    bin = typeof mod === 'string' ? mod : mod && mod.path;
  } catch (err) {
    fail(`${pkg} package not resolvable`, [
      `Run \`npm install\` (and check network errors in its output).`,
      `   Original error: ${String((err && err.message) || err).split('\n')[0]}`,
    ]);
    continue;
  }
  if (!bin || !fs.existsSync(bin)) {
    fail(`${pkg} binary missing at ${bin || '(unknown path)'}`, [
      `Reinstall: \`rm -rf node_modules/${pkg} && npm install\`.`,
      'The package downloads a platform-specific binary on install.',
    ]);
    continue;
  }
  if (!isExecutable(bin)) {
    fail(`${pkg} binary not executable: ${bin}`, [
      `Run \`chmod +x "${bin}"\` (Gatekeeper/antivirus may have stripped it).`,
    ]);
    continue;
  }
  try {
    const out = execFileSync(bin, ['-version'], { encoding: 'utf8', timeout: 15000 });
    ok(`${pkg}`, out.split('\n')[0].trim().slice(0, 80));
  } catch (err) {
    fail(`${pkg} binary does not run: ${bin}`, [
      'Wrong platform/arch binary — reinstall it for this machine.',
      `   Original error: ${String((err && err.message) || err).split('\n')[0]}`,
    ]);
  }
}

console.log('');
if (failures > 0) {
  console.log(`doctor: ${failures} problem(s) found — fix the items above, then re-run \`npm run doctor\`.`);
  process.exit(1);
}
console.log('doctor: all checks passed.');
