"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Calendar, Clock, MapPin, Scissors } from "lucide-react";
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
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }
    setUser(user);
    await fetchBarberInfo();
    setLoading(false);
  };

  const fetchBarberInfo = async () => {
    const { data: barberData } = await supabase
      .from("barber_profiles")
      .select("*, profile:profiles(name, profile_picture)")
      .eq("user_id", barberId)
      .single();
    setBarber(barberData);
    const { data: servicesData } = await supabase
      .from("services")
      .select("id, service_name, price, duration_minutes")
      .eq("barber_id", barberId);
    setServices(servicesData || []);
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
      const { error: insertError } = await supabase
        .from("appointments")
        .insert({
          customer_id: user.id,
          barber_id: barberId,
          service_id: selectedService,
          appointment_date: date,
          appointment_time: time,
          status: "scheduled",
          notes
        });
      if (insertError) throw insertError;
      // Fetch customer phone number
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", user.id)
        .single();
      // Get service name
      const serviceObj = services.find(s => s.id === selectedService);
      // Send WhatsApp confirmation if phone exists
      if (profile?.phone && serviceObj) {
        const { whatsappService } = await import("@/lib/whatsapp");
        await whatsappService.sendAppointmentConfirmation(
          profile.phone,
          barber.salon_name || "Salon",
          date,
          time,
          serviceObj.service_name
        );
      }
      setSuccess("Appointment booked successfully!");
      setTimeout(() => router.push("/customer/dashboard"), 1500);
    } catch (err: any) {
      setError(err.message);
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
                      {service.service_name} - ${service.price} ({service.duration_minutes} min)
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