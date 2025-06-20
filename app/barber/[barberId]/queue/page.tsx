import QueueClient from './QueueClient';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { barberId: string };
}

export default async function Page({ params }: PageProps) {
  if (!params.barberId) return notFound();
  return <QueueClient barberId={params.barberId} />;
}

export async function generateStaticParams() {
  const { data, error } = await supabase
    .from('barber_profiles')
    .select('user_id');
  if (error) return [];
  return (data ?? []).map((barber: { user_id: string }) => ({ barberId: barber.user_id }));
}