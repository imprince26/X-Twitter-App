import { Schema, model, Document } from 'mongoose';

interface IAnalytics extends Document {
  type: 'post_impression' | 'profile_view';
  targetId: string; // Post ID or User ID
  userId?: string; // Viewer, if authenticated
  createdAt: Date;
}

const analyticsSchema = new Schema<IAnalytics>({
  type: { type: String, enum: ['post_impression', 'profile_view'], required: true },
  targetId: { type: String, required: true },
  userId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Indexes for performance
analyticsSchema.index({ targetId: 1, type: 1, createdAt: -1 });

export const Analytics = model<IAnalytics>('Analytics', analyticsSchema);