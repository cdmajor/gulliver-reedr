import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Layout } from '@/components/Layout';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { SiApple } from 'react-icons/si';
import { Send, Loader2, Bot, User } from 'lucide-react';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const APP_ID = 'victor-web';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const WELCOME: Message = {
  role: 'assistant',
  content: "Hello. I'm the Victor support assistant. I can help with app features, troubleshooting, goals, memories, account questions, and more. How can I help you today?",
};

export default function Support() {
  const faqs = [
    { q: "How do I talk to Victor?", a: "Just type in the chat bar and tap send. You can also tap the microphone icon to speak — Victor will transcribe your voice and reply." },
    { q: "How does Victor remember things?", a: "Victor builds an understanding of you through your conversations. You can see what he's noticed by tapping the eye icon in the top bar." },
    { q: "How do I set a goal?", a: "Tap the target icon in the top bar to open Goals. Tap + to add a goal, set a check-in frequency, and choose a notification time." },
    { q: "Is my data private?", a: "Your goals and conversation history are stored locally on your device. Messages are processed via our servers and OpenAI's API but are never used to train AI models or sold." },
    { q: "Victor isn't responding — what do I do?", a: "Check your internet connection. If the issue persists, close and reopen the app or contact us at support@victor.ai.life." },
  ];

  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/techsupport/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: APP_ID, messages: next.slice(-12) }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply ?? 'Something went wrong. Please try again.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error — please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <Layout>
      <div className="pt-32 pb-20 px-6 md:px-12 max-w-5xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <Link href="/" className="text-primary hover:text-foreground transition-colors text-sm tracking-widest uppercase font-semibold flex items-center gap-2 mb-8">
            <span className="text-lg leading-none">&larr;</span> Back to Home
          </Link>

          <h1 className="text-4xl md:text-6xl font-serif mb-6">Support</h1>
          <p className="text-xl text-secondary/80 mb-12 max-w-2xl">
            Need help with Victor? Chat with our AI assistant for instant answers, or browse the FAQs below.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* AI Chat — takes up 2 columns */}
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-serif border-b border-border pb-4 mb-6">Ask the Support Assistant</h2>
              <div className="border border-border flex flex-col" style={{ height: '480px' }}>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${
                        msg.role === 'user' ? 'bg-foreground text-background' : 'bg-card border border-border text-foreground'
                      }`}>
                        {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>
                      <div className={`max-w-[76%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-foreground text-background'
                          : 'bg-card border border-border text-foreground'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center shrink-0">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      </div>
                      <div className="bg-card border border-border px-4 py-3 flex items-center gap-1.5">
                        {[0, 150, 300].map(d => (
                          <div key={d} className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  {messages.length === 1 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {["How do I set a goal?", "Victor isn't responding", "How do I delete my data?", "Change Victor's appearance"].map(q => (
                        <button key={q} onClick={() => setInput(q)}
                          className="text-xs border border-border px-3 py-1.5 text-secondary/70 hover:text-foreground hover:border-foreground/40 transition-colors">
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="border-t border-border p-4">
                  <div className="flex gap-2 items-end">
                    <textarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={onKey}
                      placeholder="Ask a question about Victor…"
                      rows={1}
                      disabled={loading}
                      className="flex-1 resize-none bg-transparent border-b border-border focus:border-foreground pb-1 text-sm text-foreground placeholder:text-secondary/50 focus:outline-none transition-colors disabled:opacity-50 max-h-24"
                      style={{ fieldSizing: 'content' } as React.CSSProperties}
                    />
                    <button onClick={send} disabled={!input.trim() || loading}
                      className="pb-1 text-secondary/50 hover:text-foreground disabled:opacity-30 transition-colors shrink-0">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* FAQs */}
              <h2 className="text-3xl font-serif border-b border-border pb-4 mt-12 mb-8">Frequently Asked Questions</h2>
              <div className="space-y-8">
                {faqs.map((faq, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }}>
                    <h3 className="text-lg font-serif mb-2">{faq.q}</h3>
                    <p className="text-secondary/80 leading-relaxed text-sm">{faq.a}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              <div className="bg-card border border-border p-8">
                <h2 className="text-2xl font-serif mb-4">Contact Us</h2>
                <p className="text-secondary/80 text-sm mb-4">Can't find what you're looking for?</p>
                <a href="mailto:support@victor.ai.life" className="text-primary hover:text-foreground transition-colors font-medium text-sm">
                  support@victor.ai.life
                </a>
              </div>
              <div className="bg-foreground text-background p-8">
                <h2 className="text-2xl font-serif mb-4">Get the App</h2>
                <p className="text-background/80 text-sm mb-6">Victor is available exclusively for iOS.</p>
                <a href="#" className="bg-background text-foreground px-6 py-3 flex items-center justify-center gap-3 hover:bg-primary hover:text-background transition-colors duration-300 w-full">
                  <SiApple className="w-5 h-5" />
                  <span className="font-medium tracking-wide text-sm">App Store</span>
                </a>
              </div>
              <div className="bg-card border border-border p-8 space-y-4">
                <h2 className="text-2xl font-serif mb-2">Legal</h2>
                <Link href="/privacy" className="block text-muted-foreground hover:text-foreground transition-colors text-sm">Privacy Policy →</Link>
                <Link href="/terms" className="block text-muted-foreground hover:text-foreground transition-colors text-sm">Terms of Use →</Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
