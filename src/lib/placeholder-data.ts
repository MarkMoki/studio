import type { Creator, Tip, User } from '@/types';

export const placeholderUsers: User[] = [
  {
    id: 'user1',
    username: 'supporter_jane',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    profilePicUrl: 'https://picsum.photos/seed/user1/200/200',
    isCreator: false,
    bio: 'Loves supporting Kenyan talent!',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user2',
    username: 'amani_art_fan',
    fullName: 'Amani Art', // This user is also a creator
    email: 'amani@example.com',
    profilePicUrl: 'https://picsum.photos/seed/amaniart/200/200',
    isCreator: true,
    bio: 'Digital artist painting Nairobi\'s vibrant culture. Your support fuels my passion! 🎨✨',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user3',
    username: 'music_lover_mike',
    fullName: 'Mike K.',
    email: 'mike@example.com',
    isCreator: false,
    createdAt: new Date().toISOString(),
  },
];

export const placeholderCreators: Creator[] = [
  {
    id: 'user2', // Matches Amani Art's user ID
    userId: 'user2',
    tipHandle: '@AmaniArt',
    fullName: 'Amani Art',
    profilePicUrl: 'https://picsum.photos/seed/amaniart/200/200',
    bio: 'Digital artist painting Nairobi\'s vibrant culture. Your support fuels my passion! 🎨✨',
    totalTips: 123,
    totalAmountReceived: 6400,
    category: 'Art',
    active: true,
    featured: true,
  },
  {
    id: 'creator2',
    userId: 'some_other_user_id_dance',
    tipHandle: '@DanceQueenShiro',
    fullName: 'Shiro M.',
    profilePicUrl: 'https://picsum.photos/seed/shiro/200/200',
    bio: 'Afrobeat dancer from Nairobi. Let\'s vibe!',
    totalTips: 250,
    totalAmountReceived: 12500,
    category: 'Dance',
    active: true,
    featured: false,
  },
  {
    id: 'creator3',
    userId: 'some_other_user_id_music',
    tipHandle: '@BengaBeats',
    fullName: 'Benga Beats Studio',
    profilePicUrl: 'https://picsum.photos/seed/benga/200/200',
    bio: 'Crafting the freshest Benga tunes. Support local music!',
    totalTips: 88,
    totalAmountReceived: 4400,
    category: 'Music',
    active: true,
    featured: true,
  },
   {
    id: 'creator4',
    userId: 'some_other_user_id_comedy',
    tipHandle: '@LaughFactoryKE',
    fullName: 'Laugh Factory Kenya',
    profilePicUrl: 'https://picsum.photos/seed/comedy/200/200',
    bio: 'Bringing you daily doses of Kenyan humor.',
    totalTips: 150,
    totalAmountReceived: 7000,
    category: 'Comedy',
    active: false,
    featured: false,
  },
];

export const placeholderTips: Tip[] = [
  {
    id: 'tip1',
    fromUserId: 'user1',
    fromUsername: 'supporter_jane',
    toCreatorId: 'user2', // Tip to Amani Art
    toCreatorHandle: '@AmaniArt',
    amount: 100,
    message: 'Love your latest piece! Keep it up! ❤️',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    paymentRef: 'mpesa_txn_001',
  },
  {
    id: 'tip2',
    fromUserId: 'user3',
    fromUsername: 'music_lover_mike',
    toCreatorId: 'creator3', // Tip to Benga Beats
    toCreatorHandle: '@BengaBeats',
    amount: 50,
    message: 'Great music!',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    paymentRef: 'mpesa_txn_002',
  },
  {
    id: 'tip3',
    fromUserId: 'user1',
    fromUsername: 'supporter_jane',
    toCreatorId: 'creator2', // Tip to DanceQueenShiro
    toCreatorHandle: '@DanceQueenShiro',
    amount: 250,
    message: null,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    paymentRef: 'mpesa_txn_003',
  },
];

// Simulate a logged-in user for dashboard/auth testing
export const mockAuthenticatedUser: User = placeholderUsers[1]; // Amani Art, who is a creator
// export const mockAuthenticatedUser: User = placeholderUsers[0]; // Jane Doe, who is not a creator
