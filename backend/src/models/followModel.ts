import { Schema, model, Document, Types } from 'mongoose';

export interface IFollow extends Document {
  follower: Types.ObjectId;
  following: Types.ObjectId;
  isActive: boolean;
  isMuted: boolean;
  isBlocked: boolean;
  createdAt: Date;
}

const followSchema = new Schema<IFollow>({
  follower: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  following: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: { type: Boolean, default: true },
  isMuted: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false }
}, {
  timestamps: true
});

followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ follower: 1 });
followSchema.index({ following: 1 });

export const Follow = model<IFollow>('Follow', followSchema);
