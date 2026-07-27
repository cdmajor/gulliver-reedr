#!/usr/bin/env node
/**
 * Pack public/reedr-extension into a zip with files at the zip root
 * (so Windows Extract All does not double-nest) and optionally bake
 * REEDR_API_URL into background.js.
 *
 * Usage:
 *   npm run pack:extension
 *   REEDR_API_URL=https://your-host/api npm run pack:extension
 *   npm run pack:cws
 *     → writes public/reedr-extension-cws.zip with production API baked in
 */
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'public', 'reedr-extension');

const isCws = process.argv.includes('--cws') || process.env.PACK_TARGET === 'cws';
const defaultProdApi = 'https://gulliversoftwaretech.com/api';
// Chrome downloads (Mac + PC) need a baked API; default to production unless explicitly left blank.
const apiUrl = (
  process.env.REEDR_API_URL !== undefined
    ? process.env.REEDR_API_URL
    : defaultProdApi
).trim().replace(/\/$/, '');

const outZip = path.join(
  root,
  'public',
  process.env.OUT_ZIP || (isCws ? 'reedr-extension-cws.zip' : 'reedr-extension.zip'),
);

const required = [
  'manifest.json',
  'background.js',
  'content.js',
  'memory.js',
  'options.html',
  'options.js',
  'icon16.png',
  'icon48.png',
  'icon128.png',
];

for (const file of required) {
  const full = path.join(srcDir, file);
  try {
    readFileSync(full);
  } catch {
    console.error(`Missing required extension file: ${file}`);
    process.exit(1);
  }
}

const staging = mkdtempSync(path.join(tmpdir(), 'reedr-pack-'));
try {
  for (const file of required) {
    cpSync(path.join(srcDir, file), path.join(staging, file));
  }

  // CWS listings need a stable homepage + baked production API (no %% token).
  if (isCws) {
    const manifestPath = path.join(staging, 'manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.homepage_url = process.env.REEDR_HOMEPAGE_URL || 'https://gulliversoftwaretech.com';
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  }

  const bgPath = path.join(staging, 'background.js');
  let background = readFileSync(bgPath, 'utf8');
  if (apiUrl) {
    if (!/^https?:\/\//i.test(apiUrl)) {
      console.error('REEDR_API_URL must start with http:// or https://');
      process.exit(1);
    }
    if (!background.includes('%%REEDR_API_URL%%') && isCws) {
      // Already baked in source copy — force-replace existing BAKED_API_URL string if present
      background = background.replace(
        /const BAKED_API_URL = ["'][^"']*["'];/,
        `const BAKED_API_URL = ${JSON.stringify(apiUrl)};`,
      );
    } else {
      background = background.replaceAll('%%REEDR_API_URL%%', apiUrl);
    }
    writeFileSync(bgPath, background);
    console.log(`Baked API URL: ${apiUrl}`);
  } else if (background.includes('%%REEDR_API_URL%%')) {
    console.log('No REEDR_API_URL set — zip keeps the download-time placeholder.');
    console.log('For store / load-unpacked without Settings, pack with:');
    console.log('  REEDR_API_URL=https://your-host/api npm run pack:extension');
    console.log('  npm run pack:cws   # production API for Chrome Web Store upload');
  }

  if (isCws && readFileSync(bgPath, 'utf8').includes('%%REEDR_API_URL%%')) {
    console.error('CWS build still contains %%REEDR_API_URL%% — refusing to write.');
    process.exit(1);
  }

  rmSync(outZip, { force: true });
  const zip = spawnSync('zip', ['-q', '-r', outZip, '.'], {
    cwd: staging,
    stdio: 'inherit',
  });
  if (zip.status !== 0) {
    console.error('zip failed — is the zip CLI installed?');
    process.exit(zip.status ?? 1);
  }

  console.log(`Wrote ${path.relative(root, outZip)} (files at zip root${isCws ? ', CWS-ready' : ''})`);
  if (isCws) {
    console.log('\nNext: upload this zip at https://chrome.google.com/webstore/devconsole');
    console.log('After approval, set VITE_CHROME_WEB_STORE_URL to the listing URL and redeploy the site.');
  }
} finally {
  rmSync(staging, { recursive: true, force: true });
}
