import { emailService } from '../sendMail';

interface VerificationEmailProps {
  name: string;
  email: string;
  verificationCode: string;
  baseUrl?: string;
}

const getVerificationEmailHTML = (props: VerificationEmailProps): string => {
  const { name, verificationCode, baseUrl = process.env.CLIENT_URL || 'http://localhost:3000' } = props;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - X</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0f1419; background-color: #ffffff; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background-color: #000000; padding: 20px; text-align: center; }
            .logo { color: #ffffff; font-size: 28px; font-weight: bold; text-decoration: none; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #0f1419; }
            .message { font-size: 16px; line-height: 1.5; margin-bottom: 30px; color: #536471; }
            .code-container { background-color: #f7f9fa; border: 2px dashed #1d9bf0; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0; }
            .verification-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1d9bf0; font-family: 'Courier New', monospace; }
            .code-label { font-size: 14px; color: #536471; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
            .footer { background-color: #f7f9fa; padding: 30px; text-align: center; border-top: 1px solid #e1e8ed; }
            .footer-text { font-size: 14px; color: #536471; margin-bottom: 15px; }
            .highlight { background-color: #f7f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #1d9bf0; margin: 20px 0; }
            .warning { background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #e0245e; margin: 20px 0; color: #e0245e; }
            .divider { height: 1px; background-color: #e1e8ed; margin: 30px 0; }
            @media only screen and (max-width: 600px) {
                .container { width: 100% !important; }
                .content { padding: 20px 15px !important; }
                .greeting { font-size: 20px !important; }
                .verification-code { font-size: 24px !important; letter-spacing: 4px !important; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <a href="${baseUrl}" class="logo">𝕏</a>
            </div>
            
            <div class="content">
                <div class="greeting">Verify your email address</div>

                <div class="message">
                    Hi ${name},<br><br>
                    
                    Thanks for signing up for X! To complete your registration and start using your account, 
                    please enter the verification code below in the app.
                </div>

                <div class="code-container">
                    <div class="code-label">Your verification code</div>
                    <div class="verification-code">${verificationCode}</div>
                </div>

                <div class="highlight">
                    <strong>Important:</strong> This verification code will expire in 10 minutes for security reasons. 
                    If you don't verify your email within this time, you'll need to request a new verification code.
                </div>

                <div class="divider"></div>

                <div class="message">
                    If you didn't create an account with X, you can safely ignore this email.
                </div>

                <div class="warning">
                    <strong>Security tip:</strong> Never share this code with anyone. X will never ask for your verification code via phone or email.
                </div>
            </div>
            
            <div class="footer">
                <div class="footer-text">
                    This email was sent by X (Twitter Clone). If you didn't request this email, you can safely ignore it.
                </div>
                
                <div style="margin: 20px 0;">
                    <a href="${baseUrl}" style="color: #536471; text-decoration: none; margin: 0 10px;">Visit X</a> |
                    <a href="${baseUrl}/help" style="color: #536471; text-decoration: none; margin: 0 10px;">Help Center</a> |
                    <a href="${baseUrl}/privacy" style="color: #536471; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
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

export const sendVerificationEmail = async (props: VerificationEmailProps): Promise<boolean> => {
  try {
    const html = getVerificationEmailHTML(props);
    
    return await emailService.sendEmail({
      to: props.email,
      subject: 'Verify your email address for X',
      html
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
};

export default sendVerificationEmail;