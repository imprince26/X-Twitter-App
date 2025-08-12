import { Schema, model, Document, Types } from 'mongoose';

export interface IConversation extends Document {
  participants: Types.ObjectId[];
  isGroup: boolean;
  groupName?: string;
  groupImage?: string;
  admin?: Types.ObjectId;
  lastMessage?: Types.ObjectId;
  lastActivity: Date;
  isActive: boolean;
  mutedBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  isGroup: { type: Boolean, default: false },
  groupName: {
    type: String,
    maxlength: 50
  },
  groupImage: String,
  admin: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'DirectMessage'
  },
  lastActivity: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  mutedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastActivity: -1 });

export const Conversation = model<IConversation>('Conversation', conversationSchema);
