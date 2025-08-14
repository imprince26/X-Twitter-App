import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/userModel";
import {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendLoginAlertEmail,
} from "../email/emailService";
import "dotenv/config";
import { parseUserAgent } from "../utils/userAgentParser";
import requestIP from "request-ip";

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
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
};

// Helper function to generate JWT token
const generateToken = (user: IUser): string => {
  const payload: JWTPayload = {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin || false,
    isModerator: user.isModerator || false,
  };

  return jwt.sign(payload, getJWTSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    issuer: "x-app",
    audience: "x-users",
  });
};

const sendTokenResponse = (
  user: IUser,
  statusCode: number,
  res: Response,
  message: string = "Success"
) => {
  const token = generateToken(user);

  const cookieOptions = {
    expires: new Date(
      Date.now() +
        (process.env.JWT_COOKIE_EXPIRES_IN
          ? parseInt(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
          : 7 * 24 * 60 * 60 * 1000)
    ), // 7 days default
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
  };

  res
    .status(statusCode)
    .cookie("TwitterToken", token, cookieOptions)
    .json({
      success: true,
      message,
      data: {
        user: user.toJSON(),
        token,
        tokenType: "Bearer",
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      },
    });
};

const getClientInfo = (req: Request) => {
  const userAgent =
    req.get("User-Agent") || req.headers["user-agent"] || "Unknown Device";

  const ipAddress = requestIP.getClientIp(req) || "Unknown IP";

  const getLocation = () => {
    // Cloudflare country code
    const cfCountry = req.get("CF-IPCountry") || req.headers["cf-ipcountry"];
    if (cfCountry && cfCountry !== "XX" && cfCountry !== "T1") {
      return cfCountry;
    }

    // AWS CloudFront country code
    const cloudfrontCountry =
      req.get("CloudFront-Viewer-Country") ||
      req.headers["cloudfront-viewer-country"];
    if (cloudfrontCountry) {
      return cloudfrontCountry;
    }

    return "Unknown Location";
  };

  const location = getLocation();

  // Clean up IPv4-mapped IPv6 addresses
  const cleanIP = (ip: string) => {
    if (ip.startsWith("::ffff:")) {
      return ip.substring(7);
    }
    return ip;
  };

  return {
    userAgent,
    ipAddress: cleanIP(ipAddress),
    location,
    timestamp: new Date().toISOString(),
    protocol: req.protocol,
    host: req.get("Host") || "Unknown Host",
  };
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, name, password, dateOfBirth } = req.body;

    // Basic validation
    if (!username || !email || !name || !password || !dateOfBirth) {
      res.status(400).json({
        success: false,
        message: "All fields are required",
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() },
      ],
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message:
          existingUser.username === username.toLowerCase()
            ? "Username already taken"
            : "Email already registered",
      });
      return;
    }

    // Create user
    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      name: name.trim(),
      password,
      dateOfBirth: new Date(dateOfBirth),
    });

    await user.save();

    // Generate 6-digit verification code
    const verificationCode = user.generateEmailVerificationCode();
    await user.save();

    // Send verification email with code
    await sendVerificationEmail({
      name: user.name,
      email: user.email,
      verificationCode,
    });

    sendTokenResponse(
      user,
      201,
      res,
      "User registered successfully. Please verify your email with the 6-digit code sent to your email."
    );
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Server error during registration",
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body;

    // Basic validation
    if (!identifier || !password) {
      res.status(400).json({
        success: false,
        message: "Username/email and password are required",
      });
      return;
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username: identifier.toLowerCase() },
        { email: identifier.toLowerCase() },
      ],
    }).select("+password +loginAttempts +lockUntil");

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    // Check account status
    if (user.isAccountLocked && user.isAccountLocked()) {
      res.status(423).json({
        success: false,
        message:
          "Account temporarily locked due to too many failed login attempts",
        lockUntil: user.lockUntil,
      });
      return;
    }

    if (user.isSuspended) {
      res.status(403).json({
        success: false,
        message: "Account suspended",
        suspensionReason: user.suspensionReason,
        suspensionExpires: user.suspensionExpires,
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: "Account deactivated",
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
        message: "Invalid credentials",
      });
      return;
    }

    // Reset login attempts and update last login
    if (user.resetLoginAttempts) {
      await user.resetLoginAttempts();
    }
    user.lastLogin = new Date();
    await user.save();

    // Send login alert email
    const { userAgent, ipAddress, location } = getClientInfo(req);
    const deviceInfo = parseUserAgent(userAgent);

    await sendLoginAlertEmail({
      name: user.name,
      email: user.email,
      username: user.username,
      ipAddress,
      userAgent,
      location,
      loginTime: new Date(),
      deviceInfo,
    });

    sendTokenResponse(user, 200, res, "Login successful");
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

export const logout = (req: Request, res: Response): void => {
  res
    .cookie("TwitterToken", "", {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })
    .json({
      success: true,
      message: "Logged out successfully",
    });
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.json({
      success: true,
      data: { user: user },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { code } = req.body;

    if (!code) {
      res.status(400).json({
        success: false,
        message: "Verification code is required",
      });
      return;
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      res.status(400).json({
        success: false,
        message: "Invalid verification code format",
      });
      return;
    }

    const user = await User.findOne({
      emailVerificationCode: code,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
      return;
    }

    if (user.isEmailVerified) {
      res.status(400).json({
        success: false,
        message: "Email already verified",
      });
      return;
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail({
        name: user.name,
        email: user.email,
        username: user.username,
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during email verification",
    });
  }
};

export const resendVerification = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (user.isEmailVerified) {
      res.status(400).json({
        success: false,
        message: "Email already verified",
      });
      return;
    }

    const verificationCode = user.generateEmailVerificationCode();
    await user.save();

    try {
      await sendVerificationEmail({
        name: user.name,
        email: user.email,
        verificationCode,
      });

      console.info(`Verification code resent to: ${user.email}`);

      res.json({
        success: true,
        message: "Verification code sent successfully",
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      res.status(500).json({
        success: false,
        message: "Failed to send verification email",
      });
    }
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, username } = req.body;

    if (!email && !username) {
      res.status(400).json({
        success: false,
        message: "Email or username is required",
      });
      return;
    }

    const query = email 
      ? { email: email.toLowerCase() }
      : { username: username.toLowerCase() };

    const user = await User.findOne(query);

    // Always return success to prevent user enumeration
    if (!user) {
      res.json({
        success: true,
        message: "If the account exists, a password reset code has been sent",
      });
      return;
    }

    const resetCode = user.generatePasswordResetCode();
    await user.save();

    try {
      await sendPasswordResetEmail({
        name: user.name,
        email: user.email,
        username: user.username,
        resetCode,
      });

      res.json({
        success: true,
        message: "Password reset code sent to your email",
      });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      res.json({
        success: true,
        message: "If the account exists, a password reset code has been sent",
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { code, password } = req.body;

    if (!code || !password) {
      res.status(400).json({
        success: false,
        message: "Reset code and new password are required",
      });
      return;
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      res.status(400).json({
        success: false,
        message: "Invalid reset code format",
      });
      return;
    }

    const user = await User.findOne({
      passwordResetCode: code,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired reset code",
      });
      return;
    }

    // Check if new password is different from current
    const isSamePassword = await user.comparePassword(password);
    if (isSamePassword) {
      res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
      return;
    }

    user.password = password;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Send password changed email
    const { userAgent, ipAddress, location } = getClientInfo(req);

    try {
      await sendPasswordChangedEmail({
        name: user.name,
        email: user.email,
        username: user.username,
        ipAddress,
        userAgent,
        location,
      });
    } catch (emailError) {
      console.error("Failed to send password changed email:", emailError);
    }

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password reset",
    });
  }
};

export const verifyResetCode = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { code } = req.body;

    if (!code) {
      res.status(400).json({
        success: false,
        message: "Reset code is required",
      });
      return;
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      res.status(400).json({
        success: false,
        message: "Invalid reset code format",
      });
      return;
    }

    const user = await User.findOne({
      passwordResetCode: code,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired reset code",
      });
      return;
    }

    res.json({
      success: true,
      message: "Reset code is valid",
    });
  } catch (error) {
    console.error("Verify reset code error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
      return;
    }

    const user = await User.findById(req.user?._id).select("+password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
      return;
    }

    // Check if new password is different
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      res.status(400).json({
        success: false,
        message: "New password must be different from current password",
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
        location,
      });
    } catch (emailError) {
      console.error("Failed to send password changed email:", emailError);
    }

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, bio, location, website } = req.body;

    const user = await User.findById(req.user?._id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
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
      message: "Profile updated successfully",
      data: { user: user.toJSON() },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const deactivateAccount = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { password } = req.body;

    if (!password) {
      res.status(400).json({
        success: false,
        message: "Password is required for account deactivation",
      });
      return;
    }

    const user = await User.findById(req.user?._id).select("+password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Verify password before deactivation
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(400).json({
        success: false,
        message: "Password is incorrect",
      });
      return;
    }

    user.isActive = false;
    await user.save();

    console.info(`Account deactivated for user: ${user.username}`);

    // Clear cookie on deactivation
    res.cookie("TwitterToken", "", {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.json({
      success: true,
      message: "Account deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate account error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const checkUsername = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username } = req.params;

    if (!username || username.length < 3 || username.length > 15) {
      res.status(400).json({
        success: false,
        message: "Username must be between 3 and 15 characters",
      });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      res.status(400).json({
        success: false,
        message: "Username can only contain letters, numbers, and underscores",
      });
      return;
    }

    const existingUser = await User.findOne({
      username: username.toLowerCase(),
    }).select("_id");

    res.json({
      success: true,
      available: !existingUser,
      message: existingUser ? "Username already taken" : "Username available",
    });
  } catch (error) {
    console.error("Check username error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const checkEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.params;

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    }).select("_id");

    res.json({
      success: true,
      available: !existingUser,
      message: existingUser ? "Email already registered" : "Email available",
    });
  } catch (error) {
    console.error("Check email error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const verifyAuthToken = async (req: Request, res: Response) => {
  try {
    // The user should be available from the auth middleware
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Token verification failed'
    });
  }
};

export default {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  verifyResetCode,
  changePassword,
  updateProfile,
  deactivateAccount,
  checkUsername,
  checkEmail,
};