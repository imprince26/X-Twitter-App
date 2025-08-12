import { Schema, model, Document, Types } from 'mongoose';

export interface IList extends Document {
  name: string;
  description: string;
  owner: Types.ObjectId;
  members: Types.ObjectId[];
  followers: Types.ObjectId[];
  isPrivate: boolean;
  coverImage?: string;
  membersCount: number;
  followersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const listSchema = new Schema<IList>({
  name: {
    type: String,
    required: true,
    maxlength: 25,
    trim: true
  },
  description: {
    type: String,
    maxlength: 100,
    trim: true
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  isPrivate: { type: Boolean, default: false },
  coverImage: String,
  membersCount: { type: Number, default: 0 },
  followersCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

listSchema.index({ owner: 1 });

export const List = model<IList>('List', listSchema);