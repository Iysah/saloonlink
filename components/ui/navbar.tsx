'use client';

import Link from "next/link";
import Image from "next/image";
import { Button } from '@/components/ui/button';
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutDashboard, LogOut } from "lucide-react";

const supabase = createClient()

export default function Navbar() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkUser();
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
 
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    window.location.href = '/';
  };

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
            <Link href="/pricing" className="text-gray-600 font-medium hover:text-emerald-600/80">
              Pricing
            </Link>
            <Link href="/#testimonials" className="text-gray-600 hover:text-primary transition-colors">
              Reviews
            </Link>
          </nav>

          <div className="flex items-center space-x-3" ref={dropdownRef}>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userProfile?.avatar_url || ''} alt={user.email || ''} />
                      <AvatarFallback className="bg-emerald-500 text-white">
                        {userProfile?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem asChild>
                    <Link href={`/${userProfile?.role}/dashboard`} className="w-full cursor-pointer flex items-center">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}