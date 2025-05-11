import type { Timestamp } from 'firebase/firestore';

export interface User {
  id: string; // UID from Firebase Auth
  username?: string | null; // Make all optional fields potentially null
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  profilePicUrl?: string | null;
  isCreator: boolean;
  bio?: string | null;
  createdAt: Timestamp | Date | string; // Firestore Timestamp on server, Date or string on client
  updatedAt?: Timestamp | Date | string | null;
  // For creator-specific fields if they complete profile as creator initially
  tipHandle?: string | null; 
  category?: string | null;
}

export interface SocialLink {
  platform: 'twitter' | 'instagram' | 'facebook' | 'youtube' | 'tiktok' | 'website' | 'other';
  url: string;
}

export interface Creator {
  id: string; // This will be the same as userId (Firebase Auth UID)
  userId: string; // Firebase Auth UID
  tipHandle: string;
  fullName?: string | null; 
  profilePicUrl?: string | null; 
  coverImageUrl?: string | null; 
  bio?: string | null; 
  totalTips: number;
  totalAmountReceived: number; // in KES
  category: string; 
  active: boolean;
  featured: boolean;
  socialLinks?: SocialLink[] | null;
  createdAt: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string | null;
  // Denormalized for querying, if needed
  email?: string | null;
  phoneNumber?: string | null;
}

export interface Tip {
  id: string; // Firestore document ID
  fromUserId: string; // Firebase Auth UID
  fromUsername?: string | null; // Denormalized for display
  toCreatorId: string; // Firebase Auth UID of creator
  toCreatorHandle?: string | null; // Denormalized for display
  amount: number; // in KES (original tip amount)
  platformFee: number; // KES
  creatorAmount: number; // KES (amount after platform fee)
  message?: string | null;
  timestamp: Timestamp | Date | string; // Firestore Timestamp
  paymentRef?: string | null; // e.g., Flutterwave tx_ref or M-Pesa transaction ID
  paymentProvider?: 'flutterwave' | 'mpesa_direct' | string; // To identify payment method used
  paymentStatus: 'initiated' | 'pending_confirmation' | 'successful' | 'failed' | 'refunded' | 'error_initiation' | 'failed_initiation';
  mpesaPhone?: string | null; // Phone number that received STK or was used for payment
  platformReceivingMpesa?: string | null; // Platform's M-Pesa for settlement record
  flutterwaveResponse?: any | null; // To store initial response from Flutterwave
  flutterwaveError?: any | null; // To store error response from Flutterwave
  webhookConfirmedAt?: Timestamp | Date | string | null; // When payment was confirmed via webhook
}

// For useAuth hook, largely mirrors User but ensures ID is present
export interface AuthUser extends User {
  id: string; 
}
