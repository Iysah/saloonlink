import cron from 'node-cron';
import { supabase } from './supabase';
import { whatsappService } from './termii';

// Helper to get current time in UTC and 10 minutes from now
function getTimeWindow() {
  const now = new Date();
  const inTenMinutes = new Date(now.getTime() + 10 * 60 * 1000);
  const date = inTenMinutes.toISOString().split('T')[0];
  const time = inTenMinutes.toTimeString().slice(0, 5); // 'HH:MM'
  return { date, time };
}

async function sendReminders() {
  const { date, time } = getTimeWindow();
  // Find appointments scheduled for exactly 10 minutes from now and not already completed/cancelled
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`id, appointment_date, appointment_time, status, service_id, barber_id, customer_id, 
      service:services(service_name),
      barber:barber_profiles(salon_name),
      customer:profiles(name, phone),
      barber_profile:barber_profiles!appointments_barber_id_fkey(user_id, salon_name),
      barber_user:profiles!barber_profiles_user_id_fkey(name, phone)
    `)
    .eq('appointment_date', date)
    .eq('appointment_time', time)
    .in('status', ['scheduled', 'in_progress']);

  if (error) {
    console.error('Error fetching appointments:', error);
    return;
  }

  if (!appointments || appointments.length === 0) return;

  for (const appt of appointments) {
    // Extract joined single objects from arrays (Supabase join returns arrays)
    const customer = Array.isArray(appt.customer) ? appt.customer[0] : appt.customer;
    const barber = Array.isArray(appt.barber) ? appt.barber[0] : appt.barber;
    const service = Array.isArray(appt.service) ? appt.service[0] : appt.service;
    const barberUser = Array.isArray(appt.barber_user) ? appt.barber_user[0] : appt.barber_user;
    // Customer reminder
    if (customer?.phone && barber?.salon_name && service?.service_name) {
      await whatsappService.sendAppointmentReminder(
        customer.phone,
        barber.salon_name,
        appt.appointment_time,
        service.service_name
      );
    }
    // Barber reminder (get barber's phone)
    if (barberUser?.phone && barber?.salon_name && service?.service_name) {
      await whatsappService.sendAppointmentReminder(
        barberUser.phone,
        barber.salon_name,
        appt.appointment_time,
        service.service_name
      );
    }
  }
}

// Schedule the job to run every minute
cron.schedule('* * * * *', async () => {
  console.log('Running appointment reminder job at', new Date().toISOString());
  await sendReminders();
});

// If run directly, start the cron job
if (require.main === module) {
  console.log('Starting appointment reminder scheduler...');
} 