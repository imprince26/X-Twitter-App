import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import dotenv from 'dotenv';

dotenv.config();

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: string | Buffer;
  }>;
}
class EmailService {
  private transport: Transporter<SMTPTransport.SentMessageInfo>;

  constructor() {
    this.transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME!,
        pass: process.env.EMAIL_PASSWORD!, // Use App Password for Gmail
      }
    });

    // Verify transporter configuration
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transport.verify();
      console.log('Email service is ready to send emails');
    } catch (error) {
      console.error('Error verifying email service:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions: SendMailOptions = {
        from: {
          name: 'X (Twitter Clone)',
          address: process.env.EMAIL_USERNAME!,
        },
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      };

      const info = await this.transport.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendBulkEmail(emails: EmailOptions[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const email of emails) {
      const result = await this.sendEmail(email);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }
    console.info(`Bulk email sent. Success: ${success}, Failed: ${failed}`);
    return { success, failed };
  }

  close(): void {
    this.transport.close();
  }
}

export const emailService = new EmailService();
export default emailService;