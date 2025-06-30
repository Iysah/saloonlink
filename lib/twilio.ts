// Twilio SMS integration for salon booking notifications

interface TwilioMessage {
    to: string;
    body: string;
  }
  
  export class TwilioService {
    private accountSid: string;
    private authToken: string;
    private fromNumber: string;
    private baseUrl = 'https://v3.api.termii.com';
  
    constructor() {
      this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
      this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
      this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';
    }
  
    async sendSMS(to: string, message: string): Promise<boolean> {
      if (!this.accountSid || !this.authToken || !this.fromNumber) {
        console.error('Twilio credentials not configured');
        return false;
      }
  
      // Format phone number (ensure it starts with +)
      const formattedPhone = to.startsWith('+') ? to : `+1${to.replace(/\D/g, '')}`;
  
      const payload = new URLSearchParams({
        To: formattedPhone,
        From: this.fromNumber,
        Body: message,
      });
  
      try {
        const response = await fetch(`${this.baseUrl}/Accounts/${this.accountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: payload.toString(),
        });
  
        const result = await response.json();
        
        if (response.ok) {
          console.log('SMS sent successfully:', result.sid);
          return true;
        } else {
          console.error('Failed to send SMS:', result);
          return false;
        }
      } catch (error) {
        console.error('Twilio API error:', error);
        return false;
      }
    }
  
    // Helper methods for different notification types
    async sendQueueConfirmation(phone: string, salonName: string, position: number, estimatedWait: number) {
      const message = `🔔 You've joined the queue at ${salonName}!\n\n📍 Position: #${position}\n⏰ Estimated wait: ~${estimatedWait} minutes\n\nWe'll notify you when you're next in line.`;
      return this.sendSMS(phone, message);
    }
  
    async sendQueueAlert(phone: string, salonName: string, position: number) {
      const message = `🚨 You're #${position} in line at ${salonName}!\n\nGet ready, you'll be called soon. Please be available for the next few minutes.`;
      return this.sendSMS(phone, message);
    }
  
    async sendNextInLineAlert(phone: string, salonName: string) {
      const message = `🎯 You're NEXT at ${salonName}!\n\nPlease head to the salon now. Your turn is coming up!`;
      return this.sendSMS(phone, message);
    }
  
    async sendAppointmentConfirmation(phone: string, salonName: string, date: string, time: string, service: string) {
      const message = `✅ Appointment confirmed at ${salonName}!\n\n📅 Date: ${date}\n⏰ Time: ${time}\n💄 Service: ${service}\n\nSee you there!`;
      return this.sendSMS(phone, message);
    }
  
    async sendAppointmentReminder(phone: string, salonName: string, time: string, service: string) {
      const message = `⏰ Reminder: Your appointment at ${salonName} is in 10 minutes!\n\n🕐 Time: ${time}\n💄 Service: ${service}\n\nPlease arrive on time.`;
      return this.sendSMS(phone, message);
    }
  
    async sendAppointmentStarted(phone: string, salonName: string, service: string) {
      const message = `🎉 Your ${service} service has started at ${salonName}!\n\nEnjoy your session!`;
      return this.sendSMS(phone, message);
    }
  
    async sendServiceCompleted(phone: string, salonName: string, service: string) {
      const message = `✨ Your ${service} is complete at ${salonName}!\n\nThank you for choosing us. We hope you love your new look!`;
      return this.sendSMS(phone, message);
    }
  }
  
  export const twilioService = new TwilioService();

  // yawaapp_5

  // TrimsHive - 🎯 You're NEXT at <%salonName%>. Please head to the salon now. Your turn is coming up!


  // yawaapp_6 

  // TrimsHive - 🎉 Your <%service%> service has started at <%salonName%>!. Enjoy your session!

  // yawaapp_7

  // TrimsHive - ✨ Your <%service%> is complete at <%salonName%>!. Thank you for choosing us. We hope you love your new look!