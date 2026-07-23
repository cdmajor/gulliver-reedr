import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { InstallModal, detectBrowser } from '@/components/InstallGuide';
import DemoVideo from '@/pages/DemoVideo';
import heroImage from '@/assets/hero-browser.jpg';

type Browser = 'chrome' | 'edge' | 'firefox' | 'safari' | 'brave' | 'opera';

const BROWSER_LABELS: Record<Browser, { icon: string; name: string; cta: string }> = {
  chrome:  { icon: '🟡', name: 'Chrome',  cta: 'Download for Chrome' },
  edge:    { icon: '🔵', name: 'Edge',    cta: 'Download for Edge' },
  firefox: { icon: '🦊', name: 'Firefox', cta: 'Download for Firefox' },
  safari:  { icon: '🧭', name: 'Safari',  cta: 'Download for Safari' },
  brave:   { icon: '🦁', name: 'Brave',   cta: 'Download for Brave' },
  opera:   { icon: '🔴', name: 'Opera',   cta: 'Download for Opera' },
};

function extensionDownloadUrl(browser: Browser) {
  return (
    window.location.origin +
    '/api/reedr/extension-download?origin=' +
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
    desc: "The moment you land somewhere, Reedr has already read it. No copy-pasting, no explaining the context. Just ask."
  },
  {
    icon: "🌍",
    title: "Any language",
    desc: "Reedr reads pages in any language and replies in yours. Japanese article, French news, Spanish product page — he's got it."
  },
  {
    icon: "💬",
    title: "Actually adds something",
    desc: "He doesn't just recite what's on the page. He finds the angle, spots the gap in the argument, pulls out the part that actually matters."
  },
  {
    icon: "🔄",
    title: "Follows you as you browse",
    desc: "Navigate to a new page and Reedr resets automatically. He always knows where you are — even on single-page apps."
  },
  {
    icon: "🕓",
    title: "Conversation history",
    desc: "Every chat is saved locally in your browser. Flip to the History tab to browse past conversations by page, re-read them in full, or clear everything with one tap."
  },
  {
    icon: "🧩",
    title: "Chrome, Edge, and Firefox",
    desc: "One download works across all major browsers. Reedr runs as a local extension — nothing leaves your device, no account required."
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
    a.download = 'reedr-extension.zip';
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
              <span className="text-accent tracking-widest uppercase text-xs font-semibold">Meet Reedr</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl md:text-7xl lg:text-8xl font-serif leading-[1.1] tracking-tight text-foreground"
            >
              Your browser,<br />
              <span className="italic text-accent">but it thinks.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-muted-foreground leading-relaxed font-sans max-w-lg"
            >
              Reedr lives in your browser as a floating button. Every page you visit, he reads it before you say a word — then he's ready to discuss, explain, or dig into it with you.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={() => handleDownload(browser)}
                className="bg-primary text-primary-foreground px-8 py-4 flex items-center justify-center gap-3 rounded-full hover:bg-primary/80 transition-colors duration-300 w-full sm:w-auto font-medium"
              >
                <span>{BROWSER_LABELS[browser].icon}</span>
                <span className="tracking-wide">{BROWSER_LABELS[browser].cta}</span>
              </button>
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
              alt="Reedr"
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
            <span className="italic text-accent">Reedr helps you hear it.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl font-sans"
          >
            Most AI assistants make you paste in the content and explain the context. Reedr skips all that. He's already read the page — the article, the product, the thread, the doc — and he's waiting for you to ask.
          </motion.p>
        </div>
      </section>

      {/* Demo video */}
      <section className="py-24 px-6 md:px-12 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-5xl font-serif mb-4 text-foreground">See it in action.</h2>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              From page load to answered question in three clicks.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1, delay: 0.2 }}
            className="w-full rounded-2xl overflow-hidden border border-border shadow-2xl"
            style={{ aspectRatio: '16/9' }}
          >
            <div className="w-full h-full" style={{ height: '100%' }}>
              <DemoVideo />
            </div>
          </motion.div>
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
              Install once. Reedr handles the rest on every page.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: "Step one",
                title: "Install the extension.",
                desc: "Download the zip and load it into Chrome, Edge, Firefox, Brave, Opera, or Safari. Optional account unlocks Reedr Plus memory. Takes under a minute."
              },
              {
                num: "Step two",
                title: "Visit any page.",
                desc: "Reedr reads it quietly in the background — articles, product pages, docs, threads, anything. He's ready before you've finished the first paragraph."
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
            <h2 className="text-4xl md:text-5xl font-serif mb-6 text-foreground">What Reedr brings to every page.</h2>
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
            "I opened a Japanese research paper and just asked Reedr what it said. He explained the whole thing in plain English in about ten seconds."
          </p>
          <footer className="text-sm tracking-widest uppercase text-accent/70 font-semibold">— Early user</footer>
        </motion.blockquote>
      </section>

      {/* What makes Reedr different */}
      <section className="py-24 px-6 md:px-12 border-t border-border">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            {
              title: "He reads first.",
              desc: "Reedr processes the page the moment you land. By the time you open the chat, he already knows the content — you don't have to explain anything."
            },
            {
              title: "Your history, your device.",
              desc: "Every conversation is saved locally in your browser — never sent to a server, never used for training. Browse past chats by page or clear everything anytime."
            },
            {
              title: "Chrome, Edge, or Firefox.",
              desc: "One zip works across all major browsers. Download, load it in, and Reedr appears on the next page you visit. No sign-in, no subscription."
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
                  Reedr rides along<br />
                  <span className="italic text-accent">everywhere you go.</span>
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  A floating chat bubble on every page you visit. He reads it before you say a word.
                </p>
              </div>

              {/* Browser picker */}
              <div className="flex gap-2 flex-wrap">
                {(['chrome', 'edge', 'firefox', 'safari', 'brave', 'opera'] as Browser[]).map((b) => (
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
                    <div className="text-white text-sm font-semibold">Reedr</div>
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
                  <div className="flex-1 bg-[#09091a] border border-[#2a2a4a] rounded-xl px-3 py-2 text-[#404060] text-sm">Ask Reedr anything about this page…</div>
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
      
      {/* Memory + Plus */}
      <section className="py-24 border-t border-[#1a1a38]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-serif mb-6 text-foreground">Memory that stays organized.</h2>
            <p className="text-[#9090b8] text-lg max-w-2xl mx-auto">
              Reedr saves chat threads and page summaries inside the extension — grouped by site, ready to reopen anytime.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-[#2a2a4a] bg-[#13132b] p-8">
              <p className="text-xs uppercase tracking-widest text-[#8080a0] mb-2">Free</p>
              <h3 className="text-2xl font-semibold text-foreground mb-2">Get started</h3>
              <p className="text-[#9090b8] text-sm mb-6">$0 — included with the extension</p>
              <ul className="space-y-3 text-sm text-[#c0c0e8]">
                <li>25 saved chat threads</li>
                <li>10 page summaries</li>
                <li>40 messages kept per thread</li>
                <li>Library organized by site</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-[#6d5ffa] bg-[#13132b] p-8 shadow-[0_0_0_1px_rgba(109,95,250,0.25)]">
              <p className="text-xs uppercase tracking-widest text-[#a78bfa] mb-2">Plus</p>
              <h3 className="text-2xl font-semibold text-foreground mb-2">More memory</h3>
              <p className="text-[#9090b8] text-sm mb-6">$6/mo or $60/year</p>
              <ul className="space-y-3 text-sm text-[#c0c0e8]">
                <li>1,000 saved chat threads</li>
                <li>500 page summaries</li>
                <li>200 messages kept per thread</li>
                <li>Upgrade from Reedr Settings</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

<section id="download" className="py-32 px-6 md:px-12 relative overflow-hidden border-t border-border">
        <div className="absolute inset-0 bg-secondary/40 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[300px] bg-accent/6 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center gap-10">
          <h2 className="text-5xl md:text-7xl font-serif leading-tight text-foreground">
            Meet Reedr on<br /><span className="italic text-accent">your next page.</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
            Install takes less than a minute. He'll be ready the moment you load a page.
          </p>

          {/* Browser picker */}
          <div className="flex gap-3 flex-wrap justify-center">
            {(['chrome', 'edge', 'firefox', 'safari', 'brave', 'opera'] as Browser[]).map((b) => (
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
