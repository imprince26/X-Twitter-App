import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/userModel';

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

interface JWTPayload {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  isModerator: boolean;
  iat?: number;
  exp?: number;
}

const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
};

const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, getJWTSecret(), {
    issuer: 'x-app',
    audience: 'x-users'
  }) as JWTPayload;
};

export const authenticate = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from cookie
    const token = req.cookies.TwitterToken;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
      return;
    }

    try {
      // Verify the token
      const decoded = verifyToken(token);
      
      // Check if user still exists and is active
      const user = await User.findById(decoded.id).select('+isActive +isSuspended +isEmailVerified');
      
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Token is no longer valid - user not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      // Check if user account is active
      if (!user.isActive) {
        res.status(403).json({
          success: false,
          message: 'Account is deactivated',
          code: 'ACCOUNT_DEACTIVATED'
        });
        return;
      }

      // Check if user account is suspended
      if (user.isSuspended) {
        res.status(403).json({
          success: false,
          message: 'Account is suspended',
          code: 'ACCOUNT_SUSPENDED',
          suspensionReason: user.suspensionReason,
          suspensionExpires: user.suspensionExpires
        });
        return;
      }

      req.user = user;

      next();
    } catch (jwtError) {
      console.warn(`Invalid token attempt: ${jwtError}`);
      
      // Handle specific JWT errors
      if (jwtError instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
        return;
      }

      if (jwtError instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
        return;
      }

      res.status(401).json({
        success: false,
        message: 'Token verification failed',
        code: 'TOKEN_VERIFICATION_FAILED'
      });
      return;
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication service error'
    });
  }
};

export const adminAuth = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  await authenticate(req, res, () => {
    if (!req.user?.isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
        code: 'ADMIN_REQUIRED'
      });
      return;
    }
    next();
  });
};

export const moderatorAuth = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  await authenticate(req, res, () => {
    if (!req.user?.isModerator && !req.user?.isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Moderator privileges required.',
        code: 'MODERATOR_REQUIRED'
      });
      return;
    }
    next();
  });
};

export const requireEmailVerification = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  await authenticate(req, res, () => {
    if (!req.user?.isEmailVerified) {
      res.status(403).json({
        success: false,
        message: 'Email verification required',
        code: 'EMAIL_VERIFICATION_REQUIRED'
      });
      return;
    }
    next();
  });
};

export const optionalAuth = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.TwitterToken;
    
    // If no token provided, continue without authentication
    if (!token) {
      next();
      return;
    }

    try {
      const decoded = verifyToken(token);
      
      const user = await User.findById(decoded.id).select('+isActive +isSuspended');
      
      if (user && user.isActive && !user.isSuspended) {
        req.user = user;
      }
    } catch (jwtError) {
      // Ignore JWT errors in optional auth
      console.debug(`Optional auth - invalid token: ${jwtError.message}`);
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // Continue even if error occurs
  }
};

export default {
  authenticate,
  adminAuth,
  moderatorAuth,
  requireEmailVerification,
  optionalAuth
};