import { emailService } from '../sendMail';

interface AccountSuspensionEmailProps {
  name: string;
  email: string;
  username: string;
  suspensionReason: string;
  suspensionExpires?: Date;
  appealUrl?: string;
  baseUrl?: string;
}

const getAccountSuspensionEmailHTML = (props: AccountSuspensionEmailProps): string => {
  const { 
    name, 
    username, 
    suspensionReason, 
    suspensionExpires,
    appealUrl,
    baseUrl = process.env.CLIENT_URL || 'http://localhost:3000' 
  } = props;

  const isPermanent = !suspensionExpires;
  const suspensionText = isPermanent 
    ? 'permanently suspended' 
    : `suspended until ${suspensionExpires?.toLocaleDateString()}`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Suspension Notice - X</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0f1419; background-color: #ffffff; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background-color: #000000; padding: 20px; text-align: center; }
            .logo { color: #ffffff; font-size: 28px; font-weight: bold; text-decoration: none; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #e0245e; }
            .message { font-size: 16px; line-height: 1.5; margin-bottom: 30px; color: #536471; }
            .button { display: inline-block; background-color: #1d9bf0; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 9999px; font-weight: bold; font-size: 15px; margin: 20px 0; }
            .appeal-button { background-color: #e0245e; }
            .appeal-button:hover { background-color: #c91849; }
            .button:hover { background-color: #1a8cd8; }
            .footer { background-color: #f7f9fa; padding: 30px; text-align: center; border-top: 1px solid #e1e8ed; }
            .footer-text { font-size: 14px; color: #536471; margin-bottom: 15px; }
            .warning { background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #e0245e; margin: 20px 0; }
            .info-box { background-color: #f7f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #1d9bf0; margin: 20px 0; }
            .divider { height: 1px; background-color: #e1e8ed; margin: 30px 0; }
            .detail-row { margin-bottom: 8px; }
            .label { font-weight: bold; color: #0f1419; }
            .value { color: #536471; }
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
                <div class="greeting">Account Suspension Notice</div>

                <div class="message">
                    Hi ${name},<br><br>
                    
                    We're writing to inform you that your X account (@${username}) has been ${suspensionText} 
                    due to a violation of our Terms of Service and Community Guidelines.
                </div>

                <div class="warning">
                    <strong style="color: #e0245e; margin-bottom: 15px; display: block;">Suspension Details:</strong>
                    <div class="detail-row"><span class="label">Account:</span> <span class="value">@${username}</span></div>
                    <div class="detail-row"><span class="label">Status:</span> <span class="value">${suspensionText}</span></div>
                    <div class="detail-row"><span class="label">Reason:</span> <span class="value">${suspensionReason}</span></div>
                    ${suspensionExpires ? `<div class="detail-row"><span class="label">Expires:</span> <span class="value">${suspensionExpires.toLocaleDateString()}</span></div>` : ''}
                </div>

                <div class="message">
                    <strong>What this means:</strong><br>
                    • You cannot log in to your account<br>
                    • Your profile and posts are not visible to other users<br>
                    • You cannot create new posts or interact with content<br>
                    • Your account data is preserved during the suspension period
                </div>

                ${appealUrl ? `
                <div style="text-align: center;">
                    <a href="${appealUrl}" class="button appeal-button">Appeal This Decision</a>
                </div>
                ` : ''}

                <div class="info-box">
                    <strong>Appeal Process:</strong><br>
                    If you believe this suspension was made in error, you can submit an appeal. 
                    Please provide any relevant information that might help us review your case.
                    Appeals are typically reviewed within 5-7 business days.
                </div>

                ${!isPermanent ? `
                <div class="message">
                    <strong>Automatic Reinstatement:</strong><br>
                    Your account will be automatically reactivated on ${suspensionExpires?.toLocaleDateString()} 
                    if no further violations occur.
                </div>
                ` : ''}

                <div class="divider"></div>

                <div class="message">
                    <strong>Community Guidelines:</strong><br>
                    To prevent future suspensions, please review our Community Guidelines and Terms of Service. 
                    We're committed to maintaining a safe and respectful environment for all users.
                </div>

                <div style="text-align: center;">
                    <a href="${baseUrl}/rules" class="button">Review Community Guidelines</a>
                </div>
            </div>
            
            <div class="footer">
                <div class="footer-text">
                    This email was sent by X (Twitter Clone) regarding your account status.
                </div>
                
                <div style="margin: 20px 0;">
                    <a href="${baseUrl}/help" style="color: #536471; text-decoration: none; margin: 0 10px;">Help Center</a> |
                    <a href="${baseUrl}/rules" style="color: #536471; text-decoration: none; margin: 0 10px;">Rules</a> |
                    <a href="${baseUrl}/appeals" style="color: #536471; text-decoration: none; margin: 0 10px;">Appeals</a>
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

export const sendAccountSuspensionEmail = async (props: AccountSuspensionEmailProps): Promise<boolean> => {
  try {
    const html = getAccountSuspensionEmailHTML(props);
    
    return await emailService.sendEmail({
      to: props.email,
      subject: `Account Suspension Notice - @${props.username}`,
      html
    });
  } catch (error) {
    console.error('Failed to send account suspension email:', error);
    return false;
  }
};

export default sendAccountSuspensionEmail;