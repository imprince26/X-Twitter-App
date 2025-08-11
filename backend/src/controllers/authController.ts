import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '../models/userModel';
import {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from '../email/emailService';
import 'dotenv/config';

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

// JWT Token Types
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

interface RefreshTokenPayload {
  userId: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

interface VerificationTokenPayload {
  userId: string;
  type: 'email-verification';
  iat?: number;
  exp?: number;
}

interface PasswordResetTokenPayload {
  userId: string;
  type: 'password-reset';
  iat?: number;
  exp?: number;
}

// Helper function to generate JWT tokens
const generateTokens = (user: IUser) => {
  const accessTokenPayload: AccessTokenPayload = {
    userId: user._id.toString(),
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin || false,
    isModerator: user.isModerator || false,
    type: 'access'
  };

  const refreshTokenPayload: RefreshTokenPayload = {
    userId: user._id.toString(),
    type: 'refresh'
  };

  const accessToken = jwt.sign(
    accessTokenPayload,
    process.env.JWT_SECRET!,
    { 
      expiresIn:  '15m',
      issuer: 'x-app',
      audience: 'x-users'
    }
  );

  const refreshToken = jwt.sign(
    refreshTokenPayload,
    process.env.JWT_REFRESH_SECRET!,
    { 
      expiresIn: '7d',
      issuer: 'x-app',
      audience: 'x-users'
    }
  );

  return { accessToken, refreshToken };
};

// Helper function to generate email verification token
const generateEmailVerificationToken = (userId: string): string => {
  const payload: VerificationTokenPayload = {
    userId,
    type: 'email-verification'
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '24h',
    issuer: 'x-app',
    audience: 'x-users'
  });
};

// Helper function to generate password reset token
const generatePasswordResetToken = (userId: string): string => {
  const payload: PasswordResetTokenPayload = {
    userId,
    type: 'password-reset'
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '1h',
    issuer: 'x-app',
    audience: 'x-users'
  });
};

// Helper function to verify JWT token
const verifyToken = (token: string, secret: string): any => {
  return jwt.verify(token, secret, {
    issuer: 'x-app',
    audience: 'x-users'
  });
};

// Helper function to send response with tokens
const sendTokenResponse = (
  user: IUser,
  statusCode: number,
  res: Response,
  message: string = 'Success'
) => {
  const { accessToken, refreshToken } = generateTokens(user);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/'
  };

  res
    .status(statusCode)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json({
      success: true,
      message,
      data: {
        user: user.toJSON(),
        accessToken,
        tokenType: 'Bearer',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m'
      },
    });
};

// Helper function to get client info
const getClientInfo = (req: Request) => {
  const userAgent = req.get('User-Agent') || 'Unknown Device';
  const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown IP';
  const location = req.get('CF-IPCountry') || 'Unknown Location'; // Cloudflare country header
  
  return { userAgent, ipAddress, location };
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, name, password, dateOfBirth } = req.body;

    // Basic validation
    if (!username || !email || !name || !password || !dateOfBirth) {
      res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: existingUser.username === username.toLowerCase()
          ? 'Username already taken'
          : 'Email already registered'
      });
      return;
    }

    // Create user
    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      name: name.trim(),
      password,
      dateOfBirth: new Date(dateOfBirth)
    });

    await user.save();

    // Generate email verification token
    const verificationToken = generateEmailVerificationToken(user._id.toString());
    
    // Save verification token to user (optional, for tracking)
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    console.info(`New user registered: ${user.username} (${user.email})`);

    // Send verification email
    try {
      await sendVerificationEmail({
        name: user.name,
        email: user.email,
        verificationToken
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    sendTokenResponse(
      user,
      201,
      res,
      'User registered successfully. Please verify your email.'
    );
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body;

    // Basic validation
    if (!identifier || !password) {
      res.status(400).json({
        success: false,
        message: 'Username/email and password are required'
      });
      return;
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username: identifier.toLowerCase() },
        { email: identifier.toLowerCase() }
      ]
    }).select('+password +loginAttempts +lockUntil');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Check account status
    if (user.isAccountLocked && user.isAccountLocked()) {
      res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to too many failed login attempts',
        lockUntil: user.lockUntil
      });
      return;
    }

    if (user.isSuspended) {
      res.status(403).json({
        success: false,
        message: 'Account suspended',
        suspensionReason: user.suspensionReason,
        suspensionExpires: user.suspensionExpires
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Account deactivated'
      });
      return;
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      if (user.incrementLoginAttempts) {
        await user.incrementLoginAttempts();
      }
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Reset login attempts and update last login
    if (user.resetLoginAttempts) {
      await user.resetLoginAttempts();
    }
    user.lastLogin = new Date();
    await user.save();

    // Get client info for security alert
    const { userAgent, ipAddress, location } = getClientInfo(req);

    // Send login alert email (optional, for security)
    try {
      // await sendLoginAlertEmail({
      //   name: user.name,
      //   email: user.email,
      //   username: user.username,
      //   ipAddress,
      //   userAgent,
      //   location,
      //   loginTime: new Date()
      // });
    } catch (emailError) {
      console.error('Failed to send login alert email:', emailError);
      // Don't fail login if email fails
    }

    console.info(`User login: ${user.username} from ${ipAddress}`);

    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: 'Refresh token not provided'
      });
      return;
    }

    try {
      const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET!) as RefreshTokenPayload;
      
      if (decoded.type !== 'refresh') {
        res.status(401).json({
          success: false,
          message: 'Invalid token type'
        });
        return;
      }

      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive || user.isSuspended) {
        res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
        return;
      }

      sendTokenResponse(user, 200, res, 'Token refreshed successfully');
    } catch (jwtError) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
export const logout = (req: Request, res: Response): void => {
  res
    .cookie('refreshToken', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    })
    .json({
      success: true,
      message: 'Logged out successfully'
    });
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId)
      .populate('followersCount followingCount tweetsCount likesCount');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: { user: user.toJSON() }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
      return;
    }

    try {
      const decoded = verifyToken(token, process.env.JWT_SECRET!) as VerificationTokenPayload;

      if (decoded.type !== 'email-verification') {
        res.status(400).json({
          success: false,
          message: 'Invalid token type'
        });
        return;
      }

      const user = await User.findById(decoded.userId);

      if (!user) {
        res.status(400).json({
          success: false,
          message: 'Invalid verification token'
        });
        return;
      }

      if (user.isEmailVerified) {
        res.status(400).json({
          success: false,
          message: 'Email already verified'
        });
        return;
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      console.info(`Email verified for user: ${user.username}`);

      // Send welcome email
      try {
        await sendWelcomeEmail({
          name: user.name,
          email: user.email,
          username: user.username
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail verification if email fails
      }

      res.json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (jwtError) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification'
    });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
export const resendVerification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    if (user.isEmailVerified) {
      res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
      return;
    }

    const verificationToken = generateEmailVerificationToken(user._id.toString());
    
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail({
        name: user.name,
        email: user.email,
        verificationToken
      });

      console.info(`Verification email resent to: ${user.email}`);

      res.json({
        success: true,
        message: 'Verification email sent successfully'
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required'
      });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
      return;
    }

    const resetToken = generatePasswordResetToken(user._id.toString());
    
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send password reset email
    try {
      await sendPasswordResetEmail({
        name: user.name,
        email: user.email,
        username: user.username,
        resetToken
      });

      console.info(`Password reset requested for: ${user.email}`);

      res.json({
        success: true,
        message: 'Password reset link sent to your email'
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({
        success: false,
        message: 'Token and password are required'
      });
      return;
    }

    try {
      const decoded = verifyToken(token, process.env.JWT_SECRET!) as PasswordResetTokenPayload;

      if (decoded.type !== 'password-reset') {
        res.status(400).json({
          success: false,
          message: 'Invalid token type'
        });
        return;
      }

      const user = await User.findById(decoded.userId).select('+password');

      if (!user) {
        res.status(400).json({
          success: false,
          message: 'Invalid reset token'
        });
        return;
      }

      // Check if new password is different from current
      const isSamePassword = await user.comparePassword(password);
      if (isSamePassword) {
        res.status(400).json({
          success: false,
          message: 'New password must be different from current password'
        });
        return;
      }

      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      console.info(`Password reset successful for user: ${user.username}`);

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (jwtError) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
      return;
    }

    const user = await User.findById(req.user?.userId).select('+password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
      return;
    }

    // Check if new password is different
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
      return;
    }

    user.password = newPassword;
    await user.save();

    console.info(`Password changed for user: ${user.username}`);

    // Get client info and send notification email
    const { userAgent, ipAddress, location } = getClientInfo(req);
    
    try {
      await sendPasswordChangedEmail({
        name: user.name,
        email: user.email,
        username: user.username,
        ipAddress,
        userAgent,
        location
      });
    } catch (emailError) {
      console.error('Failed to send password changed email:', emailError);
      // Don't fail password change if email fails
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, bio, location, website } = req.body;

    const user = await User.findById(req.user?.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Update only provided fields
    if (name !== undefined) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (location !== undefined) user.location = location.trim();
    if (website !== undefined) user.website = website.trim();

    await user.save();

    console.info(`Profile updated for user: ${user.username}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: user.toJSON() }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Deactivate account
// @route   DELETE /api/auth/deactivate
// @access  Private
export const deactivateAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { password } = req.body;

    if (!password) {
      res.status(400).json({
        success: false,
        message: 'Password is required for account deactivation'
      });
      return;
    }

    const user = await User.findById(req.user?.userId).select('+password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Verify password before deactivation
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
      return;
    }

    user.isActive = false;
    await user.save();

    console.info(`Account deactivated for user: ${user.username}`);

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Check username availability
// @route   GET /api/auth/check-username/:username
// @access  Public
export const checkUsername = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;

    if (!username || username.length < 3 || username.length > 15) {
      res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 15 characters'
      });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      res.status(400).json({
        success: false,
        message: 'Username can only contain letters, numbers, and underscores'
      });
      return;
    }

    const existingUser = await User.findOne({
      username: username.toLowerCase()
    }).select('_id');

    res.json({
      success: true,
      available: !existingUser,
      message: existingUser ? 'Username already taken' : 'Username available'
    });
  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Check email availability
// @route   GET /api/auth/check-email/:email
// @access  Public
export const checkEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.params;

    const existingUser = await User.findOne({
      email: email.toLowerCase()
    }).select('_id');

    res.json({
      success: true,
      available: !existingUser,
      message: existingUser ? 'Email already registered' : 'Email available'
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Verify JWT token (utility function)
// @route   POST /api/auth/verify-token
// @access  Public
export const verifyJWTToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Token is required'
      });
      return;
    }

    try {
      const decoded = verifyToken(token, process.env.JWT_SECRET!) as AccessTokenPayload;
      
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive || user.isSuspended) {
        res.status(401).json({
          success: false,
          message: 'Invalid token - user not found or inactive'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Token is valid',
        data: {
          userId: decoded.userId,
          username: decoded.username,
          email: decoded.email,
          isAdmin: decoded.isAdmin,
          isModerator: decoded.isModerator,
          expiresAt: new Date(decoded.exp! * 1000)
        }
      });
    } catch (jwtError) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export default {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
  deactivateAccount,
  checkUsername,
  checkEmail,
  verifyJWTToken
};