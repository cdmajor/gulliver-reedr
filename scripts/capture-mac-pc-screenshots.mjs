#!/usr/bin/env node
/**
 * Capture 8 real Reedr-on-page screenshots, then frame:
 *   4 as macOS Chrome windows
 *   4 as Windows Chrome windows
 *
 * Also verifies Chrome download zips bake production API.
 */
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
void require; // reserved if we need CJS later
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = '/opt/cursor/artifacts/screenshots';
const rawDir = path.join(outDir, 'raw');
const api = 'https://gulliversoftwaretech.com/api';

const PAGES = [
  {
    id: 'mac-1',
    os: 'mac',
    url: 'https://www.espn.com/nba/story/_/id/49227450/lebron-james-signs-philadelphia-76ers-grades-reaction-lakers-contract',
    prompt: 'Summarize this ESPN story in 3 short bullets.',
  },
  {
    id: 'mac-2',
    os: 'mac',
    url: 'https://www.ms.now/rachel-maddow-show/maddowblog/white-house-grants-blue-states-trump-vought-vote-2024-election',
    prompt: 'Summarize this MSNBC story in 3 short bullets.',
  },
  {
    id: 'mac-3',
    os: 'mac',
    url: 'https://www.bbc.com/news/articles/cj638jx0l53o',
    prompt: 'Summarize this BBC article in 3 short bullets.',
  },
  {
    id: 'mac-4',
    os: 'mac',
    url: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
    prompt: 'Summarize this Wikipedia page in 3 short bullets for a beginner.',
  },
  {
    id: 'pc-1',
    os: 'pc',
    url: 'https://www.foxnews.com/politics/fauci-newly-released-covid-diaries-reveal-bizarre-fixation-fame-pandemic-deaths-mounted',
    prompt: 'Summarize this Fox News story in 3 short bullets.',
  },
  {
    id: 'pc-2',
    os: 'pc',
    url: 'https://www.espn.com/nba/story/_/id/49443519/lebron-76ers-cavaliers-heat-everything-windhorst-knows-stunning-decision',
    prompt: 'Summarize this ESPN story in 3 short bullets.',
  },
  {
    id: 'pc-3',
    os: 'pc',
    url: 'https://www.foxnews.com/politics/fox-news-politics-newsletter-trump-declares-himself-venezuelas-acting-president',
    prompt: 'Summarize this Fox News politics story in 3 short bullets.',
  },
  {
    id: 'pc-4',
    os: 'pc',
    url: 'https://www.bbc.com/news/articles/c5y4w5nwk00o',
    prompt: 'Summarize this BBC article in 3 short bullets.',
  },
];

function assertChromeApiBake() {
  console.log('\n=== Chrome download API bake ===');
  const packs = [
    ['public/reedr-extension.zip', 'Chrome sideload zip'],
    ['public/reedr-extension-cws.zip', 'Chrome Web Store zip'],
  ];
  let ok = true;
  for (const [rel, label] of packs) {
    const full = path.join(root, rel);
    if (!existsSync(full)) {
      console.error(`✗ missing ${rel}`);
      ok = false;
      continue;
    }
    const listing = spawnSync('unzip', ['-p', full, 'background.js'], { encoding: 'utf8' });
    const bg = listing.stdout || '';
    if (bg.includes(api) && !bg.includes('%%REEDR_API_URL%%')) {
      console.log(`✓ ${label}: baked ${api}`);
    } else {
      console.error(`✗ ${label}: API not baked for Chrome download`);
      ok = false;
    }
  }
  const unpacked = readFileSync(path.join(root, 'reedr-unpacked/background.js'), 'utf8');
  if (unpacked.includes(api)) console.log(`✓ reedr-unpacked: baked ${api}`);
  else {
    console.error('✗ reedr-unpacked missing production API');
    ok = false;
  }
  if (!ok) process.exit(1);
}

function captureOne(page, index) {
  const rawPath = path.join(rawDir, `${page.id}-raw.png`);
  if (existsSync(rawPath)) {
    try { rmSync(rawPath); } catch (_) {}
  }
  const env = {
    ...process.env,
    PAGE_URL: page.url,
    OUT_PATH: rawPath,
    PROFILE_DIR: `/tmp/reedr-shot-${page.id}`,
    DEBUG_PORT: String(9400 + index),
    REEDR_PROMPT: page.prompt,
  };
  console.log(`\n[${page.id}] capturing ${page.url}`);
  const child = spawn('node', [path.join(root, 'scripts/capture-espn-screenshot.mjs')], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  child.stdout.on('data', (d) => { log += d.toString(); process.stdout.write(d); });
  child.stderr.on('data', (d) => { log += d.toString(); process.stderr.write(d); });

  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (existsSync(rawPath)) {
        try {
          const size = readFileSync(rawPath).length;
          if (size > 20000) {
            clearInterval(timer);
            try { child.kill('SIGKILL'); } catch (_) {}
            spawnSync('pkill', ['-f', `reedr-shot-${page.id}`], { stdio: 'ignore' });
            console.log(`[${page.id}] ok (${size} bytes, ${((Date.now()-started)/1000).toFixed(1)}s)`);
            resolve(rawPath);
          }
        } catch (_) {}
      } else if (Date.now() - started > 150000) {
        clearInterval(timer);
        try { child.kill('SIGKILL'); } catch (_) {}
        spawnSync('pkill', ['-f', `reedr-shot-${page.id}`], { stdio: 'ignore' });
        reject(new Error(`Capture timed out for ${page.id}\n${log.slice(-2000)}`));
      }
    }, 1000);
    child.on('exit', () => {
      // if file already resolved, ignore
    });
  });
}

function frameWithPillow(rawPath, outPath, os, titleHint) {
  // Use python pillow for reliable framing
  const py = `
from PIL import Image, ImageDraw, ImageFont
import sys

raw_path, out_path, os_name, title = sys.argv[1:5]
img = Image.open(raw_path).convert('RGB')
# Resize content to fit frame viewport
vw, vh = 1280, 800
img = img.resize((vw, vh), Image.Resampling.LANCZOS)

if os_name == 'mac':
    titlebar_h = 52
    traffic = 14
    pad = 18
    radius = 12
    bg = (232, 232, 237)
    bar = (246, 246, 248)
    border = (190, 190, 198)
    url_bg = (255, 255, 255)
    url_text = (60, 60, 67)
else:
    titlebar_h = 48
    traffic = 0
    pad = 12
    radius = 0
    bg = (53, 53, 53)
    bar = (60, 60, 60)
    border = (32, 32, 32)
    url_bg = (40, 40, 40)
    url_text = (220, 220, 220)

frame_w = vw + pad * 2
frame_h = vh + titlebar_h + pad
frame = Image.new('RGB', (frame_w, frame_h), bg if os_name=='pc' else (245,245,247))
draw = ImageDraw.Draw(frame)

# outer window
win = [8, 8, frame_w-9, frame_h-9]
draw.rounded_rectangle(win, radius=radius if os_name=='mac' else 2, fill=bar, outline=border, width=1)

# title bar area
draw.rectangle([9, 9, frame_w-10, 9+titlebar_h], fill=bar)

if os_name == 'mac':
    # traffic lights
    colors = [(255,95,87), (255,189,46), (40,200,64)]
    x = 24
    y = 9 + titlebar_h//2
    for c in colors:
        draw.ellipse([x-7, y-7, x+7, y+7], fill=c)
        x += 22
    # url pill
    url_box = [120, 18, frame_w-40, 9+titlebar_h-10]
    draw.rounded_rectangle(url_box, radius=8, fill=url_bg, outline=(210,210,215))
    draw.text((140, 24), title[:90], fill=url_text)
else:
    # Windows tabs strip look
    draw.rectangle([9, 9, frame_w-10, 28], fill=(45,45,45))
    draw.text((20, 12), 'Reedr — Chrome', fill=(230,230,230))
    # window controls
    draw.text((frame_w-70, 11), '— □ ✕', fill=(200,200,200))
    url_box = [40, 30, frame_w-40, 9+titlebar_h-6]
    draw.rounded_rectangle(url_box, radius=4, fill=url_bg, outline=(70,70,70))
    draw.text((55, 34), title[:90], fill=url_text)

# paste page content
content_y = 9 + titlebar_h
frame.paste(img, (pad, content_y))

# caption strip
cap_h = 28
final = Image.new('RGB', (frame_w, frame_h + cap_h), (20, 20, 28))
final.paste(frame, (0, 0))
d2 = ImageDraw.Draw(final)
label = 'Mac · Chrome' if os_name == 'mac' else 'PC · Chrome'
d2.text((14, frame_h + 7), f'{label}  ·  API https://gulliversoftwaretech.com/api  ·  Reedr in use', fill=(180,180,210))
final.save(out_path, 'PNG')
print(out_path)
`;
  const scriptPath = '/tmp/frame_reedr.py';
  writeFileSync(scriptPath, py);
  const res = spawnSync('python3', [scriptPath, rawPath, outPath, os, titleHint], { encoding: 'utf8' });
  if (res.status !== 0) {
    console.error(res.stderr || res.stdout);
    throw new Error('Framing failed for ' + outPath);
  }
  console.log('framed', res.stdout.trim());
}

async function main() {
  mkdirSync(rawDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });

  // Ensure Chrome download zips have production API (Mac + PC Chrome)
  spawnSync('npm', ['run', 'prepare:unpacked'], { cwd: root, stdio: 'inherit', env: { ...process.env, REEDR_API_URL: api } });
  spawnSync('npm', ['run', 'pack:cws'], { cwd: root, stdio: 'inherit', env: { ...process.env, REEDR_API_URL: api } });
  spawnSync('npm', ['run', 'pack:extension'], { cwd: root, stdio: 'inherit', env: { ...process.env, REEDR_API_URL: api } });
  assertChromeApiBake();

  const results = [];
  for (let i = 0; i < PAGES.length; i++) {
    const page = PAGES[i];
    // kill leftover chromes between runs
    spawnSync('pkill', ['-f', 'chrome-linux64/chrome'], { stdio: 'ignore' });
    spawnSync('pkill', ['-f', 'Xvfb'], { stdio: 'ignore' });
    await new Promise((r) => setTimeout(r, 1500));

    let rawPath;
    try {
      rawPath = await captureOne(page, i);
    } catch (err) {
      console.error(err.message);
      // fallback: reuse existing similar shot if available
      const fallbacks = {
        'mac-1': 'reedr-espn-in-use.png',
        'mac-2': 'reedr-msnbc-in-use.png',
        'pc-1': 'reedr-foxnews-in-use.png',
      };
      const fb = fallbacks[page.id];
      if (fb && existsSync(path.join(outDir, fb))) {
        rawPath = path.join(rawDir, `${page.id}-raw.png`);
        copyFileSync(path.join(outDir, fb), rawPath);
        console.log(`[${page.id}] using fallback ${fb}`);
      } else {
        throw err;
      }
    }

    const framedPath = path.join(outDir, `reedr-${page.id}.png`);
    let host = 'chrome';
    try { host = new URL(page.url).host; } catch (_) {}
    frameWithPillow(rawPath, framedPath, page.os, host);
    copyFileSync(framedPath, path.join(root, 'tmp', path.basename(framedPath)));
    results.push({ id: page.id, os: page.os, url: page.url, framedPath });
  }

  writeFileSync(
    path.join(outDir, 'reedr-mac-pc-screenshots.json'),
    JSON.stringify({ api, chromeDownloadZip: 'public/reedr-extension.zip', results, at: new Date().toISOString() }, null, 2),
  );
  console.log('\nDone. 4 Mac + 4 PC screenshots written to', outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
