"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ReviewForm } from '@/components/ui/review-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, ArrowLeft, Loader2 } from 'lucide-react';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  barber: {
    user_id: string;
    salon_name: string;
    profile: {
      name: string;
    };
  };
  service: {
    service_name: string;
  };
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params?.appointmentId as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to leave a review');
        setLoading(false);
        return;
      }

      // Fetch appointment details
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          barber:barber_profiles!appointments_barber_id_fkey(
            user_id,
            salon_name,
            profile:profiles(name)
          ),
          service:services(service_name)
        `)
        .eq('id', appointmentId)
        .eq('customer_id', user.id)
        .single();

      if (appointmentError) {
        throw appointmentError;
      }

      if (!appointmentData) {
        setError('Appointment not found');
        setLoading(false);
        return;
      }

      // Check if appointment is completed
      if (appointmentData.status !== 'completed') {
        setError('You can only review completed appointments');
        setLoading(false);
        return;
      }

      setAppointment(appointmentData as any);

      // Check if review already exists
      const { data: existingReviewData } = await supabase
        .from('reviews')
        .select('*')
        .eq('appointment_id', appointmentId)
        .eq('customer_id', user.id)
        .single();

      if (existingReviewData) {
        setExistingReview(existingReviewData);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (rating: number, reviewText: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !appointment) return;

    const { error } = await supabase
      .from('reviews')
      .insert({
        customer_id: user.id,
        barber_id: appointment.barber.user_id,
        appointment_id: appointmentId,
        rating,
        review_text: reviewText || null
      });

    if (error) {
      throw error;
    }

    setReviewSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-emerald-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => router.push('/customer/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (existingReview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Review Already Submitted</h2>
              <p className="text-gray-600 mb-4">
                You have already submitted a review for this appointment.
              </p>
              <Button onClick={() => router.push('/customer/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (reviewSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Review Submitted!</h2>
              <p className="text-gray-600 mb-4">
                Thank you for your feedback. Your review has been submitted successfully.
              </p>
              <Button onClick={() => router.push('/customer/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!appointment) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/customer/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <Card className="mb-4">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                {appointment.barber.salon_name}
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                {appointment.barber.profile.name}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                {appointment.service.service_name}
              </p>
              <p className="text-sm text-gray-600">
                {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.appointment_time}
              </p>
            </CardContent>
          </Card>
        </div>

        <ReviewForm
          barberId={appointment.barber.user_id}
          appointmentId={appointmentId}
          barberName={appointment.barber.profile.name}
          onSubmit={handleSubmitReview}
          onCancel={() => router.push('/customer/dashboard')}
        />
      </div>
    </div>
  );
} 