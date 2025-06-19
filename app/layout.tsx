import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Salon Booking Assistant - Smart Walk-in & Appointment System',
  description: 'Book appointments or join virtual queues at your favorite salons. Real-time notifications and seamless booking experience.',
  generator: 'Iysah - TheProductDude'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}