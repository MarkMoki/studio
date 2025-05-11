import type { Timestamp } from 'firebase/firestore';

export interface User {
  id: string; // UID from Firebase Auth
  username?: string | null; 
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  profilePicUrl?: string | null;
  isCreator: boolean;
  bio?: string | null;
  createdAt: Timestamp | Date | string; 
  updatedAt?: Timestamp | Date | string | null;
  tipHandle?: string | null; 
  category?: string | null;
}

export interface SocialLink {
  platform: 'twitter' | 'instagram' | 'facebook' | 'youtube' | 'tiktok' | 'website' | 'other';
  url: string | null; // Allow null for URL if not set during edit
}

export interface Creator {
  id: string; 
  userId: string; 
  tipHandle: string;
  fullName?: string | null; 
  profilePicUrl?: string | null; 
  coverImageUrl?: string | null; 
  bio?: string | null; 
  totalTips: number;
  totalAmountReceived: number; 
  category: string; 
  active: boolean;
  featured: boolean;
  socialLinks?: SocialLink[] | null;
  createdAt: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string | null;
  email?: string | null;
  phoneNumber?: string | null;
}

export interface Tip {
  id: string; 
  fromUserId: string; 
  fromUsername?: string | null; 
  toCreatorId: string; 
  toCreatorHandle?: string | null; 
  amount: number; 
  platformFee: number; 
  creatorAmount: number; 
  message?: string | null;
  timestamp: Timestamp | Date | string; 
  paymentRef?: string | null; 
  paymentProvider?: 'flutterwave' | 'mpesa_direct' | string; 
  paymentStatus: 'initiated' | 'pending_confirmation' | 'successful' | 'failed' | 'refunded' | 'error_initiation' | 'failed_initiation';
  mpesaPhone?: string | null; 
  platformReceivingMpesa?: string | null; 
  flutterwaveResponse?: any | null; 
  flutterwaveError?: any | null; 
  webhookConfirmedAt?: Timestamp | Date | string | null; 
}

export interface AuthUser extends User {
  id: string; 
}
