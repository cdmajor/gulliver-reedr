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
          <ul className="list-disc pl-6 space-y-3 mb-4">
            <li>
              <strong>Conversation messages:</strong> The text you send to Victor during your sessions. These are transmitted to our API server and to OpenAI's API to generate Victor's responses.
            </li>
            <li>
              <strong>Voice audio:</strong> If you use voice input, your recorded audio is transmitted to our API server and processed by OpenAI's Whisper model for transcription. The audio is not retained after transcription.
            </li>
            <li>
              <strong>Images and photos:</strong> If you share photos (including camera images), they are transmitted to OpenAI's API for visual processing and are not stored on our servers.
            </li>
            <li>
              <strong>Uploaded documents:</strong> Text and Word files you upload for discussion are transmitted to our server and to OpenAI's API, and are not permanently retained after your session.
            </li>
            <li>
              <strong>Goals and conversation history:</strong> Your goals and past conversations are stored <em>locally on your device</em> only, using your device's secure storage. We do not upload or store these on our servers.
            </li>
            <li>
              <strong>Device information:</strong> Basic technical information (device type, OS version) to ensure the app functions correctly.
            </li>
          </ul>
        </>
      )
    },
    {
      title: "2. How We Use Your Data",
      content: (
        <>
          <p className="mb-4">Your data is used solely to provide the Victor experience.</p>
          <ul className="list-disc pl-6 space-y-3 mb-4">
            <li>
              <strong>AI processing:</strong> Your messages, voice transcriptions, and shared images are processed by OpenAI's API (including GPT and Whisper models) to generate Victor's responses. This processing is subject to{' '}
              <a href="https://openai.com/policies/privacy-policy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">OpenAI's privacy policy</a>.
            </li>
            <li>
              <strong>Not used for training:</strong> Your conversations and content are <em>never</em> used by us to train AI models.
            </li>
            <li>
              <strong>No sale of data:</strong> We do not sell your personal data or conversation content to any third party.
            </li>
            <li>
              <strong>No advertising:</strong> We do not use your data for advertising or share it with advertising networks.
            </li>
          </ul>
        </>
      )
    },
    {
      title: "3. Device Permissions",
      content: (
        <>
          <p className="mb-4">Victor requests the following device permissions, each used only for the stated purpose:</p>
          <ul className="list-disc pl-6 space-y-3 mb-4">
            <li>
              <strong>Microphone:</strong> Used only when you tap the mic button to send a voice message. Victor never listens passively.
            </li>
            <li>
              <strong>Camera:</strong> Used only when you choose to take a photo to share with Victor.
            </li>
            <li>
              <strong>Photo Library:</strong> Used only when you choose to share a photo from your library.
            </li>
            <li>
              <strong>Notifications:</strong> Used only to deliver goal check-in reminders you have set up. You can disable these in your device's notification settings or remove goals inside the app at any time.
            </li>
          </ul>
          <p>You can revoke any permission at any time in your device's Settings. Revoking a permission disables the associated feature but does not otherwise affect the app.</p>
        </>
      )
    },
    {
      title: "4. Data Retention & Storage",
      content: (
        <>
          <p className="mb-4">We take a minimal-footprint approach to data retention:</p>
          <ul className="list-disc pl-6 space-y-3 mb-4">
            <li>
              <strong>Server-side:</strong> Conversation messages, voice audio, images, and documents are processed in memory to generate responses and are not permanently stored on our servers.
            </li>
            <li>
              <strong>On-device:</strong> Your conversation history and goals are stored locally on your device using secure on-device storage. This data remains under your control and is not accessible to us.
            </li>
            <li>
              <strong>Clearing your data:</strong> You can delete your conversation history and goals at any time from within the app. Uninstalling the app removes all locally stored data from your device.
            </li>
          </ul>
        </>
      )
    },
    {
      title: "5. Third-Party Services",
      content: (
        <>
          <p className="mb-4">Victor uses the following third-party service to function:</p>
          <ul className="list-disc pl-6 space-y-3 mb-4">
            <li>
              <strong>OpenAI:</strong> Victor's responses and voice transcription are powered by OpenAI's API. Content you send to Victor (text, voice audio, images) is transmitted to OpenAI for processing. OpenAI's use of this data is governed by their{' '}
              <a href="https://openai.com/policies/privacy-policy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
            </li>
          </ul>
          <p>We do not share your data with any other third parties.</p>
        </>
      )
    },
    {
      title: "6. Children's Privacy",
      content: (
        <p className="mb-4">
          Victor is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us with personal information, please contact us at{' '}
          <a href="mailto:support@victor.ai.life" className="text-primary hover:underline">support@victor.ai.life</a>{' '}
          and we will take steps to delete that information.
        </p>
      )
    },
    {
      title: "7. Your Rights",
      content: (
        <>
          <p className="mb-4">You have the following rights regarding your data:</p>
          <ul className="list-disc pl-6 space-y-3 mb-4">
            <li><strong>Access:</strong> You can request a description of any personal data we hold about you.</li>
            <li><strong>Deletion:</strong> You can delete your conversation history and goals from within the app at any time. As we do not permanently store your conversations on our servers, there is no additional server-side account to delete.</li>
            <li><strong>Permissions:</strong> You can revoke camera, microphone, photo library, and notification permissions at any time in your device Settings.</li>
          </ul>
        </>
      )
    },
    {
      title: "8. Changes to This Policy",
      content: (
        <p className="mb-4">
          We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date at the top of this page. We encourage you to review this policy periodically. Continued use of Victor after any changes constitutes your acceptance of the updated policy.
        </p>
      )
    },
    {
      title: "9. Contact Us",
      content: (
        <p className="mb-4">
          If you have questions about this policy or our privacy practices, please contact us at{' '}
          <a href="mailto:support@victor.ai.life" className="text-primary hover:underline">support@victor.ai.life</a>.
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
            Last updated: July 2026
          </p>

          <div className="prose prose-lg prose-headings:font-serif prose-headings:font-normal prose-headings:text-foreground prose-p:text-secondary/80 prose-li:text-secondary/80 max-w-none">
            <p className="text-xl font-serif italic text-secondary border-l-2 border-primary pl-6 mb-12">
              We believe you should know exactly what happens to your data. This policy is written in plain language — no legalese.
            </p>

            <div className="space-y-12">
              {sections.map((section, index) => (
                <motion.section 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
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
