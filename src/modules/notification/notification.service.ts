export class NotificationService {
  static async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    console.log(`[EmailNotification] Sent email to ${to} | Subject: ${subject}`);
    return true;
  }

  static async sendSms(toMsisdn: string, message: string): Promise<boolean> {
    console.log(`[SmsNotification] Sent SMS to ${toMsisdn} | Message: ${message}`);
    return true;
  }

  static async sendWhatsApp(toMsisdn: string, templateCode: string, params: any): Promise<boolean> {
    console.log(`[WhatsAppNotification] Sent WhatsApp to ${toMsisdn} | Template: ${templateCode}`);
    return true;
  }
}
