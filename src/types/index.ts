import type { Timestamp } from 'firebase/firestore';

export interface User {
  id: string; // UID from Firebase Auth
  username?: string;
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  profilePicUrl?: string | null;
  isCreator: boolean;
  bio?: string | null;
  createdAt: Timestamp | Date | string; // Firestore Timestamp on server, Date or string on client
  updatedAt?: Timestamp | Date | string;
  // For creator-specific fields if they complete profile as creator initially
  tipHandle?: string; 
  category?: string;
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
  socialLinks?: SocialLink[];
  createdAt: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string;
  // Denormalized for querying, if needed
  email?: string | null;
  phoneNumber?: string | null;
}

export interface Tip {
  id: string; // Firestore document ID
  fromUserId: string; // Firebase Auth UID
  fromUsername?: string; // Denormalized for display
  toCreatorId: string; // Firebase Auth UID of creator
  toCreatorHandle?: string; // Denormalized for display
  amount: number; // in KES
  message?: string | null;
  timestamp: Timestamp | Date | string; // Firestore Timestamp
  paymentRef?: string; // e.g., M-Pesa transaction ID (future use)
  status?: 'pending' | 'successful' | 'failed'; // For payment status (future use)
}

// For useAuth hook, largely mirrors User but ensures ID is present
export interface AuthUser extends User {
  id: string; 
}
