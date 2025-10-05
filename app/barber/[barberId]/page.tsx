"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Scissors,
  MapPin,
  Clock,
  Users,
  Calendar,
  Image as ImageIcon,
  ArrowLeft,
} from "lucide-react";
import { TProfile } from "@/types/profile.type";
import { UpgradeModal } from "@/components/UpgradeModal";
import { plans } from "@/lib/tierLimits";
import { hasSubscriptionExpired } from "@/lib/utils";
import { db } from "@/lib/firebase-client";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
// Add count aggregation for appointments
import { getCountFromServer } from "firebase/firestore";

interface Service {
  id: string;
  service_name: string;
  price: number;
  duration_minutes: number;
  images?: ServiceImage[];
}

interface ServiceImage {
  id: string;
  image_url: string;
  image_order: number;
}

interface BarberInfo {
  user_id: string;
  salon_name: string;
  location: string;
  bio: string;
  is_available: boolean;
  walk_in_enabled: boolean;
  profile: {
    name: string;
    profile_picture: string;
  };
}

export default function BarberDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const barberId = params?.barberId as string;

  const [barber, setBarber] = useState<BarberInfo | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [appointmentCount, setAppointmentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOpenSubModal, setOpenSubModal] = useState(false);
  const [barberProfile, setBarberProfile] = useState<TProfile | null>(null);

  useEffect(() => {
    (async () => {
      if (barberId) {
        setLoading(true);
        await Promise.all([fetchBarberDetails(), fetchBarberProfile()]);

        setLoading(false);
      }
    })();
  }, [barberId]);

  const fetchBarberProfile = async () => {
    try {
      const profileRef = doc(db, "profiles", barberId);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        setBarberProfile(profileSnap.data() as TProfile);
      }
    } catch (err) {
      console.error("Error fetching barber profile:", err);
    }
  };

  const fetchAppointments = async () => {
    try {
      const q = query(
        collection(db, "appointments"),
        where("barber_id", "==", barberId)
      );
      const aggregateSnap = await getCountFromServer(q);
      const count = aggregateSnap.data().count || 0;
      setAppointmentsCount(count);
    } catch (err) {
      console.error("Error fetching appointments count:", err);
    }
  };

  const fetchBarberDetails = async () => {
    try {
      // Get latest barber profile doc by user_id
      const barberProfilesQ = query(
        collection(db, "barber_profiles"),
        where("user_id", "==", barberId),
        orderBy("created_at", "desc"),
        limit(1)
      );
      const barberProfilesSnap = await getDocs(barberProfilesQ);
      if (barberProfilesSnap.empty) {
        setError("Barber not found");
        return;
      }
      const barberData = barberProfilesSnap.docs[0].data();

      // Fetch linked profile info for name and avatar
      let profileData: { name?: string; profile_picture?: string } = {};
      try {
        const profileRef = doc(db, "profiles", barberId);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const p = profileSnap.data() as any;
          profileData = { name: p?.name, profile_picture: p?.profile_picture };
        }
      } catch (err) {
        console.warn("Could not fetch linked profile:", err);
      }

      setBarber({ ...(barberData as any), profile: profileData } as any);

      // Fetch services for barber
      const servicesQ = query(
        collection(db, "services"),
        where("barber_id", "==", barberId),
        orderBy("created_at", "asc")
      );
      const servicesSnap = await getDocs(servicesQ);
      const baseServices = servicesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

      const servicesWithImages = await Promise.all(
        baseServices.map(async (service: any) => {
          const imagesQ = query(
            collection(db, "service_images"),
            where("service_id", "==", service.id),
            orderBy("image_order", "asc")
          );
          const imagesSnap = await getDocs(imagesQ);
          const images = imagesSnap.docs.map((img) => ({ id: img.id, ...(img.data() as any) }));
          return { ...service, images } as Service;
        })
      );

      setServices(servicesWithImages);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <Scissors className="h-12 w-12 text-emerald-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading barber details...</p>
        </div>
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Barber not found
            </h3>
            <p className="text-gray-500 mb-4">
              The barber you're looking for doesn't exist or is not available.
            </p>
            <Button onClick={() => router.push("/customer/dashboard")}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-emerald-600 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
        </div>
        {/* Barber Header */}
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={barber.profile?.profile_picture} />
                <AvatarFallback className="text-2xl">
                  {barber.profile?.name?.charAt(0) || "B"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {barber.salon_name}
                </h1>
                <p className="text-xl text-gray-600 mb-2">
                  {barber.profile?.name}
                </p>
                <div className="flex items-center text-gray-500 mb-3">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{barber.location}</span>
                </div>

                <div className="flex items-center space-x-4">
                  <Badge
                    className={
                      barber.is_available
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }
                  >
                    {barber.is_available ? "Available" : "Busy"}
                  </Badge>
                  {barber.walk_in_enabled && (
                    <Badge variant="outline">Walk-ins Welcome</Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                {/**&& */}
                {
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      if (
                        barberSubscription &&
                        barberSubscription?.plan === "basic" &&
                        appointmentCount === 5
                      ) {
                        return setOpenSubModal(true);
                      }
                      if (
                        barberSubscription &&
                        barberSubscription?.plan === "starter" &&
                        appointmentCount === 10
                      ) {
                        return setOpenSubModal(true);
                      }
                      router.push(`/barber/${barberId}/book`);
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Appointment
                  </Button>
                }
                {barber.walk_in_enabled && (
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/barber/${barberId}/queue`)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Join Queue
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bio */}
        {barber.bio && (
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{barber.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle>Services & Pricing</CardTitle>
            <CardDescription>
              Browse our services and see examples of our work
            </CardDescription>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <div className="text-center py-8">
                <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  No services available at the moment.
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {services.map((service) => (
                  <div key={service.id} className="border rounded-lg p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {service.service_name}
                        </h3>
                        <div className="flex items-center space-x-4">
                          <Badge
                            variant="secondary"
                            className="text-lg px-3 py-1"
                          >
                            ₦{service.price}
                          </Badge>
                          <div className="flex items-center text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{service.duration_minutes} minutes</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        className="mt-4 md:mt-0 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => router.push(`/barber/${barberId}/book`)}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Book This Service
                      </Button>
                    </div>

                    {/* Service Images */}
                    {service.images && service.images.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Examples of this service
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {service.images.map((image, index) => (
                            <div
                              key={image.id}
                              className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
                            >
                              <img
                                src={image.image_url}
                                alt={`${service.service_name} example ${
                                  index + 1
                                }`}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact & Booking CTA */}
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Ready to book your appointment?
              </h3>
              <p className="text-gray-600 mb-4">
                Choose from our services and book a time that works for you
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => router.push(`/barber/${barberId}/book`)}
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Book Appointment
                </Button>
                {barber.walk_in_enabled && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => router.push(`/barber/${barberId}/queue`)}
                  >
                    <Users className="h-5 w-5 mr-2" />
                    Join Walk-in Queue
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <UpgradeModal
        onClose={() => setOpenSubModal(false)}
        isOpen={isOpenSubModal}
      />
    </div>
  );
}
