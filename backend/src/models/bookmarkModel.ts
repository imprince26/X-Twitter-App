import { Schema, model, Document, Types } from 'mongoose';

export interface IBookmark extends Document {
  user: Types.ObjectId;
  post: Types.ObjectId;
  folder?: string;
  createdAt: Date;
}

const bookmarkSchema = new Schema<IBookmark>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  folder: {
    type: String,
    default: 'All Bookmarks'
  }
}, {
  timestamps: true
});

bookmarkSchema.index({ user: 1, post: 1 }, { unique: true });
bookmarkSchema.index({ user: 1, createdAt: -1 });

export const Bookmark = model<IBookmark>('Bookmark', bookmarkSchema);
