// Termii-based WhatsApp integration

export class TermiiWhatsAppService {
    private apiKey: string;
    private deviceId: string;
    private baseUrl = 'https://v3.api.termii.com/api/send/template';
  
    constructor() {
      this.apiKey = process.env.TERMII_API_KEY || 'TLeZODympuQoRcNUysAPajuEtuHXxlWDOyOMXXMXHyNUuCmolOMdbRpxxKpLZE';
      this.deviceId = process.env.TERMII_DEVICE_ID || '206f76f8-ba3f-43d4-8904-d51bcc9537fa';
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
        product_name: salonName,
        otp: position,
        expiry_time: `${estimatedWait} minutes`,
      });
    }
  
    async sendQueueAlert(phone: string | string[], salonName: string, position: number) {
      return this.sendTemplateMessage(phone, 'queueAlert', {
        product_name: salonName,
        otp: position,
        expiry_time: '',
      });
    }
  
    async sendAppointmentConfirmation(phone: string | string[], salonName: string, date: string, time: string, service: string) {
      return this.sendTemplateMessage(phone, 'appointmentConfirmation', {
        product_name: salonName,
        otp: time,
        expiry_time: service,
      });
    }
  
    async sendAppointmentReminder(phone: string | string[], salonName: string, time: string, service: string) {
      return this.sendTemplateMessage(phone, 'appointmentReminder', {
        product_name: salonName,
        otp: time,
        expiry_time: service,
      });
    }

    /**
     * Send a "Next in Line" alert (fallback to queueAlert template)
     * @param phone
     * @param salonName
     */
    async sendNextInLineAlert(phone: string | string[], salonName: string) {
      // Use queueAlert template, set otp to 'NEXT'
      return this.sendTemplateMessage(phone, 'queueAlert', {
        product_name: salonName,
        otp: 'NEXT',
        expiry_time: '',
      });
    }

    /**
     * Send an appointment started notification (fallback to appointmentConfirmation template)
     * @param phone
     * @param salonName
     * @param service
     */
    async sendAppointmentStarted(phone: string | string[], salonName: string, service: string) {
      // Use appointmentConfirmation template, set otp to 'Started', expiry_time to service
      return this.sendTemplateMessage(phone, 'appointmentConfirmation', {
        product_name: salonName,
        otp: 'Started',
        expiry_time: service,
      });
    }

    /**
     * Send a service completed notification (fallback to appointmentConfirmation template)
     * @param phone
     * @param salonName
     * @param service
     */
    async sendServiceCompleted(phone: string | string[], salonName: string, service: string) {
      // Use appointmentConfirmation template, set otp to 'Completed', expiry_time to service
      return this.sendTemplateMessage(phone, 'appointmentConfirmation', {
        product_name: salonName,
        otp: 'Completed',
        expiry_time: service,
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
  