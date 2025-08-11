import { emailService } from '../sendMail';

interface LoginAlertEmailProps {
  name: string;
  email: string;
  username: string;
  ipAddress: string;
  userAgent: string;
  location: string | string[];
  loginTime: Date;
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
  };
  baseUrl?: string;
}

const getLoginAlertEmailHTML = (props: LoginAlertEmailProps): string => {
  const { 
    name, 
    username, 
    ipAddress, 
    userAgent, 
    location, 
    loginTime, 
    deviceInfo,
    baseUrl = process.env.CLIENT_URL || 'http://localhost:3000' 
  } = props;

  const securityUrl = `${baseUrl}/account/security`;
  const changePasswordUrl = `${baseUrl}/account/security/change-password`;
  const helpUrl = `${baseUrl}/help`;

  const formatDate = (date: Date): string => {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getDeviceIcon = (userAgent: string): string => {
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return '📱';
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      return '📲';
    } else {
      return '💻';
    }
  };

  const getBrowserInfo = (userAgent: string): string => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown Browser';
  };

  const getLocationFlag = (location: string): string => {
    const flags: { [key: string]: string } = {
      'US': '🇺🇸', 'UK': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺', 'DE': '🇩🇪',
      'FR': '🇫🇷', 'IT': '🇮🇹', 'ES': '🇪🇸', 'NL': '🇳🇱', 'SE': '🇸🇪',
      'IN': '🇮🇳', 'JP': '🇯🇵', 'CN': '🇨🇳', 'KR': '🇰🇷', 'BR': '🇧🇷',
      'MX': '🇲🇽', 'AR': '🇦🇷', 'CL': '🇨🇱', 'CO': '🇨🇴', 'PE': '🇵🇪'
    };
    return flags[location] || '🌍';
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Security Alert - X</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0f1419; background-color: #ffffff; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 20px; text-align: center; color: white; }
            .logo { color: #ffffff; font-size: 28px; font-weight: bold; text-decoration: none; }
            .header-title { font-size: 24px; font-weight: bold; margin-top: 10px; }
            .header-subtitle { font-size: 16px; opacity: 0.9; margin-top: 5px; }
            .content { padding: 40px 30px; }
            .alert-banner { background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%); border: 2px solid #ffc107; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center; }
            .alert-icon { font-size: 32px; margin-bottom: 10px; }
            .alert-title { font-size: 18px; font-weight: bold; color: #856404; margin-bottom: 8px; }
            .alert-message { font-size: 14px; color: #6c757d; }
            .greeting { font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #0f1419; }
            .message { font-size: 16px; line-height: 1.5; margin-bottom: 20px; color: #536471; }
            .login-details { background-color: #f7f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #1d9bf0; }
            .detail-row { display: flex; align-items: center; margin-bottom: 12px; padding: 8px 0; }
            .detail-row:last-child { margin-bottom: 0; }
            .detail-icon { font-size: 18px; margin-right: 12px; width: 20px; text-align: center; }
            .detail-label { font-weight: bold; color: #0f1419; margin-right: 8px; min-width: 100px; }
            .detail-value { color: #536471; }
            .button { display: inline-block; background-color: #1d9bf0; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 9999px; font-weight: bold; font-size: 15px; margin: 10px 8px; }
            .button:hover { background-color: #1a8cd8; }
            .button-danger { background-color: #dc3545; }
            .button-danger:hover { background-color: #c82333; }
            .warning-section { background-color: #f8d7da; border: 2px solid #dc3545; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
            .warning-title { font-size: 16px; font-weight: bold; color: #721c24; margin-bottom: 10px; }
            .warning-text { font-size: 14px; color: #721c24; margin-bottom: 15px; }
            .security-tips { background-color: #e8f5e8; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .security-tips-title { font-size: 16px; font-weight: bold; color: #155724; margin-bottom: 15px; }
            .tips-list { text-align: left; padding-left: 20px; color: #155724; }
            .tips-list li { margin-bottom: 8px; }
            .footer { background-color: #f7f9fa; padding: 30px; text-align: center; border-top: 1px solid #e1e8ed; }
            .footer-text { font-size: 14px; color: #536471; margin-bottom: 15px; }
            .divider { height: 1px; background-color: #e1e8ed; margin: 30px 0; }
            .button-container { text-align: center; margin: 20px 0; }
            @media only screen and (max-width: 600px) {
                .container { width: 100% !important; }
                .content { padding: 20px 15px !important; }
                .greeting { font-size: 18px !important; }
                .button { display: block !important; text-align: center !important; width: calc(100% - 16px) !important; margin: 8px !important; }
                .detail-row { flex-direction: column; text-align: center; }
                .detail-label { min-width: auto; margin-bottom: 4px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <a href="${baseUrl}" class="logo">𝕏</a>
                <div class="header-title">🔐 Security Alert</div>
                <div class="header-subtitle">New login detected for your account</div>
            </div>
            
            <div class="content">
                <div class="alert-banner">
                    <div class="alert-icon">🔐</div>
                    <div class="alert-title">New Login Detected</div>
                    <div class="alert-message">Hi ${name}, we detected a new login to your X account</div>
                </div>

                <div class="greeting">Account Access Alert</div>

                <div class="message">
                    Hi ${name},<br><br>
                    
                    We detected a new login to your X account <strong>@${username}</strong>. 
                    If this was you, no action is needed. If you don't recognize this activity, 
                    please secure your account immediately.
                </div>

                <div class="login-details">
                    <div style="font-weight: bold; margin-bottom: 15px; color: #0f1419;">Login Details:</div>
                    
                    <div class="detail-row">
                        <div class="detail-icon">👤</div>
                        <div class="detail-label">Account:</div>
                        <div class="detail-value">@${username}</div>
                    </div>
                    
                    <div class="detail-row">
                        <div class="detail-icon">📅</div>
                        <div class="detail-label">Time:</div>
                        <div class="detail-value">${formatDate(loginTime)}</div>
                    </div>
                    
                    <div class="detail-row">
                        <div class="detail-icon">${getDeviceIcon(userAgent)}</div>
                        <div class="detail-label">Device:</div>
                        <div class="detail-value">${getBrowserInfo(userAgent)} on ${deviceInfo?.os || 'Unknown OS'}</div>
                    </div>
                    
                    <div class="detail-row">
                        <div class="detail-icon">🌐</div>
                        <div class="detail-label">IP Address:</div>
                        <div class="detail-value">${ipAddress}</div>
                    </div>
                    
                    <div class="detail-row">
                        <div class="detail-icon">${getLocationFlag(location)}</div>
                        <div class="detail-label">Location:</div>
                        <div class="detail-value">${location === 'Unknown Location' ? 'Unknown Location' : location}</div>
                    </div>
                </div>

                <div class="button-container">
                    <div style="margin-bottom: 15px; font-size: 16px; font-weight: bold;">Was this you?</div>
                    <a href="${securityUrl}" class="button">Yes, this was me</a>
                    <a href="${changePasswordUrl}" class="button button-danger">No, secure my account</a>
                </div>

                <div class="warning-section">
                    <div class="warning-title">⚠️ If this wasn't you</div>
                    <div class="warning-text">
                        Someone else may have access to your account. Please change your password immediately 
                        and review your account security settings.
                    </div>
                    <a href="${changePasswordUrl}" class="button button-danger">Change Password Now</a>
                </div>

                <div class="divider"></div>

                <div class="security-tips">
                    <div class="security-tips-title">🛡️ Security Tips:</div>
                    <ul class="tips-list">
                        <li>Use a strong, unique password for your account</li>
                        <li>Enable two-factor authentication for added security</li>
                        <li>Keep your browser and apps updated</li>
                        <li>Don't share your login credentials with anyone</li>
                        <li>Log out from public or shared devices</li>
                    </ul>
                </div>

                <div class="message">
                    If you have any questions about this login or need help securing your account, 
                    visit our <a href="${helpUrl}" style="color: #1d9bf0;">Help Center</a> 
                    or contact our support team immediately.
                </div>
            </div>
            
            <div class="footer">
                <div class="footer-text">
                    This security alert was sent to ${props.email} because someone logged into your X account.
                    If you believe this email was sent in error, please contact our support team.
                </div>
                
                <div style="margin: 20px 0;">
                    <a href="${baseUrl}" style="color: #536471; text-decoration: none; margin: 0 10px;">Visit X</a> |
                    <a href="${securityUrl}" style="color: #536471; text-decoration: none; margin: 0 10px;">Security Settings</a> |
                    <a href="${helpUrl}" style="color: #536471; text-decoration: none; margin: 0 10px;">Help Center</a>
                </div>
                
                <div class="footer-text" style="margin-top: 20px;">
                    <strong>X Security Team</strong><br>
                    © 2024 X Corp. All rights reserved.<br>
                    1355 Market Street, Suite 900, San Francisco, CA 94103
                </div>
                
                <div style="margin-top: 15px; font-size: 10px; color: #aab8c2;">
                    Email ID: LOGIN-${Date.now()}-${username.toUpperCase()}
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};

export const sendLoginAlertEmail = async (props: LoginAlertEmailProps): Promise<boolean> => {
  try {
    const html = getLoginAlertEmailHTML(props);
    
    return await emailService.sendEmail({
      to: props.email,
      subject: `🔐 New login to your X account (@${props.username})`,
      html
    });
  } catch (error) {
    console.error('Failed to send login alert email:', error);
    return false;
  }
};

export default sendLoginAlertEmail;