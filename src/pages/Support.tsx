import { Layout } from '@/components/Layout';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { SiApple } from 'react-icons/si';

export default function Support() {
  const faqs = [
    {
      q: "How do I talk to Victor?",
      a: "Just type in the chat bar and tap send. You can also tap the microphone icon to speak — Victor will transcribe your voice and reply. You can attach photos from your library, take a photo with your camera, or share a document too."
    },
    {
      q: "Can I use my voice instead of typing?",
      a: "Yes. Tap the microphone icon in the input bar, speak your message, then tap it again to stop. Victor transcribes what you said and the text appears in the input field — you can edit it before sending, or just tap send right away."
    },
    {
      q: "How does Victor remember things?",
      a: "Victor builds an understanding of you through your conversations. After each reply, he quietly notes what stood out — details about your life, people you mention, how you're feeling. You can see what he's noticed by tapping the eye icon in the top bar."
    },
    {
      q: "How do I set a goal?",
      a: "Tap the target icon in the top bar to open Goals. Tap the + button to add a goal — give it a name, set how often you want Victor to check in (daily, weekdays, or weekly), and choose a time of day for a notification reminder. Victor will check in naturally in conversation."
    },
    {
      q: "How do I find an old conversation?",
      a: "Tap the clock icon in the top bar to see your conversation history. Tap any thread to pick it up exactly where you left off. Tap the pencil icon to start a fresh chat."
    },
    {
      q: "What file types can I share?",
      a: "You can share photos (from your camera or photo library), plain text (.txt), Word documents (.docx), and Markdown (.md) files."
    },
    {
      q: "Is my data private?",
      a: "Your goals and conversation history are stored locally on your device — we never upload them. Messages you send are processed via our servers and OpenAI's API to generate Victor's responses. Your data is never used to train AI models and is never sold. See our full Privacy Policy for details."
    },
    {
      q: "How do I change Victor's appearance?",
      a: "Tap the gear icon to open Settings. Under Appearance you can choose from five colour themes (Charcoal, Midnight, Forest, Blush, Slate) and adjust the font size. You can also change Victor's response style between Brief, Natural, and Detailed."
    },
    {
      q: "How do I delete my data?",
      a: "Your conversation history can be cleared from Settings > Conversation > Clear conversation. Individual goals can be deleted from the Goals screen by tapping the trash icon. Uninstalling the app removes all locally stored data from your device."
    },
    {
      q: "Victor isn't responding — what do I do?",
      a: "Check your internet connection. Victor requires a connection to generate replies. If the issue persists, close and reopen the app. You can also reach us at support@victor.ai.life."
    }
  ];

  return (
    <Layout>
      <div className="pt-32 pb-20 px-6 md:px-12 max-w-4xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Link href="/" className="text-primary hover:text-foreground transition-colors text-sm tracking-widest uppercase font-semibold flex items-center gap-2 mb-8">
            <span className="text-lg leading-none">&larr;</span> Back to Home
          </Link>
          
          <h1 className="text-4xl md:text-6xl font-serif mb-6">Support</h1>
          <p className="text-xl text-secondary/80 mb-16 max-w-2xl">
            Need help with Victor? Browse our frequently asked questions or reach out to our team directly.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20">
            <div className="md:col-span-2 space-y-12">
              <h2 className="text-3xl font-serif border-b border-border pb-4">Frequently Asked Questions</h2>
              
              <div className="space-y-10">
                {faqs.map((faq, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  >
                    <h3 className="text-xl font-serif mb-3">{faq.q}</h3>
                    <p className="text-secondary/80 leading-relaxed">{faq.a}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="space-y-10">
              <div className="bg-card border border-border p-8">
                <h2 className="text-2xl font-serif mb-4">Contact Us</h2>
                <p className="text-secondary/80 text-sm mb-6">
                  Can't find what you're looking for? Our team is here to help.
                </p>
                <a 
                  href="mailto:support@victor.ai.life" 
                  className="inline-flex items-center gap-2 text-primary hover:text-foreground transition-colors font-medium"
                >
                  support@victor.ai.life
                </a>
              </div>

              <div className="bg-foreground text-background p-8">
                <h2 className="text-2xl font-serif mb-4">Get the App</h2>
                <p className="text-background/80 text-sm mb-6">
                  Victor is available exclusively for iOS on the Apple App Store.
                </p>
                <a 
                  href="#"
                  className="bg-background text-foreground px-6 py-3 flex items-center justify-center gap-3 hover:bg-primary hover:text-background transition-colors duration-300 w-full"
                >
                  <SiApple className="w-5 h-5" />
                  <span className="font-medium tracking-wide text-sm">App Store</span>
                </a>
              </div>

              <div className="bg-card border border-border p-8 space-y-4">
                <h2 className="text-2xl font-serif mb-2">Legal</h2>
                <Link href="/privacy" className="block text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Privacy Policy →
                </Link>
                <Link href="/terms" className="block text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Terms of Use →
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
