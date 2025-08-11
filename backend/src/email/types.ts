export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface LoginAlertEmailData {
  name: string;
  email: string;
  username: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  loginTime: Date;
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
  };
}