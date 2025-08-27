"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Scissors,
  Mail,
  Lock,
  User,
  Phone,
  Loader2,
  Eye,
  EyeOff,
  UserRound,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { plans } from "@/lib/tierLimits";

const supabase = createClient();

function RegisterPageComponent() {
  const params = useSearchParams();
  const plan = params.get("plan");
  const trial = params.get("trial");
  const billing = params.get("billing");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "" as "" | "customer" | "barber", // Start with empty role
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const selectedPlan = useMemo(() => {
    if (plan && trial === "true") {
      return plans.find((c) => c?.plan === plan);
    } else return plans.find((c) => c?.plan === "basic");
  }, [plan, trial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.role) {
      setError("Please select your role");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: formData.role,
            phone: formData.phone,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // The database trigger will automatically create the profile
      // Wait a moment for the trigger to execute
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update the profile with the correct information (in case trigger used defaults)
      // Use upsert to handle cases where profile might already exist
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: authData.user.id,
          name: formData.name,
          role: formData.role,
          email: formData.email,
          phone: formData.phone,
          //? add user subscription info
          subscription:
            formData.role === "barber"
              ? {
                  subscription: {
                    ...selectedPlan,
                    end_date:
                      selectedPlan?.plan !== "basic"
                        ? new Date(
                            Date.now() + 7 * 24 * 60 * 60 * 1000
                          ).toISOString()
                        : null,
                  },
                }
              : null,
        },
        {
          onConflict: "id",
        }
      );

      if (profileError) throw profileError;

      // Redirect to appropriate setup page
      if (formData.role === "barber") {
        if (trial === "false")
          return router.push(`/payment?plan=${plan}&billing=${billing}`);
        router.push("/barber/setup");
      } else {
        router.push("/customer/dashboard");
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl shadow-xl">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-emerald-100 px-3 py-6 rounded-full">
              <Image
                src="/images/LOGOTYPE_1.svg"
                alt="TrimsHive"
                width={70}
                height={70}
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Create Account
          </CardTitle>
          <CardDescription className="text-gray-600">
            Join our salon booking platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Role Selection Cards */}
            {!formData.role ? (
              <div className="space-y-4">
                <Label className="block text-center text-lg font-medium mb-4">
                  I am a...
                </Label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, role: "customer" })
                    }
                    className="flex-1"
                  >
                    <Card className="hover:border-emerald-400 hover:shadow-md transition-all h-full">
                      <CardContent className="p-6 flex flex-col items-center">
                        <div className="bg-emerald-100 p-4 rounded-full mb-4">
                          <UserRound className="h-6 w-6 text-emerald-600" />
                        </div>
                        <h3 className="font-medium text-lg">Customer</h3>
                        <p className="text-sm text-gray-500 text-center mt-1">
                          Book appointments with barbers
                        </p>
                      </CardContent>
                    </Card>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: "barber" })}
                    className="flex-1"
                  >
                    <Card className="hover:border-emerald-400 hover:shadow-md transition-all h-full">
                      <CardContent className="p-6 flex flex-col items-center">
                        <div className="bg-rose-100 p-4 rounded-full mb-4">
                          <Scissors className="h-6 w-6 text-rose-600" />
                        </div>
                        <h3 className="font-medium text-lg">Barber/Stylist</h3>
                        <p className="text-sm text-gray-500 text-center mt-1">
                          Manage your business and clients
                        </p>
                      </CardContent>
                    </Card>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-start mb-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: "" })}
                    className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center"
                  >
                    <span className="mr-1">←</span> Change role
                  </button>
                </div>

                <div className="flex items-center justify-center mb-6">
                  <div className="bg-gradient-to-r from-emerald-100 to-rose-100 px-4 py-2 rounded-full flex items-center">
                    {formData.role === "customer" ? (
                      <>
                        <UserRound className="h-4 w-4 text-emerald-600 mr-2" />
                        <span className="text-sm font-medium text-emerald-800">
                          Registering as Customer
                        </span>
                      </>
                    ) : (
                      <>
                        <Scissors className="h-4 w-4 text-rose-600 mr-2" />
                        <span className="text-sm font-medium text-rose-800">
                          Registering as Barber
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">WhatsApp Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your whatsapp number"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            password: e.target.value,
                          })
                        }
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Create Account
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>

          {formData.role && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return;
  <Suspense>
    <RegisterPageComponent />
  </Suspense>;
}
