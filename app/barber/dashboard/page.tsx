"use client";

// ============================================================================
// IMPORTS
// ============================================================================

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, orderBy, limit, getDocs, getDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  Users,
  Settings,
  QrCode,
  MapPin,
  Play,
  CheckCircle,
  Scissors,
  LogOut,
  User,
  Menu,
  Image,
  Star,
  Copy,
  Share2,
} from "lucide-react";
import { format } from "date-fns";
import QRCode from "qrcode";
import { TProfile } from "@/types/profile.type";
import { Analytics } from "@/components/analytics/Analytics";
import { hasSubscriptionExpired } from "@/lib/utils";
import { plans } from "@/lib/tierLimits";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Interface for appointment data structure
 */
export interface Appointment {
  id: string;
  customer_id: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  customer: {
    name: string;
    phone: string;
  };
  service: {
    service_name: string;
    price: number;
    duration_minutes: number;
  };
}

/**
 * Interface for queue item data structure
 */
export interface QueueItem {
  id: string;
  customer_name: string;
  phone: string;
  position: number;
  join_time: string;
  status: string;
  estimated_wait_minutes: number;
  barber_id: string;
}

export interface ServiceItem {
  idx: number;
  id: string;
  barber_id: string;
  service_name: string;
  price: string;
  duration_minutes: number;
  service_image: string | null;
  is_predefined: boolean;
  created_at: string;
  deleted_at: string | null;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Barber Dashboard Component
 *
 * This is the main dashboard for barbers to manage their appointments,
 * walk-in queue, and business settings. It provides functionality for:
 * - Viewing and managing today's appointments
 * - Managing walk-in queue
 * - Viewing completed appointments and generating review links
 * - Managing availability settings
 * - QR code generation for walk-in customers
 */
export default function BarberDashboard() {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // User authentication state
  const [user, setUser] = useState<any>(null);

  // Business profile data
  const [barberProfile, setBarberProfile] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<TProfile | null>(null);

  // Appointment and queue data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [completedAppointments, setCompletedAppointments] = useState<
    Appointment[]
  >([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  // Business settings
  const [isAvailable, setIsAvailable] = useState(true);
  const [walkInEnabled, setWalkInEnabled] = useState(true);

  // UI state
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Refs and router
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();


  const barberSubscription = useMemo(() => {
    if (barberProfile) {
      const barberSub = userProfile?.subscription?.subscription;
      const basicPlan = plans[0];
      //? has expired - change to basic plan

      //? else continue
      return barberSub?.plan !== "basic" &&
        hasSubscriptionExpired(barberSub?.end_date!)
        ? basicPlan
        : userProfile?.subscription?.subscription;
    } else return null;
  }, [userProfile]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Main initialization effect
   * Fetches all necessary data when user is authenticated
   */
  useEffect(() => {
    let queueSubscription: any;

    const initializeData = async () => {
      // First check if user is authenticated
      await checkUser();

      if (user) {
        setLoading(false);

        // Fetch all dashboard data in parallel for better performance
        await Promise.all([
          await fetchBarberData(user.id),
          await fetchAppointments(user.id),
          await fetchCompletedAppointments(user.id),
          await fetchQueue(user.id),
          await fetchUserData(user.id),
        ])
          .then((res) => {})
          .catch((error) => {
            console.log(error);
          });
      }
    };

    initializeData();
  }, [user?.id]);

  //? Live Queue

  useEffect(() => {
    if (!user) return;
    if (
      !userProfile ||
      !barberSubscription?.features?.appointments?.real_time_updates
    )
      return;

    const q = query(
      collection(db, "queue"),
      where("barber_id", "==", user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data() as any;
        return { id: d.id, ...(data as any) } as QueueItem;
      });
      const updatedQueue = items
        .filter((v) => v.status !== "completed")
        .sort((a, b) => a.position - b.position);
      setQueue(updatedQueue);
    });

    return () => {
      unsubscribe();
    };
  }, [user, userProfile, barberSubscription]);

  /**
   * Generate QR code when user data is available
   */
  useEffect(() => {
    if (user) {
      const url = getQueueUrl();
      if (url) {
        QRCode.toDataURL(url, { width: 256 }, (err, url) => {
          if (!err && url) setQrCodeUrl(url);
        });
      }
    }
  }, [user]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  /**
   * Extract subscription information from user profile
   */

  /**
   * Extract subscription information from user profile
   */
 



  // ============================================================================
  // AUTHENTICATION FUNCTIONS
  // ============================================================================

  /**
   * Check if user is authenticated and redirect to login if not
   */

  /**
   * Check if user is authenticated and redirect to login if not
   */
  const checkUser = async () => {
    const u = auth.currentUser;
    if (!u) {
      router.push("/auth/login");
      return;
    }
    setUser(u);
  };

  // ============================================================================
  // DATA FETCHING FUNCTIONS
  // ============================================================================

  /**
   * Fetch user profile data from profiles table
   */

  /**
   * Fetch user profile data from profiles table
   */
  const fetchUserData = async (userId: string) => {
    try {
      const snap = await getDoc(doc(db, "profiles", userId));
      if (snap.exists()) {
        setUserProfile(snap.data() as TProfile);
      }
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * 
   Fetch services
   */

  const fetchServices = async (userId: string) => {
    try {
      const q = query(collection(db, "services"), where("barber_id", "==", userId));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ServiceItem[];
      if (data && data.length > 0) {
        setServices(data);
      }
    } catch (error) {}
  };

  /**
   * Fetch barber profile data including availability settings
   */
  const fetchBarberData = async (userId: string) => {
    try {
      const q = query(
        collection(db, "barber_profiles"),
        where("user_id", "==", userId),
        orderBy("created_at", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const data = docSnap.data() as any;
        setBarberProfile({ id: docSnap.id, ...data });
        setIsAvailable(data.is_available);
        setWalkInEnabled(data.walk_in_enabled);
      }
    } catch (error) {
      console.error("Error fetching barber data:", error);
    }
  };

  /**
   * Fetch today's appointments for the barber
   */
  const fetchAppointments = async (userId: string) => {
    const today = new Date().toISOString().split("T")[0];

    const q = query(
      collection(db, "appointments"),
      where("barber_id", "==", userId),
      where("appointment_date", "==", today),
      orderBy("appointment_time")
    );
    const snap = await getDocs(q);
    const base = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as any[];

    // hydrate with customer and service info
    const enriched = await Promise.all(
      base.map(async (appt) => {
        let customer: { name?: string; phone?: string } = {};
        let service: { service_name?: string; price?: number; duration_minutes?: number } = {} as any;
        try {
          const cSnap = await getDoc(doc(db, "profiles", appt.customer_id));
          if (cSnap.exists()) {
            const c = cSnap.data() as any;
            customer = { name: c.name, phone: c.phone };
          }
        } catch {}
        try {
          const sSnap = await getDoc(doc(db, "services", appt.service_id));
          if (sSnap.exists()) {
            const s = sSnap.data() as any;
            service = { service_name: s.service_name, price: s.price, duration_minutes: s.duration_minutes };
          }
        } catch {}
        return { ...appt, customer, service } as Appointment;
      })
    );

    setAppointments(enriched);
  };

  /**
   * Fetch recently completed appointments for review link generation
   */
  const fetchCompletedAppointments = async (userId: string) => {
    const q = query(
      collection(db, "appointments"),
      where("barber_id", "==", userId),
      where("status", "==", "completed"),
      orderBy("appointment_date", "desc"),
      orderBy("appointment_time", "desc"),
      limit(20)
    );
    const snap = await getDocs(q);
    const base = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as any[];
    const enriched = await Promise.all(
      base.map(async (appt) => {
        let customer: { name?: string; phone?: string } = {};
        let service: { service_name?: string; price?: number; duration_minutes?: number } = {} as any;
        try {
          const cSnap = await getDoc(doc(db, "profiles", appt.customer_id));
          if (cSnap.exists()) {
            const c = cSnap.data() as any;
            customer = { name: c.name, phone: c.phone };
          }
        } catch {}
        try {
          const sSnap = await getDoc(doc(db, "services", appt.service_id));
          if (sSnap.exists()) {
            const s = sSnap.data() as any;
            service = { service_name: s.service_name, price: s.price, duration_minutes: s.duration_minutes };
          }
        } catch {}
        return { ...appt, customer, service } as Appointment;
      })
    );
    setCompletedAppointments(enriched);
  };

  /**
   * Fetch current walk-in queue for the barber
   */
  const fetchQueue = async (userId: string) => {
    const q = query(
      collection(db, "queue"),
      where("barber_id", "==", userId),
      where("status", "==", "waiting"),
      orderBy("position")
    );
    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as QueueItem[];
    setQueue(data.filter((v) => v.status !== "completed"));
  };

  // ============================================================================
  // BUSINESS LOGIC FUNCTIONS
  // ============================================================================

  /**
   * Update barber's availability status
   */
  const updateAvailability = async (available: boolean) => {
    if (!user || !barberProfile?.id) return;

    try {
      await updateDoc(doc(db, "barber_profiles", barberProfile.id), {
        is_available: available,
      });
      setIsAvailable(available);
    } catch (error) {
      console.error("Failed to update availability", error);
    }
  };

  /**
   * Update walk-in acceptance setting
   */
  const updateWalkInEnabled = async (enabled: boolean) => {
    if (!user || !barberProfile?.id) return;

    try {
      await updateDoc(doc(db, "barber_profiles", barberProfile.id), {
        walk_in_enabled: enabled,
      });
      setWalkInEnabled(enabled);
    } catch (error) {
      console.error("Failed to update walk-in setting", error);
    }
  };

  /**
   * Start an appointment and send WhatsApp notification
   */
  const startAppointment = async (appointmentId: string) => {
    try {
      await updateDoc(doc(db, "appointments", appointmentId), {
        status: "in_progress",
      });

      fetchAppointments(user.id);

      const apptSnap = await getDoc(doc(db, "appointments", appointmentId));
      if (apptSnap.exists()) {
        const appt = apptSnap.data() as any;

        let customerPhone: string | null = null;
        try {
          const cSnap = await getDoc(doc(db, "profiles", appt.customer_id));
          if (cSnap.exists()) {
            customerPhone = (cSnap.data() as any).phone ?? null;
          }
        } catch {}

        const salonName = barberProfile?.salon_name ?? null;

        let serviceName: string | null = null;
        try {
          const sSnap = await getDoc(doc(db, "services", appt.service_id));
          if (sSnap.exists()) {
            serviceName = (sSnap.data() as any).service_name ?? null;
          }
        } catch {}

        if (customerPhone && salonName && serviceName) {
          const { whatsappService } = await import("@/lib/termii");
          await whatsappService.sendAppointmentStarted(
            customerPhone,
            salonName,
            serviceName
          );
        }
      }
    } catch (error) {
      console.error("Failed to start appointment", error);
    }
  };

  /**
   * Complete an appointment and send WhatsApp notification
   */
  const completeAppointment = async (appointmentId: string) => {
    try {
      await updateDoc(doc(db, "appointments", appointmentId), {
        status: "completed",
      });

      fetchAppointments(user.id);
      fetchCompletedAppointments(user.id);

      const apptSnap = await getDoc(doc(db, "appointments", appointmentId));
      if (apptSnap.exists()) {
        const appt = apptSnap.data() as any;

        let customerPhone: string | null = null;
        try {
          const cSnap = await getDoc(doc(db, "profiles", appt.customer_id));
          if (cSnap.exists()) {
            customerPhone = (cSnap.data() as any).phone ?? null;
          }
        } catch {}

        const salonName = barberProfile?.salon_name ?? null;

        let serviceName: string | null = null;
        try {
          const sSnap = await getDoc(doc(db, "services", appt.service_id));
          if (sSnap.exists()) {
            serviceName = (sSnap.data() as any).service_name ?? null;
          }
        } catch {}

        if (customerPhone && salonName && serviceName) {
          const { whatsappService } = await import("@/lib/termii");
          await whatsappService.sendServiceCompleted(
            customerPhone,
            salonName,
            serviceName
          );
        }
      }
    } catch (error) {
      console.error("Failed to complete appointment", error);
    }
  };

  /**
   * Start serving a queue item
   */
  const startQueueItem = async (queueId: string) => {
    try {
      await updateDoc(doc(db, "queue", queueId), { status: "in_progress" });
      fetchQueue(user.id);
    } catch (error) {
      console.error("Failed to start queue item", error);
    }
  };

  /**
   * Complete a queue item and notify next customer
   */
  const completeQueueItem = async (queueId: string) => {
    try {
      await updateDoc(doc(db, "queue", queueId), { status: "completed" });
      fetchQueue(user.id);

      await updateQueuePositions();

      const qWaiting = query(
        collection(db, "queue"),
        where("barber_id", "==", user.id),
        where("status", "==", "waiting"),
        orderBy("position")
      );
      const snap = await getDocs(qWaiting);
      if (!snap.empty) {
        const next = {
          id: snap.docs[0].id,
          ...(snap.docs[0].data() as any),
        } as QueueItem;
        if (next && next.phone && barberProfile?.salon_name) {
          const { whatsappService } = await import("@/lib/termii");
          await whatsappService.sendQueueAlert(
            next.phone,
            barberProfile.salon_name,
            next.position
          );
          await whatsappService.sendNextInLineAlert(
            next.phone,
            barberProfile.salon_name
          );
        }
      }
    } catch (error) {
      console.error("Failed to complete queue item", error);
    }
  };

  /**
   * Reorder queue positions after completing a customer
   */
  const updateQueuePositions = async () => {
    if (!user) return;

    try {
      const qWaiting = query(
        collection(db, "queue"),
        where("barber_id", "==", user.id),
        where("status", "==", "waiting"),
        orderBy("join_time")
      );

      const snap = await getDocs(qWaiting);
      const docs = snap.docs;

      for (let i = 0; i < docs.length; i++) {
        await updateDoc(doc(db, "queue", docs[i].id), {
          position: i + 1,
        });
      }

      fetchQueue(user.id);
    } catch (error) {
      console.error("Failed to update queue positions", error);
    }
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Handle user logout
   */
  const handleLogout = async () => {
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
    router.push("/auth/login");
  };

  /**
   * Generate queue URL for QR code
   */
  const getQueueUrl = () => {
    if (!user) return "";
    return `${window.location.origin}/barber/${user.id}/queue`;
  };

  /**
   * Generate review link for completed appointments
   */
  const generateReviewLink = (appointmentId: string) => {
    return `${window.location.origin}/review/${appointmentId}`;
  };

  /**
   * Copy text to clipboard with visual feedback
   */
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(text);
      // Clear copied state after 2 seconds
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <Scissors className="h-12 w-12 text-emerald-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Business Info */}
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-100 p-2 rounded-full">
                <Scissors className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {barberProfile?.salon_name || "My Dashboard"}
                </h1>
                <p className="text-sm text-gray-600">
                  {barberProfile?.location}
                </p>
              </div>
            </div>

            {/* Desktop Navigation Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push("/barber/services")}
              >
                <Image className="h-4 w-4 mr-2" />
                Services
              </Button>
              {/* Show Reviews button only for premium users */}
              {barberSubscription !== null &&
                barberSubscription?.features?.analytics?.basic && (
                  <Button
                    variant="outline"
                    onClick={() => router.push("/barber/reviews")}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Reviews
                  </Button>
                )}
              <Button
                variant="outline"
                onClick={() => router.push("/barber/profile")}
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="outline"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMenuOpen && (
            <div className="md:hidden pb-4">
              <div className="flex flex-col space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    router.push("/barber/services");
                    setIsMenuOpen(false);
                  }}
                >
                  <Image className="h-4 w-4 mr-2" />
                  Services
                </Button>
                {/* Show Reviews button only for premium users */}
                {barberSubscription !== null &&
                  barberSubscription?.features?.analytics?.basic && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        router.push("/barber/reviews");
                        setIsMenuOpen(false);
                      }}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Reviews
                    </Button>
                  )}
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    router.push("/barber/profile");
                    setIsMenuOpen(false);
                  }}
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="today" className="space-y-6">
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="queue">Queue ({queue.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Today's Appointments Tab */}
          <TabsContent value="today" className="space-y-6">
            {/* Statistics Cards */}
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Today's Appointments
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {appointments.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Walk-in Queue
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{queue.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                  <div
                    className={`h-3 w-3 rounded-full ${
                      isAvailable ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium">
                    {isAvailable ? "Available" : "Busy"}
                  </div>
                </CardContent>
              </Card>
            </div> */}

            <Analytics
              rawServices={services}
              rawQueue={queue}
              rawAppointments={appointments}
              userProfile={userProfile}
            />

            {/* Appointments List */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Appointments</CardTitle>
                <CardDescription>
                  {format(new Date(), "EEEE, MMMM d, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No appointments scheduled for today
                  </p>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">
                                {appointment?.appointment_time}
                              </span>
                            </div>
                            <Badge
                              variant={
                                appointment?.status === "completed"
                                  ? "default"
                                  : appointment?.status === "in_progress"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {appointment?.status}
                            </Badge>
                          </div>
                          <p className="font-medium mt-1">
                            {appointment?.customer?.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {appointment?.service?.service_name} - $
                            {appointment?.service?.price}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {/* Start appointment button - only show for scheduled appointments */}
                          {appointment?.status === "scheduled" && (
                            <Button
                              size="sm"
                              onClick={() => startAppointment(appointment.id)}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Start
                            </Button>
                          )}
                          {/* Complete appointment button - only show for in-progress appointments */}
                          {appointment?.status === "in_progress" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                completeAppointment(appointment?.id)
                              }
                              variant="outline"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Done
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Walk-in Queue Tab */}
          <TabsContent value="queue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Walk-in Queue</CardTitle>
                <CardDescription>Manage your walk-in customers</CardDescription>
              </CardHeader>
              <CardContent>
                {queue.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No customers in queue
                  </p>
                ) : (
                  <div className="space-y-4">
                    {queue.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3"
                      >
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-1 sm:space-y-0">
                            <Badge variant="outline" className="w-8 h-6">
                              #{item.position}
                            </Badge>
                            <span className="font-medium">
                              {item.customer_name}
                            </span>
                            <span className="text-sm text-gray-600 break-all">
                              {item.phone}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Joined: {format(new Date(item.join_time), "h:mm a")}
                          </p>
                        </div>
                        {/* Queue item actions */}
                        <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                          <Button
                            size="sm"
                            disabled={item?.status === "in_progress"}
                            onClick={() => startQueueItem(item.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                          <Button
                            size="sm"
                            disabled={item?.status === "waiting"}
                            onClick={() => completeQueueItem(item.id)}
                            variant="outline"
                            className="w-full sm:w-auto"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Done
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Completed Appointments Tab */}
          <TabsContent value="completed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Completed Appointments</CardTitle>
                <CardDescription>
                  Generate review links for your customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {completedAppointments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No completed appointments
                  </p>
                ) : (
                  <div className="space-y-4">
                    {completedAppointments.map((appointment) => {
                      const reviewLink = generateReviewLink(appointment.id);
                      const isCopied = copiedLink === reviewLink;

                      return (
                        <div
                          key={appointment.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">
                                  {format(
                                    new Date(appointment.appointment_date),
                                    "MMM d"
                                  )}{" "}
                                  at {appointment.appointment_time}
                                </span>
                              </div>
                              <Badge variant="default">Completed</Badge>
                            </div>
                            <p className="font-medium mt-1">
                              {appointment.customer?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {appointment.service?.service_name} - $
                              {appointment.service?.price}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            {/* Copy review link button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(reviewLink)}
                              className={
                                isCopied ? "bg-green-50 border-green-200" : ""
                              }
                            >
                              {isCopied ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copy Link
                                </>
                              )}
                            </Button>
                            {/* Open review link button */}
                            <Button
                              size="sm"
                              onClick={() => window.open(reviewLink, "_blank")}
                            >
                              <Share2 className="h-4 w-4 mr-1" />
                              Open
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* QR Code Section */}
            <Card>
              <CardHeader>
                <CardTitle>QR Code for Walk-ins</CardTitle>
                <CardDescription>
                  Customers can scan this to join your queue
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="bg-white p-8 rounded-lg inline-block border-2 border-dashed border-gray-300">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="Queue QR Code"
                      className="h-32 w-32 mx-auto mb-4"
                    />
                  ) : (
                    <QrCode className="h-32 w-32 text-gray-400 mx-auto mb-4" />
                  )}
                  <p className="text-sm text-gray-600 mb-4">
                    Scan to join the queue
                  </p>
                  <p className="text-xs text-gray-500 max-w-xs">
                    {getQueueUrl()}
                  </p>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
                  {/* Download QR Code button */}
                  <Button
                    onClick={() => {
                      if (!qrCodeUrl) return;
                      const link = document.createElement("a");
                      link.href = qrCodeUrl;
                      link.download = "queue-qr-code.png";
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    disabled={!qrCodeUrl}
                  >
                    Download QR Code
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Availability Settings Section */}
            <Card>
              <CardHeader>
                <CardTitle>Availability Settings</CardTitle>
                <CardDescription>
                  Manage your availability and walk-in preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Available for bookings toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="availability">Available for bookings</Label>
                    <p className="text-sm text-gray-600">
                      Turn off when you're busy or taking a break
                    </p>
                  </div>
                  <Switch
                    id="availability"
                    checked={isAvailable}
                    onCheckedChange={updateAvailability}
                  />
                </div>

                {/* Accept walk-ins toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="walkin">Accept walk-ins</Label>
                    <p className="text-sm text-gray-600">
                      Allow customers to join your walk-in queue
                    </p>
                  </div>
                  <Switch
                    id="walkin"
                    checked={walkInEnabled}
                    onCheckedChange={updateWalkInEnabled}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
