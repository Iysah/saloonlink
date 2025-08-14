'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Scissors, Plus, Edit, Loader2, ArrowLeft, Save, X } from 'lucide-react';
import { ServiceImageGallery } from '@/components/ui/service-image-gallery';

interface Service {
  id: string;
  service_name: string;
  price: number;
  duration_minutes: number;
  created_at: string;
}
const supabase = createClient()

export default function BarberServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editForm, setEditForm] = useState({
    service_name: '',
    price: '',
    duration_minutes: ''
  });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
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
  };

  useEffect(() => {
    if (user?.id) {
      fetchServices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('barber_id', user.id)
        .order('created_at');

      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setEditForm({
      service_name: service.service_name,
      price: service.price.toString(),
      duration_minutes: service.duration_minutes.toString()
    });
    setEditError('');
  };

  const handleSaveService = async () => {
    if (!editingService) return;

    setSaving(true);
    setEditError('');

    try {
      // Validate form
      if (!editForm.service_name || !editForm.price || !editForm.duration_minutes) {
        setEditError('All fields are required');
        setSaving(false);
        return;
      }

      const price = parseFloat(editForm.price);
      const duration = parseInt(editForm.duration_minutes, 10);

      if (isNaN(price) || isNaN(duration)) {
        setEditError('Price and duration must be valid numbers');
        setSaving(false);
        return;
      }

      if (price <= 0 || duration <= 0) {
        setEditError('Price and duration must be greater than 0');
        setSaving(false);
        return;
      }

      // Update service
      const { error } = await supabase
        .from('services')
        .update({
          service_name: editForm.service_name,
          price: price,
          duration_minutes: duration
        })
        .eq('id', editingService.id);

      if (error) throw error;

      // Update local state
      setServices(services.map(service => 
        service.id === editingService.id 
          ? { ...service, service_name: editForm.service_name, price, duration_minutes: duration }
          : service
      ));

      setEditingService(null);
      setEditForm({ service_name: '', price: '', duration_minutes: '' });
    } catch (error: any) {
      setEditError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingService(null);
    setEditForm({ service_name: '', price: '', duration_minutes: '' });
    setEditError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <Scissors className="h-12 w-12 text-emerald-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-emerald-600 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
        </div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Services</h1>
            <p className="text-gray-600">Manage your services and add images to attract more clients</p>
          </div>
          <Button onClick={() => router.push('/barber/setup')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {services.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No services yet</h3>
              <p className="text-gray-500 mb-4">
                Add your first service to start accepting bookings
              </p>
              <Button onClick={() => router.push('/barber/setup')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Service
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {services.map((service) => (
              <Card key={service.id} className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{service.service_name}</CardTitle>
                      <CardDescription>
                        Manage images and details for this service
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">₦{service.price}</Badge>
                      <Badge variant="outline">{service.duration_minutes}min</Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditService(service)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ServiceImageGallery serviceId={service.id} maxImages={3} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Service Dialog */}
        <Dialog open={!!editingService} onOpenChange={handleCancelEdit}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Service</DialogTitle>
              <DialogDescription>
                Update the details for {editingService?.service_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {editError && (
                <Alert variant="destructive">
                  <AlertDescription>{editError}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="service_name">Service Name</Label>
                <Input
                  id="service_name"
                  value={editForm.service_name}
                  onChange={(e) => setEditForm({ ...editForm, service_name: e.target.value })}
                  placeholder="e.g. Low-cut"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Price (₦)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  placeholder="e.g. 1,000"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  min="1"
                  step="1"
                  value={editForm.duration_minutes}
                  onChange={(e) => setEditForm({ ...editForm, duration_minutes: e.target.value })}
                  placeholder="e.g. 30"
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button onClick={handleSaveService} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 