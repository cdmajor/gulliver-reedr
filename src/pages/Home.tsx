import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { InstallModal, detectBrowser } from '@/components/InstallGuide';
import heroImage from '@/assets/hero-notebook.png';

type Browser = 'chrome' | 'edge' | 'firefox';

const BROWSER_LABELS: Record<Browser, { icon: string; name: string; cta: string }> = {
  chrome: { icon: '🟡', name: 'Chrome', cta: 'Download for Chrome' },
  edge:   { icon: '🔵', name: 'Edge',   cta: 'Download for Edge' },
  firefox:{ icon: '🦊', name: 'Firefox',cta: 'Download for Firefox' },
};

function extensionDownloadUrl(browser: Browser) {
  return (
    window.location.origin +
    '/api/victor/extension-download?origin=' +
    encodeURIComponent(window.location.origin) +
    '&browser=' +
    browser
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] as any } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 }
  }
};

const features = [
  {
    icon: "📄",
    title: "Reads the page for you",
    desc: "The moment you land somewhere, Victor has already read it. No copy-pasting, no explaining the context. Just ask."
  },
  {
    icon: "🌍",
    title: "Any language",
    desc: "Victor reads pages in any language and replies in yours. Japanese article, French news, Spanish product page — he's got it."
  },
  {
    icon: "💬",
    title: "Actually adds something",
    desc: "He doesn't just recite what's on the page. He finds the angle, spots the gap in the argument, pulls out the part that actually matters."
  },
  {
    icon: "🔄",
    title: "Follows you as you browse",
    desc: "Navigate to a new page and Victor resets automatically. He always knows where you are — even on single-page apps."
  },
  {
    icon: "⚡",
    title: "No account needed",
    desc: "Download, install, done. Victor shows up on the next page you open. No sign-up, no API key, no configuration."
  },
  {
    icon: "🔒",
    title: "Stays in your browser",
    desc: "Victor runs as a local extension. Your browsing is yours — he reads the page, you ask a question, he answers. That's the whole loop."
  }
];

export default function Home() {
  const [installOpen, setInstallOpen] = useState(false);
  const [browser, setBrowser] = useState<Browser>('chrome');

  useEffect(() => {
    setBrowser(detectBrowser());
  }, []);

  function handleDownload(b: Browser = browser) {
    const a = document.createElement('a');
    a.href = extensionDownloadUrl(b);
    a.download = 'victor-extension.zip';
    a.click();
    setBrowser(b);
    setInstallOpen(true);
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-[100dvh] flex items-center pt-24 pb-12 overflow-hidden px-6 md:px-12">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/8 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            className="flex flex-col gap-8 max-w-2xl relative z-10"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp} className="flex items-center gap-3">
              <span className="w-8 h-[1px] bg-accent"></span>
              <span className="text-accent tracking-widest uppercase text-xs font-semibold">Meet Victor</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl md:text-7xl lg:text-8xl font-serif leading-[1.1] tracking-tight text-foreground"
            >
              He's read it<br />
              <span className="italic text-accent">already.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-muted-foreground leading-relaxed font-sans max-w-lg"
            >
              Victor lives in your browser as a floating button. Every page you visit, he reads it before you say a word — then he's ready to discuss, explain, or dig into it with you.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 pt-4">
              <a
                href="#download"
                className="bg-primary text-primary-foreground px-8 py-4 flex items-center justify-center gap-3 rounded-full hover:bg-primary/80 transition-colors duration-300 w-full sm:w-auto font-medium"
              >
                <span>{BROWSER_LABELS[browser].icon}</span>
                <span className="tracking-wide">{BROWSER_LABELS[browser].cta}</span>
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
            className="relative flex items-center justify-center h-[60vh] lg:h-[80vh] w-full"
          >
            <div className="absolute inset-0 rounded-2xl bg-secondary border border-border" />
            <img
              src={heroImage}
              alt="Victor"
              className="relative z-10 w-2/3 md:w-1/2 drop-shadow-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* The idea */}
      <section className="py-32 bg-secondary/60 border-y border-border px-6 md:px-12 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-10">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-3xl md:text-5xl font-serif leading-tight text-foreground"
          >
            The web has a lot to say.<br className="hidden md:block" />
            <span className="italic text-accent">Victor helps you hear it.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl font-sans"
          >
            Most AI assistants make you paste in the content and explain the context. Victor skips all that. He's already read the page — the article, the product, the thread, the doc — and he's waiting for you to ask.
          </motion.p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-serif mb-6 text-foreground">How it works.</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Install once. Victor handles the rest on every page.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: "Step one",
                title: "Install the extension.",
                desc: "Download the zip, load it into your browser, and you're done. No account, no API key, no settings to configure. Takes under a minute."
              },
              {
                num: "Step two",
                title: "Visit any page.",
                desc: "Victor reads it quietly in the background — articles, product pages, docs, threads, anything. He's ready before you've finished the first paragraph."
              },
              {
                num: "Step three",
                title: "Click V and ask.",
                desc: "The floating V button opens a chat. Ask him to summarize, explain, push back, find the key point, or compare it to something else. He already knows the content."
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: i * 0.15 }}
                className="flex flex-col gap-5 p-8 bg-card border border-border rounded-xl hover:border-accent/40 transition-colors duration-300"
              >
                <span className="text-accent font-sans text-xs font-semibold tracking-widest uppercase">{item.num}</span>
                <h3 className="font-serif text-2xl text-foreground">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-24 px-6 md:px-12 bg-secondary/40 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-serif mb-6 text-foreground">What Victor brings to every page.</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Not a search box. Not a chatbot. A second set of eyes that's already read the room.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
                className="flex flex-col gap-4 p-8 bg-card border border-border rounded-xl hover:border-accent/30 transition-colors duration-300"
              >
                <span className="text-3xl">{f.icon}</span>
                <h3 className="font-serif text-xl text-foreground">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-40 px-6 md:px-12 text-center max-w-4xl mx-auto">
        <motion.blockquote
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1 }}
        >
          <p className="text-3xl md:text-5xl font-serif italic leading-tight text-foreground/60 mb-10">
            "I opened a Japanese research paper and just asked Victor what it said. He explained the whole thing in plain English in about ten seconds."
          </p>
          <footer className="text-sm tracking-widest uppercase text-accent/70 font-semibold">— Early user</footer>
        </motion.blockquote>
      </section>

      {/* What makes Victor different */}
      <section className="py-24 px-6 md:px-12 border-t border-border">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            {
              title: "He reads first.",
              desc: "Victor processes the page the moment you land. By the time you open the chat, he already knows the content — you don't have to explain anything."
            },
            {
              title: "Any page, any language.",
              desc: "Articles, docs, threads, product pages, PDFs rendered as web pages. In English, French, Japanese, Arabic — Victor reads it and replies in whatever language you write in."
            },
            {
              title: "No account. No setup.",
              desc: "Download the zip, load it in your browser, and Victor appears on the next page you visit. Nothing to configure, no sign-in, no subscription."
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className="flex flex-col gap-4"
            >
              <div className="w-8 h-[2px] bg-accent"></div>
              <h4 className="font-serif text-xl text-foreground">{item.title}</h4>
              <p className="text-muted-foreground leading-relaxed text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Browser Extension */}
      <section className="py-24 px-6 md:px-12 border-t border-border bg-secondary/40">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: copy + download + steps */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9 }}
              className="flex flex-col gap-8"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-[1px] bg-accent"></span>
                  <span className="text-accent tracking-widest uppercase text-xs font-semibold">Browser Extension</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-serif leading-tight text-foreground">
                  Victor rides along<br />
                  <span className="italic text-accent">everywhere you go.</span>
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  A floating chat bubble on every page you visit. He reads it before you say a word.
                </p>
              </div>

              {/* Browser picker */}
              <div className="flex gap-2 flex-wrap">
                {(['chrome', 'edge', 'firefox'] as Browser[]).map((b) => (
                  <button
                    key={b}
                    onClick={() => setBrowser(b)}
                    className={`text-sm px-4 py-2 rounded-full border transition-colors ${
                      browser === b
                        ? 'border-accent bg-accent/10 text-accent font-medium'
                        : 'border-border text-muted-foreground hover:border-accent/40'
                    }`}
                  >
                    {BROWSER_LABELS[b].icon} {BROWSER_LABELS[b].name}
                  </button>
                ))}
              </div>

              {/* Download button */}
              <button
                onClick={() => handleDownload(browser)}
                className="inline-flex items-center justify-center gap-3 bg-primary text-primary-foreground px-8 py-5 rounded-2xl hover:bg-primary/80 transition-colors duration-300 font-medium text-lg w-full text-center"
              >
                <span className="text-xl">⬇</span>
                <span>{BROWSER_LABELS[browser].cta}</span>
                <span className="text-sm opacity-60 font-normal">— free</span>
              </button>

              <p className="text-xs text-muted-foreground/50 text-center">
                Install guide opens right after download
              </p>
            </motion.div>

            {/* Right: mock chat preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <div className="bg-[#0d0d22] border border-[#2a2a4a] rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex items-center gap-3 px-4 py-3 bg-[#13132b] border-b border-[#2a2a4a]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6d5ffa] to-[#a78bfa] flex items-center justify-center text-white text-sm font-bold">V</div>
                  <div>
                    <div className="text-white text-sm font-semibold">Victor</div>
                    <div className="text-[#6060a0] text-xs">theverge.com</div>
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6d5ffa] to-[#a78bfa] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">V</div>
                    <div className="bg-[#1a1a38] text-[#e0e0f8] text-sm rounded-2xl rounded-tl px-3 py-2.5 max-w-[85%] leading-relaxed">
                      This piece is arguing AI companions will reshape how people process news. The most interesting point is buried in paragraph four — want me to pull it out?
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <div className="bg-[#6d5ffa] text-white text-sm rounded-2xl rounded-tr px-3 py-2.5 max-w-[75%] leading-relaxed">
                      Yes, and what's the counterargument?
                    </div>
                    <div className="w-6 h-6 rounded-full bg-[#2a2a4a] flex items-center justify-center text-[#a0a0c0] text-xs flex-shrink-0 mt-0.5">U</div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6d5ffa] to-[#a78bfa] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">V</div>
                    <div className="bg-[#1a1a38] text-[#e0e0f8] text-sm rounded-2xl rounded-tl px-3 py-2.5 max-w-[85%] leading-relaxed">
                      The counterargument — which this piece doesn't fully address — is that personalized AI filters could deepen news bubbles rather than break them…
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4 flex gap-2">
                  <div className="flex-1 bg-[#09091a] border border-[#2a2a4a] rounded-xl px-3 py-2 text-[#404060] text-sm">Ask Victor anything about this page…</div>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6d5ffa] to-[#a78bfa] flex items-center justify-center">
                    <span className="text-white text-xs">→</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="download" className="py-32 px-6 md:px-12 relative overflow-hidden border-t border-border">
        <div className="absolute inset-0 bg-secondary/40 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[300px] bg-accent/6 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center gap-10">
          <h2 className="text-5xl md:text-7xl font-serif leading-tight text-foreground">
            Meet Victor on<br /><span className="italic text-accent">your next page.</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
            Install takes less than a minute. He'll be ready the moment you load a page.
          </p>

          {/* Browser picker */}
          <div className="flex gap-3 flex-wrap justify-center">
            {(['chrome', 'edge', 'firefox'] as Browser[]).map((b) => (
              <button
                key={b}
                onClick={() => setBrowser(b)}
                className={`text-sm px-4 py-2 rounded-full border transition-colors ${
                  browser === b
                    ? 'border-accent bg-accent/10 text-accent font-medium'
                    : 'border-border text-muted-foreground hover:border-accent/40'
                }`}
              >
                {BROWSER_LABELS[b].icon} {BROWSER_LABELS[b].name}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleDownload(browser)}
            className="mt-2 bg-primary text-primary-foreground px-10 py-5 inline-flex items-center justify-center gap-3 rounded-full hover:bg-primary/80 transition-colors duration-300 w-full sm:w-auto font-medium text-lg"
          >
            <span>⬇</span>
            <span>{BROWSER_LABELS[browser].cta}</span>
            <span className="text-sm opacity-60 font-normal">— free</span>
          </button>

          <p className="text-xs text-muted-foreground/60 max-w-sm leading-relaxed">
            Free to install. Works on Chrome, Edge, and Firefox.{' '}
            By downloading you agree to our{' '}
            <a href="/terms" className="underline hover:text-muted-foreground transition-colors">Terms of Use</a>
            {' '}and{' '}
            <a href="/privacy" className="underline hover:text-muted-foreground transition-colors">Privacy Policy</a>.
          </p>
        </div>
      </section>

      {installOpen && <InstallModal onClose={() => setInstallOpen(false)} initialBrowser={browser} />}
    </Layout>
  );
}
