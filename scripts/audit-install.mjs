#!/usr/bin/env node
/**
 * End-user download → install → use audit.
 *   npm run audit:install
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const api = 'https://gulliversoftwaretech.com/api';
let failed = 0;
const ok = (m) => console.log(`✓ ${m}`);
const fail = (m) => { console.error(`✗ ${m}`); failed += 1; };

console.log('Reedr install/use audit\n');

spawnSync('npm', ['run', 'pack:extension'], { cwd: root, stdio: 'inherit', env: { ...process.env, REEDR_API_URL: api } });
spawnSync('npm', ['run', 'pack:cws'], { cwd: root, stdio: 'inherit', env: { ...process.env, REEDR_API_URL: api } });

const zip = path.join(root, 'public/reedr-extension.zip');
const listing = spawnSync('unzip', ['-Z1', zip], { encoding: 'utf8' });
const names = (listing.stdout || '').split('\n').filter(Boolean);
if (names.includes('manifest.json') && !names.some((n) => n.startsWith('reedr-extension/'))) ok('Chrome zip has files at root (Windows Extract All safe)');
else fail('Chrome zip nesting would break Load unpacked');
for (const f of ['popup.html', 'popup.js', 'background.js', 'content.js', 'memory.js']) {
  if (names.includes(f)) ok(`zip contains ${f}`);
  else fail(`zip missing ${f}`);
}

const bg = spawnSync('unzip', ['-p', zip, 'background.js'], { encoding: 'utf8' }).stdout || '';
if (bg.includes(api) && !bg.includes('%%REEDR_API_URL%%')) ok(`Chrome zip bakes ${api}`);
else fail('Chrome zip missing baked production API');

const manifest = JSON.parse(readFileSync(path.join(root, 'public/reedr-extension/manifest.json'), 'utf8'));
if (manifest.action?.default_popup === 'popup.html') ok('toolbar action popup present');
else fail('missing toolbar action popup');

const home = readFileSync(path.join(root, 'src/pages/Home.tsx'), 'utf8');
if (home.includes('blobLooksLikeZip')) ok('download validates zip magic bytes');
else fail('download does not validate zip contents');
if (home.includes('Developer mode') && home.includes('Load unpacked')) ok('Home copy mentions Developer mode zip path');
else fail('Home still implies store-only install');

const guide = readFileSync(path.join(root, 'src/components/InstallGuide.tsx'), 'utf8');
if (guide.includes('refresh') || guide.includes('Refresh')) ok('Install guide tells users to refresh / open http(s) page');
else fail('Install guide missing refresh guidance');
if (guide.includes('manifest.json')) ok('Install guide checks selected folder has manifest.json');
else fail('Install guide missing manifest.json checklist');

const content = readFileSync(path.join(root, 'public/reedr-extension/content.js'), 'utf8');
if (content.includes('if (!apiUrl)') && content.includes('showNoApiNotice')) ok('panel warns immediately when API missing');
else fail('no-API notice only after send');

// Live API
const plans = await fetch(api + '/reedr/plans');
if (plans.ok) ok(`live /reedr/plans ${plans.status}`);
else fail(`live /reedr/plans ${plans.status}`);
const chat = await fetch(api + '/reedr/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Reply with exactly: AUDIT_OK' }],
    pageContext: { url: 'https://example.com', title: 'Audit', text: 'Audit' },
    stream: false,
  }),
});
if (chat.ok) ok(`live /reedr/chat ${chat.status}`);
else fail(`live /reedr/chat ${chat.status}`);

// Live download (API packer — the path Mac/Chrome users hit)
const dl = await fetch(`${api.replace(/\/api$/, '')}/api/reedr/extension-download?origin=https://gulliversoftwaretech.com&browser=chrome`);
const dlBuf = Buffer.from(await dl.arrayBuffer());
if (dl.ok && dlBuf[0] === 0x50 && dlBuf[1] === 0x4b) ok('live Chrome extension-download returns a zip');
else fail('live Chrome extension-download is not a zip');
const staticDl = await fetch('https://gulliversoftwaretech.com/reedr-extension.zip');
const staticType = staticDl.headers.get('content-type') || '';
if (staticType.includes('zip') || staticType.includes('octet-stream')) ok('production static /reedr-extension.zip is a zip');
else {
  console.log(`! production static /reedr-extension.zip is ${staticType || 'unknown'} (fallback only — API download is primary)`);
}

console.log('');
if (failed) {
  console.error(`${failed} audit check(s) failed`);
  process.exit(1);
}
console.log('Install/use audit passed for Mac + Chrome zip path.');
