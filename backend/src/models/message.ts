import { Schema, model, Document } from 'mongoose';

interface IMessage extends Document {
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Indexes for performance
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

export const Message = model<IMessage>('Message', messageSchema);