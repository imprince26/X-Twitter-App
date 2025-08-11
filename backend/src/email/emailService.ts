// Email Templates Export
export { default as sendVerificationEmail } from './templates/sendVerificationEmail';
export { default as sendWelcomeEmail } from './templates/sendWelcomeEmail';
export { default as sendPasswordResetEmail } from './templates/sendPasswordResetEmail';
export { default as sendPasswordChangedEmail } from './templates/sendPasswordChangedEmail';

// Email Service Export
export { emailService } from './sendMail';

// Email Template Props Types
export interface VerificationEmailProps {
  name: string;
  email: string;
  verificationToken: string;
  baseUrl?: string;
}

export interface WelcomeEmailProps {
  name: string;
  email: string;
  username: string;
  baseUrl?: string;
}

export interface PasswordResetEmailProps {
  name: string;
  email: string;
  username: string;
  resetToken: string;
  baseUrl?: string;
}

export interface PasswordChangedEmailProps {
  name: string;
  email: string;
  username: string;
  ipAddress: string;
  userAgent?: string;
  location?: string;
  baseUrl?: string;
}

export interface LoginAlertEmailProps {
  name: string;
  email: string;
  username: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  loginTime?: Date;
  baseUrl?: string;
}

export interface TwoFactorCodeEmailProps {
  name: string;
  email: string;
  username: string;
  verificationCode: string;
  expiresIn?: number;
  baseUrl?: string;
}

export interface AccountSuspensionEmailProps {
  name: string;
  email: string;
  username: string;
  suspensionReason: string;
  suspensionExpires?: Date;
  appealUrl?: string;
  baseUrl?: string;
}