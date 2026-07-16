import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { SiApple } from 'react-icons/si';

// Use a placeholder if the generated image is not available yet
import heroImage from '@/assets/hero-notebook.png';
import appImage from '@/assets/writing-app.png';

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
      {/* Hero Section */}
      <section className="relative min-h-[100dvh] flex items-center pt-24 pb-12 overflow-hidden px-6 md:px-12">
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
              className="text-5xl md:text-7xl lg:text-8xl font-serif leading-[1.1] tracking-tight"
            >
              Your brilliant <br/>
              <span className="italic text-secondary/70">editor friend.</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeUp}
              className="text-lg md:text-xl text-secondary/80 leading-relaxed font-sans max-w-lg"
            >
              Victor is an intelligent writing companion for authors. Upload your manuscript, get line-by-line notes, and work through your writing section by section.
            </motion.p>
            
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 pt-4">
              <a 
                href="#download"
                className="bg-foreground text-background px-8 py-4 flex items-center justify-center gap-3 hover:bg-primary transition-colors duration-300 w-full sm:w-auto"
              >
                <SiApple className="w-5 h-5" />
                <span className="font-medium tracking-wide">Download on App Store</span>
              </a>
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
            className="relative h-[60vh] lg:h-[80vh] w-full"
          >
            <div className="absolute inset-0 bg-secondary/5 mix-blend-multiply rounded-sm z-10"></div>
            <img 
              src={heroImage} 
              alt="A beautiful notebook on a dark desk" 
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=2000";
              }}
            />
            {/* Subtle decorative elements */}
            <div className="absolute -bottom-6 -left-6 w-24 h-24 border-l border-b border-primary/30 z-20"></div>
            <div className="absolute -top-6 -right-6 w-24 h-24 border-r border-t border-primary/30 z-20"></div>
          </motion.div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-32 bg-secondary text-secondary-foreground px-6 md:px-12 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-4"
          >
            <span className="font-serif text-3xl italic pt-1">V</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-3xl md:text-5xl font-serif leading-tight"
          >
            Not a productivity app.<br className="hidden md:block" />
            <span className="italic text-primary">Not a chatbot.</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl font-sans"
          >
            Writing shouldn't feel like programming. Victor brings the warmth and precision of a world-class literary editor to your pocket. He remembers your characters, understands your pacing, and cares about your prose.
          </motion.p>
        </div>
      </section>

      {/* Feature 1: The Process */}
      <section className="py-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="order-2 lg:order-1 relative aspect-[4/5] bg-muted overflow-hidden"
          >
            <img 
              src={appImage} 
              alt="Victor app interface on manuscript" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1455390582262-044cdead2708?auto=format&fit=crop&q=80&w=1500";
              }}
            />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="order-1 lg:order-2 flex flex-col gap-8 max-w-xl"
          >
            <div className="flex items-center gap-3">
              <span className="text-primary font-serif italic text-xl">01</span>
              <span className="w-12 h-[1px] bg-border"></span>
            </div>
            
            <h3 className="text-4xl md:text-5xl font-serif">Deep Manuscript Analysis</h3>
            
            <p className="text-lg text-secondary/80 leading-relaxed">
              Upload your complete `.docx`, `.txt`, or `.md` file. Victor reads the entire manuscript to understand the global narrative arc before making local suggestions.
            </p>
            
            <ul className="flex flex-col gap-4 mt-4">
              {[
                "Character voice consistency checks",
                "Pacing and structural feedback",
                "Line-by-line prose polishing"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4 text-secondary">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0"></div>
                  <span className="text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Feature 2: Conversational Brainstorming */}
      <section className="py-32 px-6 md:px-12 bg-muted/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="flex flex-col gap-8 max-w-xl"
          >
            <div className="flex items-center gap-3">
              <span className="text-primary font-serif italic text-xl">02</span>
              <span className="w-12 h-[1px] bg-border"></span>
            </div>
            
            <h3 className="text-4xl md:text-5xl font-serif">A dialogue about your art.</h3>
            
            <p className="text-lg text-secondary/80 leading-relaxed">
              Stuck on a plot hole? Need to heighten the tension in chapter four? Chat with Victor to brainstorm solutions that feel organic to your story's existing logic.
            </p>
            
            <blockquote className="mt-6 border-l-2 border-primary pl-6 py-2">
              <p className="font-serif text-xl italic text-secondary mb-3">
                "The protagonist's decision feels slightly unearned here. Based on her reaction in chapter two, perhaps we could layer in a moment of hesitation?"
              </p>
              <footer className="text-sm tracking-widest uppercase text-muted-foreground font-semibold">— Victor</footer>
            </blockquote>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="relative aspect-square bg-card border border-border p-8 md:p-12 shadow-xl flex flex-col justify-end"
          >
            <div className="flex-1 flex flex-col gap-6 justify-center">
              <div className="bg-muted p-4 self-end max-w-[80%]">
                <p className="text-sm">I'm struggling with the transition between the cafe scene and the train station.</p>
              </div>
              <div className="bg-primary/10 p-6 self-start max-w-[90%] border-l-2 border-primary">
                <p className="text-sm leading-relaxed text-foreground">
                  Let's look at the emotional shift. In the cafe, Elias is feeling defeated. A direct cut to the busy train station might be too jarring. What if we insert a brief moment of him walking through the rain, letting the sensory details of the city mirror his internal state?
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Focus / Aesthetics Section */}
      <section className="py-40 px-6 md:px-12 text-center max-w-5xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1 }}
          className="text-4xl md:text-6xl font-serif leading-tight mb-8"
        >
          Designed for focus.
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-xl text-secondary/80 max-w-2xl mx-auto leading-relaxed mb-16"
        >
          An interface that disappears, leaving only your words and thoughtful critique. Ink on cream. A terracotta bookmark catching the light.
        </motion.p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "No Distractions", desc: "A minimal, typographical interface that respects your attention." },
            { title: "Your Voice, Preserved", desc: "Victor edits to enhance your unique style, never to flatten it." },
            { title: "Absolute Privacy", desc: "Your manuscript is processed securely and never used for training." }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2 + (i * 0.1) }}
              className="flex flex-col items-center gap-4 p-8 bg-card border border-border"
            >
              <div className="w-10 h-10 border border-primary flex items-center justify-center text-primary font-serif italic mb-2">
                {i + 1}
              </div>
              <h4 className="font-serif text-xl">{feature.title}</h4>
              <p className="text-secondary/70 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section id="download" className="py-32 px-6 md:px-12 bg-foreground text-background relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center gap-10">
          <h2 className="text-5xl md:text-7xl font-serif leading-tight">
            Ready to <span className="italic text-primary">refine</span> your work?
          </h2>
          
          <p className="text-xl text-background/80 max-w-xl leading-relaxed">
            Download Victor today and meet the editor you've been waiting for.
          </p>
          
          <a 
            href="#"
            className="mt-8 bg-background text-foreground px-10 py-5 flex items-center justify-center gap-4 hover:bg-primary hover:text-background transition-colors duration-300 w-full sm:w-auto"
          >
            <SiApple className="w-6 h-6" />
            <div className="flex flex-col items-start">
              <span className="text-xs uppercase tracking-widest font-semibold opacity-70 leading-none mb-1">Download on</span>
              <span className="font-medium tracking-wide leading-none text-lg">App Store</span>
            </div>
          </a>
        </div>
      </section>
    </Layout>
  );
}
