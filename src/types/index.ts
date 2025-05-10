export interface User {
  id: string;
  username?: string;
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  profilePicUrl?: string | null;
  isCreator: boolean;
  bio?: string | null;
  createdAt: string; // ISO date string
}

export interface Creator {
  id: string; // This will be the same as userId
  userId: string;
  tipHandle: string;
  fullName?: string | null; // Denormalized for easier display
  profilePicUrl?: string | null; // Denormalized
  bio?: string | null; // Denormalized
  totalTips: number;
  totalAmountReceived: number; // in KES
  category: string; // e.g., Dance, Music, Art
  active: boolean;
  featured: boolean;
}

export interface Tip {
  id: string;
  fromUserId: string;
  fromUsername?: string; // Denormalized for display
  toCreatorId: string;
  toCreatorHandle?: string; // Denormalized for display
  amount: number; // in KES
  message?: string | null;
  timestamp: string; // ISO date string
  paymentRef?: string; // e.g., M-Pesa transaction ID
}

// For useAuth hook
export interface AuthUser extends User {}
