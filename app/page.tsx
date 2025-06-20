'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Scissors, 
  Calendar, 
  Users, 
  Clock,
  MapPin,
  Star,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Get user profile to determine role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile) {
        if (profile.role === 'barber') {
          router.push('/barber/dashboard');
        } else {
          router.push('/customer/dashboard');
        }
      }
    }
  };

  const features = [
    {
      icon: Calendar,
      title: 'Smart Booking',
      description: 'Book appointments with your favorite stylists in advance'
    },
    {
      icon: Users,
      title: 'Walk-in Queue',
      description: 'Join virtual queues and get notified when it\'s your turn'
    },
    {
      icon: Clock,
      title: 'Real-time Updates',
      description: 'Get instant notifications about your appointment status'
    },
    {
      icon: MapPin,
      title: 'Find Nearby',
      description: 'Discover great barbers and salons in your area'
    }
  ];

  const benefits = [
    'No more waiting around at the salon',
    'Book appointments 24/7',
    'Get WhatsApp notifications',
    'See real-time queue status',
    'Compare services and prices',
    'Save your favorite barbers'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="bg-emerald-100 p-6 rounded-full">
                    <Scissors className="h-16 w-16 text-emerald-600" />
                  </div>
                </div>
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Your Salon</span>
                  <span className="block text-emerald-600">Booking Assistant</span>
                </h1>
                <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                  Book appointments instantly or join virtual queues. No more waiting around - get notified when it's your turn.
                </p>
                <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                  <div className="rounded-md shadow">
                    <Link href="/auth/register">
                      <Button className="w-full flex items-center justify-center px-8 py-3 text-base font-medium bg-emerald-600 hover:bg-emerald-700 md:py-4 md:text-lg md:px-10">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                    <Link href="/auth/login">
                      <Button variant="outline" className="w-full flex items-center justify-center px-8 py-3 text-base font-medium md:py-4 md:text-lg md:px-10">
                        Sign In
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Everything you need for salon visits
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Modern solutions for both customers and barbers
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-emerald-100 p-3 rounded-full">
                      <feature.icon className="h-8 w-8 text-emerald-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 bg-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Why choose our platform?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
            <div className="relative">
              <div className="bg-white rounded-lg shadow-xl p-8">
                <div className="text-center space-y-4">
                  <div className="bg-amber-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                    <Star className="h-8 w-8 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Premium Experience
                  </h3>
                  <p className="text-gray-600">
                    Join thousands of satisfied customers who've transformed their salon experience with our platform.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-emerald-600">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-emerald-200">
            Join our platform today and revolutionize your salon experience.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <Link href="/auth/register?role=customer">
              <Button variant="secondary" className="px-8 py-3">
                I'm a Customer
              </Button>
            </Link>
            <Link href="/auth/register?role=barber">
              <Button variant="outline" className="px-8 py-3 border-white text-emerald-600 hover:bg-white hover:text-emerald-600">
                I'm a Stylist
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}