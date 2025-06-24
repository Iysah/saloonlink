// Termii-based WhatsApp integration

export class TermiiWhatsAppService {
    private apiKey: string;
    private senderId: string;
    private baseUrl = 'https://v3.api.termii.com';
  
    constructor() {
      this.apiKey = process.env.TERMII_API_KEY || '';
      this.senderId = process.env.TERMII_SENDER_ID || '';
    }
  
    async sendMessage(to: string, message: string): Promise<boolean> {
      if (!this.apiKey || !this.senderId) {
        console.error('Termii credentials not configured');
        return false;
      }
  
      const payload = {
        to: to.replace(/\D/g, ''), // Ensure numeric international format
        from: this.senderId,
        channel: 'whatsapp',
        type: 'plain',
        message: message,
        api_key: this.apiKey,
      };
  
      try {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
  
        const result = await response.json();
        
        if (response.ok) {
          console.log('Termii WhatsApp message sent successfully:', result);
          return true;
        } else {
          console.error('Failed to send Termii WhatsApp message:', result);
          return false;
        }
      } catch (error) {
        console.error('Termii WhatsApp API error:', error);
        return false;
      }
    }
  
    // Reuse your notification methods as-is
    async sendQueueConfirmation(phone: string, salonName: string, position: number, estimatedWait: number) {
      const message = `🔔 You've joined the queue at ${salonName}!\n\n📍 Position: #${position}\n⏰ Estimated wait: ~${estimatedWait} minutes\n\nWe'll notify you when you're next in line.`;
      return this.sendMessage(phone, message);
    }
  
    async sendQueueAlert(phone: string, salonName: string, position: number) {
      const message = `🚨 You're #${position} in line at ${salonName}!\n\nGet ready, you'll be called soon. Please be available for the next few minutes.`;
      return this.sendMessage(phone, message);
    }
  
    async sendAppointmentConfirmation(phone: string, salonName: string, date: string, time: string, service: string) {
      const message = `✅ Appointment confirmed at ${salonName}!\n\n📅 Date: ${date}\n⏰ Time: ${time}\n💄 Service: ${service}\n\nSee you there!`;
      return this.sendMessage(phone, message);
    }
  
    async sendAppointmentReminder(phone: string, salonName: string, time: string, service: string) {
      const message = `⏰ Reminder: Your appointment at ${salonName} is in 10 minutes!\n\n🕐 Time: ${time}\n💄 Service: ${service}\n\nPlease arrive on time.`;
      return this.sendMessage(phone, message);
    }
  }
  
  export const whatsappService = new TermiiWhatsAppService();
  