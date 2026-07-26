#!/usr/bin/env node
/**
 * Smoke checks so you can tell whether Reedr is wired correctly
 * without guessing. Run: npm run verify
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const extDir = path.join(root, 'public', 'reedr-extension');
const zipPath = path.join(root, 'public', 'reedr-extension.zip');

let failed = 0;

function ok(msg) {
  console.log(`✓ ${msg}`);
}

function fail(msg) {
  console.error(`✗ ${msg}`);
  failed += 1;
}

function check(condition, passMsg, failMsg) {
  if (condition) ok(passMsg);
  else fail(failMsg);
}

console.log('Reedr verify\n');

// Extension source folder
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
  check(existsSync(path.join(extDir, file)), `extension has ${file}`, `missing ${file}`);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(path.join(extDir, 'manifest.json'), 'utf8'));
  ok(`manifest.json parses (v${manifest.version}, MV${manifest.manifest_version})`);
} catch (err) {
  fail(`manifest.json invalid: ${err.message}`);
}

if (manifest) {
  check(manifest.manifest_version === 3, 'manifest_version is 3', 'manifest_version should be 3');
  check(
    Array.isArray(manifest.content_scripts) && manifest.content_scripts.length > 0,
    'content_scripts declared',
    'content_scripts missing',
  );
  check(
    Boolean(manifest.background?.service_worker),
    'background service_worker declared',
    'background service_worker missing',
  );
  const csJs = manifest.content_scripts?.[0]?.js || [];
  check(csJs.includes('memory.js'), 'memory.js loaded before content.js', 'memory.js not in content_scripts');
  check(csJs.includes('content.js'), 'content.js in content_scripts', 'content.js not in content_scripts');
}

const background = readFileSync(path.join(extDir, 'background.js'), 'utf8');
check(
  background.includes('%%REEDR_API_URL%%') || /https?:\/\//.test(background),
  'background.js has API URL placeholder or baked URL',
  'background.js has no API URL wiring',
);
check(background.includes('REEDR_CHAT') || background.includes('reedr-chat'), 'chat messaging wired', 'chat messaging missing');

const content = readFileSync(path.join(extDir, 'content.js'), 'utf8');
check(content.includes('reedr') || content.includes('Reedr'), 'content script references Reedr', 'content script looks empty/wrong');

// Zip shape
check(existsSync(zipPath), 'public/reedr-extension.zip exists', 'public/reedr-extension.zip missing — run npm run pack:extension');
if (existsSync(zipPath)) {
  const listing = spawnSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' });
  if (listing.status !== 0) {
    fail('could not list zip contents (is unzip installed?)');
  } else {
    const names = listing.stdout.split('\n').filter(Boolean);
    check(names.includes('manifest.json'), 'zip has manifest.json at root', 'zip nests files — Windows Extract All will double-nest');
    check(!names.some((n) => n.startsWith('reedr-extension/')), 'zip is not double-wrapped in reedr-extension/', 'zip contains reedr-extension/ prefix');
    for (const file of required) {
      check(names.includes(file), `zip contains ${file}`, `zip missing ${file}`);
    }
  }
}

// Demo page for visual smoke test without installing
check(existsSync(path.join(root, 'public', 'reedr-demo.html')), 'interactive demo page present (/reedr-demo.html)', 'reedr-demo.html missing');

// Website entrypoints
check(existsSync(path.join(root, 'src', 'pages', 'Home.tsx')), 'website Home page present', 'Home.tsx missing');
check(existsSync(path.join(root, 'src', 'components', 'InstallGuide.tsx')), 'InstallGuide present', 'InstallGuide missing');

console.log(`\nHow to see it working:`);
console.log(`  1. Website UI:     npm install && npm run dev`);
console.log(`     Then open http://localhost:5173/`);
console.log(`  2. Fake UI demo:   http://localhost:5173/reedr-demo.html`);
console.log(`  3. Real extension: npm run pack:extension`);
console.log(`     Chrome → chrome://extensions → Developer mode → Load unpacked`);
console.log(`     Select public/reedr-extension/ (or extract the zip folder)`);
console.log(`     Open any article → purple R button → ask a question`);
console.log(`     If chat fails: Reedr Settings → set API URL ending in /api → Test`);
console.log(`  4. Full check:     npm test`);

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}

console.log(`\nAll checks passed`);
