"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StarRating } from '@/components/ui/star-rating';
import { 
  ArrowLeft, 
  Share2, 
  Copy, 
  CheckCircle, 
  Star,
  MessageSquare,
  Users,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  customer: {
    name: string;
    profile_picture: string | null;
  };
  appointment: {
    appointment_date: string;
    appointment_time: string;
    service: {
      service_name: string;
    };
  };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
}

export default function BarberReviewsPage() {
  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: {}
  });
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
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
    await fetchReviews(user.id);
    setLoading(false);
  };

  const fetchReviews = async (userId: string) => {
    const { data } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        review_text,
        created_at,
        customer:profiles!reviews_customer_id_fkey(name, profile_picture),
        appointment:appointments!reviews_appointment_id_fkey(
          appointment_date,
          appointment_time,
          service:services(service_name)
        )
      `)
      .eq('barber_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      setReviews(data as any);
      calculateStats(data as any);
    }
  };

  const calculateStats = (reviewsData: Review[]) => {
    if (reviewsData.length === 0) {
      setStats({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {}
      });
      return;
    }

    const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviewsData.length;

    const distribution: { [key: number]: number } = {};
    for (let i = 1; i <= 5; i++) {
      distribution[i] = reviewsData.filter(review => review.rating === i).length;
    }

    setStats({
      averageRating,
      totalReviews: reviewsData.length,
      ratingDistribution: distribution
    });
  };

  const generateReviewLink = (appointmentId: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/review/${appointmentId}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(text);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getRatingPercentage = (rating: number) => {
    if (stats.totalReviews === 0) return 0;
    return (stats.ratingDistribution[rating] / stats.totalReviews) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/barber/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Reviews & Ratings</h1>
              <p className="text-sm text-gray-600">Manage your customer feedback</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Average Rating</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {stats.averageRating.toFixed(1)}
                      </span>
                      <StarRating 
                        rating={stats.averageRating} 
                        readonly 
                        size="sm" 
                        showValue={false}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-full">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">5-Star Reviews</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.ratingDistribution[5] || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rating Distribution */}
          {stats.totalReviews > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center">
                      <div className="flex items-center w-16">
                        <span className="text-sm font-medium text-gray-600">{rating}</span>
                        <Star className="h-4 w-4 text-yellow-400 ml-1" />
                      </div>
                      <div className="flex-1 mx-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{ width: `${getRatingPercentage(rating)}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {stats.ratingDistribution[rating] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                  <p className="text-gray-500">
                    Share your review link with customers to start receiving feedback.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-6 last:border-b-0">
                      <div className="flex items-start space-x-4">
                                                 <Avatar className="h-10 w-10">
                           <AvatarImage src={review.customer.profile_picture || undefined} />
                           <AvatarFallback>
                             {review.customer.name.charAt(0)}
                           </AvatarFallback>
                         </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {review.customer.name}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {format(new Date(review.appointment.appointment_date), 'MMM d, yyyy')} at {review.appointment.appointment_time}
                              </p>
                              <p className="text-sm text-gray-500">
                                {review.appointment.service.service_name}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <StarRating 
                                rating={review.rating} 
                                readonly 
                                size="sm" 
                              />
                              <Badge variant="outline">
                                {format(new Date(review.created_at), 'MMM d')}
                              </Badge>
                            </div>
                          </div>
                          {review.review_text && (
                            <p className="mt-2 text-gray-700">{review.review_text}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 