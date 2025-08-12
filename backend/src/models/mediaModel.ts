import { Schema, model, Document, Types } from 'mongoose';

export interface IMedia extends Document {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  
  type: 'image' | 'video' | 'gif' | 'audio';
  
  dimensions?: {
    width: number;
    height: number;
  };
  
  duration?: number; // For videos/audio
  
  uploadedBy: Types.ObjectId;
  
  metadata: {
    altText?: string;
    description?: string;
    tags?: string[];
  };
  
  usage: {
    posts: Types.ObjectId[];
    messages: Types.ObjectId[];
    profiles: Types.ObjectId[];
  };
  
  isProcessed: boolean;
  isDeleted: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const mediaSchema = new Schema<IMedia>({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  thumbnailUrl: String,
  
  type: {
    type: String,
    enum: ['image', 'video', 'gif', 'audio'],
    required: true
  },
  
  dimensions: {
    width: Number,
    height: Number
  },
  
  duration: Number,
  
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  metadata: {
    altText: String,
    description: String,
    tags: [String]
  },
  
  usage: {
    posts: [{
      type: Schema.Types.ObjectId,
      ref: 'Post'
    }],
    messages: [{
      type: Schema.Types.ObjectId,
      ref: 'DirectMessage'
    }],
    profiles: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  
  isProcessed: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

mediaSchema.index({ uploadedBy: 1 });
mediaSchema.index({ type: 1 });

export const Media = model<IMedia>('Media', mediaSchema);