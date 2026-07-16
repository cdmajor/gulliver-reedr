import { FC, ReactNode } from 'react';
import { Link } from 'wouter';
import { SiApple } from 'react-icons/si';
import logoSrc from '@/assets/victor-logo.png';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-[100dvh] flex flex-col relative bg-background">
      <div className="glow-bg" />

      <header className="absolute top-0 left-0 right-0 z-40 w-full pt-6 pb-4 px-6 md:px-12 flex items-center justify-between border-b border-white/5">
        <Link href="/" className="flex items-center gap-3">
          <img src={logoSrc} alt="Victor" className="h-10 w-10 rounded-xl object-cover" />
          <span className="font-sans font-semibold text-lg tracking-wider text-white/90 uppercase">Victor</span>
        </Link>

        <nav className="flex items-center gap-6 md:gap-10 text-sm font-medium tracking-wide z-10">
          <Link href="/support" className="text-white/60 hover:text-white transition-colors">Support</Link>
          <a
            href="#download"
            className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2 rounded-full hover:bg-primary hover:text-white transition-all duration-300"
          >
            <SiApple className="w-4 h-4" />
            <span>App Store</span>
          </a>
        </nav>
      </header>

      <main className="flex-1 flex flex-col w-full relative z-10">
        {children}
      </main>

      <footer className="bg-secondary/50 border-t border-white/5 py-16 px-6 md:px-12 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
          <div className="flex flex-col gap-5 max-w-sm">
            <img src={logoSrc} alt="Victor" className="h-12 w-12 rounded-xl object-cover" />
            <p className="text-white/50 text-sm leading-relaxed">
              A companion who knows you, remembers you, and is genuinely glad you showed up.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 text-sm">
            <div className="flex flex-col gap-4">
              <span className="text-white/30 uppercase tracking-widest text-xs font-semibold">Product</span>
              <Link href="/" className="text-white/60 hover:text-white transition-colors">Home</Link>
              <a href="#download" className="text-white/60 hover:text-white transition-colors">Download</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-white/30 uppercase tracking-widest text-xs font-semibold">Legal & Help</span>
              <Link href="/support" className="text-white/60 hover:text-white transition-colors">Support</Link>
              <Link href="/privacy" className="text-white/60 hover:text-white transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/30">
          <p>© {new Date().getFullYear()} Victor. All rights reserved.</p>
          <p>victor.ai.life</p>
        </div>
      </footer>
    </div>
  );
};
