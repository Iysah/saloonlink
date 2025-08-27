"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ArrowLeft, Loader2, Lock } from "lucide-react";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { createClient } from "@/lib/supabase";
import { TProfile } from "@/types/profile.type";
import { cn } from "@/lib/utils";
import { paymentConfig } from "@/hooks/use-paystack-payment";
import { plans } from "@/lib/tierLimits";

const PaystackButton = dynamic(
  () => import("react-paystack").then((mod) => mod.PaystackButton),
  { ssr: false }
);

const supabase = createClient();

//? Define plan details (same as in pricing page)
const pricingTiers = [
  {
    id: "basic",
    name: "Basic",
    monthlyPrice: "₦0",
    annualPrice: "₦0",
    period: "Free Forever",
    description: "Perfect for individual stylists just getting started",
    features: [
      "Scheduling for 1 stylist",
      "Basic queue management (up to 5 daily appointments)",
      "Hairstyle selection (5 predefined styles)",
      "Basic profile listing on the app",
    ],
    firstButtonText: "Get Started Free",
    buttonVariant: "outline" as const,
    popular: false,
    savings: null,
  },
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: "₦5,000",
    annualPrice: "₦50,000",
    period: "per month",
    description: "Ideal for small barbershops with growing clientele",
    features: [
      "Scheduling for up to 2 stylists",
      "Basic queue management (real-time updates for up to 10 daily appointments)",
      "Customer hairstyle selection (limited to 10 predefined styles)",
      "Basic analytics (appointment history, no-show rates)",
    ],
    firstButtonText: "Start Free Trial",
    secondButtonText: "Get Started",
    buttonVariant: "default" as const,
    popular: false,
    savings: null,
    annualSavings: "17%",
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: "₦15,000",
    annualPrice: "₦135,000",
    period: "per month",
    description: "Perfect for established barbershops with multiple stylists",
    features: [
      "Scheduling for up to 5 stylists",
      "Advanced queue management (unlimited daily appointments, priority queue options)",
      "Full hairstyle selection library",
      "Customer reviews and ratings (publicly visible on app)",
      "Intermediate analytics (client retention, peak hours)",
      "In-app messaging with customers",
    ],
    firstButtonText: "Start Free Trial",
    secondButtonText: "Get Started",
    buttonVariant: "default" as const,
    popular: true,
    savings: "Most Popular",
    annualSavings: "25%",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: "₦30,000",
    annualPrice: "₦270,000",
    period: "per month",
    description: "For large barbershop chains and premium establishments",
    features: [
      "Unlimited stylists and appointments",
      "Full queue management with AI-driven slot optimization",
      "Custom hairstyle (services) uploads by barbershop",
      "Advanced analytics (revenue tracking, customer demographics)",
      "Priority customer support (24/7 phone and chat)",
      "Marketing tools (push notifications for promotions)",
    ],
    firstButtonText: "Contact Sales",
    buttonVariant: "default" as const,
    popular: false,
    savings: null,
    annualSavings: "25%",
  },
];

function PaymentComponent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");
  const billingCycle = searchParams.get("billing") || "monthly";
  const action = searchParams.get("action") || "upgrade";

  const [userProfile, setUserProfile] = useState<TProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [transactionReference, setTransactionReference] = useState("");

  const selectedPlan =
    pricingTiers.find((tier) => tier.id === planId) || pricingTiers[0];
  const isAnnual = billingCycle === "annual";
  const amount = isAnnual
    ? parseInt(selectedPlan.annualPrice.replace(/\D/g, ""))
    : parseInt(selectedPlan.monthlyPrice.replace(/\D/g, ""));
  const displayAmount = isAnnual
    ? selectedPlan.annualPrice
    : selectedPlan.monthlyPrice;

  useEffect(() => {
    checkUser();
    // Generate a transaction reference
    setTransactionReference(
      `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    );
  }, []);

  const chosenPlan = useMemo(() => {
    if (planId ) {
      return plans.find((c) => c?.plan === planId);
    } else return plans.find((c) => c?.plan === "basic");
  }, [planId]);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
      }
    }
    setLoading(false);
  };

  console.log(userProfile)

  const handlePaymentSuccess = async (reference: any) => {
    setProcessing(true);
    try {
      // Update user subscription in the database
      const { error } = await supabase
        .from("profiles")
        .update({
            subscription: {
            subscription : {
            ...chosenPlan,
            billing_cycle: billingCycle,
            status: "active",
            start_date: new Date().toISOString(),
            end_date: isAnnual
              ? new Date(
                  new Date().setFullYear(new Date().getFullYear() + 1)
                ).toISOString()
              : new Date(
                  new Date().setMonth(new Date().getMonth() + 1)
                ).toISOString(),
            last_payment_date: new Date().toISOString(),
            payment_reference: reference.reference,
            transaction_id: reference.transaction,
           }
          },
        })
        .eq("id", userProfile?.id);

      if (error) {
        throw error;
      }

      setPaymentStatus("success");

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 3000);
    } catch (error: any) {
      console.error("Error updating subscription:", error);
      setErrorMessage(
        "Payment was successful but we encountered an issue updating your account. Please contact support."
      );
      setPaymentStatus("error");
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentClose = () => {
    // User closed the payment modal
    console.log("Payment modal closed");
  };

  if (loading || !userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  //? Prepare Paystack config
  const config = paymentConfig({
    reference: transactionReference,
    email: userProfile?.email || "",
    amount: amount,
    currency: "NGN",
  });

  //? Prepare component props for PaystackButton
  const componentProps: any = {
    ...config,
    onSuccess: (reference: any) => handlePaymentSuccess(reference),
    onClose: handlePaymentClose,
    children: (
      <Button
        className="w-full py-6 text-lg gap-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
        size="lg"
        disabled={processing}
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock size={22} />
            <span>{`Pay ${displayAmount} Now`}</span>
          </>
        )}
      </Button>
    ),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Navbar />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pricing
          </Button>

          {paymentStatus === "idle" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">
                  Complete Your Subscription
                </CardTitle>
                <CardDescription className="text-center">
                  You're subscribing to the {selectedPlan.name} plan with{" "}
                  {isAnnual ? "annual" : "monthly"} billing
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Order Summary */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg">
                  <h3 className="font-semibold text-lg mb-4">Order Summary</h3>

                  <div className="flex justify-between items-center mb-2">
                    <span>Plan</span>
                    <span className="font-medium">{selectedPlan.name}</span>
                  </div>

                  <div className="flex justify-between items-center mb-2">
                    <span>Billing Cycle</span>
                    <span className="font-medium">
                      {isAnnual ? "Annual" : "Monthly"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mb-2">
                    <span>Amount</span>
                    <span className="font-medium">{displayAmount}</span>
                  </div>

                  {isAnnual && selectedPlan.annualSavings && (
                    <div className="flex justify-between items-center mb-2">
                      <span>You Save</span>
                      <span className="font-medium text-emerald-600">
                        {selectedPlan.annualSavings}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 dark:border-slate-700 mt-4 pt-4 flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold">{displayAmount}</span>
                  </div>
                </div>

                {/* Features List */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">
                    What's included:
                  </h3>
                  <ul className="space-y-3">
                    {selectedPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {errorMessage && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                    <p className="text-red-700 dark:text-red-300 text-sm">
                      {errorMessage}
                    </p>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                {userProfile && (
                  <div className="w-full flex items-center justify-center">
                    <PaystackButton {...componentProps} />
                  </div>
                )}
              </CardFooter>
            </Card>
          )}

          {/* Success Message */}
          {paymentStatus === "success" && (
            <Card className="border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20">
              <CardHeader className="text-center">
                <div className="mx-auto bg-emerald-100 dark:bg-emerald-800/30 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                  Payment Successful!
                </CardTitle>
                <CardDescription className="text-emerald-700 dark:text-emerald-300">
                  Your subscription to {selectedPlan.name} has been activated.
                </CardDescription>
              </CardHeader>

              <CardContent className="text-center">
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  You will be redirected to your dashboard shortly. Your
                  subscription is now active.
                </p>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h4 className="font-semibold mb-2">Receipt</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Plan:</span>
                      <span>{selectedPlan.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Billing Cycle:</span>
                      <span>{isAnnual ? "Annual" : "Monthly"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount Paid:</span>
                      <span className="font-medium">{displayAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-800/30 dark:text-emerald-300">
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => (window.location.href = "/dashboard")}
                >
                  Go to Dashboard Now
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Error Message */}
          {paymentStatus === "error" && (
            <Card className="border-red-600 bg-red-50 dark:bg-red-900/20">
              <CardHeader className="text-center">
                <div className="mx-auto bg-red-100 dark:bg-red-800/30 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <X className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-red-800 dark:text-red-200">
                  Payment Failed
                </CardTitle>
                <CardDescription className="text-red-700 dark:text-red-300">
                  We couldn't process your payment for {selectedPlan.name}.
                </CardDescription>
              </CardHeader>

              <CardContent className="text-center">
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {errorMessage ||
                    "Please try again or use a different payment method."}
                </p>
              </CardContent>

              <CardFooter className="flex flex-col space-y-3">
                <Button
                  className="w-full"
                  onClick={() => setPaymentStatus("idle")}
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => (window.location.href = "/pricing")}
                >
                  Choose a Different Plan
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function Payment() {
  return (
    <Suspense>
      <PaymentComponent />
    </Suspense>
  );
}
