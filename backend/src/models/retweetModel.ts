import { Schema, model, Document, Types } from 'mongoose';

export interface IRetweet extends Document {
  user: Types.ObjectId;
  post: Types.ObjectId;
  comment?: string; // For quote tweets
  type: 'retweet' | 'quote';
  createdAt: Date;
}

const retweetSchema = new Schema<IRetweet>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  comment: {
    type: String,
    maxlength: [280, 'Quote comment cannot exceed 280 characters'],
    trim: true
  },
  type: {
    type: String,
    enum: ['retweet', 'quote'],
    required: true
  }
}, {
  timestamps: true
});

retweetSchema.index({ user: 1, post: 1 }, { unique: true });

export const Retweet = model<IRetweet>('Retweet', retweetSchema);