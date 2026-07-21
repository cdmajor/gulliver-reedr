import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
`;

const SCENE_DURATIONS = [
  3500, // 0: Browser article page
  2000, // 1: V button appears
  2500, // 2: Chat panel slides open
  4500, // 3: Victor greets
  3000, // 4: User types
  5000, // 5: Victor streams reply
  3000, // 6: Copy button & click
  5000, // 7: Logo & tagline
];

const TypewriterChar = ({ text, play, fast = false }: { text: string, play: boolean, fast?: boolean }) => {
  return (
    <span>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={play ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: i * (fast ? 0.015 : 0.03), duration: 0.01 }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
};

const Cursor = ({ x, y, clicking }: { x: string, y: string, clicking: boolean }) => (
  <motion.div
    animate={{ x, y, scale: clicking ? 0.8 : 1 }}
    transition={{ type: "spring", stiffness: 150, damping: 20 }}
    className="absolute z-[100] pointer-events-none"
    style={{ top: 0, left: 0 }}
  >
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
      <path d="M5.5 3L18.5 16L13.5 16L17 22L14.5 23L11 17L7 21V3Z" fill="white" stroke="#000" strokeWidth="1" />
    </svg>
    {clicking && (
      <motion.div 
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="absolute top-1/2 left-1/2 w-6 h-6 bg-white/40 rounded-full -translate-x-1/2 -translate-y-1/2"
      />
    )}
  </motion.div>
);

export default function DemoVideo() {
  const [scene, setScene] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: '50vw', y: '120vh' });
  const [cursorClicking, setCursorClicking] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const advance = () => {
      setScene((s) => (s + 1) % SCENE_DURATIONS.length);
    };
    timeout = setTimeout(advance, SCENE_DURATIONS[scene]);
    return () => clearTimeout(timeout);
  }, [scene]);

  useEffect(() => {
    if (scene === 0) {
      setCursorPos({ x: '50vw', y: '120vh' });
      setCursorClicking(false);
    } else if (scene === 1) {
      setTimeout(() => {
        setCursorPos({ x: 'calc(90vw - 32px)', y: 'calc(90vh - 32px)' });
      }, 500);
    } else if (scene === 2) {
      setCursorClicking(true);
      setTimeout(() => setCursorClicking(false), 200);
      setTimeout(() => setCursorPos({ x: '70vw', y: '70vh' }), 800);
    } else if (scene === 3) {
      // Resting
    } else if (scene === 4) {
      setCursorPos({ x: 'calc(90vw - 200px)', y: 'calc(10vh + 80vh - 50px)' });
      setTimeout(() => setCursorClicking(true), 800);
      setTimeout(() => setCursorClicking(false), 1000);
    } else if (scene === 5) {
      setCursorPos({ x: 'calc(90vw - 420px)', y: '50vh' });
    } else if (scene === 6) {
      setCursorPos({ x: 'calc(90vw - 80px)', y: 'calc(10vh + 450px)' });
      setTimeout(() => setCursorClicking(true), 800);
      setTimeout(() => setCursorClicking(false), 1000);
    } else if (scene === 7) {
      setCursorPos({ x: '50vw', y: '120vh' });
    }
  }, [scene]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0d0d22] select-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{FONTS}</style>
      <style>{`
        .font-serif { font-family: 'Playfair Display', serif; }
        .bg-gradient-accent { background: linear-gradient(135deg, #6d5ffa, #a78bfa); }
        .text-gradient-accent { background: linear-gradient(135deg, #6d5ffa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      `}</style>

      {/* Background Ambient Orbs */}
      <motion.div
        className="absolute top-[-20vh] left-[-10vw] w-[60vw] h-[60vw] rounded-full mix-blend-screen opacity-20 bg-[#6d5ffa]"
        style={{ filter: 'blur(120px)' }}
        animate={{ x: [0, 50, 0], y: [0, -50, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-[-20vh] right-[-10vw] w-[50vw] h-[50vw] rounded-full mix-blend-screen opacity-20 bg-[#a78bfa]"
        style={{ filter: 'blur(120px)' }}
        animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />

      {/* Main Browser Window */}
      <motion.div
        className="absolute top-[10vh] left-[10vw] w-[80vw] h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex"
        initial={{ scale: 0.8, opacity: 0, y: 50, rotateX: 5 }}
        animate={{
          scale: scene === 7 ? 0.9 : 1,
          opacity: scene === 7 ? 0 : 1,
          y: scene === 7 ? -50 : 0,
          rotateX: scene === 0 ? 5 : 0
        }}
        transition={{ type: "spring", stiffness: 80, damping: 20 }}
        style={{ perspective: 1000 }}
      >
        {/* Browser Top Bar */}
        <div className="absolute top-0 left-0 w-full h-12 bg-[#f3f4f6] border-b border-gray-200 flex items-center px-4 gap-2 z-20">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          <div className="ml-4 flex-1 h-6 bg-white rounded-md mx-4 max-w-xl text-[10px] text-gray-400 flex items-center px-3 border border-gray-200 shadow-inner">
            https://techjournal.com/ai-agency
          </div>
        </div>

        {/* Article Content */}
        <div className="relative w-full h-full pt-12 bg-white overflow-hidden text-gray-800">
          <motion.div 
            className="max-w-3xl mx-auto p-12 pt-20"
            animate={{ y: scene >= 1 ? -120 : 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          >
            <div className="font-serif text-5xl font-bold mb-6 text-gray-900 leading-tight">
              The Shift from Generative to Agentic Systems
            </div>
            <div className="flex items-center gap-4 mb-10 text-sm text-gray-400 font-medium">
              <div>By Dr. Elena Rostova</div>
              <div>•</div>
              <div>Published Oct 14, 2024</div>
            </div>
            <div className="space-y-8 text-xl text-gray-600 leading-relaxed font-serif">
              <p>For the past five years, the artificial intelligence industry has been overwhelmingly focused on generation. Creating text, images, and video from prompts has unlocked immense creative potential.</p>
              <p>However, we are now entering a new paradigm: agency. Unlike generative models that simply respond to a prompt and wait, agentic systems are given a goal, a set of tools, and the autonomy to plan and execute a series of actions over time.</p>
              <p>This article argues that the true economic value of AI lies not in writing poetry or rendering images, but in completing multi-step workflows. We will explore the architecture of autonomous agents and the counterarguments against their immediate feasibility.</p>
              <p>Critics point out that compounding errors in reasoning could lead to catastrophic failure in unmonitored systems. The primary counterargument is that true agency requires robust self-correction loops which are mathematically difficult to guarantee...</p>
            </div>
          </motion.div>
        </div>

        {/* Victor Chat Panel */}
        <motion.div
          className="absolute top-12 right-0 bottom-0 w-[400px] bg-[#fdfdfd] border-l border-gray-200 shadow-[-10px_0_30px_rgba(0,0,0,0.05)] z-30 flex flex-col"
          initial={{ x: "100%" }}
          animate={{ x: scene >= 2 && scene < 7 ? "0%" : "100%" }}
          transition={{ type: "spring", stiffness: 120, damping: 22 }}
        >
          {/* Panel Header */}
          <div className="h-16 border-b border-gray-200 flex items-center px-6 justify-between bg-white shadow-sm z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center text-white font-bold text-sm shadow-md">V</div>
              <span className="font-bold text-gray-800 text-lg">Victor</span>
            </div>
            <div className="w-5 h-5 text-gray-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </div>
          </div>
          
          {/* Chat History */}
          <div className="flex-1 overflow-hidden p-6 flex flex-col gap-6 pt-8">
            <AnimatePresence>
              {scene >= 3 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex gap-3 max-w-[90%]"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-accent flex-shrink-0 mt-1 flex items-center justify-center text-[10px] text-white font-bold shadow-sm">V</div>
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm text-[15px] text-gray-700 leading-relaxed">
                    <TypewriterChar text="This article argues that AI will shift from generative tools to autonomous agentic systems, focusing on the economic value of multi-step workflows." play={scene >= 3} />
                  </div>
                </motion.div>
              )}
              
              {scene >= 4 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex gap-3 max-w-[90%] self-end"
                >
                  <div className="bg-[#0d0d22] text-white p-4 rounded-2xl rounded-tr-none shadow-md text-[15px] leading-relaxed">
                    <TypewriterChar text="What's the counterargument?" play={scene >= 4} fast />
                  </div>
                </motion.div>
              )}
              
              {scene >= 5 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex gap-3 max-w-[95%]"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-accent flex-shrink-0 mt-1 flex items-center justify-center text-[10px] text-white font-bold shadow-sm">V</div>
                  <div className="relative bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm text-[15px] text-gray-700 leading-relaxed">
                    <TypewriterChar text="The primary counterargument highlighted is that compounding errors in reasoning could lead to catastrophic failures. True agency requires robust self-correction loops." play={scene >= 5} />
                    
                    <AnimatePresence>
                      {scene >= 6 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute -bottom-4 right-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-md p-1.5 shadow-sm flex items-center justify-center"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                          {scene === 6 && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10, scale: 0.8 }}
                              animate={{ opacity: [0, 1, 1, 0], y: [10, -5, -5, -15], scale: [0.8, 1, 1, 0.9] }}
                              transition={{ times: [0, 0.15, 0.85, 1], duration: 2.5 }}
                              className="absolute -top-8 bg-[#0d0d22] text-white text-[11px] py-1 px-2.5 rounded shadow-lg font-bold"
                            >
                              Copied!
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-white border-t border-gray-100 relative z-20">
            <div className={`w-full h-14 bg-[#f8f9fa] border rounded-xl flex items-center px-4 transition-colors duration-300 ${scene === 4 ? 'border-[#6d5ffa] shadow-[0_0_0_2px_rgba(109,95,250,0.1)]' : 'border-gray-200'}`}>
              <div className="text-gray-400 text-[15px]">
                {scene < 4 ? "Ask Victor about this page..." : ""}
              </div>
            </div>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-[#0d0d22] flex items-center justify-center shadow-md">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating V Button */}
      <motion.div
        className="absolute z-40 flex items-center justify-center shadow-[0_15px_40px_rgba(109,95,250,0.4)]"
        style={{ right: 'calc(10vw - 32px)', bottom: 'calc(10vh - 32px)' }}
        initial={{ scale: 0, opacity: 0, width: 64, height: 64, borderRadius: 32 }}
        animate={{
          scale: scene >= 1 && scene < 7 ? 1 : 0,
          opacity: scene >= 1 && scene < 7 ? 1 : 0,
          rotate: scene >= 2 ? 180 : 0,
          background: scene >= 2 ? '#0d0d22' : 'linear-gradient(135deg, #6d5ffa, #a78bfa)'
        }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <motion.div 
          className="text-white font-bold text-3xl"
          animate={{ opacity: scene >= 2 ? 0 : 1, rotate: scene >= 2 ? -180 : 0 }}
        >
          V
        </motion.div>
        <motion.div 
          className="absolute inset-0 flex items-center justify-center text-white"
          initial={{ opacity: 0, rotate: -90 }}
          animate={{ opacity: scene >= 2 ? 1 : 0, rotate: scene >= 2 ? 0 : -90 }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </motion.div>
      </motion.div>

      {/* Scene 7: Outro */}
      <AnimatePresence>
        {scene === 7 && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <motion.div 
              className="w-28 h-28 rounded-3xl bg-gradient-accent flex items-center justify-center shadow-[0_20px_60px_rgba(109,95,250,0.5)] mb-10"
              initial={{ scale: 0, rotate: -180, borderRadius: 100 }}
              animate={{ scale: 1, rotate: 0, borderRadius: 28 }}
              transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
            >
              <span className="text-white font-bold text-6xl">V</span>
            </motion.div>
            <motion.div
              className="font-serif text-white text-6xl tracking-tight mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 1 }}
            >
              He's read it already.
            </motion.div>
            <motion.div
              className="text-[#a78bfa] text-xl font-medium tracking-wide uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 1 }}
            >
              victor.ai
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Cursor x={cursorPos.x} y={cursorPos.y} clicking={cursorClicking} />
    </div>
  );
}