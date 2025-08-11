import { emailService } from '../sendMail';

interface WelcomeEmailProps {
  name: string;
  email: string;
  username: string;
  baseUrl?: string;
}

const getWelcomeEmailHTML = (props: WelcomeEmailProps): string => {
  const { name, username, baseUrl = process.env.CLIENT_URL || 'http://localhost:3000' } = props;
  const loginUrl = `${baseUrl}/login`;
  const helpUrl = `${baseUrl}/help`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to X!</title>
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
            .divider { height: 1px; background-color: #e1e8ed; margin: 30px 0; }
            .tips-list { text-align: left; padding-left: 20px; color: #0f1419; }
            .tips-list li { margin-bottom: 8px; }
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
                <div class="greeting">Welcome to X! 🎉</div>

                <div class="message">
                    Hi ${name},<br><br>
                    
                    Your email has been verified successfully! Welcome to X, where you can share your thoughts, 
                    connect with others, and stay updated with what's happening around the world.
                </div>

                <div style="text-align: center;">
                    <a href="${loginUrl}" class="button">Start Using X</a>
                </div>

                <div class="highlight">
                    <h3 style="margin-bottom: 15px; color: #0f1419;">Getting Started Tips:</h3>
                    <ul class="tips-list">
                        <li>Complete your profile with a photo and bio</li>
                        <li>Follow accounts that interest you</li>
                        <li>Share your first post</li>
                        <li>Explore trending topics</li>
                        <li>Customize your notification preferences</li>
                    </ul>
                </div>

                <div class="message">
                    Your username: <strong>@${username}</strong><br>
                    Ready to join the conversation? Start by following some interesting accounts and sharing your thoughts!
                </div>

                <div class="divider"></div>

                <div class="message">
                    If you have any questions, visit our <a href="${helpUrl}" style="color: #1d9bf0;">Help Center</a> 
                    or contact our support team. We're here to help you get the most out of X!
                </div>
            </div>
            
            <div class="footer">
                <div class="footer-text">
                    This email was sent by X (Twitter Clone). You're receiving this because you successfully verified your account.
                </div>
                
                <div style="margin: 20px 0;">
                    <a href="${baseUrl}" style="color: #536471; text-decoration: none; margin: 0 10px;">Visit X</a> |
                    <a href="${baseUrl}/help" style="color: #536471; text-decoration: none; margin: 0 10px;">Help Center</a> |
                    <a href="${baseUrl}/settings" style="color: #536471; text-decoration: none; margin: 0 10px;">Settings</a>
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

export const sendWelcomeEmail = async (props: WelcomeEmailProps): Promise<boolean> => {
  try {
    const html = getWelcomeEmailHTML(props);
    
    return await emailService.sendEmail({
      to: props.email,
      subject: 'Welcome to X! 🎉',
      html
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
};

export default sendWelcomeEmail;