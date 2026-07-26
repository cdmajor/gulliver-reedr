#!/usr/bin/env node
/**
 * Automated smoke checks for the Reedr extension + production API.
 * Does not load Chrome; catches packaging/API/config flaws before manual Load unpacked.
 *
 *   npm run smoke
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const apiBase = (process.env.REEDR_API_URL || 'https://gulliversoftwaretech.com/api').replace(/\/$/, '');

let failed = 0;
function ok(msg) { console.log(`✓ ${msg}`); }
function fail(msg) { console.error(`✗ ${msg}`); failed += 1; }

console.log(`Reedr smoke test\nAPI: ${apiBase}\n`);

// 1) Prepare unpacked and verify bake
const prep = spawnSync('node', [path.join(root, 'scripts/prepare-unpacked.mjs')], {
  encoding: 'utf8',
  env: { ...process.env, REEDR_API_URL: apiBase },
});
if (prep.status !== 0) {
  fail('prepare:unpacked failed');
  console.error(prep.stderr || prep.stdout);
} else {
  ok('prepare:unpacked');
}

const unpackedBg = path.join(root, 'reedr-unpacked', 'background.js');
if (existsSync(unpackedBg)) {
  const bg = readFileSync(unpackedBg, 'utf8');
  if (bg.includes('%%REEDR_API_URL%%')) fail('unpacked still has API placeholder');
  else if (bg.includes(apiBase)) ok('unpacked has baked production API');
  else fail('unpacked API bake mismatch');
} else {
  fail('reedr-unpacked/background.js missing');
}

// 2) Source wiring checks
const content = readFileSync(path.join(root, 'public/reedr-extension/content.js'), 'utf8');
const options = readFileSync(path.join(root, 'public/reedr-extension/options.js'), 'utf8');
const background = readFileSync(path.join(root, 'public/reedr-extension/background.js'), 'utf8');

if (content.includes('storage.onChanged')) ok('content listens for Settings API URL changes');
else fail('content missing storage.onChanged (Settings save requires reload)');

if (content.includes('finishErr(msg.error')) ok('stream errors surface API message');
else fail('stream ERROR path does not pass msg.error');

if (content.includes('removePdfStatus()') && content.includes('if (!apiUrl)')) {
  ok('PDF extract clears status when unconfigured');
} else {
  fail('PDF unconfigured path may leave stuck status');
}

if (options.includes('/reedr/plans') && !options.includes('url + "/health"')) {
  ok('Settings Test probes /reedr/plans (not false-positive /health)');
} else if (options.includes('url + "/reedr/plans"') && options.includes('data.plans')) {
  ok('Settings Test validates Reedr plans payload');
} else {
  fail('Settings Test may false-positive on any HTTP < 500');
}

if (background.includes('reedr_open_section')) ok('Upgrade CTA can deep-link Options');
else fail('Upgrade CTA deep-link not wired in background');

// 3) Live API
async function apiSmoke() {
  const plansRes = await fetch(apiBase + '/reedr/plans', { headers: { Accept: 'application/json' } });
  if (!plansRes.ok) fail(`/reedr/plans HTTP ${plansRes.status}`);
  else {
    const plans = await plansRes.json();
    if (plans.plans?.free) ok('/reedr/plans returns free/plus limits');
    else fail('/reedr/plans missing plans.free');
  }

  const chatRes = await fetch(apiBase + '/reedr/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Reply with exactly: SMOKE_OK' }],
      pageContext: { url: 'https://example.com', title: 'Example', text: 'Example Domain' },
      stream: false,
    }),
  });
  if (!chatRes.ok) fail(`/reedr/chat HTTP ${chatRes.status}`);
  else {
    const data = await chatRes.json();
    if (data.reply && String(data.reply).length > 0) ok(`/reedr/chat reply (${data.reply.slice(0, 60)}…)`);
    else fail('/reedr/chat empty reply');
  }

  const streamRes = await fetch(apiBase + '/reedr/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
      pageContext: { url: 'https://example.com', title: 'Example', text: 'Example Domain' },
      stream: true,
    }),
  });
  if (!streamRes.ok) fail(`/reedr/chat stream HTTP ${streamRes.status}`);
  else {
    const text = await streamRes.text();
    if (text.includes('data:') && text.includes('[DONE]')) ok('streaming chat returns SSE chunks + [DONE]');
    else fail('streaming chat response shape unexpected');
  }

  const authRes = await fetch(apiBase + '/reedr/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'smoke-test@example.com', password: 'wrong' }),
  });
  if (authRes.status === 401) ok('auth login rejects bad credentials (401)');
  else fail(`auth login unexpected status ${authRes.status}`);
}

await apiSmoke();

console.log('');
if (failed) {
  console.error(`${failed} smoke check(s) failed`);
  process.exit(1);
}
console.log('Automated smoke checks passed.');
console.log('Manual follow-up on your computer:');
console.log('  1. npm run prepare:unpacked');
console.log('  2. chrome://extensions → Load unpacked → reedr-unpacked/');
console.log('  3. Open https://example.com → purple R → ask a question');
console.log('  4. Settings → Test should say Connected successfully!');
