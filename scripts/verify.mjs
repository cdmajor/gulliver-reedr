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
const chromeArtifact = path.join(root, 'artifacts', 'reedr-chrome', 'extension');
const safariArtifact = path.join(root, 'artifacts', 'reedr-safari', 'extension');
const extDir = chromeArtifact;
const zipPath = path.join(root, 'public', 'reedr-extension.zip');
const safariZipPath = path.join(root, 'public', 'reedr-safari-extension.zip');
const chromeArtifactZip = path.join(root, 'artifacts', 'reedr-chrome', 'public', 'reedr-for-chrome.zip');
const safariArtifactZip = path.join(root, 'artifacts', 'reedr-safari', 'public', 'reedr-for-safari.zip');

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

check(existsSync(chromeArtifact), 'artifacts/reedr-chrome/extension present', 'missing artifacts/reedr-chrome/extension');
check(existsSync(safariArtifact), 'artifacts/reedr-safari/extension present', 'missing artifacts/reedr-safari/extension');
check(
  existsSync(path.join(root, 'artifacts', 'reedr-chrome', '.replit-artifact', 'artifact.toml')),
  'Replit discovers Reedr for Chrome artifact',
  'missing artifacts/reedr-chrome/.replit-artifact/artifact.toml',
);
check(
  existsSync(path.join(root, 'artifacts', 'reedr-safari', '.replit-artifact', 'artifact.toml')),
  'Replit discovers Reedr for Safari artifact',
  'missing artifacts/reedr-safari/.replit-artifact/artifact.toml',
);
check(existsSync(path.join(root, '.replit')), 'root .replit registers both artifacts', 'missing .replit');

// Extension source folder
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
check(existsSync(zipPath), 'public/reedr-extension.zip exists', 'public/reedr-extension.zip missing — run npm run pack:chrome');
check(
  existsSync(safariZipPath),
  'public/reedr-safari-extension.zip exists',
  'public/reedr-safari-extension.zip missing — run npm run pack:safari',
);
check(
  existsSync(chromeArtifactZip),
  'artifacts/reedr-chrome/public/reedr-for-chrome.zip exists',
  'chrome artifact zip missing — run npm run pack:chrome',
);
check(
  existsSync(safariArtifactZip),
  'artifacts/reedr-safari/public/reedr-for-safari.zip exists',
  'safari artifact zip missing — run npm run pack:safari',
);
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

try {
  const chromeManifest = JSON.parse(readFileSync(path.join(chromeArtifact, 'manifest.json'), 'utf8'));
  const safariManifest = JSON.parse(readFileSync(path.join(safariArtifact, 'manifest.json'), 'utf8'));
  check(chromeManifest.name === 'Reedr for Chrome', 'Chrome package is branded Reedr for Chrome', `Chrome name is ${chromeManifest.name}`);
  check(safariManifest.name === 'Reedr for Safari', 'Safari package is branded Reedr for Safari', `Safari name is ${safariManifest.name}`);
} catch (err) {
  fail(`could not compare browser manifests: ${err.message}`);
}

// Demo page for visual smoke test without installing
check(existsSync(path.join(root, 'public', 'reedr-demo.html')), 'interactive demo page present (/reedr-demo.html)', 'reedr-demo.html missing');
check(existsSync(path.join(root, 'public', 'how-to-test.html')), 'how-to-test.html present', 'how-to-test.html missing');
check(existsSync(path.join(root, 'scripts', 'prepare-unpacked.mjs')), 'prepare:unpacked script present', 'prepare-unpacked.mjs missing');

// Website entrypoints
check(existsSync(path.join(root, 'src', 'pages', 'Home.tsx')), 'website Home page present', 'Home.tsx missing');
check(existsSync(path.join(root, 'src', 'components', 'InstallGuide.tsx')), 'InstallGuide present', 'InstallGuide missing');

console.log(`\nHow to test the real extension on your computer:`);
console.log(`  npm run prepare:unpacked`);
console.log(`  Chrome → chrome://extensions → Developer mode ON → Load unpacked`);
console.log(`  Select the reedr-unpacked/ folder this creates`);
console.log(`  Open any article → purple R → ask a question`);
console.log(`  Step-by-step page: npm run dev → http://localhost:5173/how-to-test.html`);
console.log(`  (Store listings in review have no install button — use Load unpacked.)`);

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}

console.log(`\nAll checks passed`);
