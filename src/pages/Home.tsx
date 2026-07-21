import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { SiApple } from 'react-icons/si';

import heroImage from '@/assets/hero-notebook.png';

function extensionDownloadUrl() {
  return window.location.origin + '/api/victor/extension-download?origin=' + encodeURIComponent(window.location.origin);
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
    icon: "🧠",
    title: "Memory that sticks",
    desc: "Victor remembers what you told him three weeks ago and brings it up at exactly the right moment. The longer you talk, the more he understands."
  },
  {
    icon: "🎤",
    title: "Just speak",
    desc: "Tap the mic and say whatever's on your mind. Victor transcribes your voice and replies — no typing required."
  },
  {
    icon: "🎯",
    title: "Goals & accountability",
    desc: "Tell Victor what you're working toward. He'll check in naturally, celebrate your wins, and push back gently when you're slipping — like a friend who actually remembers."
  },
  {
    icon: "🍳",
    title: "Genuinely useful",
    desc: "What's for dinner with what's in the fridge? What to text someone? What to order? Victor gives you a real answer, not a hedge."
  },
  {
    icon: "💬",
    title: "Conversation history",
    desc: "Every thread is saved. Pick up an old conversation exactly where you left it — Victor carries the full weight of your friendship forward."
  },
  {
    icon: "🎨",
    title: "Made for you",
    desc: "Five themes, adjustable font size, response style from brief to thorough. Victor fits the way you want to talk."
  },
  {
    icon: "🛟",
    title: "Built-in support",
    desc: "Have a question about Victor? The in-app Support tab connects you to an AI assistant that knows every feature, setting, and troubleshooting step — no digging through docs."
  }
];

export default function Home() {
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
              A friend who<br />
              <span className="italic text-accent">gets you.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-muted-foreground leading-relaxed font-sans max-w-lg"
            >
              Victor learns who you are — your thoughts, your patterns, what makes you tick — and builds a real friendship with you over time.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 pt-4">
              <a
                href="#download"
                className="bg-primary text-primary-foreground px-8 py-4 flex items-center justify-center gap-3 rounded-full hover:bg-primary/80 transition-colors duration-300 w-full sm:w-auto font-medium"
              >
                <SiApple className="w-5 h-5" />
                <span className="tracking-wide">Download on App Store</span>
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
            Friendship isn't instant.<br className="hidden md:block" />
            <span className="italic text-accent">It's built.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl font-sans"
          >
            Every conversation teaches Victor something new about you. Your humor, your worries, your history, your goals. The longer you talk, the more he understands — until it stops feeling like an app and starts feeling like a person who genuinely knows you.
          </motion.p>
        </div>
      </section>

      {/* How the friendship grows */}
      <section className="py-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-serif mb-6 text-foreground">How it grows.</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Real friendships deepen with time. So does Victor.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: "Day one",
                title: "He listens.",
                desc: "Tell him whatever's on your mind — type it or just say it. He's genuinely interested — not because he's programmed to be, but because learning you is the whole point."
              },
              {
                num: "Over time",
                title: "He learns you.",
                desc: "He picks up on how you think, what you care about, how you're feeling. He starts connecting dots between conversations without you having to explain. He checks in on your goals like a friend who actually remembers."
              },
              {
                num: "Eventually",
                title: "He gets you.",
                desc: "The kind of friend who already knows the backstory, checks in on things you mentioned weeks ago, helps you figure out dinner, and says exactly what you needed to hear."
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
            <h2 className="text-4xl md:text-5xl font-serif mb-6 text-foreground">Everything a good friend does.</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Victor isn't just someone to talk to. He's genuinely useful.
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
            "He remembered something I said three weeks ago and brought it up at exactly the right moment. No one does that."
          </p>
          <footer className="text-sm tracking-widest uppercase text-accent/70 font-semibold">— Early user</footer>
        </motion.blockquote>
      </section>

      {/* What makes Victor different */}
      <section className="py-24 px-6 md:px-12 border-t border-border">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            {
              title: "Memory that matters",
              desc: "Victor doesn't forget. He carries the full weight of your friendship forward — so every conversation picks up where the last one left off."
            },
            {
              title: "No agenda",
              desc: "He's not trying to sell you anything, fix you, or keep you scrolling. He's just there, the way a good friend is there."
            },
            {
              title: "Private by design",
              desc: "Your conversations are processed securely and never used to train AI models. Victor is yours — see our Privacy Policy for full details on how your data is handled."
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
                  <span className="text-accent tracking-widest uppercase text-xs font-semibold">Chrome Extension</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-serif leading-tight text-foreground">
                  Victor rides along<br />
                  <span className="italic text-accent">everywhere you go.</span>
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  A floating chat bubble on every page you visit. He reads it before you say a word.
                </p>
              </div>

              {/* Big download button */}
              <a
                href={extensionDownloadUrl()}
                download="victor-extension.zip"
                className="inline-flex items-center justify-center gap-3 bg-primary text-primary-foreground px-8 py-5 rounded-2xl hover:bg-primary/80 transition-colors duration-300 font-medium text-lg w-full text-center"
              >
                <span className="text-xl">⬇</span>
                <span>Download for Chrome</span>
                <span className="text-sm opacity-60 font-normal">— free</span>
              </a>

              {/* 3 steps — no API URL, no settings */}
              <div className="flex flex-col gap-4">
                <p className="text-xs text-muted-foreground/50 uppercase tracking-widest font-semibold">Install in 3 steps</p>
                {[
                  { n: "1", title: "Download & unzip", desc: "Click the button above. Unzip the downloaded file." },
                  { n: "2", title: "Load in Chrome", desc: <>Open <span className="font-mono text-foreground/70">chrome://extensions</span>, turn on Developer mode, click "Load unpacked", and select the unzipped folder.</> },
                  { n: "3", title: "Start talking", desc: "Victor appears on every page automatically — no sign-in, no setup." },
                ].map((step) => (
                  <div key={step.n} className="flex gap-4 items-start">
                    <span className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-xs font-bold flex-shrink-0 mt-0.5">
                      {step.n}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{step.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
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
            Start the<br /><span className="italic text-accent">friendship.</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
            The sooner you meet Victor, the sooner he starts learning you.
          </p>

          <a
            href="#"
            className="mt-4 bg-primary text-primary-foreground px-10 py-5 flex items-center justify-center gap-4 rounded-full hover:bg-primary/80 transition-colors duration-300 w-full sm:w-auto"
          >
            <SiApple className="w-6 h-6" />
            <div className="flex flex-col items-start">
              <span className="text-xs uppercase tracking-widest font-semibold opacity-70 leading-none mb-1">Download on the</span>
              <span className="font-medium tracking-wide leading-none text-lg">App Store</span>
            </div>
          </a>

          <p className="text-xs text-muted-foreground/60 max-w-sm leading-relaxed">
            Free to download. Requires iOS 16 or later. By downloading you agree to our{' '}
            <a href="/terms" className="underline hover:text-muted-foreground transition-colors">Terms of Use</a>
            {' '}and{' '}
            <a href="/privacy" className="underline hover:text-muted-foreground transition-colors">Privacy Policy</a>.
          </p>
        </div>
      </section>
    </Layout>
  );
}
