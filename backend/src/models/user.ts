import { Schema, model, Document } from 'mongoose';

interface IUser extends Document {
  clerkId: string;
  username: string;
  name: string;
  bio: string;
  profilePicture: string;
  coverImage: string;
  isVerified: boolean; // Blue tick for premium users
  affiliatedAccounts: string[]; // Clerk IDs of affiliated accounts
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  clerkId: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  bio: { type: String, default: '' },
  profilePicture: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  isVerified: { type: Boolean, default: false }, // Blue tick
  affiliatedAccounts: [{ type: String }], // Affiliated accounts for premium users
  createdAt: { type: Date, default: Date.now },
});

// Indexes for performance
userSchema.index({ clerkId: 1 });
userSchema.index({ username: 'text', name: 'text' }); // For search

export const User = model<IUser>('User', userSchema);