"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  Clock,
  MapPin,
  Scissors,
  Phone,
  User,
  CheckCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import React from "react";
import { TProfile } from "@/types/profile.type";

interface QueueItem {
  id: string;
  customer_name: string;
  phone: string;
  position: number;
  join_time: string;
  status: string;
  estimated_wait_minutes: number;
}

interface BarberInfo {
  user_id: string;
  salon_name: string;
  location: string;
  is_available: boolean;
  walk_in_enabled: boolean;
  profile: {
    name: string;
    profile_picture: string;
  };
}

const supabase = createClient();

const getStatusColor = (status: string) => {
  switch (status) {
    case "in_progress":
      return { bg: "#F0FDF4", border: "#BBF7D0" };
    case "completed":
      return { bg: "#F5F5F5", border: "#E5E5E5" };
    default:
      return { bg: "#FFFBEB", border: "#FDE68A" };
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "in_progress":
      return "default";
    case "completed":
      return "secondary";
    default:
      return "outline";
  }
};

interface QueueClientProps {
  barberId: string;
}

const QueueClient: React.FC<QueueClientProps> = ({ barberId }) => {
  const [barber, setBarber] = useState<BarberInfo | null>(null);
  const [barberProfile, setBarberProfile] = useState<TProfile | null>(null)
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [joinedQueue, setJoinedQueue] = useState(false);
  const [userQueueItem, setUserQueueItem] = useState<QueueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuthentication();

    // Listen for auth state changes (token expiration, logout, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
        router.push("/auth/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!barberId) return;
    //? define the channel

        //? if not eligible to live return
        // if (
        //   !barberProfile ||
        //   !barberProfile?.subscription?.subscription?.features?.appointments
        //     ?.real_time_updates
        // )
        //   return;
    

    const channel = supabase.channel(`live-channel`);

   // console.log(channel);

    //? Listen for UPDATE events
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "queue",
        filter: `barber_id=eq.${barberId}`,
      },
      (payload) => {
        // console.log("payload from live UPDATE", payload);
        const updated = payload.new as QueueItem;
        if (Array.isArray(queue)) {
          const updatedQueue = queue.map((item) => {
            if (item.id === updated.id) {
              return { ...updated };
            }
            return item;
          });
          // .eq("status", "waiting")
          setQueue(
            updatedQueue
               .filter((v) => v.status !== "completed")
              .sort((a, b) => a.position - b.position)
          );
        }
      }
    );

    //? Listen for INSERT events
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "queue",
        filter: `barber_id=eq.${barberId}`,
      },
      (payload) => {
        // console.log("payload from live INSERT", payload);
        if (Array.isArray(queue)) {
          setQueue(
            [...queue, payload.new as QueueItem]
               .filter((v) => v.status !== "completed")
              .sort((a, b) => a.position - b.position)
          );
        }
      }
    );

    //? Subscribe to the channel
    channel.subscribe((status) => {
      console.log("Subscription status:", status);
    });

    return () => {
      //? Cleanup the channel on unmount
      supabase.removeChannel(channel);
    };
  }, [barberId, supabase, queue, barberProfile]);

  const checkAuthentication = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }
    setIsAuthenticated(true);
    setCurrentUserId(user.id);

    // Fetch customer profile for autofill
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, phone")
      .eq("id", user.id)
      .single();
    if (profile) {
      setCustomerName(profile.name || "");
      setCustomerPhone(profile.phone || "");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated && barberId) {
      fetchBarberInfo();
      fetchQueue();
      fetchBarberProfile();
      
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barberId, isAuthenticated]);

  const fetchBarberInfo = async () => {
    const { data, error } = await supabase
      .from("barber_profiles")
      .select(`*, profile:profiles(name, profile_picture)`)
      .eq("user_id", barberId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching barber info:", error);
      return;
    }

    if (data) {
      setBarber(data as any);
    }
  };
  const fetchBarberProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select(`*`)
      .eq("user_id", barberId)
      .single();

    if (error) {
      console.error("Error fetching barber info:", error);
      return;
    }

    if (data) {
      setBarberProfile(data as any);
    }
  };

  const fetchQueue = async () => {
    const { data } = await supabase
      .from("queue")
      .select("*")
      .eq("barber_id", barberId)
      // .eq("status", "waiting")
      .order("position");
    if (data) {
      setQueue(data.filter((v) => v.status !== 'completed'));
      console.log(queue);
      const existingUser = data.find((item) => item.phone === customerPhone);
      if (existingUser) {
        setUserQueueItem(existingUser);
        setJoinedQueue(true);
      }
    }
  };

  const joinQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barber || !customerName || !customerPhone) return;
    setJoining(true);
    setError("");
    try {
      const { data: existingQueue } = await supabase
        .from("queue")
        .select("*")
        .eq("barber_id", barberId)
        .eq("phone", customerPhone)
        .eq("status", "waiting");
      if (existingQueue && existingQueue.length > 0) {
        setError("This phone number is already in the queue");
        setJoining(false);
        return;
      }
      const nextPosition = queue.length + 1;
      const estimatedWait = nextPosition * 20;
      const { data, error: insertError } = await supabase
        .from("queue")
        .insert({
          barber_id: barberId,
          customer_name: customerName,
          phone: customerPhone,
          position: nextPosition,
          estimated_wait_minutes: estimatedWait,
        })
        .select()
        .single();
      if (insertError) throw insertError;
      setUserQueueItem(data);
      setJoinedQueue(true);
      await supabase.from("notifications").insert({
        type: "queue_confirmation",
        message: `You've joined the queue at ${barber.salon_name}. You're #${nextPosition} in line.`,
        phone: customerPhone,
      });
      // Send WhatsApp queue confirmation
      if (customerPhone && barber.salon_name) {
        const { whatsappService } = await import("@/lib/termii");
        await whatsappService.sendQueueConfirmation(
          customerPhone,
          barber.salon_name,
          nextPosition,
          estimatedWait
        );
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setJoining(false);
    }
  };

  const calculateWaitTime = (position: number) => {
    const averageServiceTime = 10;
    return position * averageServiceTime;
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <Scissors className="h-12 w-12 text-emerald-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">
            {!isAuthenticated
              ? "Checking authentication..."
              : "Loading queue..."}
          </p>
        </div>
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Barber not found
            </h3>
            <p className="text-gray-500">
              The barber you're looking for doesn't exist or is not available.
            </p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!barber.walk_in_enabled || !barber.is_available) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Queue Unavailable
            </h3>
            <p className="text-gray-500 mb-4">
              {!barber.is_available
                ? "This barber is currently unavailable."
                : "Walk-ins are not accepted at this time."}
            </p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        {/* Barber Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={barber?.profile?.profile_picture} />
                <AvatarFallback>
                  {barber?.profile?.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {barber?.salon_name}
                </h1>
                <p className="text-gray-600">{barber?.profile?.name}</p>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{barber?.location}</span>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">Available</Badge>
            </div>
          </CardContent>
        </Card>
        {/* Queue Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Walk-in Queue
            </CardTitle>
            <CardDescription>
              Join the queue and we'll notify you when it's your turn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">
                  {queue.length}
                </div>
                <div className="text-sm text-gray-600">People in queue</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">
                  {queue.length > 0 ? calculateWaitTime(queue.length) : 0}
                </div>
                <div className="text-sm text-gray-600">Minutes wait time</div>
              </div>
            </div>
            {!joinedQueue ? (
              <form onSubmit={joinQueue} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      placeholder="Enter your name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
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
                      placeholder="Enter your WhatsApp number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={joining}
                >
                  {joining ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining queue...
                    </>
                  ) : (
                    "Join Queue"
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    You're in the queue!
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Position:</strong> #{userQueueItem?.position}
                    </p>
                    <p>
                      <strong>Estimated wait:</strong> ~
                      {userQueueItem?.estimated_wait_minutes} minutes
                    </p>
                    <p>
                      <strong>Joined:</strong>{" "}
                      {userQueueItem
                        ? format(new Date(userQueueItem.join_time), "h:mm a")
                        : ""}
                    </p>
                  </div>
                </div>
                <p className="text-gray-600">
                  We'll send you a WhatsApp message when you're next in line.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Current Queue */}
        {queue.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Current Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {queue.map((item, index) => {
                  // Only show name if current user is barber or this customer
                  const isBarber = currentUserId === barber?.user_id;
                  const isCustomer = customerPhone === item.phone;
                  const displayName =
                    isBarber || isCustomer ? item.customer_name : "Customer";
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{
                        backgroundColor: getStatusColor(item.status).bg,
                        border: `1px solid ${
                          getStatusColor(item.status).border
                        }`,
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">#{item.position}</Badge>
                        <span className="font-medium">{displayName}</span>
                        <Badge variant={getStatusBadgeVariant(item.status)} className="capitalize">
                          {item.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>~{calculateWaitTime(item.position)} min</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default QueueClient;
