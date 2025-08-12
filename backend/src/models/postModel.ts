import { Schema, model, Document, Types } from 'mongoose';

export interface IPost extends Document {
  _id: string;
  content: string;
  author: Types.ObjectId;
  type: 'tweet' | 'retweet' | 'quote' | 'reply';
  
  // Media & Attachments
  media: {
    type: 'image' | 'video' | 'gif';
    url: string;
    thumbnail?: string;
    altText?: string;
    dimensions?: {
      width: number;
      height: number;
    };
  }[];
  
  // Links & Polls
  links: {
    url: string;
    title?: string;
    description?: string;
    image?: string;
  }[];
  
  poll?: {
    options: {
      text: string;
      votes: number;
    }[];
    endsAt: Date;
    totalVotes: number;
  };
  
  // Engagement
  likesCount: number;
  retweetsCount: number;
  repliesCount: number;
  quotesCount: number;
  viewsCount: number;
  bookmarksCount: number;
  
  // Relationships
  originalPost?: Types.ObjectId; // For retweets and quotes
  replyTo?: Types.ObjectId; // For replies
  thread?: Types.ObjectId[]; // For threads
  
  // Mentions & Hashtags
  mentions: Types.ObjectId[];
  hashtags: string[];
  
  // Privacy & Visibility
  visibility: 'public' | 'followers' | 'mentioned' | 'circle';
  isPromoted: boolean;
  promotionEnds?: Date;
  
  // Location & Context
  location?: {
    name: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Moderation
  isDeleted: boolean;
  isFlagged: boolean;
  flagReason?: string;
  moderatedBy?: Types.ObjectId;
  moderatedAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  editedAt?: Date;
  scheduledFor?: Date;
}

const postSchema = new Schema<IPost>({
  content: {
    type: String,
    required: [true, 'Content is required'],
    maxlength: [280, 'Content cannot exceed 280 characters'],
    trim: true
  },
  
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  type: {
    type: String,
    enum: ['tweet', 'retweet', 'quote', 'reply'],
    default: 'tweet'
  },
  
  media: [{
    type: {
      type: String,
      enum: ['image', 'video', 'gif'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    thumbnail: String,
    altText: String,
    dimensions: {
      width: Number,
      height: Number
    }
  }],
  
  links: [{
    url: {
      type: String,
      required: true
    },
    title: String,
    description: String,
    image: String
  }],
  
  poll: {
    options: [{
      text: {
        type: String,
        required: true,
        maxlength: 25
      },
      votes: {
        type: Number,
        default: 0
      }
    }],
    endsAt: Date,
    totalVotes: {
      type: Number,
      default: 0
    }
  },
  
  likesCount: { type: Number, default: 0 },
  retweetsCount: { type: Number, default: 0 },
  repliesCount: { type: Number, default: 0 },
  quotesCount: { type: Number, default: 0 },
  viewsCount: { type: Number, default: 0 },
  bookmarksCount: { type: Number, default: 0 },
  
  originalPost: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  
  thread: [{
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }],
  
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  hashtags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  visibility: {
    type: String,
    enum: ['public', 'followers', 'mentioned', 'circle'],
    default: 'public'
  },
  
  isPromoted: { type: Boolean, default: false },
  promotionEnds: Date,
  
  location: {
    name: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  isDeleted: { type: Boolean, default: false },
  isFlagged: { type: Boolean, default: false },
  flagReason: String,
  moderatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date,
  
  editedAt: Date,
  scheduledFor: Date
}, {
  timestamps: true
});

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ createdAt: -1 });

export const Post = model<IPost>('Post', postSchema);