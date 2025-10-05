'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StarRating } from '@/components/ui/star-rating';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  MapPin, 
  Clock, 
  Star,
  Calendar,
  Users,
  Scissors,
  LogOut,
  User,
  Menu,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';

interface Barber {
  user_id: string;
  bio: string;
  salon_name: string;
  location: string;
  is_available: boolean;
  walk_in_enabled: boolean;
  profile: {
    name: string;
    profile_picture: string;
  };
  services: Array<{
    id: string;
    service_name: string;
    price: number;
    duration_minutes: number;
  }>;
  average_rating?: number;
  review_count?: number;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  barber: Barber;
  service: {
    service_name: string;
    price: number;
  };
}

import { auth, db } from '@/lib/firebase-client';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';



export default function CustomerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'rating'>('rating');
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push('/auth/login');
        return;
      }
      setUser(firebaseUser);
      await fetchBarbers();
      await fetchUserAppointments(firebaseUser.uid);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const fetchBarbers = async () => {
    const barberSnap = await getDocs(
      query(collection(db, 'barber_profiles'), where('is_available', '==', true))
    );

    const barbersWithRatings = await Promise.all(
      barberSnap.docs.map(async (docSnap) => {
        const barber: any = { user_id: docSnap.id, ...docSnap.data() };

        // Fetch profile
        let profile: { name: string; profile_picture: string } | undefined = undefined;
        try {
          const profileSnap = await getDoc(doc(db, 'profiles', barber.user_id));
          if (profileSnap.exists()) {
            const p = profileSnap.data() as any;
            profile = {
              name: p?.name || '',
              profile_picture: p?.profile_picture || '',
            };
          }
        } catch (e) {}

        // Fetch services
        const servicesSnap = await getDocs(
          query(collection(db, 'services'), where('barber_id', '==', barber.user_id))
        );
        const services = servicesSnap.docs.map((s) => ({ id: s.id, ...(s.data() as any) }));

        // Fetch ratings
        const ratingSnap = await getDocs(
          query(collection(db, 'reviews'), where('barber_id', '==', barber.user_id))
        );
        const ratings = ratingSnap.docs.map((r) => ((r.data() as any)?.rating ?? 0));
        const averageRating = ratings.length > 0
          ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length
          : 0;

        return {
          ...barber,
          profile,
          services,
          average_rating: averageRating,
          review_count: ratings.length,
        };
      })
    );

    setBarbers(barbersWithRatings as any);
  };

  const fetchUserAppointments = async (userId: string) => {
    const today = new Date().toISOString().split('T')[0];

    const q = query(
      collection(db, 'appointments'),
      where('customer_id', '==', userId),
      where('appointment_date', '>=', today),
      orderBy('appointment_date'),
      orderBy('appointment_time')
    );

    const apptSnap = await getDocs(q);

    const data = await Promise.all(
      apptSnap.docs.map(async (d) => {
        const appt: any = { id: d.id, ...(d.data() as any) };

        // Join barber info
        let barber: any = appt.barber;
        try {
          const barberSnap = await getDoc(doc(db, 'barber_profiles', appt.barber_id));
          if (barberSnap.exists()) {
            const bp = barberSnap.data() as any;
            let profile: any = undefined;
            const profSnap = await getDoc(doc(db, 'profiles', appt.barber_id));
            if (profSnap.exists()) profile = { name: (profSnap.data() as any)?.name };
            barber = { salon_name: bp?.salon_name, location: bp?.location, profile };
          }
        } catch (e) {}

        // Join service info
        let service: any = appt.service;
        try {
          const svcSnap = await getDoc(doc(db, 'services', appt.service_id));
          if (svcSnap.exists()) {
            const sv = svcSnap.data() as any;
            service = { service_name: sv?.service_name, price: sv?.price };
          }
        } catch (e) {}

        return { ...appt, barber, service } as Appointment;
      })
    );

    if (data) {
      setAppointments(data as any);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/auth/login');
  };

  const filteredAndSortedBarbers = barbers
    .filter(barber => 
      barber?.salon_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      barber?.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      barber?.profile?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.average_rating || 0) - (a.average_rating || 0);
      } else {
        return (a.salon_name || '').localeCompare(b.salon_name || '');
      }
    });



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <Scissors className="h-12 w-12 text-emerald-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-100 p-2 rounded-full">
                <Scissors className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Find Your Perfect Cut</h1>
                <p className="text-sm text-gray-600">Book appointments or join queues</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/customer/profile')}
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
              <Button variant="outline" onClick={() => setIsMenuOpen(!isMenuOpen)}>
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
                    router.push('/customer/profile');
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Search and Sort Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by salon name, location, or barber..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <Select value={sortBy} onValueChange={(value: 'name' | 'rating') => setSortBy(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="name">Name A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          {appointments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Upcoming Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">
                              {format(new Date(appointment.appointment_date), 'MMM d')} at {appointment.appointment_time}
                            </span>
                          </div>
                          <Badge 
                            variant={
                              appointment.status === 'completed' ? 'default' :
                              appointment.status === 'in_progress' ? 'secondary' :
                              'outline'
                            }
                          >
                            {appointment.status}
                          </Badge>
                        </div>
                        <p className="font-medium mt-1">{appointment.barber.salon_name}</p>
                        <p className="text-sm text-gray-600">
                          {appointment?.service.service_name} - ₦{appointment?.service.price}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Barbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedBarbers?.map((barber: Barber) => (
              <Card key={barber?.user_id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={barber?.profile?.profile_picture} />
                      <AvatarFallback>
                        {barber?.profile?.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {barber?.salon_name}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {barber?.profile?.name}
                      </p>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="truncate">{barber?.location}</span>
                      </div>
                      {barber.average_rating && barber.average_rating > 0 && (
                        <div className="flex items-center mt-2">
                          <StarRating 
                            rating={barber.average_rating} 
                            readonly 
                            size="sm" 
                            showValue 
                          />
                          <span className="text-xs text-gray-500 ml-1">
                            ({barber.review_count} reviews)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Services</span>
                      <div className="flex items-center space-x-2">
                        {barber?.is_available && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            Available
                          </Badge>
                        )}
                        {barber?.walk_in_enabled && (
                          <Badge variant="outline" className="text-xs">
                            Walk-ins
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {barber?.services.slice(0, 2).map((service) => (
                        <div key={service.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">{service.service_name}</span>
                          <span className="font-medium">₦{service.price}</span>
                        </div>
                      ))}
                      {barber?.services.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{barber.services.length - 2} more services
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => router.push(`/barber/${barber.user_id}`)}
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      {barber.walk_in_enabled && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => router.push(`/barber/${barber.user_id}/queue`)}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Queue
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAndSortedBarbers.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No barbers found</h3>
                <p className="text-gray-500">
                  Try adjusting your search or check back later for available barbers.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}