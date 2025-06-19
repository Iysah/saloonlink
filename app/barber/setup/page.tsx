'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Scissors, MapPin, Building, Plus, X, Loader2 } from 'lucide-react';

interface Service {
  id: string;
  service_name: string;
  price: number;
  duration_minutes: number;
}

export default function BarberSetupPage() {
  const [profile, setProfile] = useState({
    bio: '',
    salon_name: '',
    location: ''
  });
  const [services, setServices] = useState<Service[]>([]);
  const [newService, setNewService] = useState({
    service_name: '',
    price: '',
    duration_minutes: '30'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setUser(user);

    // Check if already set up
    const { data: barberProfile } = await supabase
      .from('barber_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (barberProfile && barberProfile.salon_name) {
      router.push('/barber/dashboard');
    }
  };

  const addService = () => {
    if (!newService.service_name || !newService.price) return;

    const service = {
      id: Date.now().toString(),
      service_name: newService.service_name,
      price: parseFloat(newService.price),
      duration_minutes: parseInt(newService.duration_minutes)
    };

    setServices([...services, service]);
    setNewService({ service_name: '', price: '', duration_minutes: '30' });
  };

  const removeService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // Update barber profile
      const { error: profileError } = await supabase
        .from('barber_profiles')
        .update({
          bio: profile.bio,
          salon_name: profile.salon_name,
          location: profile.location
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Insert services
      if (services.length > 0) {
        const servicesData = services.map(service => ({
          barber_id: user.id,
          service_name: service.service_name,
          price: service.price,
          duration_minutes: service.duration_minutes
        }));

        const { error: servicesError } = await supabase
          .from('services')
          .insert(servicesData);

        if (servicesError) throw servicesError;
      }

      router.push('/barber/dashboard');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-emerald-100 p-3 rounded-full">
              <Scissors className="h-10 w-10 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup Your Profile</h1>
          <p className="text-gray-600">Tell us about your salon and services</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Barber Profile Setup</CardTitle>
            <CardDescription>
              Complete your profile to start accepting bookings and walk-ins
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
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
                    onChange={(e) => setProfile({ ...profile, salon_name: e.target.value })}
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
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
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
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Services & Pricing</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input
                    placeholder="Service name"
                    value={newService.service_name}
                    onChange={(e) => setNewService({ ...newService, service_name: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Price"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Duration (min)"
                    value={newService.duration_minutes}
                    onChange={(e) => setNewService({ ...newService, duration_minutes: e.target.value })}
                  />
                  <Button type="button" onClick={addService} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {services.length > 0 && (
                  <div className="space-y-2">
                    {services.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium">{service.service_name}</span>
                          <Badge variant="secondary">${service.price}</Badge>
                          <Badge variant="outline">{service.duration_minutes}min</Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeService(service.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up profile...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}