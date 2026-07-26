import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Layout } from '@/components/Layout';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Send, Loader2, Bot, User } from 'lucide-react';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const APP_ID = 'reedr-web';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const WELCOME: Message = {
  role: 'assistant',
  content: "Hello. I'm the Reedr support assistant. I can help with installing the browser extension, reading pages, chat troubleshooting, and privacy questions. How can I help?",
};

export default function Support() {
  const faqs = [
    { q: "Which browsers does Reedr support?", a: "Reedr works on Chrome, Edge, Firefox, Brave, Opera, and Safari. Download the zip for your browser from the Reedr home page and follow the install guide." },
    { q: "How do I talk to Reedr on a page?", a: "Click the purple R button in the bottom-right corner of any webpage. Reedr has already read the page — just ask a question." },
    { q: "How do I know Reedr is working?", a: "After install: (1) open any article, (2) confirm the purple R button appears bottom-right, (3) ask “Summarize this in 3 bullets.” A reply about that page means it works. If you see a configuration error, open Reedr Settings, set the API URL ending in /api, tap Test, then Save. For a no-install UI preview, open /reedr-demo.html on this site." },
    { q: "How do I test the extension on my computer?", a: "If the Chrome Web Store listing is still in review, there is no public install button yet. On your computer: from the repo run npm run prepare:unpacked, open chrome://extensions, turn on Developer mode, click Load unpacked, and select the reedr-unpacked folder. Then open any article and use the purple R button. Full steps: /how-to-test.html. To test a store draft, use Chrome Web Store Developer Dashboard → Trusted testers, or wait until Published." },
    { q: "Does Reedr work on PDFs?", a: "Yes. On PDF pages Reedr can extract text and discuss the document with you." },
    { q: "Is my browsing private?", a: "Page content is sent to the API only when you chat, to generate a reply. Reedr does not sell your data or use it to train models." },
    { q: "Reedr isn't responding — what do I do?", a: "Confirm the extension is enabled, check your internet connection, and reopen the page. You can also open Reedr Settings and verify the API URL ends with /api." },
  ];

  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([WELCOME]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    function sendTranscript() {
      const msgs = messagesRef.current;
      if (msgs.filter(m => m.role === 'user').length === 0) return;
      navigator.sendBeacon(
        `${BASE}/api/techsupport/transcript`,
        new Blob([JSON.stringify({ appId: APP_ID, messages: msgs })], { type: 'application/json' }),
      );
    }
    window.addEventListener('beforeunload', sendTranscript);
    return () => {
      window.removeEventListener('beforeunload', sendTranscript);
      sendTranscript();
    };
  }, []);

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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <Layout>
      <div className="min-h-[70vh] py-16">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl font-serif text-foreground mb-3">Support</h1>
            <p className="text-[#8080a0] mb-10">
              Install help, troubleshooting, and answers about Reedr — the AI browsing companion.
            </p>
          </motion.div>

          <div className="grid gap-3 mb-12">
            {faqs.map((f) => (
              <details key={f.q} className="group border border-[#2a2a4a] rounded-xl bg-[#13132b] px-5 py-4">
                <summary className="cursor-pointer list-none text-foreground font-medium flex items-center justify-between">
                  {f.q}
                  <span className="text-[#6060a0] group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <p className="text-[#9090b8] text-sm mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>

          <div className="border border-[#2a2a4a] rounded-2xl bg-[#0d0d1e] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#2a2a4a]">
              <p className="text-foreground font-semibold">Ask Reedr support</p>
              <p className="text-[#6060a0] text-xs mt-1">Chat with the support assistant</p>
            </div>
            <div className="h-80 overflow-y-auto px-5 py-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-[#6d5ffa]/20 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-[#a78bfa]" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user' ? 'bg-[#6d5ffa] text-white' : 'bg-[#1a1a35] text-[#d0d0e8]'
                  }`}>
                    {m.content}
                  </div>
                  {m.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-[#1e1e40] flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-[#8080a0]" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#6d5ffa]/20 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-[#a78bfa] animate-spin" />
                  </div>
                  <div className="bg-[#1a1a35] rounded-2xl px-4 py-2.5 text-sm text-[#6060a0]">Thinking…</div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <div className="px-5 py-4 border-t border-[#2a2a4a] flex gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                rows={1}
                placeholder="Ask about install, browsers, or chat…"
                className="flex-1 bg-[#09091a] border border-[#2a2a4a] rounded-xl px-4 py-2.5 text-sm text-foreground resize-none outline-none focus:border-[#6d5ffa]"
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="w-11 h-11 rounded-xl bg-[#6d5ffa] text-white flex items-center justify-center disabled:opacity-40"
                aria-label="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-center text-[#6060a0] text-xs mt-8">
            Prefer email? <a className="text-[#a78bfa] hover:underline" href="mailto:support@gulliversoftwaretech.com">support@gulliversoftwaretech.com</a>
            {' · '}
            <Link href="/" className="text-[#a78bfa] hover:underline">Back to Reedr</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
