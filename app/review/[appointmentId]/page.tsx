"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase-client';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
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
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setError('You must be logged in to leave a review');
        setLoading(false);
        router.push('/auth/login');
        return;
      }
      setCurrentUser(u);
      if (appointmentId) {
        await fetchAppointment(u.uid);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [appointmentId]);

  const fetchAppointment = async (uid: string) => {
    try {
      const apptSnap = await getDoc(doc(db, 'appointments', appointmentId));
      if (!apptSnap.exists()) {
        setError('Appointment not found');
        return;
      }
      const apptData = apptSnap.data() as any;

      // Verify appointment belongs to current user
      if (apptData?.customer_id !== uid) {
        setError('You can only review your own appointment');
        return;
      }

      // Check if appointment is completed
      if (apptData?.status !== 'completed') {
        setError('You can only review completed appointments');
        return;
      }

      // Join barber info
      let barber: any = { user_id: apptData?.barber_id, salon_name: '', profile: { name: '' } };
      try {
        const barberSnap = await getDoc(doc(db, 'barber_profiles', apptData.barber_id));
        if (barberSnap.exists()) {
          const bp = barberSnap.data() as any;
          barber.salon_name = bp?.salon_name || '';
        }
        const profSnap = await getDoc(doc(db, 'profiles', apptData.barber_id));
        if (profSnap.exists()) {
          const pd = profSnap.data() as any;
          barber.profile = { name: pd?.name || '' };
        }
      } catch (e) {}

      // Join service info
      let service: any = { service_name: '' };
      try {
        const svcSnap = await getDoc(doc(db, 'services', apptData.service_id));
        if (svcSnap.exists()) {
          const sv = svcSnap.data() as any;
          service.service_name = sv?.service_name || '';
        }
      } catch (e) {}

      const appointment: Appointment = {
        id: appointmentId,
        appointment_date: apptData?.appointment_date || '',
        appointment_time: apptData?.appointment_time || '',
        status: apptData?.status || '',
        barber: {
          user_id: apptData?.barber_id,
          salon_name: barber.salon_name,
          profile: { name: barber.profile?.name || '' },
        },
        service: { service_name: service.service_name },
      };

      setAppointment(appointment);

      // Check if review already exists
      try {
        const q = query(
          collection(db, 'reviews'),
          where('appointment_id', '==', appointmentId),
          where('customer_id', '==', uid)
        );
        const existingSnap = await getDocs(q);
        if (!existingSnap.empty) {
          setExistingReview(existingSnap.docs[0].data());
        }
      } catch (e) {}
    } catch (err: any) {
      setError(err.message || 'Failed to load appointment');
    }
  };

  const handleSubmitReview = async (rating: number, reviewText: string) => {
    if (!currentUser || !appointment) return;
    try {
      await addDoc(collection(db, 'reviews'), {
        customer_id: currentUser.uid,
        barber_id: appointment.barber.user_id,
        appointment_id: appointmentId,
        rating,
        review_text: reviewText || null,
        created_at: serverTimestamp(),
      });
      setReviewSubmitted(true);
    } catch (error: any) {
      setError(error.message || 'Failed to submit review');
    }
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