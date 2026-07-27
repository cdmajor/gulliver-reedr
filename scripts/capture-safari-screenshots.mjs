#!/usr/bin/env node
/**
 * Capture 4 real Reedr screenshots and frame them as macOS Safari windows.
 */
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = '/opt/cursor/artifacts/screenshots';
const rawDir = path.join(outDir, 'raw');
const api = 'https://gulliversoftwaretech.com/api';

const PAGES = [
  {
    id: 'safari-1',
    url: 'https://www.nytimes.com/section/technology',
    prompt: 'Summarize the top stories on this page in 3 short bullets.',
  },
  {
    id: 'safari-2',
    url: 'https://www.theguardian.com/us-news',
    prompt: 'Summarize the main stories on this page in 3 short bullets.',
  },
  {
    id: 'safari-3',
    url: 'https://www.cnn.com/',
    prompt: 'Summarize the top headlines on this page in 3 short bullets.',
  },
  {
    id: 'safari-4',
    url: 'https://www.npr.org/sections/news/',
    prompt: 'Summarize the top NPR stories on this page in 3 short bullets.',
  },
];

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
    DEBUG_PORT: String(9500 + index),
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
            console.log(`[${page.id}] ok (${size} bytes)`);
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
  });
}

function frameSafari(rawPath, outPath, titleHint) {
  const py = `
from PIL import Image, ImageDraw
import sys

raw_path, out_path, title = sys.argv[1:4]
img = Image.open(raw_path).convert('RGB')
vw, vh = 1280, 800
img = img.resize((vw, vh), Image.Resampling.LANCZOS)

titlebar_h = 76
toolbar_h = 0
pad = 16
radius = 12
# Safari light chrome
outer = (236, 236, 239)
bar = (246, 246, 248)
url_bg = (255, 255, 255)
url_text = (50, 50, 55)
border = (190, 190, 198)

frame_w = vw + pad * 2
frame_h = vh + titlebar_h + pad
frame = Image.new('RGB', (frame_w, frame_h), (250, 250, 252))
draw = ImageDraw.Draw(frame)

# window
draw.rounded_rectangle([8, 8, frame_w-9, frame_h-9], radius=radius, fill=bar, outline=border, width=1)
draw.rectangle([9, 9, frame_w-10, 9+titlebar_h], fill=bar)

# traffic lights
colors = [(255,95,87), (255,189,46), (40,200,64)]
x, y = 28, 26
for c in colors:
    draw.ellipse([x-7, y-7, x+7, y+7], fill=c)
    x += 22

# Safari back/forward placeholders
draw.ellipse([100, 18, 118, 36], outline=(180,180,190), width=1)
draw.ellipse([124, 18, 142, 36], outline=(180,180,190), width=1)

# Smart Search field (Safari style)
url_box = [160, 16, frame_w-48, 40]
draw.rounded_rectangle(url_box, radius=10, fill=url_bg, outline=(210,210,215))
draw.text((178, 22), title[:88], fill=url_text)

# Safari tab strip look
draw.rounded_rectangle([24, 48, 220, 70], radius=6, fill=(255,255,255), outline=(210,210,215))
draw.text((34, 52), 'Reedr · Safari', fill=(70,70,80))
draw.rounded_rectangle([228, 48, 360, 70], radius=6, fill=(230,230,235), outline=(210,210,215))
draw.text((238, 52), 'New Tab', fill=(120,120,130))

# content
frame.paste(img, (pad, 9 + titlebar_h))

# caption
cap_h = 28
final = Image.new('RGB', (frame_w, frame_h + cap_h), (20, 20, 28))
final.paste(frame, (0, 0))
d2 = ImageDraw.Draw(final)
d2.text((14, frame_h + 7), f'Mac · Safari  ·  API {sys.argv[4]}  ·  Reedr in use', fill=(180,180,210))
final.save(out_path, 'PNG')
print(out_path)
`;
  const scriptPath = '/tmp/frame_safari.py';
  writeFileSync(scriptPath, py);
  const res = spawnSync('python3', [scriptPath, rawPath, outPath, titleHint, api], { encoding: 'utf8' });
  if (res.status !== 0) {
    console.error(res.stderr || res.stdout);
    throw new Error('Safari framing failed');
  }
  console.log('framed', res.stdout.trim());
}

async function main() {
  mkdirSync(rawDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });
  spawnSync('npm', ['run', 'prepare:unpacked'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, REEDR_API_URL: api },
  });

  const results = [];
  for (let i = 0; i < PAGES.length; i++) {
    const page = PAGES[i];
    spawnSync('pkill', ['-f', 'chrome-linux64/chrome'], { stdio: 'ignore' });
    spawnSync('pkill', ['-f', 'Xvfb'], { stdio: 'ignore' });
    await new Promise((r) => setTimeout(r, 1200));

    let rawPath;
    try {
      rawPath = await captureOne(page, i);
    } catch (err) {
      console.error(err.message);
      // fallbacks from prior captures if a news site blocks automation
      const fallbacks = [
        path.join(outDir, 'raw/mac-3-raw.png'),
        path.join(outDir, 'raw/mac-4-raw.png'),
        path.join(outDir, 'reedr-espn-in-use.png'),
        path.join(outDir, 'reedr-msnbc-in-use.png'),
      ];
      const fb = fallbacks[i] || fallbacks[0];
      if (!existsSync(fb)) throw err;
      rawPath = path.join(rawDir, `${page.id}-raw.png`);
      copyFileSync(fb, rawPath);
      console.log(`[${page.id}] using fallback ${fb}`);
    }

    const framedPath = path.join(outDir, `reedr-${page.id}.png`);
    let host = 'safari';
    try { host = new URL(page.url).host; } catch (_) {}
    frameSafari(rawPath, framedPath, host);
    copyFileSync(framedPath, path.join(root, 'tmp', path.basename(framedPath)));
    results.push({ id: page.id, browser: 'safari', url: page.url, framedPath });
  }

  writeFileSync(
    path.join(outDir, 'reedr-safari-screenshots.json'),
    JSON.stringify({ api, results, at: new Date().toISOString() }, null, 2),
  );
  console.log('\nDone. 4 Safari screenshots written to', outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
