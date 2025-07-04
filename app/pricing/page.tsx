import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Star, Zap, Crown, Users, TrendingUp } from 'lucide-react'
import Navbar from '@/components/ui/navbar'
import Footer from '@/components/ui/footer'

const pricingTiers = [
  {
    name: 'Basic',
    price: '₦0',
    period: 'Free Forever',
    description: 'Perfect for individual stylists just getting started',
    features: [
      'Scheduling for 1 stylist',
      'Basic queue management (up to 5 daily appointments)',
      'Hairstyle selection (5 predefined styles)',
      'Basic profile listing on the app'
    ],
    buttonText: 'Get Started Free',
    buttonVariant: 'outline' as const,
    popular: false,
    icon: Users,
    savings: null
  },
  {
    name: 'Starter',
    price: '₦5,000',
    period: 'per month',
    description: 'Ideal for small barbershops with growing clientele',
    features: [
      'Scheduling for up to 2 stylists',
      'Basic queue management (real-time updates for up to 10 daily appointments)',
      'Customer hairstyle selection (limited to 10 predefined styles)',
      'Basic analytics (appointment history, no-show rates)'
    ],
    buttonText: 'Start Free Trial',
    buttonVariant: 'default' as const,
    popular: false,
    icon: Star,
    savings: null,
    annualPrice: '₦50,000',
    annualSavings: '17%'
  },
  {
    name: 'Pro',
    price: '₦15,000',
    period: 'per month',
    description: 'Perfect for established barbershops with multiple stylists',
    features: [
      'Scheduling for up to 5 stylists',
      'Advanced queue management (unlimited daily appointments, priority queue options)',
      'Full hairstyle selection library',
      'Customer reviews and ratings (publicly visible on app)',
      'Intermediate analytics (client retention, peak hours)',
      'In-app messaging with customers'
    ],
    buttonText: 'Start Free Trial',
    buttonVariant: 'default' as const,
    popular: true,
    icon: Zap,
    savings: 'Most Popular',
    annualPrice: '₦135,000',
    annualSavings: '25%'
  },
  {
    name: 'Enterprise',
    price: '₦30,000',
    period: 'per month',
    description: 'For large barbershop chains and premium establishments',
    features: [
      'Unlimited stylists and appointments',
      'Full queue management with AI-driven slot optimization',
      'Custom hairstyle (services) uploads by barbershop',
      'Advanced analytics (revenue tracking, customer demographics)',
      'Priority customer support (24/7 phone and chat)',
      'Marketing tools (push notifications for promotions)'
    ],
    buttonText: 'Contact Sales',
    buttonVariant: 'default' as const,
    popular: false,
    icon: Crown,
    savings: null,
    annualPrice: '₦270,000',
    annualSavings: '25%'
  }
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Navbar />
      
      {/* Header Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Scale your barbershop business with our flexible subscription tiers. 
            Start free and upgrade as you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <Card 
              key={index} 
              className={`relative transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${
                tier.popular 
                  ? 'border-2 border-emerald-600 shadow-lg scale-105' 
                  : 'border border-gray-200 dark:border-emerald-600'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-emerald-600 text-primary-foreground px-4 py-1">
                    {tier.savings}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className={`p-3 rounded-full ${
                    tier.name === 'Basic' ? 'bg-gray-100 dark:bg-gray-800' :
                    tier.name === 'Starter' ? 'bg-primary/10' :
                    tier.name === 'Pro' ? 'bg-primary/10' :
                    'bg-primary/10'
                  }`}>
                    <tier.icon className={`w-6 h-6 ${
                      tier.name === 'Basic' ? 'text-gray-600 dark:text-gray-400' :
                      'text-primary'
                    }`} />
                  </div>
                </div>
                
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tier.name}
                </CardTitle>
                
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  {tier.description}
                </CardDescription>
                
                <div className="mt-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {tier.price}
                    </span>
                    {tier.period !== 'Free Forever' && (
                      <span className="text-gray-500 dark:text-gray-400 ml-1">
                        /{tier.period}
                      </span>
                    )}
                  </div>
                  
                  {tier.period === 'Free Forever' && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      No credit card required
                    </p>
                  )}
                  
                  {tier.annualPrice && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="line-through">{tier.price}/month</span>
                        <span className="ml-2 text-emerald-600 dark:text-emerald-600 font-semibold">
                          {tier.annualPrice}/year ({tier.annualSavings} discount)
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <ul className="space-y-3">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter className="pt-6">
                <Button 
                  variant={tier.buttonVariant}
                  className={`w-full ${
                    tier.popular 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                      : ''
                  }`}
                >
                  {tier.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I switch plans anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes, all paid plans come with a 14-day free trial. No credit card required to start.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  We accept all major credit cards, debit cards, and bank transfers. All payments are processed securely.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do you offer refunds?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  We offer a 30-day money-back guarantee. If you're not satisfied, we'll refund your payment.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <Card className="bg-gradient-to-r from-emerald-600 to-emerald-600/80 text-primary-foreground border-0">
            <CardContent className="py-12">
              <h3 className="text-3xl font-bold mb-4">
                Ready to Transform Your Barbershop?
              </h3>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of barbershops already using TrimsHive to grow their business
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-gray-100">
                  Start Free Trial
                </Button>
                <Button size="lg" variant="outline" className="border-white text-emerald-600 hover:bg-white hover:text-primary">
                  Schedule Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
}
