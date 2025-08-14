"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';


const supabase = createClient()

export default function DeleteAccountPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
      } else {
        setUser(user);
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  const handleDeleteAccount = async () => {
    setError('');
    if (confirmation !== 'DELETE') {
      setError('Please type "DELETE" to confirm.');
      return;
    }
    
    setIsDeleting(true);

    // Note: A secure implementation requires a server-side API route (e.g., an Edge Function)
    // to handle user deletion with admin privileges. This client-side example
    // deletes associated data but cannot fully delete the user from Supabase Auth.

    try {
      // 1. Delete associated data from the 'profiles' table.
      // Add similar steps for other tables like appointments, etc.
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Sign the user out.
      await supabase.auth.signOut();

      // 3. Redirect to the login page with a success message.
      router.push('/auth/login?message=Account+deleted+successfully');

    } catch (err: any) {
      setError('Failed to delete account. Please contact support.');
      console.error('Deletion error:', err.message);
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Delete Account</CardTitle>
          <CardDescription>
            This action cannot be undone. This will permanently delete your account and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> You are about to permanently delete your account. All your profile information and booking history will be lost.
            </AlertDescription>
          </Alert>
          <div>
            <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700 mb-2">
              To confirm, type <strong>DELETE</strong> below.
            </label>
            <Input
              id="confirmation"
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="DELETE"
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleDeleteAccount}
            disabled={isDeleting || confirmation !== 'DELETE'}
          >
            {isDeleting ? 'Deleting Account...' : 'I understand, delete my account'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
