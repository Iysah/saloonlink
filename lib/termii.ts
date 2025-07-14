// Termii-based WhatsApp integration

export class TermiiWhatsAppService {
    private apiKey: string;
    private deviceId: string;
    private baseUrl = 'https://v3.api.termii.com/api/send/template';
  
    constructor() {
      this.apiKey = process.env.NEXT_PUBLIC_TERMII_API_KEY || '';
      this.deviceId = process.env.NEXT_PUBLIC_TERMII_DEVICE_ID || '';
    }
  
    private getTemplateId(type: 'queueConfirmation' | 'queueAlert' | 'appointmentConfirmation' | 'appointmentReminder') {
      switch (type) {
        case 'queueConfirmation':
          return 'c2197b11-135e-4ca2-8e63-cb3aac8f0289';
        case 'queueAlert':
          return 'a98b9e31-5c7e-4608-9be5-f325795463bb';
        case 'appointmentConfirmation':
          return '58f95664-e3de-4316-b0fa-01a706961c19';
        case 'appointmentReminder':
          return '6b1ebd27-7eb9-4ddf-9292-0cff441bff84';
      }
    }
  
    private async sendTemplateMessage(
      phone: string | string[],
      type: 'queueConfirmation' | 'queueAlert' | 'appointmentConfirmation' | 'appointmentReminder',
      data: Record<string, any>
    ): Promise<boolean> {
      if (!this.apiKey || !this.deviceId) {
        console.error('Termii credentials not configured');
        return false;
      }
      const phone_number = Array.isArray(phone)
        ? phone.map(formatPhoneNumber).join(',')
        : formatPhoneNumber(phone);
      const payload = {
        phone_number,
        device_id: this.deviceId,
        template_id: this.getTemplateId(type),
        api_key: this.apiKey,
        data,
      };
      console.log(payload);
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
          console.log('Termii WhatsApp template message sent successfully:', result);
          return true;
        } else {
          console.error('Failed to send Termii WhatsApp template message:', result);
          return false;
        }
      } catch (error) {
        console.error('Termii WhatsApp API error:', error);
        return false;
      }
    }
  
    async sendQueueConfirmation(phone: string | string[], salonName: string, position: number, estimatedWait: number) {
      return this.sendTemplateMessage(phone, 'queueConfirmation', {
        salonName: salonName,
        date: position.toString(),
        time: `${estimatedWait} minutes`,
        service: '0',
      });
    }
  
    async sendQueueAlert(phone: string | string[], salonName: string, position: number) {
      return this.sendTemplateMessage(phone, 'queueAlert', {
        salonName: salonName,
        date: position.toString(),
        time: '0',
        service: '0',
      });
    }
  
    async sendAppointmentConfirmation(phone: string | string[], salonName: string, date: string, time: string, service: string) {
      return this.sendTemplateMessage(phone, 'appointmentConfirmation', {
        salonName: salonName,
        date: date,
        time: time,
        service: service,
      });
    }
  
    async sendAppointmentReminder(phone: string | string[], salonName: string, time: string, service: string) {
      return this.sendTemplateMessage(phone, 'appointmentReminder', {
        salonName: salonName,
        time: time,
        date: '0',
        service: service,
      });
    }

    /**
     * Send a "Next in Line" alert (fallback to queueAlert template)
     * @param phone
     * @param salonName
     */
    async sendNextInLineAlert(phone: string | string[], salonName: string) {
      // Use queueAlert template, set position to 'NEXT'
      return this.sendTemplateMessage(phone, 'queueAlert', {
        salonName: salonName,
        position: 'NEXT',
      });
    }

    /**
     * Send an appointment started notification (fallback to appointmentConfirmation template)
     * @param phone
     * @param salonName
     * @param service
     */
    async sendAppointmentStarted(phone: string | string[], salonName: string, service: string) {
      // Use appointmentConfirmation template, set time to 'Started', service to service
      return this.sendTemplateMessage(phone, 'appointmentConfirmation', {
        salonName: salonName,
        time: 'Started',
        service: service,
      });
    }

    /**
     * Send a service completed notification (fallback to appointmentConfirmation template)
     * @param phone
     * @param salonName
     * @param service
     */
    async sendServiceCompleted(phone: string | string[], salonName: string, service: string) {
      // Use appointmentConfirmation template, set time to 'Completed', service to service
      return this.sendTemplateMessage(phone, 'appointmentConfirmation', {
        salonName: salonName,
        time: 'Completed',
        service: service,
      });
    }
}
  
export const whatsappService = new TermiiWhatsAppService();
  
// Helper to format phone numbers to Nigerian international format
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');
  // If it starts with '0', replace with '234'
  if (digits.startsWith('0')) {
    digits = '234' + digits.slice(1);
  }
  // If it already starts with '234', leave as is
  // If it starts with something else, you may want to handle or reject
  return digits;
}
  