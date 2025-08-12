import { Schema, model, Document, Types } from 'mongoose';

export interface IMute extends Document {
  muter: Types.ObjectId;
  muted: Types.ObjectId;
  type: 'user' | 'keyword' | 'hashtag';
  keyword?: string;
  duration?: Date; // For temporary mutes
  createdAt: Date;
}

const muteSchema = new Schema<IMute>({
  muter: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  muted: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['user', 'keyword', 'hashtag'],
    required: true
  },
  keyword: {
    type: String,
    trim: true,
    lowercase: true
  },
  duration: Date
}, {
  timestamps: true
});

muteSchema.index({ muter: 1, muted: 1 });
muteSchema.index({ muter: 1, keyword: 1 });

export const Mute = model<IMute>('Mute', muteSchema);