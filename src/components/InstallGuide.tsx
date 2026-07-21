import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

type OS = 'mac' | 'windows' | 'linux';
type Browser = 'chrome' | 'edge' | 'firefox';

function detectOS(): OS {
  const ua = navigator.userAgent;
  if (ua.includes('Mac')) return 'mac';
  if (ua.includes('Win')) return 'windows';
  return 'linux';
}

export function detectBrowser(): Browser {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'edge';
  if (ua.includes('Firefox/')) return 'firefox';
  return 'chrome';
}

const BROWSER_LABELS: Record<Browser, string> = {
  chrome: '🟡 Chrome',
  edge: '🔵 Edge',
  firefox: '🦊 Firefox',
};

// ── Step 1: Download & unzip (same for all browsers) ─────────────────────────

function StepUnzip({ os }: { os: OS }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-white font-semibold">Your file is downloading now.</p>
        <p className="text-[#9090b8] text-sm leading-relaxed">
          Once it lands, open your {os === 'mac' ? 'Downloads folder' : 'Downloads folder'} and double-click{' '}
          <span className="font-mono text-[#a78bfa]">victor-extension.zip</span> to unzip it.
          You'll get a folder called <span className="font-mono text-[#a78bfa]">victor-extension</span>.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="bg-[#0d0d1e] border border-[#2a2a4a] rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 bg-[#6d5ffa]/20 border border-[#6d5ffa]/40 rounded-lg flex items-center justify-center text-[#a78bfa] text-xs font-bold flex-shrink-0">zip</div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium">victor-extension.zip</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1 bg-[#1a1a38] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#6d5ffa] rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </div>
              <span className="text-[#6060a0] text-xs flex-shrink-0">Done</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-1">
          <div className="flex-1 h-px bg-[#2a2a4a]" />
          <span className="text-[#6060a0] text-xs">double-click to unzip</span>
          <div className="flex-1 h-px bg-[#2a2a4a]" />
        </div>

        <div className="bg-[#0d0d1e] border border-[#28c840]/30 rounded-xl p-3 flex items-center gap-3">
          <span className="text-2xl flex-shrink-0">📁</span>
          <div>
            <p className="text-white text-sm font-medium">victor-extension</p>
            <p className="text-[#6060a0] text-xs">Folder — ready to load</p>
          </div>
          <div className="ml-auto w-5 h-5 rounded-full bg-[#28c840]/20 border border-[#28c840]/50 flex items-center justify-center flex-shrink-0">
            <span className="text-[#28c840] text-xs">✓</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Open extensions page (browser-specific) ───────────────────────────

function StepLoadChrome({ browser }: { browser: 'chrome' | 'edge' }) {
  const scheme = browser === 'edge' ? 'edge://extensions' : 'chrome://extensions';
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-white font-semibold">Open the extensions page.</p>
        <p className="text-[#9090b8] text-sm leading-relaxed">
          In a new tab, type{' '}
          <span className="font-mono text-[#a78bfa]">{scheme}</span>{' '}
          and press Enter. Then follow these two steps:
        </p>
      </div>

      <div className="bg-[#0d0d1e] border border-[#2a2a4a] rounded-xl overflow-hidden">
        <div className="bg-[#181830] px-3 py-2 flex items-center gap-2 border-b border-[#2a2a4a]">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 bg-[#0a0a18] rounded px-2.5 py-1 text-[#a78bfa] text-xs font-mono">{scheme}</div>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-white text-sm font-semibold">Extensions</p>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5 text-[#a78bfa] text-xs font-medium">
                <span className="w-4 h-4 rounded-full bg-[#6d5ffa] text-white text-[9px] flex items-center justify-center font-bold flex-shrink-0">A</span>
                Turn this on
              </div>
              <motion.div
                animate={{ boxShadow: ['0 0 0 0 rgba(109,95,250,0)', '0 0 0 5px rgba(109,95,250,0.5)', '0 0 0 0 rgba(109,95,250,0)'] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                className="flex items-center gap-2 bg-[#1e1e40] border border-[#6d5ffa]/60 rounded-full px-2.5 py-1"
              >
                <span className="text-[#a78bfa] text-xs">Developer mode</span>
                <div className="w-7 h-3.5 bg-[#6d5ffa] rounded-full relative flex-shrink-0">
                  <div className="absolute right-0.5 top-0.5 w-2.5 h-2.5 bg-white rounded-full" />
                </div>
              </motion.div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 text-[#a78bfa] text-xs font-medium">
                <span className="w-4 h-4 rounded-full bg-[#6d5ffa] text-white text-[9px] flex items-center justify-center font-bold flex-shrink-0">B</span>
                Then click this
              </div>
              <motion.div
                animate={{ boxShadow: ['0 0 0 0 rgba(109,95,250,0)', '0 0 0 5px rgba(109,95,250,0.5)', '0 0 0 0 rgba(109,95,250,0)'] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: 0.5 }}
                className="bg-[#6d5ffa] text-white text-xs px-4 py-2 rounded-lg font-medium cursor-pointer"
              >
                Load unpacked
              </motion.div>
            </div>
            <div className="bg-[#1e1e40] text-[#6060a0] text-xs px-3 py-2 rounded-lg self-end">Pack extension</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepLoadFirefox() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-white font-semibold">Open Firefox's debugging page.</p>
        <p className="text-[#9090b8] text-sm leading-relaxed">
          In a new tab, type{' '}
          <span className="font-mono text-[#a78bfa]">about:debugging#/runtime/this-firefox</span>{' '}
          and press Enter.
        </p>
        <p className="text-[#c4a35a] text-xs leading-relaxed bg-[#2a2208] border border-[#5c4a1a] rounded-lg px-3 py-2">
          Note: Firefox temporary add-ons are removed when you quit Firefox. Re-load the folder after restarting, or use Chrome/Edge for a persistent install.
        </p>
      </div>

      <div className="bg-[#0d0d1e] border border-[#2a2a4a] rounded-xl overflow-hidden">
        <div className="bg-[#181830] px-3 py-2 flex items-center gap-2 border-b border-[#2a2a4a]">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 bg-[#0a0a18] rounded px-2.5 py-1 text-[#a78bfa] text-xs font-mono">about:debugging#/runtime/this-firefox</div>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <p className="text-white text-sm font-semibold">This Firefox</p>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[#a78bfa] text-xs font-medium mb-1">
              <span className="w-4 h-4 rounded-full bg-[#6d5ffa] text-white text-[9px] flex items-center justify-center font-bold flex-shrink-0">A</span>
              Click this button
            </div>
            <motion.div
              animate={{ boxShadow: ['0 0 0 0 rgba(109,95,250,0)', '0 0 0 5px rgba(109,95,250,0.5)', '0 0 0 0 rgba(109,95,250,0)'] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="bg-[#6d5ffa] text-white text-xs px-4 py-2 rounded-lg font-medium cursor-pointer self-start"
            >
              Load Temporary Add-on…
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Select the folder / file ─────────────────────────────────────────

function StepSelectChrome() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-white font-semibold">Select the victor-extension folder.</p>
        <p className="text-[#9090b8] text-sm leading-relaxed">
          A file picker will open. Navigate to your <strong className="text-white">Downloads</strong> folder,
          select <span className="font-mono text-[#a78bfa]">victor-extension</span>, and click{' '}
          <strong className="text-white">Select Folder</strong>.
        </p>
      </div>

      <div className="bg-[#0d0d1e] border border-[#2a2a4a] rounded-xl overflow-hidden">
        <div className="bg-[#181830] px-4 py-2.5 flex items-center justify-between border-b border-[#2a2a4a]">
          <p className="text-white text-xs font-medium">Select Extension Directory</p>
          <span className="text-[#6060a0] text-sm">×</span>
        </div>
        <div className="p-2 flex flex-col gap-0.5">
          {[
            { icon: '📄', name: 'Documents', dim: true },
            { icon: '⬇️', name: 'Downloads', dim: false, open: true },
          ].map((f) => (
            <div key={f.name} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${f.open ? 'bg-[#1a1a38]' : ''}`}>
              <span className="text-base">{f.icon}</span>
              <span className={`text-xs flex-1 ${f.dim ? 'text-[#6060a0]' : 'text-white'}`}>{f.name}</span>
              {f.open && <span className="text-[#6060a0] text-xs">▼</span>}
            </div>
          ))}
          <motion.div
            animate={{ boxShadow: ['0 0 0 0 rgba(109,95,250,0)', '0 0 0 4px rgba(109,95,250,0.45)', '0 0 0 0 rgba(109,95,250,0)'] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }}
            className="flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg bg-[#6d5ffa]/20 border border-[#6d5ffa]/50"
          >
            <span className="text-base">📁</span>
            <span className="text-white text-xs font-semibold flex-1">victor-extension</span>
            <span className="text-[#a78bfa] text-xs font-semibold">Select Folder</span>
          </motion.div>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <span className="text-base">🖥️</span>
            <span className="text-xs flex-1 text-[#6060a0]">Desktop</span>
          </div>
        </div>
      </div>

      <DoneCard />
    </div>
  );
}

function StepSelectFirefox() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-white font-semibold">Select manifest.json inside the folder.</p>
        <p className="text-[#9090b8] text-sm leading-relaxed">
          A file picker will open. Navigate to your <strong className="text-white">Downloads</strong> folder,
          open <span className="font-mono text-[#a78bfa]">victor-extension</span>, and select{' '}
          <span className="font-mono text-[#a78bfa]">manifest.json</span> inside it.
        </p>
      </div>

      <div className="bg-[#0d0d1e] border border-[#2a2a4a] rounded-xl overflow-hidden">
        <div className="bg-[#181830] px-4 py-2.5 flex items-center justify-between border-b border-[#2a2a4a]">
          <p className="text-white text-xs font-medium">Open</p>
          <span className="text-[#6060a0] text-sm">×</span>
        </div>
        <div className="p-2 flex flex-col gap-0.5">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#1a1a38]">
            <span className="text-base">⬇️</span>
            <span className="text-white text-xs flex-1">Downloads</span>
            <span className="text-[#6060a0] text-xs">▼</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#1a1a38] ml-4">
            <span className="text-base">📁</span>
            <span className="text-white text-xs flex-1">victor-extension</span>
            <span className="text-[#6060a0] text-xs">▼</span>
          </div>
          <motion.div
            animate={{ boxShadow: ['0 0 0 0 rgba(109,95,250,0)', '0 0 0 4px rgba(109,95,250,0.45)', '0 0 0 0 rgba(109,95,250,0)'] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }}
            className="flex items-center gap-3 px-3 py-2.5 ml-8 mx-1 rounded-lg bg-[#6d5ffa]/20 border border-[#6d5ffa]/50"
          >
            <span className="text-base">📄</span>
            <span className="text-white text-xs font-semibold flex-1">manifest.json</span>
            <span className="text-[#a78bfa] text-xs font-semibold">Open</span>
          </motion.div>
        </div>
      </div>

      <DoneCard />
    </div>
  );
}

function DoneCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="bg-[#0d2218] border border-[#28c840]/30 rounded-xl p-4 flex items-center gap-4"
    >
      <span className="text-2xl flex-shrink-0">✅</span>
      <div>
        <p className="text-[#28c840] font-semibold text-sm">Victor is installed</p>
        <p className="text-[#6060a0] text-xs leading-relaxed mt-0.5">
          He'll appear on every page as a <strong className="text-white">V</strong> button in the bottom-right corner. Click it to start talking.
        </p>
      </div>
    </motion.div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Download & unzip' },
  { label: 'Open extensions' },
  { label: 'Select & confirm' },
];

interface InstallModalProps {
  onClose: () => void;
  initialBrowser?: Browser;
}

export function InstallModal({ onClose, initialBrowser }: InstallModalProps) {
  const [os, setOS] = useState<OS>('mac');
  const [browser, setBrowser] = useState<Browser>(initialBrowser ?? 'chrome');
  const [step, setStep] = useState(0);

  useEffect(() => {
    setOS(detectOS());
    if (!initialBrowser) setBrowser(detectBrowser());
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [initialBrowser]);

  useEffect(() => {
    // Reset to first step when browser changes
    setStep(0);
  }, [browser]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const stepContent = browser === 'firefox'
    ? [
        <StepUnzip key="unzip" os={os} />,
        <StepLoadFirefox key="load" />,
        <StepSelectFirefox key="select" />,
      ]
    : [
        <StepUnzip key="unzip" os={os} />,
        <StepLoadChrome key="load" browser={browser as 'chrome' | 'edge'} />,
        <StepSelectChrome key="select" />,
      ];

  const isLast = step === STEPS.length - 1;

  return createPortal(
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        key="panel"
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="bg-[#13132b] border border-[#2a2a4a] rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a4a]">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6d5ffa] to-[#a78bfa] flex items-center justify-center text-white text-xs font-bold">V</div>
              <span className="text-white font-semibold text-sm">Installing Victor</span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-[#1e1e40] hover:bg-[#2a2a50] text-[#6060a0] hover:text-white transition-colors flex items-center justify-center text-sm"
            >
              ×
            </button>
          </div>

          {/* Browser + OS pickers */}
          <div className="flex flex-col gap-3 px-6 pt-4">
            {/* Browser */}
            <div className="flex items-center gap-2">
              {(['chrome', 'edge', 'firefox'] as Browser[]).map((b) => (
                <button
                  key={b}
                  onClick={() => setBrowser(b)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    browser === b
                      ? 'border-[#6d5ffa] bg-[#6d5ffa]/20 text-[#a78bfa]'
                      : 'border-[#2a2a4a] text-[#6060a0] hover:border-[#6d5ffa]/40'
                  }`}
                >
                  {BROWSER_LABELS[b]}
                </button>
              ))}
            </div>
            {/* OS */}
            <div className="flex items-center gap-2">
              {(['mac', 'windows', 'linux'] as OS[]).map((o) => (
                <button
                  key={o}
                  onClick={() => setOS(o)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    os === o
                      ? 'border-[#6d5ffa] bg-[#6d5ffa]/20 text-[#a78bfa]'
                      : 'border-[#2a2a4a] text-[#6060a0] hover:border-[#6d5ffa]/40'
                  }`}
                >
                  {o === 'mac' ? '🍎 Mac' : o === 'windows' ? '🪟 Windows' : '🐧 Linux'}
                </button>
              ))}
            </div>
          </div>

          {/* Step progress dots */}
          <div className="flex items-center gap-2 px-6 pt-4">
            {STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className="flex items-center gap-2 group"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i < step
                    ? 'bg-[#28c840]/20 text-[#28c840] border border-[#28c840]/40'
                    : i === step
                    ? 'bg-[#6d5ffa] text-white'
                    : 'bg-[#1e1e40] text-[#6060a0] border border-[#2a2a4a]'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs hidden sm:block transition-colors ${
                  i === step ? 'text-white font-medium' : 'text-[#6060a0]'
                }`}>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`w-6 h-px transition-colors ${i < step ? 'bg-[#28c840]/40' : 'bg-[#2a2a4a]'}`} />
                )}
              </button>
            ))}
          </div>

          {/* Step content */}
          <div className="px-6 py-5 flex-1 overflow-y-auto max-h-[55vh]">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${browser}-${step}`}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                {stepContent[step]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 pt-2 border-t border-[#2a2a4a] flex items-center justify-between gap-3">
            <button
              onClick={() => step > 0 ? setStep(step - 1) : onClose()}
              className="text-sm text-[#6060a0] hover:text-white transition-colors"
            >
              {step > 0 ? '← Back' : 'Close'}
            </button>
            {isLast ? (
              <button
                onClick={onClose}
                className="bg-[#28c840] text-white text-sm px-6 py-2.5 rounded-xl font-medium hover:bg-[#22b036] transition-colors"
              >
                Done — go use Victor ✓
              </button>
            ) : (
              <button
                onClick={() => setStep(step + 1)}
                className="bg-[#6d5ffa] text-white text-sm px-6 py-2.5 rounded-xl font-medium hover:bg-[#5a4de0] transition-colors"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
