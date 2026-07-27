#!/usr/bin/env node
/**
 * Pack Reedr browser extension zips from the separate artifact folders:
 *   artifacts/reedr-chrome/extension
 *   artifacts/reedr-safari/extension
 *
 * Writes:
 *   - artifacts/<target>/public/reedr-for-<target>.zip  (Replit download surface)
 *   - public/reedr-extension.zip / reedr-safari-extension.zip / reedr-extension-cws.zip
 *   - syncs public/reedr-extension from Chrome source (website / smoke tools)
 *
 * Usage:
 *   npm run pack:extension          # chrome (default)
 *   npm run pack:chrome
 *   npm run pack:safari
 *   npm run pack:cws                # chrome web store zip
 *   npm run pack:browsers           # chrome + safari
 */
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const isCws = args.includes('--cws') || process.env.PACK_TARGET === 'cws';
const packAll = args.includes('--all');

function resolveTarget() {
  if (isCws) return 'chrome';
  if (args.includes('--safari') || process.env.PACK_TARGET === 'safari') return 'safari';
  if (args.includes('--chrome') || process.env.PACK_TARGET === 'chrome') return 'chrome';
  const envBrowser = (process.env.BROWSER || '').toLowerCase();
  if (envBrowser === 'safari') return 'safari';
  return 'chrome';
}

const defaultProdApi = 'https://gulliversoftwaretech.com/api';
const apiUrl = (
  process.env.REEDR_API_URL !== undefined
    ? process.env.REEDR_API_URL
    : defaultProdApi
).trim().replace(/\/$/, '');

const required = [
  'manifest.json',
  'background.js',
  'content.js',
  'memory.js',
  'options.html',
  'options.js',
  'popup.html',
  'popup.js',
  'icon16.png',
  'icon48.png',
  'icon128.png',
];

function packOne(target) {
  const artifactDir = path.join(root, 'artifacts', `reedr-${target}`);
  const srcDir = path.join(artifactDir, 'extension');
  const artifactPublic = path.join(artifactDir, 'public');
  mkdirSync(artifactPublic, { recursive: true });

  const artifactZipName = target === 'safari' ? 'reedr-for-safari.zip' : 'reedr-for-chrome.zip';
  const artifactZip = path.join(artifactPublic, artifactZipName);

  let siteZipName = 'reedr-extension.zip';
  if (isCws) siteZipName = 'reedr-extension-cws.zip';
  else if (target === 'safari') siteZipName = 'reedr-safari-extension.zip';
  const siteZip = path.join(root, 'public', process.env.OUT_ZIP || siteZipName);

  for (const file of required) {
    try {
      readFileSync(path.join(srcDir, file));
    } catch {
      console.error(`Missing required ${target} extension file: ${file}`);
      process.exit(1);
    }
  }

  const staging = mkdtempSync(path.join(tmpdir(), `reedr-pack-${target}-`));
  try {
    for (const file of required) {
      cpSync(path.join(srcDir, file), path.join(staging, file));
    }

    if (isCws || target === 'chrome') {
      const manifestPath = path.join(staging, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      manifest.homepage_url = process.env.REEDR_HOMEPAGE_URL || 'https://gulliversoftwaretech.com';
      if (isCws && !manifest.name.includes('Chrome')) {
        manifest.name = 'Reedr for Chrome';
      }
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    }

    const bgPath = path.join(staging, 'background.js');
    let background = readFileSync(bgPath, 'utf8');
    if (apiUrl) {
      if (!/^https?:\/\//i.test(apiUrl)) {
        console.error('REEDR_API_URL must start with http:// or https://');
        process.exit(1);
      }
      if (!background.includes('%%REEDR_API_URL%%') && (isCws || apiUrl)) {
        background = background.replace(
          /const BAKED_API_URL = ["'][^"']*["'];/,
          `const BAKED_API_URL = ${JSON.stringify(apiUrl)};`,
        );
      } else {
        background = background.replaceAll('%%REEDR_API_URL%%', apiUrl);
      }
      writeFileSync(bgPath, background);
      console.log(`[${target}] Baked API URL: ${apiUrl}`);
    } else if (background.includes('%%REEDR_API_URL%%')) {
      console.log(`[${target}] No REEDR_API_URL set — zip keeps the download-time placeholder.`);
    }

    if (isCws && readFileSync(bgPath, 'utf8').includes('%%REEDR_API_URL%%')) {
      console.error('CWS build still contains %%REEDR_API_URL%% — refusing to write.');
      process.exit(1);
    }

    for (const outZip of [artifactZip, siteZip]) {
      rmSync(outZip, { force: true });
      const zip = spawnSync('zip', ['-q', '-r', outZip, '.'], {
        cwd: staging,
        stdio: 'inherit',
      });
      if (zip.status !== 0) {
        console.error('zip failed — is the zip CLI installed?');
        process.exit(zip.status ?? 1);
      }
      console.log(`Wrote ${path.relative(root, outZip)} (${target}${isCws ? ', CWS-ready' : ''})`);
    }

    // Keep a browsable extension copy under the artifact public surface.
    const publicExt = path.join(artifactPublic, 'extension');
    rmSync(publicExt, { recursive: true, force: true });
    cpSync(staging, publicExt, { recursive: true });

    // Website / smoke tools still expect public/reedr-extension (Chrome source of truth).
    if (target === 'chrome') {
      const publicChrome = path.join(root, 'public', 'reedr-extension');
      rmSync(publicChrome, { recursive: true, force: true });
      mkdirSync(publicChrome, { recursive: true });
      for (const file of required) {
        cpSync(path.join(srcDir, file), path.join(publicChrome, file));
      }
    }
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }

  if (isCws) {
    console.log('\nNext: upload public/reedr-extension-cws.zip at https://chrome.google.com/webstore/devconsole');
    console.log('After approval, set VITE_CHROME_WEB_STORE_URL to the listing URL and redeploy the site.');
  }
}

const targets = packAll ? ['chrome', 'safari'] : [resolveTarget()];
for (const t of targets) packOne(t);
