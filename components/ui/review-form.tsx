"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating } from '@/components/ui/star-rating';
import { Loader2 } from 'lucide-react';

interface ReviewFormProps {
  barberId: string;
  appointmentId: string;
  barberName: string;
  onSubmit: (rating: number, reviewText: string) => Promise<void>;
  onCancel: () => void;
}

export function ReviewForm({ 
  barberId, 
  appointmentId, 
  barberName, 
  onSubmit, 
  onCancel 
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(rating, reviewText);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Rate Your Experience</CardTitle>
        <p className="text-sm text-gray-600 text-center">
          How was your service with {barberName}?
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              size="lg"
            />
          </div>

          <div>
            <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-2">
              Review (Optional)
            </label>
            <Textarea
              id="review"
              placeholder="Share your experience with this barber..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 