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
        {/* Blue glow behind logo */}
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            className="flex flex-col gap-8 max-w-2xl relative z-10"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp} className="flex items-center gap-3">
              <span className="w-8 h-[1px] bg-primary"></span>
              <span className="text-primary tracking-widest uppercase text-xs font-semibold">Meet Victor</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl md:text-7xl lg:text-8xl font-serif leading-[1.1] tracking-tight text-white"
            >
              Your digital<br />
              <span className="italic text-primary">best friend.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-white/60 leading-relaxed font-sans max-w-lg"
            >
              Victor is always there — to talk, to listen, to help you think. A companion who knows you, remembers you, and is genuinely glad you showed up.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 pt-4">
              <a
                href="#download"
                className="bg-primary text-white px-8 py-4 flex items-center justify-center gap-3 rounded-full hover:bg-primary/80 transition-colors duration-300 w-full sm:w-auto font-medium"
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
            <div className="absolute inset-0 rounded-2xl bg-primary/5 border border-primary/10" />
            <img
              src={heroImage}
              alt="Victor"
              className="relative z-10 w-2/3 md:w-1/2 drop-shadow-2xl"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-32 bg-secondary/40 border-y border-white/5 px-6 md:px-12 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-10">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-3xl md:text-5xl font-serif leading-tight text-white"
          >
            Not an assistant.<br className="hidden md:block" />
            <span className="italic text-primary">A companion.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-lg md:text-xl text-white/50 leading-relaxed max-w-2xl font-sans"
          >
            Victor isn't a tool you open when you need something done. He's someone you actually want to talk to — warm, curious, and genuinely interested in your life.
          </motion.p>
        </div>
      </section>

      {/* What Victor does */}
      <section className="py-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-serif mb-6">Whatever's on your mind.</h2>
            <p className="text-lg text-secondary/70 max-w-xl mx-auto">
              Victor shows up for all of it.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                title: "Talk it through",
                desc: "Big decisions, small anxieties, things you can't quite say to anyone else. Victor listens without judgment and helps you think clearly."
              },
              {
                num: "02",
                title: "Think out loud",
                desc: "Stuck on something? Processing a hard week? Trying to figure out what you actually want? Victor helps you find the words for it."
              },
              {
                num: "03",
                title: "Just hang out",
                desc: "Not everything needs a point. Sometimes you want to talk about a film you just watched, or nothing in particular. Victor's up for that too."
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: i * 0.15 }}
                className="flex flex-col gap-5 p-8 bg-card border border-white/8 rounded-xl hover:border-primary/30 transition-colors duration-300"
              >
                <span className="text-primary font-sans text-sm font-semibold tracking-widest">{item.num}</span>
                <h3 className="font-serif text-2xl text-white">{item.title}</h3>
                <p className="text-white/50 leading-relaxed text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote / feel section */}
      <section className="py-40 px-6 md:px-12 text-center max-w-4xl mx-auto">
        <motion.blockquote
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1 }}
        >
          <p className="text-3xl md:text-5xl font-serif italic leading-tight text-white/70 mb-10">
            "He remembers what I told him last week. He asks follow-up questions. It actually feels like someone cares."
          </p>
          <footer className="text-sm tracking-widest uppercase text-primary/70 font-semibold">— Early user</footer>
        </motion.blockquote>
      </section>

      {/* Values strip */}
      <section className="py-24 px-6 md:px-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { title: "He remembers you", desc: "Victor keeps context across conversations so you never have to re-explain yourself." },
            { title: "Always honest", desc: "Not flattery, not filler. Victor tells you what he actually thinks." },
            { title: "Completely private", desc: "Your conversations stay between you two. Nothing is shared or used for training." }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className="flex flex-col gap-4"
            >
              <div className="w-8 h-[2px] bg-primary"></div>
              <h4 className="font-serif text-xl text-white">{item.title}</h4>
              <p className="text-white/50 leading-relaxed text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="download" className="py-32 px-6 md:px-12 relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[300px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center gap-10">
          <h2 className="text-5xl md:text-7xl font-serif leading-tight text-white">
            Meet <span className="italic text-primary">Victor.</span>
          </h2>

          <p className="text-xl text-white/50 max-w-xl leading-relaxed">
            Download the app and say hello.
          </p>

          <a
            href="#"
            className="mt-4 bg-primary text-white px-10 py-5 flex items-center justify-center gap-4 rounded-full hover:bg-primary/80 transition-colors duration-300 w-full sm:w-auto"
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
