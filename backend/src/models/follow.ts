import { Schema, model, Document } from 'mongoose';

interface IFollow extends Document {
  followerId: string;
  followingId: string;
  createdAt: Date;
}

const followSchema = new Schema<IFollow>({
  followerId: { type: String, required: true },
  followingId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Indexes for performance
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
followSchema.index({ followingId: 1 });

export const Follow = model<IFollow>('Follow', followSchema);