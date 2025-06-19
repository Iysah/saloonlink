// WhatsApp Cloud API integration
// Note: This requires setting up a WhatsApp Business account and getting API credentials

interface WhatsAppMessage {
  to: string;
  type: 'text';
  text: {
    body: string;
  };
}

export class WhatsAppService {
  private accessToken: string;
  private phoneNumberId: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  }

  async sendMessage(to: string, message: string): Promise<boolean> {
    if (!this.accessToken || !this.phoneNumberId) {
      console.error('WhatsApp credentials not configured');
      return false;
    }

    const payload: WhatsAppMessage = {
      to: to.replace(/\D/g, ''), // Remove non-digits
      type: 'text',
      text: {
        body: message
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('WhatsApp message sent successfully:', result);
        return true;
      } else {
        console.error('Failed to send WhatsApp message:', result);
        return false;
      }
    } catch (error) {
      console.error('WhatsApp API error:', error);
      return false;
    }
  }

  // Helper methods for different notification types
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

export const whatsappService = new WhatsAppService();