import { Schema, model, Document, Types } from 'mongoose';

export interface IBlock extends Document {
  blocker: Types.ObjectId;
  blocked: Types.ObjectId;
  reason?: string;
  createdAt: Date;
}

const blockSchema = new Schema<IBlock>({
  blocker: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  blocked: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    maxlength: 200
  }
}, {
  timestamps: true
});

blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });
blockSchema.index({ blocker: 1 });
blockSchema.index({ blocked: 1 });

export const Block = model<IBlock>('Block', blockSchema);
