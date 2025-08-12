import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  recipient: Types.ObjectId;
  sender?: Types.ObjectId;
  type: 'like' | 'retweet' | 'quote' | 'reply' | 'follow' | 'mention' | 'dm' | 'verification' | 'suspension';
  
  post?: Types.ObjectId;
  message?: string;
  
  isRead: boolean;
  isDeleted: boolean;
  
  metadata?: {
    [key: string]: any;
  };
  
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['like', 'retweet', 'quote', 'reply', 'follow', 'mention', 'dm', 'verification', 'suspension'],
    required: true
  },
  
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  
  message: String,
  
  isRead: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  
  metadata: Schema.Types.Mixed
}, {
  timestamps: true
});

notificationSchema.index({ recipient: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);