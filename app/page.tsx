'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// import { createClient } from '@/lib/supabase';
import { auth, db } from '@/lib/firebase-client';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
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
  Shield,
  Smartphone,
  BarChart3,
  MessageSquare,
  CreditCard,
  
} from 'lucide-react';
import Image from "next/image"
import Link from "next/link"
import Footer from '@/components/ui/footer';
import Navbar from '@/components/ui/navbar';
import { User } from '@supabase/supabase-js';


export default function HomePage() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const { elementRef: featuresRef, isIntersecting: featuresVisible } = useIntersectionObserver();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Get user profile to determine role
        const profileSnap = await getDoc(doc(db, 'profiles', firebaseUser.uid));
        if (profileSnap.exists()) {
          setUserProfile(profileSnap.data());
        }
      }
    });
    return () => unsub();
  }, []);

  const checkUser = async () => { /* Supabase auth check removed */ };
  const features = [
    {
      icon: Calendar,
      title: 'Smart Booking',
      description: 'Book appointments with your favorite stylists in advance',
      color: 'emerald',
      size: 'large'
    },
    {
      icon: Users,
      title: 'Walk-in Queue',
      description: 'Join virtual queues and get notified when it\'s your turn',
      color: 'amber',
      size: 'medium'
    },
    {
      icon: Clock,
      title: 'Real-time Updates',
      description: 'Get instant notifications about your appointment status',
      color: 'rose',
      size: 'medium'
    },
    {
      icon: MapPin,
      title: 'Find Nearby',
      description: 'Discover great barbers and salons in your area',
      color: 'blue',
      size: 'small'
    },
    {
      icon: Smartphone,
      title: 'Mobile App',
      description: 'Access your salon management tools on the go',
      color: 'purple',
      size: 'small'
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'Track performance and optimize your business',
      color: 'indigo',
      size: 'large'
    },
    {
      icon: MessageSquare,
      title: 'WhatsApp Integration',
      description: 'Send notifications directly to customers',
      color: 'green',
      size: 'medium'
    },
    {
      icon: CreditCard,
      title: 'Payment Processing',
      description: 'Accept payments securely online and offline',
      color: 'teal',
      size: 'small'
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
      <Navbar />

      {/* Hero Section */}
      <section className="pt-12 pb-16 sm:pt-16 sm:pb-20 bg-gradient-to-br from-emerald-50 via-white to-amber-500">
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
               {user ? <Link href={userProfile?.role === 'barber' ? '/barber/dashboard' : userProfile?.role === 'customer' ? '/customer/dashboard' : '/customer/dashboard'}>
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-8">
                    Go to Dashboard
                  </Button>
                </Link> : <>
                <Link href="/auth/register?role=barber">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-8">
                    Get Started for Free
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
                </>}
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

      {/* Features Section - Bento Grid */}
      <div id='#features' className="py-20 bg-gradient-to-br from-gray-50 via-emerald-50 to-rose-50 relative overflow-hidden">
        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-rose-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-amber-200/30 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4">
              Everything you need to run a modern salon
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-600">
              Modern solutions for both customers and barbers, designed to streamline your entire salon experience
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
            {features.map((feature, index) => {
              const colorClasses = {
                emerald: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
                amber: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
                rose: 'bg-rose-50 border-rose-200 hover:bg-rose-100',
                blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
                purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
                indigo: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
                green: 'bg-green-50 border-green-200 hover:bg-green-100',
                teal: 'bg-teal-50 border-teal-200 hover:bg-teal-100'
              };

              const iconColorClasses = {
                emerald: 'text-emerald-600 bg-emerald-100',
                amber: 'text-amber-600 bg-amber-100',
                rose: 'text-rose-600 bg-rose-100',
                blue: 'text-blue-600 bg-blue-100',
                purple: 'text-purple-600 bg-purple-100',
                indigo: 'text-indigo-600 bg-indigo-100',
                green: 'text-green-600 bg-green-100',
                teal: 'text-teal-600 bg-teal-100'
              };

              const sizeClasses = {
                small: 'md:col-span-1 md:row-span-1',
                medium: 'md:col-span-1 md:row-span-2',
                large: 'md:col-span-2 md:row-span-2'
              };

              return (
                <Card 
                  key={index} 
                  className={`
                    group relative overflow-hidden border-2 transition-all duration-500 ease-out
                    hover:scale-105 hover:shadow-2xl hover:shadow-black/10
                    ${colorClasses[feature.color as keyof typeof colorClasses]}
                    ${sizeClasses[feature.size as keyof typeof sizeClasses]}
                    ${featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                  `}
                  style={{
                    transitionDelay: `${index * 100}ms`,
                    transitionDuration: '0.6s',
                    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <CardContent className="p-6 h-full flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className={`
                          p-3 rounded-xl transition-transform duration-300 group-hover:scale-110
                          ${iconColorClasses[feature.color as keyof typeof iconColorClasses]}
                        `}>
                          <feature.icon className="h-6 w-6" />
                        </div>
                        {feature.size === 'large' && (
                          <div className="text-xs font-medium text-gray-500 bg-white/50 px-2 py-1 rounded-full">
                            Premium
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/20 to-transparent rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-700"></div>
                    
                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Additional decorative elements */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">All features included in your subscription</span>
            </div>
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
      <Footer />  
    </div>
  );
}