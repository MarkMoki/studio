
"use client";

import Image from 'next/image';
import type { Creator } from '@/types';

interface AvatarImageClientProps {
  creator: Creator;
  className?: string;
}

export function AvatarImageClient({ creator, className }: AvatarImageClientProps) {
  return (
     <Image
        src={creator.profilePicUrl || 'https://picsum.photos/seed/default-avatar/200/200'}
        alt={`${creator.fullName || creator.tipHandle}'s profile picture`}
        data-ai-hint="profile avatar"
        width={160} 
        height={160}
        className={className}
      />
  );
}
