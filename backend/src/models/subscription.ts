import { Schema, model, Document, Types } from 'mongoose';

export interface ISubscription extends Document {
  user: Types.ObjectId;
  plan: 'basic' | 'premium' | 'premium_plus';
  status: 'active' | 'canceled' | 'expired' | 'paused';
  
  startDate: Date;
  endDate: Date;
  
  paymentMethod: {
    type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
    last4?: string;
    brand?: string;
  };
  
  amount: number;
  currency: string;
  
  features: {
    editTweets: boolean;
    longerTweets: boolean;
    prioritySupport: boolean;
    verificationBadge: boolean;
    adFree: boolean;
    analytics: boolean;
  };
  
  autoRenew: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  plan: {
    type: String,
    enum: ['basic', 'premium', 'premium_plus'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'canceled', 'expired', 'paused'],
    default: 'active'
  },
  
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  
  paymentMethod: {
    type: {
      type: String,
      enum: ['card', 'paypal', 'apple_pay', 'google_pay'],
      required: true
    },
    last4: String,
    brand: String
  },
  
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  features: {
    editTweets: { type: Boolean, default: false },
    longerTweets: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    verificationBadge: { type: Boolean, default: false },
    adFree: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false }
  },
  
  autoRenew: { type: Boolean, default: true }
}, {
  timestamps: true
});

subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ status: 1 });

export const Subscription = model<ISubscription>('Subscription', subscriptionSchema);
