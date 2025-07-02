'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge"
import { 
  Scissors, 
  Calendar, 
  Users, 
  Clock,
  MapPin,
  Star,
  CheckCircle,
  Check,
  Bell,
  Zap,
  Shield
} from 'lucide-react';
import Image from "next/image"
import Link from "next/link"

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
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              {/* <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">TrimsHive</span> */}
              <Image src="/images/LOGOTYPE_1.svg" alt="TrimsHive" width={100} height={100} />
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-emerald-600 transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-gray-600 hover:text-emerald-600 transition-colors">
                How It Works
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-emerald-600 transition-colors">
                Pricing
              </Link>
              <Link href="#testimonials" className="text-gray-600 hover:text-emerald-600 transition-colors">
                Reviews
              </Link>
            </nav>

            <div className="flex items-center space-x-3">
              <Link href="/auth/login">
                <Button
                  variant="ghost"
                  className="hidden sm:inline-flex text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register?role=barber">
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium">Get Started Free</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-12 pb-16 sm:pt-16 sm:pb-20 bg-gradient-to-br from-emerald-50 via-white to-amber-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Badge variant="secondary" className="mb-4 bg-rose-100 text-rose-700 border-rose-200">
                ✨ Revolutionizing Salon Management
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Streamline Your
                <span className="bg-gradient-to-r from-emerald-500 to-amber-500 bg-clip-text text-transparent">
                  {" "}
                  Salon Experience
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl">
                Effortless appointment booking and virtual queues for customers. Smart scheduling and walk-in management
                for salon professionals. Transform your salon today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-6">
                <Link href="/auth/register?role=barber">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-8">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-emerald-500 mr-2" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-emerald-500 mr-2" />
                  30-day free trial
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-emerald-500 mr-2" />
                  Setup in minutes
                </div>
              </div>
            </div>
            <div className="relative hero-image-container">
              <div className="relative bg-white rounded-2xl shadow-2xl p-4 transform rotate-3 hover:rotate-0 transition-transform duration-300 overflow-hidden">
                <Image
                  src="/images/bustling-salon.jpg"
                  alt="Bustling modern salon with stylists working and customers getting hair services in a bright, welcoming environment"
                  width={600}
                  height={400}
                  className="rounded-lg object-cover w-full h-[400px] sm:h-[350px] lg:h-[400px]"
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
                />
                
                {/* Subtle color overlay to enhance brand colors */}
                <div className="hero-image-overlay"></div>
                
                {/* Interactive overlay elements */}
                <div className="absolute top-6 left-6 bg-emerald-500/95 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg hero-overlay-float">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span>Live Bookings</span>
                  </div>
                </div>
                
                <div className="absolute bottom-6 left-6 bg-amber-500/95 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg hero-overlay-float">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>3 Available Now</span>
                  </div>
                </div>
                
                <div className="absolute top-6 right-6 bg-rose-500/95 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg hero-overlay-float">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Queue: 2 waiting</span>
                  </div>
                </div>
              </div>
              
              {/* Enhanced floating notification */}
              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-rose-500 to-rose-600 text-white p-3 rounded-full shadow-xl animate-bounce">
                <Bell className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* <div className="relative overflow-hidden">
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
                        Get Started for Free
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
      </div> */}

      {/* Features Section */}
      <div id='#features' className="py-16 bg-gradient-to-br from-gray-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Everything you need to run a modern salon
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

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How <span className='text-emerald-500'>TrimsHive</span> Works</h2>
            <p className="text-xl text-gray-600">Simple setup, powerful results</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3 text-emerald-700">Setup Your Salon</h3>
              <p className="text-gray-600">
                Add your services, stylists, and operating hours. Customize your booking preferences in minutes.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3 text-amber-700">Share Your Link</h3>
              <p className="text-gray-600">
                Share your custom booking link with customers or set up tablet kiosks for in-salon bookings.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3 text-rose-700">Manage & Grow</h3>
              <p className="text-gray-600">
                Track appointments, manage queues, and analyze your business performance with powerful insights.
              </p>
            </div>
          </div>
        </div>
      </section>

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

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Loved by salon owners and customers</h2>
            <p className="text-xl text-gray-600">See what people are saying about TrimsHive</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6">
                  "Streamline has transformed our salon! No more double bookings, and our customers love the virtual
                  queue feature. Our efficiency has increased by 40%."
                </p>
                <div className="flex items-center">
                  <Image
                    src="/images/stylist.jpeg"
                    alt="Mary Adewale"
                    width={40}
                    height={40}
                    className="rounded-full mr-3"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">Mary Adewale</p>
                    <p className="text-sm text-gray-500">Owner, Bella Hair Studio</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(4)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6">
                  "As a customer, I love being able to book appointments instantly and join virtual queues. No more
                  waiting around - I get updates right on my phone!"
                </p>
                <div className="flex items-center">
                  <Image
                    src="/images/user.jpeg"
                    alt="Jennifer Adagu"
                    width={40}
                    height={40}
                    className="rounded-full mr-3"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">Jennifer Adagu</p>
                    <p className="text-sm text-gray-500">Regular Customer</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6">
                  "The analytics dashboard gives us insights we never had before. We can see peak hours, popular
                  services, and optimize our staffing. Game changer!"
                </p>
                <div className="flex items-center">
                  <Image
                    src="/images/barber.jpeg"
                    alt="David Chen"
                    width={40}
                    height={40}
                    className="rounded-full mr-3"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">Ali Usman</p>
                    <p className="text-sm text-gray-500">Manager, Urban Cuts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-emerald-500 via-emerald-600 to-amber-500">
        <div className="mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to revolutionize your salon?</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-emerald-200">
            Join thousands of salon professionals who have transformed their business with TrimsHive.
          </p>
          <div className="mt-8 flex justify-center space-x-4 mb-6">
            <Link href="/auth/register?role=barber">
              <Button variant="secondary" className="px-8 py-3">
                Get Started
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" className="px-8 py-3 border-white text-emerald-600 hover:bg-white hover:text-emerald-600">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-emerald-100">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              30-day free trial
            </div>
            <div className="flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              Setup in 2 minutes
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 mr-2" />
              No credit card required
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Image src="/images/LOGOTYPE_1.svg" alt="TrimsHive" width={100} height={100} />
                {/* <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">TrimsHive</span> */}
              </div>
              <p className="text-gray-400 mb-4">
                Revolutionizing the salon experience with smart booking and queue management.
              </p>
              <div className="flex space-x-4">
                <Link href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </Link>
                <Link href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </Link>
                <Link href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-emerald-400">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    Integrations
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    API
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-amber-400">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    Careers
                  </Link>
                </li>
                {/* <li>
                  <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li> */}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-rose-400">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/delete-account" className="text-gray-400 hover:text-white transition-colors">
                    Delete Account
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">© {new Date().getFullYear()} TrimsHive. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}