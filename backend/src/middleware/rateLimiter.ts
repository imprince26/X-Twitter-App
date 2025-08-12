import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthenticatedRequest } from './auth';

export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      error: options.message || 'Too many requests, please try again later.',
      retryAfter: Math.ceil(options.windowMs / 1000)
    },
    standardHeaders: options.standardHeaders ?? true,
    legacyHeaders: options.legacyHeaders ?? false,
    keyGenerator: (req: Request) => {
      const userId = (req as AuthenticatedRequest).userId;
      return userId! || req.ip!;
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: options.message || 'Too many requests, please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    }
  });
};

// General rate limiter - 100 requests per 15 minutes
export const rateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this user, please try again later.'
});

// Strict rate limiter for sensitive operations - 5 requests per 15 minutes
export const strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many attempts, please try again later.'
});

// Post creation rate limiter - 50 posts per hour
export const postRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: 'Post limit exceeded. You can create up to 50 posts per hour.'
});

// Follow/Unfollow rate limiter - 400 follows per day
export const followRateLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 400,
  message: 'Follow limit exceeded. You can follow up to 400 users per day.'
});

// Like rate limiter - 1000 likes per day
export const likeRateLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 1000,
  message: 'Like limit exceeded. You can like up to 1000 posts per day.'
});

// Direct message rate limiter - 1000 messages per day
export const messageRateLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 1000,
  message: 'Message limit exceeded. You can send up to 1000 messages per day.'
});

// Search rate limiter - 300 searches per 15 minutes
export const searchRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: 'Search limit exceeded. Please try again later.'
});

// Auth rate limiter - 5 login attempts per 15 minutes
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts. Please try again later.'
});

// Registration rate limiter - 3 registrations per hour per IP
export const registrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    error: 'Too many accounts created from this IP, please try again later.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.ip, // Always use IP for registration
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many accounts created from this IP, please try again later.',
      retryAfter: 3600
    });
  }
});

// Password reset rate limiter - 3 attempts per hour
export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset attempts. Please try again later.'
});

// Email verification rate limiter - 5 attempts per hour
export const emailVerificationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many verification emails sent. Please try again later.'
});

// Media upload rate limiter - 100 uploads per hour
export const mediaUploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: 'Upload limit exceeded. You can upload up to 100 files per hour.'
});

// Report rate limiter - 20 reports per day
export const reportRateLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 20,
  message: 'Report limit exceeded. You can submit up to 20 reports per day.'
});

// Notification rate limiter - 50 requests per 15 minutes
export const notificationRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: 'Too many notification requests. Please try again later.'
});

// Custom rate limiter for specific user actions
export const customRateLimiter = (
  windowMs: number,
  maxRequests: number,
  message?: string
) => {
  return createRateLimiter({
    windowMs,
    max: maxRequests,
    message: message || 'Rate limit exceeded. Please try again later.'
  });
};

// Rate limiter for user premium features
export const premiumRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    
    if (!userId) {
      return next();
    }

    // Check if user has premium subscription
    // This would typically check your subscription model
    // For now, we'll use a simple implementation
    const { User } = await import('../models/userModel');
    const user = await User.findById(userId);
    
    if (!user) {
      return next();
    }

    // If user is premium, apply higher limits
    if (user.isVerified) {
      // Premium users get 2x the normal limits
      return customRateLimiter(15 * 60 * 1000, 200)(req, res, next);
    }

    // Regular users get standard limits
    return rateLimiter(req, res, next);
  } catch (error) {
    return next();
  }
};

// Rate limiter middleware factory for different subscription tiers
export const subscriptionBasedRateLimiter = (baseLimit: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      
      if (!userId) {
        return rateLimiter(req, res, next);
      }

      const { User } = await import('../models/userModel');
      const user = await User.findById(userId);
      
      if (!user) {
        return rateLimiter(req, res, next);
      }

      let multiplier = 1;
      
      // Adjust limits based on user status
      if (user.isVerified) {
        multiplier = 2; // Verified users get 2x limits
      }
      
      if (user.isAdmin || user.isModerator) {
        multiplier = 5; // Admin/Moderators get 5x limits
      }

      const adjustedLimit = baseLimit * multiplier;
      
      return customRateLimiter(
        15 * 60 * 1000, 
        adjustedLimit,
        `Rate limit exceeded. Your limit is ${adjustedLimit} requests per 15 minutes.`
      )(req, res, next);
    } catch (error) {
      return rateLimiter(req, res, next);
    }
  };
};

// IP-based rate limiter for public endpoints
export const ipRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Higher limit for public endpoints
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.ip,
  skip: (req: Request) => {
    // Skip rate limiting for certain trusted IPs (if needed)
    const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
    return trustedIPs.includes(req.ip);
  }
});

// Export default rate limiter
export default rateLimiter;