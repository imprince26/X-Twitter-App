import { Schema, model, Document } from 'mongoose';

interface INotification extends Document {
  userId: string;
  type: 'like' | 'retweet' | 'reply' | 'follow' | 'mention';
  fromUserId: string;
  postId?: string;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  userId: { type: String, required: true },
  type: { type: String, enum: ['like', 'retweet', 'reply', 'follow', 'mention'], required: true },
  fromUserId: { type: String, required: true },
  postId: { type: Schema.Types.ObjectId, ref: 'Post', default: null },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Indexes for performance
notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);