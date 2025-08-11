export interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export const parseUserAgent = (userAgent: string): DeviceInfo => {
  const ua = userAgent.toLowerCase();
  console.log(`Parsing user agent: ${ua}`);
  // Browser detection
  let browser = 'Unknown Browser';
  if (ua.includes('chrome') && !ua.includes('edge')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';
  
  // OS detection
  let os = 'Unknown OS';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac') && !ua.includes('iphone')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  // Device type detection
  const isMobile = ua.includes('mobile') || ua.includes('android') || ua.includes('iphone');
  const isTablet = ua.includes('tablet') || ua.includes('ipad');
  const isDesktop = !isMobile && !isTablet;
  
  let device = 'Desktop';
  if (isMobile) device = 'Mobile';
  else if (isTablet) device = 'Tablet';
  
  return {
    browser,
    os,
    device,
    isMobile,
    isTablet,
    isDesktop
  };
};