import { Schema, model, Document } from 'mongoose';

interface IPost extends Document {
  userId: string;
  text: string;
  media: string[];
  createdAt: Date;
  replyTo?: string;
  retweetOf?: string;
}

const postSchema = new Schema<IPost>({
  userId: { type: String, required: true },
  text: { type: String, required: true },
  media: [{ type: String }], // Cloudinary URLs
  createdAt: { type: Date, default: Date.now },
  replyTo: { type: Schema.Types.ObjectId, ref: 'Post', default: null },
  retweetOf: { type: Schema.Types.ObjectId, ref: 'Post', default: null },
});

// Indexes for performance
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ text: 'text' }); // For search

export const Post = model<IPost>('Post', postSchema);