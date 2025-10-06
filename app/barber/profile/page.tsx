"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
// import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User, MapPin, Building, ArrowLeft } from "lucide-react";
// import { Separator } from "@/components/ui/separator";
import { ProfilePictureUpload } from "@/components/ui/profile-picture-upload";
import { auth, db } from '@/lib/firebase-client';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function BarberProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({
    name: "",
    profile_picture: "",
    bio: "",
    salon_name: "",
    location: ""
  });
  const [barberProfileId, setBarberProfileId] = useState<string | null>(null);
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
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/auth/login");
        return;
      }
      setUser(u);
      await fetchProfile(u.uid);
      await fetchBarberProfile(u.uid);
      await fetchServices(u.uid);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const snap = await getDoc(doc(db, "profiles", userId));
      if (snap.exists()) {
        const data = snap.data() as any;
        setProfile((prev) => ({
          ...prev,
          name: data?.name || "",
          profile_picture: data?.profile_picture || data?.avatar_url || "",
        }));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchBarberProfile = async (userId: string) => {
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
        setBarberProfileId(docSnap.id);
        setProfile((prev) => ({
          ...prev,
          bio: data?.bio || "",
          salon_name: data?.salon_name || "",
          location: data?.location || "",
        }));
      }
    } catch (error) {
      console.error("Error fetching barber profile:", error);
    }
  };

  const fetchServices = async (userId: string) => {
    try {
      const q = query(collection(db, "services"), where("barber_id", "==", userId));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      if (data) setServices(data);
    } catch (error) {}
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
      // Update profiles document with name and profile_picture
      await setDoc(
        doc(db, "profiles", user.uid),
        {
          name: profile.name,
          profile_picture: profile.profile_picture,
          avatar_url: profile.profile_picture,
        },
        { merge: true }
      );

      // Update or create barber_profiles document
      if (barberProfileId) {
        await updateDoc(doc(db, "barber_profiles", barberProfileId), {
          bio: profile.bio,
          salon_name: profile.salon_name,
          location: profile.location,
        });
      } else {
        const ref = await addDoc(collection(db, "barber_profiles"), {
          user_id: user.uid,
          bio: profile.bio,
          salon_name: profile.salon_name,
          location: profile.location,
          created_at: serverTimestamp(),
        });
        setBarberProfileId(ref.id);
      }

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

    try {
      await addDoc(collection(db, "services"), {
        barber_id: user.uid,
        service_name: serviceForm.service_name,
        price,
        duration_minutes: duration,
        created_at: serverTimestamp(),
      });
      setServiceSuccess("Service added successfully!");
      setServiceForm({ service_name: "", price: "", duration_minutes: "" });
      await fetchServices(user.uid);
    } catch (error: any) {
      setServiceError(error?.message || "Failed to add service.");
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
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-emerald-600 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
        </div>
        <div className="text-center mb-8">
          <ProfilePictureUpload
            userId={user?.uid}
            currentImageUrl={profile.profile_picture}
            onImageUploaded={(imageUrl) => setProfile({ ...profile, profile_picture: imageUrl })}
            className="mb-4"
          />
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
                <Alert className="text-green-600 bg-green-50" variant="default">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={profile.name}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
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
      </div>
    </div>
  );
}