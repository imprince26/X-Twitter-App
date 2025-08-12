import { Schema, model, Document, Types } from 'mongoose';

export interface IPollVote extends Document {
  user: Types.ObjectId;
  post: Types.ObjectId;
  option: number;
  createdAt: Date;
}

const pollVoteSchema = new Schema<IPollVote>({
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
  option: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

pollVoteSchema.index({ user: 1, post: 1 }, { unique: true });

export const PollVote = model<IPollVote>('PollVote', pollVoteSchema);