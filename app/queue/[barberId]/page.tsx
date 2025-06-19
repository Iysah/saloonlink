import QueueClient from './QueueClient';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { barberId: string };
}

export default async function Page({ params }: PageProps) {
  // Optionally, you can fetch barber info here and pass as prop
  // For now, just pass barberId
  if (!params.barberId) return notFound();
  return <QueueClient barberId={params.barberId} />;
}

export async function generateStaticParams() {
  return [
    { barberId: 'abc123' },
    { barberId: 'def456' },
  ];

  // try {
  //   const { data, error } = await supabase
  //     .from('barber_profiles')
  //     .select('user_id');

  //   if (error || !data) {
  //     console.error('Supabase error:', error);
  //     return [];
  //   }

  //   return data.map((barber: { user_id: string }) => ({
  //     barberId: barber.user_id,
  //   }));
  // } catch (err) {
  //   console.error('Failed to fetch barber IDs:', err);
  //   return [];
  // }
}