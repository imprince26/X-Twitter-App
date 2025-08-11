import { emailService } from '../sendMail';

interface PasswordChangedEmailProps {
  name: string;
  email: string;
  username: string;
  ipAddress: string;
  userAgent?: string;
  location?: string | string[];
  baseUrl?: string;
}

const getPasswordChangedEmailHTML = (props: PasswordChangedEmailProps): string => {
  const { 
    name, 
    username, 
    email, 
    ipAddress, 
    userAgent = 'Unknown Device',
    location = 'Unknown Location',
    baseUrl = process.env.CLIENT_URL || 'http://localhost:3000' 
  } = props;
  
  const securityUrl = `${baseUrl}/settings/security`;
  const changeDate = new Date().toLocaleString();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Changed - X</title>
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
            .info-box { background-color: #f7f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #1d9bf0; margin: 20px 0; }
            .warning { background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #e0245e; margin: 20px 0; color: #e0245e; }
            .divider { height: 1px; background-color: #e1e8ed; margin: 30px 0; }
            .detail-row { margin-bottom: 8px; }
            .label { font-weight: bold; color: #0f1419; }
            .value { color: #536471; }
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
                <div class="greeting">Password changed successfully</div>

                <div class="message">
                    Hi ${name},<br><br>
                    
                    This is a confirmation that the password for your X account (@${username}) has been changed successfully.
                </div>

                <div class="info-box">
                    <strong style="color: #0f1419; margin-bottom: 15px; display: block;">Change Details:</strong>
                    <div class="detail-row"><span class="label">Username:</span> <span class="value">@${username}</span></div>
                    <div class="detail-row"><span class="label">Email:</span> <span class="value">${email}</span></div>
                    <div class="detail-row"><span class="label">Changed on:</span> <span class="value">${changeDate}</span></div>
                    <div class="detail-row"><span class="label">IP Address:</span> <span class="value">${ipAddress}</span></div>
                    <div class="detail-row"><span class="label">Device:</span> <span class="value">${userAgent}</span></div>
                    <div class="detail-row"><span class="label">Location:</span> <span class="value">${location}</span></div>
                </div>

                <div style="text-align: center;">
                    <a href="${securityUrl}" class="button">Review Security Settings</a>
                </div>

                <div class="message">
                    Your account is now more secure. We recommend reviewing your security settings regularly 
                    and enabling two-factor authentication for additional protection.
                </div>

                <div class="divider"></div>

                <div class="warning">
                    <strong>Didn't make this change?</strong><br>
                    If you didn't change your password, your account may have been compromised. 
                    Please contact our support team immediately and consider:
                    <ul class="security-list">
                        <li>Changing your password again</li>
                        <li>Enabling two-factor authentication</li>
                        <li>Reviewing recent account activity</li>
                        <li>Checking connected apps and sessions</li>
                        <li>Securing your email account</li>
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
                    <a href="${baseUrl}/settings/security" style="color: #536471; text-decoration: none; margin: 0 10px;">Security Settings</a>
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

export const sendPasswordChangedEmail = async (props: PasswordChangedEmailProps): Promise<boolean> => {
  try {
    const html = getPasswordChangedEmailHTML(props);
    
    return await emailService.sendEmail({
      to: props.email,
      subject: 'Your X password has been changed',
      html
    });
  } catch (error) {
    console.error('Failed to send password changed email:', error);
    return false;
  }
};

export default sendPasswordChangedEmail;