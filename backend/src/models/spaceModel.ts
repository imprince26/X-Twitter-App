import { Schema, model, Document, Types } from 'mongoose';

export interface ISpace extends Document {
  title: string;
  description?: string;
  host: Types.ObjectId;
  coHosts: Types.ObjectId[];
  speakers: Types.ObjectId[];
  listeners: Types.ObjectId[];
  
  status: 'scheduled' | 'live' | 'ended';
  scheduledFor?: Date;
  startedAt?: Date;
  endedAt?: Date;
  
  isRecorded: boolean;
  recordingUrl?: string;
  
  maxListeners: number;
  currentListeners: number;
  
  topics: string[];
  
  settings: {
    allowRequests: boolean;
    autoArchive: boolean;
    isPublic: boolean;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const spaceSchema = new Schema<ISpace>({
  title: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  description: {
    type: String,
    maxlength: 280,
    trim: true
  },
  host: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coHosts: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  speakers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  listeners: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended'],
    default: 'scheduled'
  },
  scheduledFor: Date,
  startedAt: Date,
  endedAt: Date,
  
  isRecorded: { type: Boolean, default: false },
  recordingUrl: String,
  
  maxListeners: { type: Number, default: 10000 },
  currentListeners: { type: Number, default: 0 },
  
  topics: [String],
  
  settings: {
    allowRequests: { type: Boolean, default: true },
    autoArchive: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

spaceSchema.index({ host: 1 });
spaceSchema.index({ status: 1 });

export const Space = model<ISpace>('Space', spaceSchema);