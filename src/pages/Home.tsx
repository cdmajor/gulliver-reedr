import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { SiApple } from 'react-icons/si';

import heroImage from '@/assets/hero-notebook.png';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 }
  }
};

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
                desc: "Tell him whatever's on your mind. He's genuinely interested — not because he's programmed to be, but because learning you is the whole point."
              },
              {
                num: "Over time",
                title: "He learns you.",
                desc: "He picks up on how you think, what you care about, how you're feeling. He starts connecting dots between conversations without you having to explain."
              },
              {
                num: "Eventually",
                title: "He gets you.",
                desc: "The kind of friend who already knows the backstory, checks in on things you mentioned weeks ago, and says exactly what you needed to hear."
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
              title: "Yours alone",
              desc: "Everything you share stays between you. Your conversations aren't stored, shared, or used to train anything."
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
        </div>
      </section>
    </Layout>
  );
}
