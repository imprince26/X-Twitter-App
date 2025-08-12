import { Schema, model, Document } from 'mongoose';

export interface ITrend extends Document {
  hashtag: string;
  count: number;
  region: string;
  category: 'trending' | 'politics' | 'sports' | 'entertainment' | 'technology';
  isPromoted: boolean;
  promotedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const trendSchema = new Schema<ITrend>({
  hashtag: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  count: {
    type: Number,
    required: true,
    min: 0
  },
  region: {
    type: String,
    default: 'worldwide'
  },
  category: {
    type: String,
    enum: ['trending', 'politics', 'sports', 'entertainment', 'technology'],
    default: 'trending'
  },
  isPromoted: { type: Boolean, default: false },
  promotedBy: String
}, {
  timestamps: true
});

trendSchema.index({ hashtag: 1, region: 1 }, { unique: true });

export const Trend = model<ITrend>('Trend', trendSchema);