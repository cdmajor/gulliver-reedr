#!/usr/bin/env node
/**
 * Pack public/reedr-extension into public/reedr-extension.zip
 * with files at the zip root (so Windows Extract All does not double-nest)
 * and optionally bake REEDR_API_URL into background.js.
 *
 * Usage:
 *   npm run pack:extension
 *   REEDR_API_URL=https://your-host/api npm run pack:extension
 */
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'public', 'reedr-extension');
const outZip = path.join(root, 'public', 'reedr-extension.zip');
const apiUrl = (process.env.REEDR_API_URL || '').trim().replace(/\/$/, '');

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

  const bgPath = path.join(staging, 'background.js');
  let background = readFileSync(bgPath, 'utf8');
  if (apiUrl) {
    if (!/^https?:\/\//i.test(apiUrl)) {
      console.error('REEDR_API_URL must start with http:// or https://');
      process.exit(1);
    }
    background = background.replaceAll('%%REEDR_API_URL%%', apiUrl);
    writeFileSync(bgPath, background);
    console.log(`Baked API URL: ${apiUrl}`);
  } else if (background.includes('%%REEDR_API_URL%%')) {
    console.log('No REEDR_API_URL set — zip keeps the download-time placeholder.');
    console.log('For local load-unpacked testing, set Settings → API URL, or pack with:');
    console.log('  REEDR_API_URL=https://your-host/api npm run pack:extension');
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

  console.log(`Wrote ${path.relative(root, outZip)} (files at zip root)`);
} finally {
  rmSync(staging, { recursive: true, force: true });
}
