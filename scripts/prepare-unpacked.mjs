#!/usr/bin/env node
/**
 * Build a Load Unpacked–ready folder with the production API baked in.
 *
 *   npm run prepare:unpacked
 *
 * Then in Chrome:
 *   1. Open chrome://extensions
 *   2. Turn on Developer mode (top right)
 *   3. Click "Load unpacked"
 *   4. Select the reedr-unpacked/ folder this script creates
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'public', 'reedr-extension');
const outDir = path.join(root, 'reedr-unpacked');
const apiUrl = (process.env.REEDR_API_URL || 'https://gulliversoftwaretech.com/api')
  .trim()
  .replace(/\/$/, '');

const files = [
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

if (!existsSync(srcDir)) {
  console.error('Missing public/reedr-extension/');
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const file of files) {
  cpSync(path.join(srcDir, file), path.join(outDir, file));
}

const bgPath = path.join(outDir, 'background.js');
let background = readFileSync(bgPath, 'utf8');
if (background.includes('%%REEDR_API_URL%%')) {
  background = background.replaceAll('%%REEDR_API_URL%%', apiUrl);
} else {
  background = background.replace(
    /const BAKED_API_URL = ["'][^"']*["'];/,
    `const BAKED_API_URL = ${JSON.stringify(apiUrl)};`,
  );
}
writeFileSync(bgPath, background);

if (readFileSync(bgPath, 'utf8').includes('%%REEDR_API_URL%%')) {
  console.error('Failed to bake API URL into background.js');
  process.exit(1);
}

console.log(`Ready: ${path.relative(root, outDir)}/`);
console.log(`API:   ${apiUrl}`);
console.log('');
console.log('Install on your computer (Chrome / Edge / Brave / Opera):');
console.log('  1. Open chrome://extensions  (edge://extensions / brave://extensions)');
console.log('  2. Turn ON "Developer mode" (top-right toggle)');
console.log('  3. Click "Load unpacked"');
console.log(`  4. Select this folder: ${outDir}`);
console.log('  5. Open any article → purple R (bottom-right) → ask a question');
console.log('');
console.log('Tip: after code changes, run this script again, then click the reload');
console.log('     icon on the Reedr card at chrome://extensions');
