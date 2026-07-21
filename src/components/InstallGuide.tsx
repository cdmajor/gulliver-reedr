import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

type Browser = 'chrome' | 'edge' | 'firefox';

export function detectBrowser(): Browser {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'edge';
  if (ua.includes('Firefox/')) return 'firefox';
  return 'chrome';
}

const BROWSER_LABELS: Record<Browser, string> = {
  chrome: 'Chrome',
  edge: 'Edge',
  firefox: 'Firefox',
};

function extensionsPageUrl(browser: Browser) {
  if (browser === 'edge') return 'edge://extensions';
  if (browser === 'firefox') return 'about:debugging#/runtime/this-firefox';
  return 'chrome://extensions';
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

  async function copyExtensionsUrl() {
    try {
      await navigator.clipboard.writeText(extUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — user can still type it
    }
  }

  const chromeOrEdge = browser === 'chrome' || browser === 'edge';

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
          className="bg-[#13132b] border border-[#2a2a4a] rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a4a]">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6d5ffa] to-[#a78bfa] flex items-center justify-center text-white text-xs font-bold">V</div>
              <div>
                <p className="text-white font-semibold text-sm">Install Victor</p>
                <p className="text-[#6060a0] text-xs">About 30 seconds</p>
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

          {/* Browser picker — detected automatically, easy to switch */}
          <div className="flex items-center gap-2 px-6 pt-5">
            <span className="text-[#6060a0] text-xs mr-1">Browser:</span>
            {(['chrome', 'edge', 'firefox'] as Browser[]).map((b) => (
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

          {/* Three clear steps */}
          <div className="px-6 py-5 flex flex-col gap-5">
            <Step n={1} title="Unzip the download">
              Open your Downloads folder and double-click{' '}
              <code className="text-[#a78bfa] font-mono text-[12px]">victor-extension.zip</code>.
              You’ll get a folder named{' '}
              <code className="text-[#a78bfa] font-mono text-[12px]">victor-extension</code>.
            </Step>

            <Step n={2} title={`Open ${BROWSER_LABELS[browser]} extensions`}>
              {chromeOrEdge ? (
                <>
                  <p className="mb-3">
                    Paste this in a new tab, then turn on <strong className="text-white">Developer mode</strong>:
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
                </>
              ) : (
                <>
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
                </>
              )}
            </Step>

            <Step n={3} title={chromeOrEdge ? 'Load the folder' : 'Select manifest.json'}>
              {chromeOrEdge ? (
                <>
                  Click <strong className="text-white">Load unpacked</strong>, then choose the{' '}
                  <code className="text-[#a78bfa] font-mono text-[12px]">victor-extension</code> folder.
                </>
              ) : (
                <>
                  Select{' '}
                  <code className="text-[#a78bfa] font-mono text-[12px]">manifest.json</code> inside the{' '}
                  <code className="text-[#a78bfa] font-mono text-[12px]">victor-extension</code> folder.
                </>
              )}
            </Step>

            <div className="bg-[#0d2218] border border-[#28c840]/30 rounded-xl p-4 flex items-start gap-3">
              <span className="text-xl leading-none mt-0.5">✓</span>
              <div>
                <p className="text-[#28c840] font-semibold text-sm">You’re done</p>
                <p className="text-[#8080a0] text-xs leading-relaxed mt-1">
                  Look for the purple <strong className="text-white">V</strong> button in the bottom-right of any page. Click it to chat — Victor already read the page.
                </p>
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
