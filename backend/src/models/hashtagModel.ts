import { Schema, model, Document } from 'mongoose';

export interface IHashtag extends Document {
  name: string;
  count: number;
  category?: string;
  isBlocked: boolean;
  isTrending: boolean;
  trendingRank?: number;
  lastUsed: Date;
  createdAt: Date;
  updatedAt: Date;
}

const hashtagSchema = new Schema<IHashtag>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  count: {
    type: Number,
    default: 0,
    min: 0
  },
  category: String,
  isBlocked: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  trendingRank: Number,
  lastUsed: { type: Date, default: Date.now }
}, {
  timestamps: true
});

hashtagSchema.index({ name: 1 });
hashtagSchema.index({ count: -1 });
hashtagSchema.index({ isTrending: 1, trendingRank: 1 });

export const Hashtag = model<IHashtag>('Hashtag', hashtagSchema);