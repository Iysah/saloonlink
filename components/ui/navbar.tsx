'use client';

import Link from "next/link";
import Image from "next/image";
import { Button } from '@/components/ui/button';

export default function Navbar() {
  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            <Link href="/">
              <Image src="/images/LOGOTYPE_1.svg" alt="TrimsHive" width={100} height={100} />
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/#features" className="text-gray-600 hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="/#how-it-works" className="text-gray-600 hover:text-primary transition-colors">
              How It Works
            </Link>
            <Link href="/pricing" className="text-emerald-600 font-medium hover:text-emerald-600/80">
              Pricing
            </Link>
            <Link href="/#testimonials" className="text-gray-600 hover:text-primary transition-colors">
              Reviews
            </Link>
          </nav>

          <div className="flex items-center space-x-3">
            <Link href="/auth/login">
              <Button
                variant="ghost"
                className="hidden sm:inline-flex text-emerald-600 hover:text-emerald-600/80 hover:bg-emerald-600/10"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register?role=barber">
              <Button className="bg-emerald-600 hover:bg-emerald-600/90 text-primary-foreground font-medium">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
} 