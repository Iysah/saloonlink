"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDoc, getDocs, doc, addDoc, limit } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Calendar, Clock, MapPin, Scissors, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export default function BookBarberPage() {
  const router = useRouter();
  const params = useParams();
  const barberId = params?.barberId as string;

  const [user, setUser] = useState<any>(null);
  const [barber, setBarber] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  
  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    checkUser();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/auth/login");
    });
    return () => unsubscribe();
  }, []);

  const checkUser = async () => {
    const u = auth.currentUser;
    if (!u) {
      router.push("/auth/login");
      return;
    }
    setUser(u);
    // Fetch customer profile for autofill
    const profileSnap = await getDoc(doc(db, 'profiles', u.uid));
    if (profileSnap.exists()) {
      const profile: any = profileSnap.data();
      setCustomerName(profile.name || '');
      setCustomerPhone(profile.phone || '');
    }
    await fetchBarberInfo();
    setLoading(false);
  };

  const fetchBarberInfo = async () => {
    try {
      const q = query(
        collection(db, "barber_profiles"),
        where("user_id", "==", barberId),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        console.error("Barber not found");
        return;
      }
      const barberData = snap.docs[0].data() as any;
      // attach profile info
      const profSnap = await getDoc(doc(db, 'profiles', barberId));
      const profile = profSnap.exists() ? (profSnap.data() as any) : {};
      setBarber({
        ...barberData,
        profile: {
          name: profile?.name || '',
          profile_picture: profile?.profile_picture || '',
        }
      });
      const svcQ = query(
        collection(db, "services"),
        where("barber_id", "==", barberId)
      );
      const svcSnap = await getDocs(svcQ);
      const servicesData = svcSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setServices(servicesData || []);
    } catch (barberError) {
      console.error("Error fetching barber info:", barberError);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    if (!selectedService || !date || !time) {
      setError("Please select a service, date, and time.");
      setSubmitting(false);
      return;
    }
    try {
      const u = auth.currentUser;
      if (!u) throw new Error("Not authenticated");
      console.log("[Book] Submitting appointment:", { userId: u.uid, barberId, selectedService, date, time, notes });
      await addDoc(collection(db, "appointments"), {
        customer_id: u.uid,
        barber_id: barberId,
        service_id: selectedService,
        appointment_date: date,
        appointment_time: time,
        status: "scheduled",
        notes,
        created_at: new Date().toISOString(),
      });
      console.log("[Book] Appointment inserted successfully");
      // Fetch customer phone number
      const profileSnap = await getDoc(doc(db, 'profiles', u.uid));
      const profile: any = profileSnap.exists() ? profileSnap.data() : null;
      console.log("[Book] Fetched profile:", profile);
      // Get service name
      const serviceObj = services.find(s => s.id === selectedService);
      console.log("[Book] Service object:", serviceObj);
      // Send WhatsApp confirmation if phone exists
      if (profile?.phone && serviceObj) {
        try {
          const { whatsappService } = await import("@/lib/termii");
          console.log("[Book] Sending WhatsApp confirmation to:", profile.phone);
          const result = await whatsappService.sendAppointmentConfirmation(
            profile.phone,
            barber.salon_name || "Salon",
            date,
            time,
            serviceObj.service_name
          );
          console.log("[Book] WhatsApp send result:", result);
        } catch (waErr) {
          console.error("[Book] Error sending WhatsApp confirmation:", waErr);
        }
      } else {
        console.warn("[Book] Missing phone or serviceObj, not sending WhatsApp", { phone: profile?.phone, serviceObj });
      }
      setSuccess("Appointment booked successfully!");
      setTimeout(() => router.push("/customer/dashboard"), 1500);
    } catch (err: any) {
      setError(err.message);
      console.error("[Book] General error in handleSubmit:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-rose-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-rose-50">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Barber not found</h3>
            <p className="text-gray-500">The barber you're looking for doesn't exist or is not available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/barber/${barberId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Barber Details
          </Button>
        </div>
        
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Scissors className="h-16 w-16 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book {barber.profile?.name || "Barber"}</h1>
          <p className="text-gray-600">at {barber.salon_name}</p>
        </div>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Book an Appointment</CardTitle>
            <CardDescription>Select a service, date, and time</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert variant="default">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <select
                  id="service"
                  className="w-full border rounded px-3 py-2"
                  value={selectedService}
                  onChange={e => setSelectedService(e.target.value)}
                  required
                >
                  <option value="">Select a service</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.service_name} - ₦{service.price} ({service.duration_minutes} min)
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  min={today}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes for your appointment"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  "Book Appointment"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}