#!/usr/bin/env node
/**
 * Load the real Reedr unpacked extension, open an ESPN article,
 * open the chat panel, send a question, wait for a reply, screenshot.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const extDir = path.join(root, 'reedr-unpacked');
const profileDir = '/tmp/reedr-espn-profile';
const outPath = '/opt/cursor/artifacts/screenshots/reedr-espn-in-use.png';
const debugPort = 9333;
const chromeBinary =
  process.env.CHROME_BIN ||
  '/tmp/chrome-for-testing/chrome/linux-136.0.7103.113/chrome-linux64/chrome';
const espnUrl =
  process.env.ESPN_URL ||
  'https://www.espn.com/nba/story/_/id/49227450/lebron-james-signs-philadelphia-76ers-grades-reaction-lakers-contract';

if (!existsSync(path.join(extDir, 'manifest.json'))) {
  console.error('Missing reedr-unpacked/. Run: npm run prepare:unpacked');
  process.exit(1);
}

mkdirSync(path.dirname(outPath), { recursive: true });
rmSync(profileDir, { recursive: true, force: true });
mkdirSync(profileDir, { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForDebugger(port, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return await res.json();
    } catch (_) {}
    await sleep(500);
  }
  throw new Error('Chrome debugger never became ready');
}

if (!existsSync(chromeBinary)) {
  console.error('Chrome binary missing:', chromeBinary);
  console.error('Install with: npx @puppeteer/browsers install chrome@136.0.7103.113 --path /tmp/chrome-for-testing');
  process.exit(1);
}

const chromeArgs = [
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profileDir}`,
  '--disable-features=DisableLoadExtensionCommandLineSwitch',
  `--disable-extensions-except=${extDir}`,
  `--load-extension=${extDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-popup-blocking',
  '--disable-dev-shm-usage',
  '--no-sandbox',
  '--window-size=1440,900',
  'about:blank',
];

console.log('Starting Chrome for Testing + Reedr under Xvfb…');
console.log('Chrome:', chromeBinary);
const chrome = spawn(
  'xvfb-run',
  ['-a', '-s', '-screen 0 1440x900x24', chromeBinary, ...chromeArgs],
  { stdio: ['ignore', 'pipe', 'pipe'] },
);

let chromeLog = '';
chrome.stderr.on('data', (d) => { chromeLog += d.toString(); });
chrome.stdout.on('data', (d) => { chromeLog += d.toString(); });

let browser;
try {
  await waitForDebugger(debugPort);
  browser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${debugPort}`,
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = (await browser.pages())[0] || (await browser.newPage());
  page.setDefaultTimeout(90000);

  // Confirm extension actually loaded (branded Chrome 137+ often ignores --load-extension)
  const extCheck = await browser.newPage();
  await extCheck.goto('chrome://extensions/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(1500);
  const loaded = await extCheck.evaluate(() => {
    const mgr = document.querySelector('extensions-manager');
    const items = mgr?.shadowRoot?.querySelector('extensions-item-list');
    const cards = [...(items?.shadowRoot?.querySelectorAll('extensions-item') || [])];
    return {
      count: cards.length,
      names: cards.map((c) => c.shadowRoot?.querySelector('#name')?.textContent?.trim()),
    };
  });
  console.log('Loaded extensions:', loaded);
  if (!loaded.count) throw new Error('Reedr extension did not load into the browser');
  await extCheck.close();

  console.log('Opening ESPN…', espnUrl);
  await page.goto(espnUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(5000);

  // Dismiss common consent / overlays if present
  for (const sel of [
    '#onetrust-accept-btn-handler',
    'button[aria-label="Accept"]',
    'button[aria-label="Close"]',
    '.CloseButton',
  ]) {
    try {
      const el = await page.$(sel);
      if (el) await el.click({ delay: 20 });
    } catch (_) {}
  }
  await sleep(1000);

  // Wait for Reedr content script host
  await page.waitForFunction(
    () => !!document.getElementById('reedr-companion-root')?.shadowRoot?.getElementById('v-btn'),
    { timeout: 45000 },
  );
  console.log('Reedr button found on page');

  // Open panel via shadow DOM
  await page.evaluate(() => {
    const root = document.getElementById('reedr-companion-root');
    const shadow = root.shadowRoot;
    shadow.getElementById('v-btn').click();
  });
  await sleep(800);

  const panelOpen = await page.evaluate(() => {
    const shadow = document.getElementById('reedr-companion-root').shadowRoot;
    return shadow.getElementById('v-panel')?.classList.contains('open');
  });
  if (!panelOpen) throw new Error('Reedr panel did not open');
  console.log('Panel open — sending question');

  await page.evaluate(() => {
    const shadow = document.getElementById('reedr-companion-root').shadowRoot;
    const input = shadow.getElementById('v-input');
    const send = shadow.getElementById('v-send');
    input.value = 'Summarize this ESPN story in 3 short bullets.';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    send.disabled = false;
    send.click();
  });

  // Wait for an assistant reply bubble with real text (not just cursor)
  await page.waitForFunction(() => {
    const shadow = document.getElementById('reedr-companion-root')?.shadowRoot;
    if (!shadow) return false;
    const assistants = [...shadow.querySelectorAll('.v-msg.assistant .v-msg-bubble')];
    return assistants.some((el) => {
      const text = (el.innerText || '').trim();
      return text.length > 40 && !el.querySelector('.v-cursor');
    });
  }, { timeout: 90000 });

  await sleep(1200);
  console.log('Reply received — taking screenshot');

  await page.screenshot({
    path: outPath,
    type: 'png',
    fullPage: false,
  });

  // Also save a page-marked copy for the walkthrough
  const workspaceCopy = path.join(root, 'tmp', 'reedr-espn-in-use.png');
  mkdirSync(path.dirname(workspaceCopy), { recursive: true });
  await page.screenshot({ path: workspaceCopy, type: 'png', fullPage: false });

  const snippet = await page.evaluate(() => {
    const shadow = document.getElementById('reedr-companion-root').shadowRoot;
    const bubbles = [...shadow.querySelectorAll('.v-msg.assistant .v-msg-bubble')];
    return bubbles.map((b) => b.innerText.trim()).filter(Boolean).slice(-1)[0]?.slice(0, 240);
  });
  writeFileSync(
    path.join(root, 'tmp', 'reedr-espn-capture.json'),
    JSON.stringify({ espnUrl, outPath, snippet, at: new Date().toISOString() }, null, 2),
  );

  console.log('Wrote', outPath);
  console.log('Reply snippet:', snippet);
} catch (err) {
  console.error('Capture failed:', err.message);
  writeFileSync('/tmp/reedr-espn-chrome.log', chromeLog.slice(-8000));
  process.exitCode = 1;
} finally {
  try { if (browser) await browser.disconnect(); } catch (_) {}
  try { chrome.kill('SIGKILL'); } catch (_) {}
  await sleep(500);
}
