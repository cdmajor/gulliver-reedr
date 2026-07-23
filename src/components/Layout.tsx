import { FC, ReactNode } from 'react';
import { Link } from 'wouter';
import logoSrc from '@/assets/victor-logo_2.png';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-[100dvh] flex flex-col relative bg-background">
      <div className="glow-bg" />

      <header className="absolute top-0 left-0 right-0 z-40 w-full pt-6 pb-4 px-6 md:px-12 flex items-center justify-between border-b border-border/60">
        <Link href="/" className="flex items-center gap-3">
          <img src={logoSrc} alt="Reedr" className="h-10 w-10 rounded-xl object-cover" />
          <span className="font-sans font-semibold text-lg tracking-wider text-foreground uppercase">Reedr</span>
        </Link>

        <nav className="flex items-center gap-6 md:gap-10 text-sm font-medium tracking-wide z-10">
          <Link href="/support" className="text-muted-foreground hover:text-foreground transition-colors">Support</Link>
          <a
            href="#download"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full hover:bg-primary/80 transition-all duration-300"
          >
            <span>⬇</span>
            <span>Install</span>
          </a>
        </nav>
      </header>

      <main className="flex-1 flex flex-col w-full relative z-10">
        {children}
      </main>

      <footer className="bg-secondary/60 border-t border-border py-16 px-6 md:px-12 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
          <div className="flex flex-col gap-5 max-w-sm">
            <img src={logoSrc} alt="Reedr" className="h-12 w-12 rounded-xl object-cover" />
            <p className="text-muted-foreground text-sm leading-relaxed">
              A browser extension that reads every page you visit and is always ready to talk about it.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 text-sm">
            <div className="flex flex-col gap-4">
              <span className="text-muted-foreground/60 uppercase tracking-widest text-xs font-semibold">Product</span>
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
              <a href="#download" className="text-muted-foreground hover:text-foreground transition-colors">Install</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-muted-foreground/60 uppercase tracking-widest text-xs font-semibold">Legal & Help</span>
              <Link href="/support" className="text-muted-foreground hover:text-foreground transition-colors">Support</Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Use</Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground/60">
          <p>© {new Date().getFullYear()} Reedr. All rights reserved.</p>
          <p>Works on Chrome, Edge, and Firefox.</p>
        </div>
      </footer>
    </div>
  );
};
