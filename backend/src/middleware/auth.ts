import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel';

// Extend Request interface for authenticated requests
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    email: string;
    isAdmin: boolean;
    isModerator: boolean;
  };
}

// JWT Token payload interface
interface AccessTokenPayload {
  userId: string;
  username: string;
  email: string;
  isAdmin: boolean;
  isModerator: boolean;
  type: 'access';
  iat?: number;
  exp?: number;
}

// Helper function to get JWT secret with validation
const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
};

// Helper function to verify JWT token
const verifyToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, getJWTSecret(), {
    issuer: 'x-app',
    audience: 'x-users'
  }) as AccessTokenPayload;
};

// @desc    Authenticate user middleware
// @access  Private
export const authenticate = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    // // Get token from Authorization header
    // const authHeader = req.header('Authorization');
    // console.log(req.header('Authorization'));
    
    // if (!authHeader || !authHeader.startsWith('Bearer ')) {
    //   res.status(401).json({
    //     success: false,
    //     message: 'Access denied. No valid token provided.'
    //   });
    //   return;
    // }

     const token = req.cookies.SportsBuddyToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login to access this resource",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication service error'
    });
  }
};

// @desc    Admin authentication middleware
// @access  Private (Admin only)
export const adminAuth = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  authenticate(req, res, () => {
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

// @desc    Moderator authentication middleware  
// @access  Private (Moderator or Admin)
export const moderatorAuth = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  authenticate(req, res, () => {
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

// @desc    Email verification check middleware
// @access  Private (Email verified users only)
export const requireEmailVerification = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  authenticate(req, res, async () => {
    try {
      const user = await User.findById(req.user?.userId).select('isEmailVerified');
      
      if (!user || !user.isEmailVerified) {
        res.status(403).json({
          success: false,
          message: 'Email verification required',
          code: 'EMAIL_VERIFICATION_REQUIRED'
        });
        return;
      }
      
      next();
    } catch (error) {
      console.error('Email verification check error:', error);
      res.status(500).json({
        success: false,
        message: 'Verification check failed'
      });
    }
  });
};

// @desc    Optional authentication middleware (doesn't fail if no token)
// @access  Public/Private
export const optionalAuth = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    
    // If no token provided, continue without authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.replace('Bearer ', '').trim();
    
    if (!token) {
      next();
      return;
    }

    try {
      const decoded = verifyToken(token);
      
      if (decoded.type === 'access') {
        const user = await User.findById(decoded.userId).select('+isActive +isSuspended');
        
        if (user && user.isActive && !user.isSuspended) {
          req.user = {
            userId: decoded.userId,
            username: decoded.username,
            email: decoded.email,
            isAdmin: decoded.isAdmin || false,
            isModerator: decoded.isModerator || false
          };
        }
      }
    } catch (jwtError) {
      // Ignore JWT errors in optional auth
      console.warn('Optional auth token verification failed:', jwtError.message);
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // Continue even if error occurs
  }
};

// Export all middleware functions
export default {
  authenticate,
  adminAuth,
  moderatorAuth,
  requireEmailVerification,
  optionalAuth
};