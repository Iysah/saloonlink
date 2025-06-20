"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User, MapPin, Building } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function BarberProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({
    name: "",
    profile_picture: "",
    bio: "",
    salon_name: "",
    location: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [serviceForm, setServiceForm] = useState({ service_name: "", price: "", duration_minutes: "" });
  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceError, setServiceError] = useState("");
  const [serviceSuccess, setServiceSuccess] = useState("");
  const router = useRouter();

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
    await fetchProfile(user.id);
    await fetchServices(user.id);
    setLoading(false);
  };

  const fetchProfile = async (userId: string) => {
    // Fetch barber profile and user profile
    const { data: barberProfile } = await supabase
      .from("barber_profiles")
      .select("*, profile:profiles(name, profile_picture)")
      .eq("user_id", userId)
      .single();
    if (barberProfile) {
      setProfile({
        name: barberProfile.profile?.name || "",
        profile_picture: barberProfile.profile?.profile_picture || "",
        bio: barberProfile.bio || "",
        salon_name: barberProfile.salon_name || "",
        location: barberProfile.location || ""
      });
    }
  };

  const fetchServices = async (userId: string) => {
    const { data, error } = await supabase
      .from("services")
      .select("id, service_name, price, duration_minutes")
      .eq("barber_id", userId)
      .order("created_at", { ascending: false });
    if (data) setServices(data);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [e.target.id]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      // Update barber_profiles
      const { error: profileError } = await supabase
        .from("barber_profiles")
        .update({
          bio: profile.bio,
          salon_name: profile.salon_name,
          location: profile.location
        })
        .eq("user_id", user.id);
      if (profileError) throw profileError;
      setSuccess("Profile updated successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setServiceForm({ ...serviceForm, [e.target.name]: e.target.value });
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setServiceLoading(true);
    setServiceError("");
    setServiceSuccess("");
    if (!serviceForm.service_name || !serviceForm.price || !serviceForm.duration_minutes) {
      setServiceError("All fields are required.");
      setServiceLoading(false);
      return;
    }
    const price = parseFloat(serviceForm.price);
    const duration = parseInt(serviceForm.duration_minutes, 10);
    if (isNaN(price) || isNaN(duration)) {
      setServiceError("Price and duration must be valid numbers.");
      setServiceLoading(false);
      return;
    }
    const { error } = await supabase
      .from("services")
      .insert({
        barber_id: user.id,
        service_name: serviceForm.service_name,
        price,
        duration_minutes: duration
      });
    if (error) {
      setServiceError(error.message);
    } else {
      setServiceSuccess("Service added successfully!");
      setServiceForm({ service_name: "", price: "", duration_minutes: "" });
      await fetchServices(user.id);
    }
    setServiceLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-rose-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.profile_picture} />
              <AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.name}</h1>
        </div>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your salon and personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
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
                <Label htmlFor="salon_name">Salon Name</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="salon_name"
                    placeholder="Enter your salon name"
                    value={profile.salon_name}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="location"
                    placeholder="Enter your salon address"
                    value={profile.location}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell customers about yourself and your experience"
                  value={profile.bio}
                  onChange={handleChange}
                  rows={4}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="shadow-xl mt-8">
          <CardHeader>
            <CardTitle>Services</CardTitle>
            <CardDescription>Add and manage your offered services</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddService} className="space-y-4 mb-6">
              {serviceError && (
                <Alert variant="destructive">
                  <AlertDescription>{serviceError}</AlertDescription>
                </Alert>
              )}
              {serviceSuccess && (
                <Alert variant="default">
                  <AlertDescription>{serviceSuccess}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="service_name">Service Name</Label>
                  <Input
                    id="service_name"
                    name="service_name"
                    value={serviceForm.service_name}
                    onChange={handleServiceChange}
                    placeholder="e.g. Low-cut"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price (NGN)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={serviceForm.price}
                    onChange={handleServiceChange}
                    placeholder="e.g. 1,000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="duration_minutes">Duration (min)</Label>
                  <Input
                    id="duration_minutes"
                    name="duration_minutes"
                    type="number"
                    min="1"
                    step="1"
                    value={serviceForm.duration_minutes}
                    onChange={handleServiceChange}
                    placeholder="e.g. 30"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={serviceLoading}>
                {serviceLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Service"
                )}
              </Button>
            </form>
            <Separator className="mb-4" />
            <div>
              {services.length === 0 ? (
                <p className="text-gray-500 text-center">No services added yet.</p>
              ) : (
                <div className="space-y-3">
                  {services.map((service) => (
                    <div key={service.id} className="flex justify-between items-center border rounded-lg p-3">
                      <div>
                        <div className="font-semibold">{service.service_name}</div>
                        <div className="text-sm text-gray-500">NGN{service.price} &bull; {service.duration_minutes} min</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 