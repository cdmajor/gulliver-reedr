import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

type Browser = 'chrome' | 'edge' | 'firefox' | 'safari' | 'brave' | 'opera';

export function detectBrowser(): Browser {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/') || ua.includes('EdgA/') || ua.includes('EdgiOS/')) return 'edge';
  if (ua.includes('Firefox/') || ua.includes('FxiOS/')) return 'firefox';
  if (ua.includes('OPR/') || ua.includes('Opera')) return 'opera';
  if (ua.includes('Brave') || (navigator as any).brave) return 'brave';
  if (ua.includes('Safari/') && !ua.includes('Chrome/') && !ua.includes('Chromium/')) return 'safari';
  return 'chrome';
}

const BROWSER_LABELS: Record<Browser, string> = {
  chrome: 'Chrome',
  edge: 'Edge',
  firefox: 'Firefox',
  safari: 'Safari',
  brave: 'Brave',
  opera: 'Opera',
};

function extensionsPageUrl(browser: Browser) {
  if (browser === 'edge') return 'edge://extensions';
  if (browser === 'firefox') return 'about:debugging#/runtime/this-firefox';
  if (browser === 'opera') return 'opera://extensions';
  if (browser === 'brave') return 'brave://extensions';
  if (browser === 'safari') return 'Safari → Settings → Extensions';
  return 'chrome://extensions';
}

function isChromium(browser: Browser) {
  return browser === 'chrome' || browser === 'edge' || browser === 'brave' || browser === 'opera';
}

interface InstallModalProps {
  onClose: () => void;
  initialBrowser?: Browser;
}

export function InstallModal({ onClose, initialBrowser }: InstallModalProps) {
  const [browser, setBrowser] = useState<Browser>(initialBrowser ?? 'chrome');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!initialBrowser) setBrowser(detectBrowser());
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [initialBrowser]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const extUrl = extensionsPageUrl(browser);
  const chromium = isChromium(browser);

  async function copyExtensionsUrl() {
    if (browser === 'safari') return;
    try {
      await navigator.clipboard.writeText(extUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — user can still type it
    }
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        key="panel"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="bg-[#13132b] border border-[#2a2a4a] rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto flex flex-col overflow-hidden max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a4a]">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6d5ffa] to-[#a78bfa] flex items-center justify-center text-white text-xs font-bold">R</div>
              <div>
                <p className="text-white font-semibold text-sm">Install Reedr</p>
                <p className="text-[#6060a0] text-xs">Works across major browsers</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-[#1e1e40] hover:bg-[#2a2a50] text-[#6060a0] hover:text-white transition-colors flex items-center justify-center text-sm"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="overflow-y-auto">
            <div className="flex flex-wrap items-center gap-2 px-6 pt-5">
              <span className="text-[#6060a0] text-xs mr-1">Browser:</span>
              {(Object.keys(BROWSER_LABELS) as Browser[]).map((b) => (
                <button
                  key={b}
                  onClick={() => setBrowser(b)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    browser === b
                      ? 'border-[#6d5ffa] bg-[#6d5ffa]/20 text-[#a78bfa]'
                      : 'border-[#2a2a4a] text-[#6060a0] hover:border-[#6d5ffa]/40'
                  }`}
                >
                  {BROWSER_LABELS[b]}
                </button>
              ))}
            </div>

            <div className="px-6 py-5 flex flex-col gap-5">

              {/* Warning banner */}
              <div className="bg-[#2a1a00] border border-[#c47a00]/40 rounded-xl px-4 py-3 flex items-start gap-2.5">
                <span className="text-lg leading-none mt-0.5">⚠️</span>
                <p className="text-[#f5b942] text-xs leading-relaxed">
                  <strong className="text-[#ffd280]">Don't open the files inside the zip.</strong>{' '}
                  That just shows you raw code in browser tabs — it doesn't install anything.
                  Follow the steps below instead.
                </p>
              </div>

              <Step n={1} title="Extract the zip">
                In your Downloads folder, <strong className="text-white">right-click</strong>{' '}
                <code className="text-[#a78bfa] font-mono text-[12px]">reedr-extension.zip</code>{' '}
                and choose <strong className="text-white">Extract All</strong> (Windows) or{' '}
                <strong className="text-white">Open</strong> (Mac). You'll get a folder called{' '}
                <code className="text-[#a78bfa] font-mono text-[12px]">reedr-extension</code>.{' '}
                <span className="text-[#c47a00]">Don't open the files inside it.</span>
              </Step>

              {chromium && (
                <>
                  <Step n={2} title={`Open ${BROWSER_LABELS[browser]} extensions`}>
                    <p className="mb-3">
                      Type this in a new tab, then flip on <strong className="text-white">Developer mode</strong> (top-right toggle):
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-[#0d0d1e] border border-[#2a2a4a] rounded-lg px-3 py-2 text-[#a78bfa] font-mono text-xs truncate">
                        {extUrl}
                      </code>
                      <button
                        onClick={copyExtensionsUrl}
                        className="shrink-0 text-xs px-3 py-2 rounded-lg bg-[#6d5ffa] text-white font-medium hover:bg-[#5a4de0] transition-colors"
                      >
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </Step>
                  <Step n={3} title="Load the folder (not the files inside)">
                    Click <strong className="text-white">Load unpacked</strong>, then select the{' '}
                    <code className="text-[#a78bfa] font-mono text-[12px]">reedr-extension</code>{' '}
                    <strong className="text-white">folder</strong> — not any file inside it.
                  </Step>
                </>
              )}

              {browser === 'firefox' && (
                <>
                  <Step n={2} title="Open Firefox debugging">
                    <p className="mb-3">
                      Paste this in a new tab, then click <strong className="text-white">Load Temporary Add-on…</strong>:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-[#0d0d1e] border border-[#2a2a4a] rounded-lg px-3 py-2 text-[#a78bfa] font-mono text-[11px] truncate">
                        {extUrl}
                      </code>
                      <button
                        onClick={copyExtensionsUrl}
                        className="shrink-0 text-xs px-3 py-2 rounded-lg bg-[#6d5ffa] text-white font-medium hover:bg-[#5a4de0] transition-colors"
                      >
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-[#c4a35a] text-[11px] mt-2 leading-relaxed">
                      Firefox temporary add-ons are removed when you quit the browser — just load the folder again after restart.
                    </p>
                  </Step>
                  <Step n={3} title="Select manifest.json">
                    Select{' '}
                    <code className="text-[#a78bfa] font-mono text-[12px]">manifest.json</code> inside the{' '}
                    <code className="text-[#a78bfa] font-mono text-[12px]">reedr-extension</code> folder.
                  </Step>
                </>
              )}

              {browser === 'safari' && (
                <>
                  <Step n={2} title="Enable the Develop menu">
                    In Safari: <strong className="text-white">Settings → Advanced → Show features for web developers</strong>.
                    Then open <strong className="text-white">Develop → Developer settings</strong> and allow unsigned extensions if needed.
                  </Step>
                  <Step n={3} title="Load Reedr in Safari">
                    On macOS Safari 16+, convert or load the Web Extension package with Xcode’s Safari Web Extension support, or use{' '}
                    <strong className="text-white">Develop → Show Extension Builder / Allow Unsigned Extensions</strong> and add the{' '}
                    <code className="text-[#a78bfa] font-mono text-[12px]">reedr-extension</code> folder.
                    Enable Reedr under <strong className="text-white">Safari → Settings → Extensions</strong>.
                  </Step>
                </>
              )}

              <div className="bg-[#0d2218] border border-[#28c840]/30 rounded-xl p-4 flex items-start gap-3">
                <span className="text-xl leading-none mt-0.5">✓</span>
                <div>
                  <p className="text-[#28c840] font-semibold text-sm">You’re done</p>
                  <p className="text-[#8080a0] text-xs leading-relaxed mt-1">
                    Look for the purple <strong className="text-white">R</strong> button in the bottom-right of any page. Click it to chat — Reedr already read the page.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 pb-5">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-[#1e1e40] hover:bg-[#2a2a50] text-white text-sm font-medium transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-[#6d5ffa]/20 border border-[#6d5ffa]/50 text-[#a78bfa] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {n}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-white font-semibold text-sm mb-1">{title}</p>
        <div className="text-[#9090b8] text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
