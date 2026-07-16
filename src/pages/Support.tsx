import { Layout } from '@/components/Layout';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { SiApple } from 'react-icons/si';

export default function Support() {
  const faqs = [
    {
      q: "How do I upload a manuscript?",
      a: "Tap the '+' icon on the main screen of the app. You can select files directly from iCloud Drive, Google Drive, or your device storage. We support full manuscript uploads."
    },
    {
      q: "What file types are supported?",
      a: "Victor currently supports plain text (.txt), Microsoft Word documents (.docx), and Markdown (.md) files."
    },
    {
      q: "Is my writing stored permanently?",
      a: "No. Your documents are processed in memory during your session to provide feedback and are not permanently stored on our servers. When you clear a session, the data is gone."
    },
    {
      q: "How do I delete my data?",
      a: "You can delete your account and all associated data at any time by going to Settings > Account > Delete Account inside the app. This action is irreversible."
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
                    transition={{ duration: 0.5, delay: index * 0.1 }}
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
                  Can't find what you're looking for? Our team is here to help you get the most out of Victor.
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
                  Victor is currently available exclusively for iOS devices on the Apple App Store.
                </p>
                <a 
                  href="#"
                  className="bg-background text-foreground px-6 py-3 flex items-center justify-center gap-3 hover:bg-primary hover:text-background transition-colors duration-300 w-full"
                >
                  <SiApple className="w-5 h-5" />
                  <span className="font-medium tracking-wide text-sm">App Store</span>
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
