import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type OS = 'mac' | 'windows' | 'linux';

function detectOS(): OS {
  const ua = navigator.userAgent;
  if (ua.includes('Mac')) return 'mac';
  if (ua.includes('Win')) return 'windows';
  return 'linux';
}

// ── Step illustrations ──────────────────────────────────────────────────────

function Step1Illustration({ os }: { os: OS }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Browser download bar */}
      <div className="rounded-xl overflow-hidden border border-[#2a2a4a] shadow-lg">
        {/* Address bar */}
        <div className="bg-[#1a1a32] px-4 py-2 flex items-center gap-3 border-b border-[#2a2a4a]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 bg-[#0d0d22] rounded-md px-3 py-1 text-[#6060a0] text-xs font-mono">victor-web.replit.app</div>
        </div>
        {/* Download bar at bottom */}
        <div className="bg-[#13132b] px-4 py-3 flex items-center justify-between border-t border-[#2a2a4a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#6d5ffa]/20 border border-[#6d5ffa]/40 rounded flex items-center justify-center text-[#a78bfa] text-xs">zip</div>
            <div>
              <p className="text-white text-xs font-medium">victor-extension.zip</p>
              <p className="text-[#6060a0] text-xs">Done — 1.4 MB</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Highlighted: open folder / show in finder */}
            <motion.div
              animate={{ boxShadow: ['0 0 0 0 rgba(109,95,250,0)', '0 0 0 4px rgba(109,95,250,0.4)', '0 0 0 0 rgba(109,95,250,0)'] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="bg-[#6d5ffa] text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer font-medium"
            >
              {os === 'mac' ? 'Show in Finder' : 'Show in Explorer'}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Arrow + folder view */}
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center pt-1">
          <div className="w-px h-4 bg-[#6d5ffa]/40" />
          <div className="text-[#6d5ffa] text-sm">↓</div>
        </div>
        <div className="flex-1 bg-[#0d0d22] border border-[#2a2a4a] rounded-xl p-3 flex items-center gap-3">
          <div className="text-2xl">📁</div>
          <div>
            <p className="text-white text-xs font-medium">victor-extension</p>
            <p className="text-[#6060a0] text-xs">Unzip, then open this folder</p>
          </div>
        </div>
      </div>

      <p className="text-[#6060a0] text-xs leading-relaxed">
        {os === 'mac'
          ? 'Double-click the .zip to unzip it. A folder called victor-extension will appear.'
          : 'Right-click the .zip → Extract All. You\'ll get a folder called victor-extension.'}
      </p>
    </div>
  );
}

function Step2Illustration() {
  return (
    <div className="flex flex-col gap-3">
      {/* Chrome extensions page mock */}
      <div className="rounded-xl overflow-hidden border border-[#2a2a4a] shadow-lg">
        <div className="bg-[#1a1a32] px-4 py-2 flex items-center gap-3 border-b border-[#2a2a4a]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 bg-[#0d0d22] rounded-md px-3 py-1 text-[#a78bfa] text-xs font-mono">chrome://extensions</div>
        </div>
        <div className="bg-[#13132b] p-4 flex flex-col gap-4">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <p className="text-white text-sm font-semibold">Extensions</p>
            {/* Developer mode toggle — highlighted */}
            <motion.div
              animate={{ boxShadow: ['0 0 0 0 rgba(109,95,250,0)', '0 0 0 4px rgba(109,95,250,0.5)', '0 0 0 0 rgba(109,95,250,0)'] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: 0 }}
              className="flex items-center gap-2 bg-[#1e1e40] border border-[#6d5ffa]/60 rounded-full px-3 py-1.5"
            >
              <p className="text-[#a78bfa] text-xs font-medium">Developer mode</p>
              {/* Toggle on */}
              <div className="w-8 h-4 bg-[#6d5ffa] rounded-full relative">
                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
              </div>
            </motion.div>
          </div>
          {/* Action buttons */}
          <div className="flex gap-2">
            {/* Load unpacked — highlighted */}
            <motion.div
              animate={{ boxShadow: ['0 0 0 0 rgba(109,95,250,0)', '0 0 0 4px rgba(109,95,250,0.5)', '0 0 0 0 rgba(109,95,250,0)'] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: 0.6 }}
              className="bg-[#6d5ffa] text-white text-xs px-4 py-2 rounded-lg font-medium cursor-pointer"
            >
              Load unpacked
            </motion.div>
            <div className="bg-[#1e1e40] text-[#6060a0] text-xs px-4 py-2 rounded-lg">Pack extension</div>
            <div className="bg-[#1e1e40] text-[#6060a0] text-xs px-4 py-2 rounded-lg">Update</div>
          </div>
        </div>
      </div>

      <p className="text-[#6060a0] text-xs leading-relaxed">
        Type <span className="font-mono text-[#a78bfa]">chrome://extensions</span> in your address bar. Turn on <strong className="text-white">Developer mode</strong> (top right), then click <strong className="text-white">Load unpacked</strong>.
      </p>
    </div>
  );
}

function Step3Illustration() {
  return (
    <div className="flex flex-col gap-3">
      {/* Folder picker mock */}
      <div className="rounded-xl overflow-hidden border border-[#2a2a4a] shadow-lg">
        <div className="bg-[#1a1a32] px-4 py-2.5 flex items-center justify-between border-b border-[#2a2a4a]">
          <p className="text-white text-xs font-medium">Select Extension Directory</p>
          <div className="text-[#6060a0] text-xs">×</div>
        </div>
        <div className="bg-[#0d0d22] p-3 flex flex-col gap-1">
          {['Documents', 'Downloads', 'Desktop'].map((folder, i) => (
            <div key={folder} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${i === 1 ? 'bg-[#1a1a38]' : ''}`}>
              <span className="text-lg">{i === 0 ? '📄' : i === 1 ? '⬇️' : '🖥️'}</span>
              <span className={`text-xs ${i === 1 ? 'text-white' : 'text-[#6060a0]'}`}>{folder}</span>
              {i === 1 && <span className="text-[#6060a0] text-xs ml-auto">▶</span>}
            </div>
          ))}
          {/* The victor-extension folder — highlighted */}
          <motion.div
            animate={{ boxShadow: ['0 0 0 0 rgba(109,95,250,0)', '0 0 0 3px rgba(109,95,250,0.5)', '0 0 0 0 rgba(109,95,250,0)'] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.4 }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#6d5ffa]/20 border border-[#6d5ffa]/50"
          >
            <span className="text-lg">📁</span>
            <span className="text-white text-xs font-medium">victor-extension</span>
            <span className="ml-auto text-[#a78bfa] text-xs font-semibold">Select Folder</span>
          </motion.div>
        </div>
      </div>

      <p className="text-[#6060a0] text-xs leading-relaxed">
        Navigate to your <strong className="text-white">Downloads</strong> folder, select the <strong className="text-white">victor-extension</strong> folder (not the zip), and click <strong className="text-white">Select Folder</strong>.
      </p>

      {/* Done state */}
      <div className="bg-[#0d2218] border border-[#28c840]/30 rounded-xl p-3 flex items-center gap-3">
        <span className="text-xl">✅</span>
        <div>
          <p className="text-[#28c840] text-xs font-semibold">Victor is installed</p>
          <p className="text-[#6060a0] text-xs">He'll appear on every page from now on.</p>
        </div>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

const STEPS = [
  {
    num: '1',
    title: 'Download & unzip',
    short: 'Click "Download for Chrome" above',
  },
  {
    num: '2',
    title: 'Open chrome://extensions',
    short: 'Turn on Developer mode, click Load unpacked',
  },
  {
    num: '3',
    title: 'Select the folder',
    short: 'Pick the victor-extension folder — done',
  },
];

export function InstallGuide() {
  const [os, setOS] = useState<OS>('mac');
  const [active, setActive] = useState(0);

  useEffect(() => {
    setOS(detectOS());
  }, []);

  const illustrations = [
    <Step1Illustration key="1" os={os} />,
    <Step2Illustration key="2" />,
    <Step3Illustration key="3" />,
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* OS pill */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#6060a0]">Instructions for</span>
        <div className="flex gap-1">
          {(['mac', 'windows', 'linux'] as OS[]).map((o) => (
            <button
              key={o}
              onClick={() => setOS(o)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                os === o
                  ? 'border-[#6d5ffa] bg-[#6d5ffa]/20 text-[#a78bfa]'
                  : 'border-[#2a2a4a] text-[#6060a0] hover:border-[#6d5ffa]/50'
              }`}
            >
              {o === 'mac' ? '🍎 Mac' : o === 'windows' ? '🪟 Windows' : '🐧 Linux'}
            </button>
          ))}
        </div>
      </div>

      {/* Step list */}
      <div className="flex flex-col gap-2">
        {STEPS.map((step, i) => {
          const isActive = active === i;
          const isDone = active > i;
          return (
            <div key={i} className="flex flex-col">
              <button
                onClick={() => setActive(i)}
                className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-300 ${
                  isActive
                    ? 'bg-[#6d5ffa]/10 border-[#6d5ffa]/50'
                    : isDone
                    ? 'bg-[#0d2218]/60 border-[#28c840]/20'
                    : 'bg-[#0d0d22] border-[#2a2a4a] hover:border-[#2a2a4a]'
                }`}
              >
                {/* Number / checkmark */}
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 transition-colors ${
                    isActive
                      ? 'bg-[#6d5ffa] text-white'
                      : isDone
                      ? 'bg-[#28c840]/20 text-[#28c840] border border-[#28c840]/40'
                      : 'bg-[#1a1a38] text-[#6060a0] border border-[#2a2a4a]'
                  }`}
                >
                  {isDone ? '✓' : step.num}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isActive ? 'text-white' : isDone ? 'text-[#6060a0]' : 'text-[#c0c0e0]'}`}>
                    {step.title}
                  </p>
                  {!isActive && (
                    <p className="text-xs text-[#6060a0] mt-0.5">{step.short}</p>
                  )}
                </div>
                {/* Chevron */}
                <span className={`text-[#6060a0] text-xs transition-transform ${isActive ? 'rotate-90' : ''}`}>▶</span>
              </button>

              {/* Expanded illustration */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 pb-2 px-1">
                      {illustrations[i]}
                    </div>
                    {/* Next button */}
                    {i < STEPS.length - 1 && (
                      <button
                        onClick={() => setActive(i + 1)}
                        className="ml-11 mb-3 text-xs text-[#6d5ffa] hover:text-[#a78bfa] transition-colors font-medium flex items-center gap-1"
                      >
                        Next step →
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
