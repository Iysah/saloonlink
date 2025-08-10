import { createBrowserClient } from "@supabase/ssr";

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

// export type Database = {
//   public: {
//     Tables: {
//       profiles: {
//         Row: {
//           id: string;
//           name: string;
//           role: 'customer' | 'barber';
//           phone: string | null;
//           email: string | null;
//           profile_picture: string | null;
//           created_at: string;
//           subscription: JSON | null,
         
//         };
//         Insert: {
//           id: string;
//           name: string;
//           role: 'customer' | 'barber';
//           phone?: string | null;
//           profile_picture?: string | null;
//           created_at?: string;
//           subscription: JSON | null
//           email: string | null;
//         };
//         Update: {
//           id?: string;
//           name?: string;
//           role?: 'customer' | 'barber';
//           phone?: string | null;
//           profile_picture?: string | null;
//           created_at?: string;
//           subscription: JSON | null
//           email: string | null;
//         };
//       };
//       barber_profiles: {
//         Row: {
//           user_id: string;
//           bio: string | null;
//           salon_name: string | null;
//           location: string | null;
//           is_available: boolean;
//           working_hours: any;
//           walk_in_enabled: boolean;
//           created_at: string;
//         };
//         Insert: {
//           user_id: string;
//           bio?: string | null;
//           salon_name?: string | null;
//           location?: string | null;
//           is_available?: boolean;
//           working_hours?: any;
//           walk_in_enabled?: boolean;
//           created_at?: string;
//         };
//         Update: {
//           user_id?: string;
//           bio?: string | null;
//           salon_name?: string | null;
//           location?: string | null;
//           is_available?: boolean;
//           working_hours?: any;
//           walk_in_enabled?: boolean;
//           created_at?: string;
//         };
//       };
//       services: {
//         Row: {
//           id: string;
//           barber_id: string;
//           service_name: string;
//           price: number;
//           duration_minutes: number;
//           created_at: string;
//         };
//         Insert: {
//           id?: string;
//           barber_id: string;
//           service_name: string;
//           price: number;
//           duration_minutes?: number;
//           created_at?: string;
//         };
//         Update: {
//           id?: string;
//           barber_id?: string;
//           service_name?: string;
//           price?: number;
//           duration_minutes?: number;
//           created_at?: string;
//         };
//       };
//       appointments: {
//         Row: {
//           id: string;
//           customer_id: string;
//           barber_id: string;
//           service_id: string;
//           appointment_date: string;
//           appointment_time: string;
//           status: string;
//           notes: string | null;
//           created_at: string;
//         };
//         Insert: {
//           id?: string;
//           customer_id: string;
//           barber_id: string;
//           service_id: string;
//           appointment_date: string;
//           appointment_time: string;
//           status?: string;
//           notes?: string | null;
//           created_at?: string;
//         };
//         Update: {
//           id?: string;
//           customer_id?: string;
//           barber_id?: string;
//           service_id?: string;
//           appointment_date?: string;
//           appointment_time?: string;
//           status?: string;
//           notes?: string | null;
//           created_at?: string;
//         };
//       };
//       queue: {
//         Row: {
//           id: string;
//           barber_id: string;
//           customer_name: string;
//           phone: string;
//           position: number;
//           join_time: string;
//           status: string;
//           estimated_wait_minutes: number;
//         };
//         Insert: {
//           id?: string;
//           barber_id: string;
//           customer_name: string;
//           phone: string;
//           position: number;
//           join_time?: string;
//           status?: string;
//           estimated_wait_minutes?: number;
//         };
//         Update: {
//           id?: string;
//           barber_id?: string;
//           customer_name?: string;
//           phone?: string;
//           position?: number;
//           join_time?: string;
//           status?: string;
//           estimated_wait_minutes?: number;
//         };
//       };
//       notifications: {
//         Row: {
//           id: string;
//           user_id: string | null;
//           type: string;
//           message: string;
//           phone: string | null;
//           sent_at: string;
//           status: string;
//         };
//         Insert: {
//           id?: string;
//           user_id?: string | null;
//           type: string;
//           message: string;
//           phone?: string | null;
//           sent_at?: string;
//           status?: string;
//         };
//         Update: {
//           id?: string;
//           user_id?: string | null;
//           type?: string;
//           message?: string;
//           phone?: string | null;
//           sent_at?: string;
//           status?: string;
//         };
//       };
//       reviews: {
//         Row: {
//           id: string;
//           customer_id: string;
//           barber_id: string;
//           appointment_id: string;
//           rating: number;
//           review_text: string | null;
//           created_at: string;
//         };
//         Insert: {
//           id?: string;
//           customer_id: string;
//           barber_id: string;
//           appointment_id: string;
//           rating: number;
//           review_text?: string | null;
//           created_at?: string;
//         };
//         Update: {
//           id?: string;
//           customer_id?: string;
//           barber_id?: string;
//           appointment_id?: string;
//           rating?: number;
//           review_text?: string | null;
//           created_at?: string;
//         };
//       };
//     };
//   };
// };