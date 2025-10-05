"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, getDoc, doc, addDoc, orderBy, limit, onSnapshot, serverTimestamp } from "firebase/firestore";
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
import { plans } from "@/lib/tierLimits";
import { hasSubscriptionExpired } from "@/lib/utils";

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



  const barberSubscription = useMemo(() => {
    if (barberProfile) {
      const barberSub = barberProfile?.subscription?.subscription;
      const basicPlan = plans[0];
      //? has expired - change to basic plan

      //? else continue
      return barberSub?.plan !== "basic" &&
        hasSubscriptionExpired(barberSub?.end_date!)
        ? basicPlan
        : barberProfile?.subscription?.subscription;
    } else return null;
  }, [barberProfile]);

  useEffect(() => {
    checkAuthentication();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/auth/login");
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!barberId) return;
    const q = query(collection(db, "queue"), where("barber_id", "==", barberId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          ...data,
        } as QueueItem;
      });
      const updatedQueue = items
        .filter((v) => v.status !== "completed")
        .sort((a, b) => a.position - b.position);
      setQueue(updatedQueue);

      const existingUser = updatedQueue.find((item) => item.phone === customerPhone);
      if (existingUser) {
        setUserQueueItem(existingUser);
        setJoinedQueue(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [barberId, barberProfile, barberSubscription, customerPhone]);

  const checkAuthentication = async () => {
    const user = auth.currentUser;
    if (!user) {
      router.push("/auth/login");
      return;
    }
    setIsAuthenticated(true);
    setCurrentUserId(user.uid);

    const profileSnap = await getDoc(doc(db, "profiles", user.uid));
    if (profileSnap.exists()) {
      const profile = profileSnap.data() as any;
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
    try {
      const q = query(
        collection(db, "barber_profiles"),
        where("user_id", "==", barberId),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const barberData = snap.docs[0].data() as any;
        const profileSnap = await getDoc(doc(db, "profiles", barberId));
        const profileData = profileSnap.exists() ? (profileSnap.data() as any) : {};
        setBarber({
          ...(barberData as any),
          profile: {
            name: profileData?.name || "",
            profile_picture: profileData?.profile_picture || "",
          },
        } as BarberInfo);
      }
    } catch (error) {
      console.error("Error fetching barber info:", error);
    }
  };
  const fetchBarberProfile = async () => {
    try {
      const snap = await getDoc(doc(db, "profiles", barberId));
      if (snap.exists()) {
        setBarberProfile(snap.data() as TProfile);
      }
    } catch (error) {
      console.error("Error fetching barber info:", error);
    }
  };

  const fetchQueue = async () => {
    try {
      const q = query(
        collection(db, "queue"),
        where("barber_id", "==", barberId),
        orderBy("position")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as QueueItem[];
      const filtered = data.filter((v) => v.status !== "completed");
      setQueue(filtered);
      const existingUser = filtered.find((item) => item.phone === customerPhone);
      if (existingUser) {
        setUserQueueItem(existingUser);
        setJoinedQueue(true);
      }
    } catch (error) {
      console.error("Error fetching queue:", error);
    }
  };

  const joinQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barber || !customerName || !customerPhone) return;
    setJoining(true);
    setError("");
    try {
      const existingQ = query(
        collection(db, "queue"),
        where("barber_id", "==", barberId),
        where("phone", "==", customerPhone),
        where("status", "==", "waiting")
      );
      const existingSnap = await getDocs(existingQ);
      if (!existingSnap.empty) {
        setError("This phone number is already in the queue");
        setJoining(false);
        return;
      }
      const nextPosition = queue.length + 1;
      const estimatedWait = nextPosition * 20;
      const docRef = await addDoc(collection(db, "queue"), {
        barber_id: barberId,
        customer_name: customerName,
        phone: customerPhone,
        position: nextPosition,
        estimated_wait_minutes: estimatedWait,
        status: "waiting",
        join_time: new Date().toISOString(),
      });

      const newItem: QueueItem = {
        id: docRef.id,
        customer_name: customerName,
        phone: customerPhone,
        position: nextPosition,
        estimated_wait_minutes: estimatedWait,
        status: "waiting",
        join_time: new Date().toISOString(),
      };
      setUserQueueItem(newItem);
      setJoinedQueue(true);

      await addDoc(collection(db, "notifications"), {
        type: "queue_confirmation",
        message: `You've joined the queue at ${barber.salon_name}. You're #${nextPosition} in line.`,
        phone: customerPhone,
        created_at: serverTimestamp(),
      });

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
      setError(error.message || "Failed to join queue");
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
