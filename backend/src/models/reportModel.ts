import { Schema, model, Document, Types } from 'mongoose';

export interface IReport extends Document {
  reporter: Types.ObjectId;
  reportedUser?: Types.ObjectId;
  reportedPost?: Types.ObjectId;
  reason: 'spam' | 'harassment' | 'hate_speech' | 'violence' | 'fake_news' | 'copyright' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  action?: 'none' | 'warning' | 'suspension' | 'ban' | 'content_removal';
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>({
  reporter: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedUser: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reportedPost: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  reason: {
    type: String,
    enum: ['spam', 'harassment', 'hate_speech', 'violence', 'fake_news', 'copyright', 'other'],
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  action: {
    type: String,
    enum: ['none', 'warning', 'suspension', 'ban', 'content_removal']
  }
}, {
  timestamps: true
});

reportSchema.index({ status: 1 });

export const Report = model<IReport>('Report', reportSchema);