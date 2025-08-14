import { Schema, model, Document } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";
import crypto from "crypto";

export interface IUser extends Document {
  // User ID
  _id: string;

  // Basic Information
  username: string;
  email: string;
  name: string;
  bio: string;
  location: string;
  website: string;
  dateOfBirth: Date;

  // Authentication
  password: string;
  isEmailVerified: boolean;
  emailVerificationCode?: string;
  emailVerificationExpires?: Date;
  passwordResetCode?: string;
  passwordResetExpires?: Date;

  // Profile
  profilePicture: string;
  coverImage: string;
  isVerified: boolean;
  verificationBadge: "blue" | "gold" | "gray" | null;

  // Social
  followersCount: number;
  followingCount: number;
  tweetsCount: number;
  likesCount: number;

  // Privacy & Security
  isPrivate: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  loginAttempts: number;
  lockUntil?: Date;

  // Account Status
  isActive: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
  suspensionExpires?: Date;

  // Admin & Moderation
  isAdmin: boolean;
  isModerator: boolean;
  affiliatedAccounts: string[];

  // Preferences
  theme: "light" | "dark" | "auto";
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    mentions: boolean;
    follows: boolean;
    likes: boolean;
    retweets: boolean;
    directMessages: boolean;
  };

  // Privacy Settings
  privacy: {
    allowDirectMessages: "everyone" | "following" | "verified" | "none";
    allowTagging: "everyone" | "following" | "none";
    discoverByEmail: boolean;
    discoverByPhone: boolean;
    showActivity: boolean;
  };

  // Timestamps
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  generateEmailVerificationCode(): string;
  generatePasswordResetCode(): string;
  isAccountLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  toJSON(): object;
}

const userSchema = new Schema<IUser>(
  {
    // Basic Information
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [15, "Username cannot exceed 15 characters"],
      match: [
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ],
      validate: {
        validator: function (username: string) {
          // Reserved usernames
          const reserved = [
            "admin",
            "root",
            "api",
            "www",
            "mail",
            "support",
            "help",
            "about",
            "privacy",
            "terms",
          ];
          return !reserved.includes(username.toLowerCase());
        },
        message: "Username is reserved",
      },
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
      minlength: [1, "Name is required"],
    },

    bio: {
      type: String,
      default: "",
      maxlength: [160, "Bio cannot exceed 160 characters"],
      trim: true,
    },

    location: {
      type: String,
      default: "",
      maxlength: [30, "Location cannot exceed 30 characters"],
      trim: true,
    },

    website: {
      type: String,
      default: "",
      validate: {
        validator: function (url: string) {
          return !url || validator.isURL(url);
        },
        message: "Please provide a valid URL",
      },
    },

    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
      validate: {
        validator: function (date: Date) {
          const age =
            (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365);
          return age >= 13; // Minimum age requirement
        },
        message: "You must be at least 13 years old",
      },
    },

    // Authentication
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      validate: {
        validator: function (password: string) {
          // At least one uppercase, one lowercase, one number, and one special character
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
            password
          );
        },
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      },
      select: false, // Don't include password in queries by default
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationCode: {
      type: String,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    passwordResetCode: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },

    // Profile
    profilePicture: {
      type: String,
      default: "",
      validate: {
        validator: function (url: string) {
          return !url || validator.isURL(url);
        },
        message: "Please provide a valid profile picture URL",
      },
    },

    coverImage: {
      type: String,
      default: "",
      validate: {
        validator: function (url: string) {
          return !url || validator.isURL(url);
        },
        message: "Please provide a valid cover image URL",
      },
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationBadge: {
      type: String,
      enum: ["blue", "gold", "gray", null],
      default: null,
    },

    // Social
    followersCount: {
      type: Number,
      default: 0,
      min: [0, "Followers count cannot be negative"],
    },

    followingCount: {
      type: Number,
      default: 0,
      min: [0, "Following count cannot be negative"],
    },

    tweetsCount: {
      type: Number,
      default: 0,
      min: [0, "Tweets count cannot be negative"],
    },

    likesCount: {
      type: Number,
      default: 0,
      min: [0, "Likes count cannot be negative"],
    },

    // Privacy & Security
    isPrivate: {
      type: Boolean,
      default: false,
    },

    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    twoFactorSecret: {
      type: String,
      select: false,
    },

    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    lockUntil: {
      type: Date,
      select: false,
    },

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },

    isSuspended: {
      type: Boolean,
      default: false,
    },

    suspensionReason: {
      type: String,
      maxlength: [500, "Suspension reason cannot exceed 500 characters"],
    },

    suspensionExpires: {
      type: Date,
    },

    // Admin & Moderation
    isAdmin: {
      type: Boolean,
      default: false,
    },

    isModerator: {
      type: Boolean,
      default: false,
    },

    affiliatedAccounts: [
      {
        type: String,
        trim: true,
      },
    ],

    // Preferences
    theme: {
      type: String,
      enum: ["light", "dark", "auto"],
      default: "auto",
    },

    language: {
      type: String,
      default: "en",
      maxlength: [5, "Language code cannot exceed 5 characters"],
    },

    timezone: {
      type: String,
      default: "UTC",
    },

    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      mentions: { type: Boolean, default: true },
      follows: { type: Boolean, default: true },
      likes: { type: Boolean, default: true },
      retweets: { type: Boolean, default: true },
      directMessages: { type: Boolean, default: true },
    },

    privacy: {
      allowDirectMessages: {
        type: String,
        enum: ["everyone", "following", "verified", "none"],
        default: "everyone",
      },
      allowTagging: {
        type: String,
        enum: ["everyone", "following", "none"],
        default: "everyone",
      },
      discoverByEmail: { type: Boolean, default: true },
      discoverByPhone: { type: Boolean, default: true },
      showActivity: { type: Boolean, default: true },
    },

    // Timestamps
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for account lock status
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Pre-save middleware to validate suspension
userSchema.pre("save", function (next) {
  if (
    this.isSuspended &&
    this.suspensionExpires &&
    this.suspensionExpires <= new Date()
  ) {
    this.isSuspended = false;
    this.suspensionReason = undefined;
    this.suspensionExpires = undefined;
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate auth token
userSchema.methods.generateAuthToken = function (): string {
  const payload = {
    userId: this._id,
    username: this.username,
    email: this.email,
    isAdmin: this.isAdmin,
    isModerator: this.isModerator,
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "7d",
    issuer: "x-app",
    audience: "x-app-users",
  });
};

// Method to generate 6-digit email verification code
userSchema.methods.generateEmailVerificationCode = function (): string {
  const code = crypto.randomInt(100000, 999999).toString();
  
  this.emailVerificationCode = code;
  this.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  return code;
};

// Method to generate 6-digit password reset code
userSchema.methods.generatePasswordResetCode = function (): string {
  const code = crypto.randomInt(100000, 999999).toString();
  
  this.passwordResetCode = code;
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  return code;
};

// Method to check if account is locked
userSchema.methods.isAccountLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

// Method to increment login attempts
userSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours

  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates: any = { $inc: { loginAttempts: 1 } };

  if (this.loginAttempts + 1 >= maxAttempts && !this.isAccountLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + lockTime) };
  }

  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
  });
};

// Override toJSON to remove sensitive fields
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();

  // Remove sensitive fields
  delete userObject.password;
  delete userObject.emailVerificationCode;
  delete userObject.emailVerificationExpires;
  delete userObject.passwordResetCode;
  delete userObject.passwordResetExpires;
  delete userObject.twoFactorSecret;
  delete userObject.loginAttempts;
  delete userObject.lockUntil;
  delete userObject.__v;

  return userObject;
};

// Static method to find by username or email
userSchema.statics.findByUsernameOrEmail = function (identifier: string) {
  return this.findOne({
    $or: [
      { username: identifier.toLowerCase() },
      { email: identifier.toLowerCase() },
    ],
  });
};

// Static method to search users
userSchema.statics.searchUsers = function (query: string, limit: number = 20) {
  return this.find({
    $and: [
      { isActive: true },
      { isSuspended: false },
      {
        $or: [
          { username: { $regex: query, $options: "i" } },
          { name: { $regex: query, $options: "i" } },
          { bio: { $regex: query, $options: "i" } },
        ],
      },
    ],
  })
    .select(
      "username name bio profilePicture isVerified verificationBadge followersCount"
    )
    .limit(limit)
    .sort({ followersCount: -1 });
};

export const User = model<IUser>("User", userSchema);
