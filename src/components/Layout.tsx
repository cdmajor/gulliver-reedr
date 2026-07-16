import { FC, ReactNode } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { SiApple } from 'react-icons/si';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-[100dvh] flex flex-col relative">
      <div className="noise-bg" />
      
      <header className="absolute top-0 left-0 right-0 z-40 w-full pt-8 pb-4 px-6 md:px-12 flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-2 relative z-10 mix-blend-difference">
          <div className="w-10 h-10 rounded-full border border-current flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors duration-500 text-foreground">
            <span className="font-serif text-xl italic tracking-wider leading-none mt-1">V</span>
          </div>
          <span className="font-serif font-medium text-lg tracking-wide hidden sm:block text-foreground">Victor</span>
        </Link>
        
        <nav className="flex items-center gap-6 md:gap-10 text-sm font-medium tracking-wide z-10 mix-blend-difference text-foreground">
          <Link href="/support" className="hover:text-primary transition-colors">Support</Link>
          <a 
            href="#download" 
            className="flex items-center gap-2 border border-current px-4 py-2 rounded-full hover:bg-foreground hover:text-background transition-colors duration-300"
          >
            <SiApple className="w-4 h-4" />
            <span>App Store</span>
          </a>
        </nav>
      </header>

      <main className="flex-1 flex flex-col w-full relative z-10">
        {children}
      </main>

      <footer className="bg-secondary text-secondary-foreground py-20 px-6 md:px-12 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
          <div className="flex flex-col gap-6 max-w-sm">
            <div className="w-12 h-12 rounded-full border border-current flex items-center justify-center">
              <span className="font-serif text-2xl italic tracking-wider leading-none mt-1">V</span>
            </div>
            <p className="font-serif text-xl text-muted-foreground">
              A brilliant editor friend who reads every word and actually cares about your work.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-12 text-sm tracking-wide">
            <div className="flex flex-col gap-4">
              <span className="text-muted-foreground uppercase tracking-widest text-xs font-semibold">Product</span>
              <Link href="/" className="hover:text-primary transition-colors">Overview</Link>
              <a href="#download" className="hover:text-primary transition-colors">Download</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-muted-foreground uppercase tracking-widest text-xs font-semibold">Legal & Help</span>
              <Link href="/support" className="hover:text-primary transition-colors">Support</Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Victor AI Life. All rights reserved.</p>
          <p>Designed for writers.</p>
        </div>
      </footer>
    </div>
  );
};
