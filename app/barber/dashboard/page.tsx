'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  User
} from 'lucide-react';
import { format } from 'date-fns';
import QRCode from 'qrcode';

interface Appointment {
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

interface QueueItem {
  id: string;
  customer_name: string;
  phone: string;
  position: number;
  join_time: string;
  status: string;
  estimated_wait_minutes: number;
}

export default function BarberDashboard() {
  const [user, setUser] = useState<any>(null);
  const [barberProfile, setBarberProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [walkInEnabled, setWalkInEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

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

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setUser(user);
    await fetchBarberData(user.id);
    await fetchAppointments(user.id);
    await fetchQueue(user.id);
    setLoading(false);

    // Set up real-time subscriptions
    const queueSubscription = supabase
      .channel('queue-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue' },
        () => fetchQueue(user.id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(queueSubscription);
    };
  };

  const fetchBarberData = async (userId: string) => {
    const { data } = await supabase
      .from('barber_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      setBarberProfile(data);
      setIsAvailable(data.is_available);
      setWalkInEnabled(data.walk_in_enabled);
    }
  };

  const fetchAppointments = async (userId: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data } = await supabase
      .from('appointments')
      .select(`
        *,
        customer:profiles!appointments_customer_id_fkey(name, phone),
        service:services(service_name, price, duration_minutes)
      `)
      .eq('barber_id', userId)
      .eq('appointment_date', today)
      .order('appointment_time');

    if (data) {
      setAppointments(data as any);
    }
  };

  const fetchQueue = async (userId: string) => {
    const { data } = await supabase
      .from('queue')
      .select('*')
      .eq('barber_id', userId)
      .eq('status', 'waiting')
      .order('position');

    if (data) {
      setQueue(data);
    }
  };

  const updateAvailability = async (available: boolean) => {
    if (!user) return;

    const { error } = await supabase
      .from('barber_profiles')
      .update({ is_available: available })
      .eq('user_id', user.id);

    if (!error) {
      setIsAvailable(available);
    }
  };

  const updateWalkInEnabled = async (enabled: boolean) => {
    if (!user) return;

    const { error } = await supabase
      .from('barber_profiles')
      .update({ walk_in_enabled: enabled })
      .eq('user_id', user.id);

    if (!error) {
      setWalkInEnabled(enabled);
    }
  };

  const startAppointment = async (appointmentId: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'in_progress' })
      .eq('id', appointmentId);

    if (!error) {
      fetchAppointments(user.id);
    }
  };

  const completeAppointment = async (appointmentId: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'completed' })
      .eq('id', appointmentId);

    if (!error) {
      fetchAppointments(user.id);
    }
  };

  const startQueueItem = async (queueId: string) => {
    const { error } = await supabase
      .from('queue')
      .update({ status: 'in_progress' })
      .eq('id', queueId);

    if (!error) {
      fetchQueue(user.id);
    }
  };

  const completeQueueItem = async (queueId: string) => {
    const { error } = await supabase
      .from('queue')
      .update({ status: 'completed' })
      .eq('id', queueId);

    if (!error) {
      fetchQueue(user.id);
      // Update positions for remaining queue items
      updateQueuePositions();
    }
  };

  const updateQueuePositions = async () => {
    if (!user) return;
    
    const { data: waitingQueue } = await supabase
      .from('queue')
      .select('id')
      .eq('barber_id', user.id)
      .eq('status', 'waiting')
      .order('join_time');

    if (waitingQueue) {
      for (let i = 0; i < waitingQueue.length; i++) {
        await supabase
          .from('queue')
          .update({ position: i + 1 })
          .eq('id', waitingQueue[i].id);
      }
      fetchQueue(user.id);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const getQueueUrl = () => {
    if (!user) return '';
    return `${window.location.origin}/barber/${user.id}/queue`;
  };

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
                <h1 className="text-xl font-bold text-gray-900">
                  {barberProfile?.salon_name || 'Salon Dashboard'}
                </h1>
                <p className="text-sm text-gray-600">{barberProfile?.location}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/barber/profile')}
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="queue">Queue ({queue.length})</TabsTrigger>
            <TabsTrigger value="qr-code">QR Code</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{appointments.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Walk-in Queue</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{queue.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                  <div className={`h-3 w-3 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium">
                    {isAvailable ? 'Available' : 'Busy'}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Today's Appointments</CardTitle>
                <CardDescription>
                  {format(new Date(), 'EEEE, MMMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No appointments scheduled for today</p>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{appointment.appointment_time}</span>
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
                          <p className="font-medium mt-1">{appointment.customer.name}</p>
                          <p className="text-sm text-gray-600">
                            {appointment.service.service_name} - ${appointment.service.price}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {appointment.status === 'scheduled' && (
                            <Button 
                              size="sm" 
                              onClick={() => startAppointment(appointment.id)}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Start
                            </Button>
                          )}
                          {appointment.status === 'in_progress' && (
                            <Button 
                              size="sm" 
                              onClick={() => completeAppointment(appointment.id)}
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

          <TabsContent value="queue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Walk-in Queue</CardTitle>
                <CardDescription>
                  Manage your walk-in customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {queue.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No customers in queue</p>
                ) : (
                  <div className="space-y-4">
                    {queue.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline">#{item.position}</Badge>
                            <span className="font-medium">{item.customer_name}</span>
                            <span className="text-sm text-gray-600">{item.phone}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Joined: {format(new Date(item.join_time), 'h:mm a')}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            onClick={() => startQueueItem(item.id)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => completeQueueItem(item.id)}
                            variant="outline"
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

          <TabsContent value="qr-code" className="space-y-6">
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
                    <img src={qrCodeUrl} alt="Queue QR Code" className="h-32 w-32 mx-auto mb-4" />
                  ) : (
                    <QrCode className="h-32 w-32 text-gray-400 mx-auto mb-4" />
                  )}
                  <p className="text-sm text-gray-600 mb-4">Scan to join the queue</p>
                  <p className="text-xs text-gray-500 max-w-xs">
                    {getQueueUrl()}
                  </p>
                </div>
                <div className="mt-6">
                  <Button onClick={() => window.open(getQueueUrl(), '_blank')}>
                    Open Queue Page
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Availability Settings</CardTitle>
                <CardDescription>
                  Manage your availability and walk-in preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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