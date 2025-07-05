import { Schema, model, Document } from 'mongoose';

import mongoose from 'mongoose';

interface ILike extends Document {
  userId: string;
  postId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const likeSchema = new Schema<ILike>({
  userId: { type: String, required: true },
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  createdAt: { type: Date, default: Date.now },
});

// Indexes for performance
likeSchema.index({ userId: 1, postId: 1 }, { unique: true });

export const Like = model<ILike>('Like', likeSchema);