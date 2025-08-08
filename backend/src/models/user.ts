import { Schema, model, Document } from 'mongoose';

interface IUser extends Document {
  clerkId: string;
  username: string;
  name: string;
  bio: string;
  profilePicture: string;
  coverImage: string;
  isVerified: boolean;
  affiliatedAccounts: string[];
  isAdmin: boolean;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  clerkId: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  bio: { type: String, default: '' },
  profilePicture: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  affiliatedAccounts: [{ type: String }],
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Indexes for performance
// userSchema.index({ clerkId: 1 });
userSchema.index({ username: 'text', name: 'text' });

export const User = model<IUser>('User', userSchema);