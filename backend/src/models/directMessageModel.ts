import { Schema, model, Document, Types } from 'mongoose';

export interface IDirectMessage extends Document {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  type: 'text' | 'image' | 'video' | 'gif' | 'voice' | 'post_share';
  
  media?: {
    type: 'image' | 'video' | 'gif' | 'voice';
    url: string;
    thumbnail?: string;
    duration?: number;
  };
  
  sharedPost?: Types.ObjectId;
  
  isRead: boolean;
  isDelivered: boolean;
  isDeleted: boolean;
  deletedFor: Types.ObjectId[];
  
  replyTo?: Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}

const directMessageSchema = new Schema<IDirectMessage>({
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'gif', 'voice', 'post_share'],
    default: 'text'
  },
  
  media: {
    type: {
      type: String,
      enum: ['image', 'video', 'gif', 'voice']
    },
    url: String,
    thumbnail: String,
    duration: Number
  },
  
  sharedPost: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  
  isRead: { type: Boolean, default: false },
  isDelivered: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedFor: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'DirectMessage'
  }
}, {
  timestamps: true
});

directMessageSchema.index({ conversation: 1, createdAt: -1 });
directMessageSchema.index({ sender: 1 });

export const DirectMessage = model<IDirectMessage>('DirectMessage', directMessageSchema);
