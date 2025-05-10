import type { Creator, Tip, User, SocialLink } from '@/types';

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
    coverImageUrl: `https://picsum.photos/seed/amaniart_cover/1200/400`,
    bio: 'Digital artist painting Nairobi\'s vibrant culture. Your support fuels my passion! 🎨✨ Also exploring Afrofuturism and surreal landscapes. Catch my latest series on Instagram!',
    totalTips: 123,
    totalAmountReceived: 6400,
    category: 'Art',
    active: true,
    featured: true,
    socialLinks: [
      { platform: 'instagram', url: '#' },
      { platform: 'twitter', url: '#' },
    ]
  },
  {
    id: 'creator2',
    userId: 'some_other_user_id_dance',
    tipHandle: '@DanceQueenShiro',
    fullName: 'Shiro M.',
    profilePicUrl: 'https://picsum.photos/seed/shiro/200/200',
    coverImageUrl: `https://picsum.photos/seed/shiro_cover/1200/400`,
    bio: 'Afrobeat dancer from Nairobi. Let\'s vibe! Spreading joy through movement. Check out my TikTok for daily dance challenges and tutorials.',
    totalTips: 250,
    totalAmountReceived: 12500,
    category: 'Dance',
    active: true,
    featured: false,
    socialLinks: [
      { platform: 'tiktok', url: '#' },
      { platform: 'youtube', url: '#' },
    ]
  },
  {
    id: 'creator3',
    userId: 'some_other_user_id_music',
    tipHandle: '@BengaBeats',
    fullName: 'Benga Beats Studio',
    profilePicUrl: 'https://picsum.photos/seed/benga/200/200',
    coverImageUrl: `https://picsum.photos/seed/benga_cover/1200/400`,
    bio: 'Crafting the freshest Benga tunes. Support local music! We are a collective of musicians dedicated to preserving and evolving traditional Kenyan sounds.',
    totalTips: 88,
    totalAmountReceived: 4400,
    category: 'Music',
    active: true,
    featured: true,
    socialLinks: [
      { platform: 'website', url: '#' },
      { platform: 'facebook', url: '#' },
    ]
  },
   {
    id: 'creator4',
    userId: 'some_other_user_id_comedy',
    tipHandle: '@LaughFactoryKE',
    fullName: 'Laugh Factory Kenya',
    profilePicUrl: 'https://picsum.photos/seed/comedy/200/200',
    coverImageUrl: `https://picsum.photos/seed/comedy_cover/1200/400`,
    bio: 'Bringing you daily doses of Kenyan humor. Stand-up, skits, and all things funny. Your tips help us produce more content and support upcoming comedians.',
    totalTips: 150,
    totalAmountReceived: 7000,
    category: 'Comedy',
    active: false, // Not active, so won't show on main creators page by default
    featured: false,
    socialLinks: [
      { platform: 'youtube', url: '#' },
    ]
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

export const mockTestimonials = [
  {
    id: 'testimonial1',
    name: 'Fatuma A.',
    role: 'Art Enthusiast',
    avatar: 'https://picsum.photos/seed/fatuma/100/100',
    dataAiHint: "female portrait",
    quote: "TipKesho makes it so easy to support my favorite Kenyan artists. The AI message suggestions are a fun touch!",
    stars: 5,
  },
  {
    id: 'testimonial2',
    name: 'DJ Kym',
    role: 'Music Creator',
    avatar: 'https://picsum.photos/seed/djkym/100/100',
    dataAiHint: "male dj",
    quote: "Finally, a platform that understands the creator economy in Kenya! Getting tips directly from fans is a game-changer.",
    stars: 5,
  },
  {
    id: 'testimonial3',
    name: 'Linda M.',
    role: 'Dance Follower',
    avatar: 'https://picsum.photos/seed/linda/100/100',
    dataAiHint: "woman smiling",
    quote: "I love discovering new dancers on TipKesho. It feels great to directly contribute to their journey.",
    stars: 4,
  },
];

// Simulate a logged-in user for dashboard/auth testing
export const mockAuthenticatedUser: User = placeholderUsers[1]; // Amani Art, who is a creator
// export const mockAuthenticatedUser: User = placeholderUsers[0]; // Jane Doe, who is not a creator
