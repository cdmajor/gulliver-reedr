import { Layout } from '@/components/Layout';
import { Link } from 'wouter';
import { motion } from 'framer-motion';

export default function Privacy() {
  const sections = [
    {
      title: "1. Information We Collect",
      content: (
        <>
          <p className="mb-4">When you use Victor, we collect the following types of information:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li><strong>Manuscripts and Documents:</strong> The files you upload for analysis (.txt, .docx, .md).</li>
            <li><strong>Chat Conversations:</strong> The dialogue between you and the Victor AI during your sessions.</li>
            <li><strong>Device Information:</strong> Basic analytics such as device type, OS version, and app interaction data to improve stability.</li>
          </ul>
        </>
      )
    },
    {
      title: "2. How We Use Your Data",
      content: (
        <>
          <p className="mb-4">Your creative work is yours. We use your data exclusively to provide the Victor editing service.</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li><strong>AI Processing:</strong> Your documents and messages are processed by secure third-party AI models (including OpenAI or Anthropic) solely to generate editorial feedback and responses.</li>
            <li><strong>No Training:</strong> Your manuscripts and chats are <em>never</em> used to train public AI models.</li>
            <li><strong>No Third-Party Sales:</strong> We do not sell your personal data or your creative works to third parties, ever.</li>
          </ul>
        </>
      )
    },
    {
      title: "3. Data Retention",
      content: (
        <p className="mb-4">
          We believe in keeping a minimal footprint. Your uploaded documents are processed in memory and deleted from our active servers after your session concludes. Chat logs are not permanently stored and disappear when you clear a session or delete your account. 
        </p>
      )
    },
    {
      title: "4. Your Rights",
      content: (
        <>
          <p className="mb-4">You have complete control over your data:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li><strong>Deletion:</strong> You can delete your account and all associated data directly from the app settings at any time.</li>
            <li><strong>Access:</strong> You can request a copy of any personal data we hold.</li>
            <li><strong>Support:</strong> If you have privacy concerns, contact our support team.</li>
          </ul>
        </>
      )
    },
    {
      title: "5. Contact Us",
      content: (
        <p className="mb-4">
          If you have questions about this policy or our privacy practices, please contact us at <a href="mailto:support@victor.ai.life" className="text-primary hover:underline">support@victor.ai.life</a>.
        </p>
      )
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
          
          <h1 className="text-4xl md:text-6xl font-serif mb-6">Privacy Policy</h1>
          <p className="text-muted-foreground tracking-wide text-sm mb-16 uppercase">
            Last updated: July 2025
          </p>

          <div className="prose prose-lg prose-headings:font-serif prose-headings:font-normal prose-headings:text-foreground prose-p:text-secondary/80 prose-li:text-secondary/80 max-w-none">
            <p className="text-xl font-serif italic text-secondary border-l-2 border-primary pl-6 mb-12">
              We know your manuscript is your most valuable asset. Victor is built on a foundation of absolute respect for your privacy and your art.
            </p>

            <div className="space-y-12">
              {sections.map((section, index) => (
                <motion.section 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <h2 className="text-2xl md:text-3xl font-serif mb-6">{section.title}</h2>
                  <div className="text-lg leading-relaxed font-sans">
                    {section.content}
                  </div>
                </motion.section>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
