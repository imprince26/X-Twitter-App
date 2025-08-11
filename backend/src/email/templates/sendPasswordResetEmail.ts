import { emailService } from '../sendMail';

interface PasswordResetEmailProps {
  name: string;
  email: string;
  username: string;
  resetToken: string;
  baseUrl?: string;
}

const getPasswordResetEmailHTML = (props: PasswordResetEmailProps): string => {
  const { name, username, resetToken, baseUrl = process.env.CLIENT_URL || 'http://localhost:3000' } = props;
  const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - X</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0f1419; background-color: #ffffff; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background-color: #000000; padding: 20px; text-align: center; }
            .logo { color: #ffffff; font-size: 28px; font-weight: bold; text-decoration: none; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #0f1419; }
            .message { font-size: 16px; line-height: 1.5; margin-bottom: 30px; color: #536471; }
            .button { display: inline-block; background-color: #1d9bf0; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 9999px; font-weight: bold; font-size: 15px; margin: 20px 0; }
            .button:hover { background-color: #1a8cd8; }
            .footer { background-color: #f7f9fa; padding: 30px; text-align: center; border-top: 1px solid #e1e8ed; }
            .footer-text { font-size: 14px; color: #536471; margin-bottom: 15px; }
            .highlight { background-color: #f7f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #1d9bf0; margin: 20px 0; }
            .warning { background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #e0245e; margin: 20px 0; color: #e0245e; }
            .divider { height: 1px; background-color: #e1e8ed; margin: 30px 0; }
            .security-list { text-align: left; padding-left: 20px; margin-top: 10px; }
            .security-list li { margin-bottom: 8px; }
            @media only screen and (max-width: 600px) {
                .container { width: 100% !important; }
                .content { padding: 20px 15px !important; }
                .greeting { font-size: 20px !important; }
                .button { display: block !important; text-align: center !important; width: 100% !important; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <a href="${baseUrl}" class="logo">𝕏</a>
            </div>
            
            <div class="content">
                <div class="greeting">Reset your password</div>

                <div class="message">
                    Hi ${name},<br><br>
                    
                    We received a request to reset the password for your X account (@${username}). 
                    If you made this request, click the button below to reset your password.
                </div>

                <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">Reset Password</a>
                </div>

                <div class="message">
                    Or copy and paste this link in your browser:<br>
                    <a href="${resetUrl}" style="color: #1d9bf0; word-break: break-all;">${resetUrl}</a>
                </div>

                <div class="highlight">
                    <strong>Security Notice:</strong> This password reset link will expire in 1 hour for security reasons. 
                    If you don't reset your password within this time, you'll need to request a new reset link.
                </div>

                <div class="divider"></div>

                <div class="warning">
                    <strong>Didn't request this?</strong><br>
                    If you didn't request a password reset, someone else might be trying to access your account. 
                    Your password hasn't been changed yet, but we recommend:
                    <ul class="security-list">
                        <li>Securing your email account</li>
                        <li>Enabling two-factor authentication</li>
                        <li>Using a strong, unique password</li>
                        <li>Checking your recent login activity</li>
                    </ul>
                </div>
            </div>
            
            <div class="footer">
                <div class="footer-text">
                    This email was sent by X (Twitter Clone) for security purposes.
                </div>
                
                <div style="margin: 20px 0;">
                    <a href="${baseUrl}" style="color: #536471; text-decoration: none; margin: 0 10px;">Visit X</a> |
                    <a href="${baseUrl}/help" style="color: #536471; text-decoration: none; margin: 0 10px;">Help Center</a> |
                    <a href="${baseUrl}/settings/security" style="color: #536471; text-decoration: none; margin: 0 10px;">Security</a>
                </div>
                
                <div class="footer-text" style="margin-top: 20px;">
                    © 2024 X Corp. All rights reserved.<br>
                    1355 Market Street, Suite 900, San Francisco, CA 94103
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};

export const sendPasswordResetEmail = async (props: PasswordResetEmailProps): Promise<boolean> => {
  try {
    const html = getPasswordResetEmailHTML(props);
    
    return await emailService.sendEmail({
      to: props.email,
      subject: 'Reset your password for X',
      html
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
};

export default sendPasswordResetEmail;