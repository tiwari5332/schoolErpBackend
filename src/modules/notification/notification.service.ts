import { Logger } from '../../libs/logger';
import db from '../../config/database';

export interface AbsenteeNotificationData {
  schoolId: string;
  studentName: string;
  gradeSection: string;
  date: string;
  parentPhone?: string;
  parentEmail?: string;
  channel?: 'SMS' | 'WHATSAPP' | 'EMAIL' | 'IN_APP';
}

export interface BroadcastNotificationData {
  schoolId: string;
  channel: 'SMS' | 'WHATSAPP' | 'EMAIL' | 'IN_APP';
  message: string;
  recipients: Array<{
    phone?: string;
    email?: string;
    name?: string;
    parentId?: string;
  }>;
}

export class NotificationService {
  /**
   * Helper to interpolate variables {{varName}} in template strings
   */
  static renderTemplate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{([^{}]+)\}\}/g, (_, key) => {
      const val = variables[key.trim()];
      return val !== undefined && val !== null ? String(val) : '';
    });
  }

  /**
   * Dispatches parent notification when a student is marked ABSENT (HLD Section 9.3)
   * Pre-approved format:
   * "Dear Parent, your ward [Student Name] was marked absent today, [Date], in Grade [X-A]. If this is an error, please contact the school office."
   */
  static async sendAbsenteeNotification(data: AbsenteeNotificationData): Promise<boolean> {
    const channel = data.channel || 'SMS';
    const message = `Dear Parent, your ward ${data.studentName} was marked absent today, ${data.date}, in Grade ${data.gradeSection}. If this is an error, please contact the school office.`;

    try {
      if (channel === 'WHATSAPP' && data.parentPhone) {
        await this.dispatchWhatsApp(data.parentPhone, message, {
          type: 'ABSENTEE_ALERT',
          schoolId: data.schoolId,
        });
      } else if (channel === 'EMAIL' && data.parentEmail) {
        await this.dispatchEmail(
          data.parentEmail,
          `Attendance Alert: ${data.studentName} Marked Absent`,
          message,
          { type: 'ABSENTEE_ALERT', schoolId: data.schoolId }
        );
      } else if (data.parentPhone) {
        await this.dispatchSms(data.parentPhone, message, {
          type: 'ABSENTEE_ALERT',
          schoolId: data.schoolId,
        });
      }

      Logger.info(`[Notification] Absentee alert sent for student ${data.studentName} via ${channel}`, {
        schoolId: data.schoolId,
        studentName: data.studentName,
        channel,
      });
      return true;
    } catch (err: any) {
      Logger.error(`[Notification] Failed to send absentee alert: ${err.message}`, { data });
      return false;
    }
  }

  /**
   * Dispatches broadcast to multiple recipients across SMS, WhatsApp, or Email (HLD Section 10)
   */
  static async dispatchBroadcast(data: BroadcastNotificationData): Promise<{ successfulCount: number; failedCount: number }> {
    let successfulCount = 0;
    let failedCount = 0;

    for (const recipient of data.recipients) {
      try {
        if (data.channel === 'SMS' && recipient.phone) {
          await this.dispatchSms(recipient.phone, data.message, { schoolId: data.schoolId });
          successfulCount++;
        } else if (data.channel === 'WHATSAPP' && recipient.phone) {
          await this.dispatchWhatsApp(recipient.phone, data.message, { schoolId: data.schoolId });
          successfulCount++;
        } else if (data.channel === 'EMAIL' && recipient.email) {
          await this.dispatchEmail(recipient.email, 'Important School Broadcast', data.message, { schoolId: data.schoolId });
          successfulCount++;
        } else if (data.channel === 'IN_APP') {
          // Log in-app event
          successfulCount++;
        }
      } catch (err: any) {
        failedCount++;
        Logger.error(`[Notification] Delivery failure to recipient: ${err.message}`, { recipient, channel: data.channel });
      }
    }

    return { successfulCount, failedCount };
  }

  static async dispatchSms(to: string, message: string, meta?: any): Promise<void> {
    Logger.info(`[SMS Gateway] Dispatched SMS to ${to}: "${message}"`, { to, meta });
  }

  static async dispatchWhatsApp(to: string, message: string, meta?: any): Promise<void> {
    Logger.info(`[WhatsApp Gateway] Dispatched WhatsApp message to ${to}: "${message}"`, { to, meta });
  }

  static async dispatchEmail(to: string, subject: string, body: string, meta?: any): Promise<void> {
    Logger.info(`[Email Gateway] Dispatched Email to ${to} [${subject}]`, { to, subject, meta });
  }
}
export default NotificationService;

