import Link from 'next/link';
import { HandCoins } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <HandCoins className="h-7 w-7 text-primary" />
            <span className="text-xl font-semibold text-primary">TipKesho</span>
          </div>
          <nav className="flex space-x-4 text-sm text-muted-foreground mb-4 md:mb-0">
            <Link href="/about" className="hover:text-primary">About Us</Link>
            <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-primary">Contact</Link>
          </nav>
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} TipKesho. All rights reserved.
          </p>
        </div>
        <div className="text-center mt-4 text-xs text-muted-foreground">
          Made with ❤️ in Kenya
        </div>
      </div>
    </footer>
  );
}
