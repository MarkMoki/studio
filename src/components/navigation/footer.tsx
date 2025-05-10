import Link from 'next/link';
import { HandCoins, Sparkles } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background/80">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0 group">
            <HandCoins className="h-7 w-7 text-primary transition-transform duration-300 group-hover:rotate-[10deg]" />
            <span className="text-xl font-semibold text-primary">TipKesho</span>
             <Sparkles className="h-4 w-4 text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <nav className="flex space-x-4 text-sm text-muted-foreground mb-4 md:mb-0">
            <Link href="/about" className="hover:text-primary transition-colors">About Us</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
          </nav>
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} TipKesho. All rights reserved.
          </p>
        </div>
        <div className="text-center mt-6 text-xs text-muted-foreground/70">
          Made with ❤️ & ☕ in Kenya
        </div>
      </div>
    </footer>
  );
}
