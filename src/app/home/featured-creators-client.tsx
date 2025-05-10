
"use client";
import type { Creator } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Palette, Music, Drama, Mic2, Users as UsersIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const categoryIcons: { [key: string]: React.ReactNode } = {
  Art: <Palette className="w-4 h-4" />,
  Dance: <Drama className="w-4 h-4" />,
  Music: <Music className="w-4 h-4" />,
  Comedy: <Mic2 className="w-4 h-4" />,
  Default: <UsersIcon className="w-4 h-4" />,
};

interface CreatorCardProps {
  creator: Creator;
  animationDelayValue: number;
}

function FeaturedCreatorCard({ creator, animationDelayValue }: CreatorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: animationDelayValue }}
      whileHover={{ y: -5, scale: 1.03, transition: { duration: 0.2 } }}
      className="h-full"
    >
    <Card 
      className="flex flex-col h-full shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out"
    >
      <CardHeader className="items-center text-center p-4">
        <Image
          src={creator.profilePicUrl || 'https://picsum.photos/seed/default-avatar/200/200'}
          alt={creator.fullName || creator.tipHandle}
          data-ai-hint="profile avatar"
          width={80}
          height={80}
          className="rounded-full mb-3 border-2 border-accent shadow-sm"
        />
        <CardTitle className="text-lg font-semibold">{creator.fullName || creator.tipHandle}</CardTitle>
        <CardDescription className="text-xs text-primary">{creator.tipHandle}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <p className="text-xs text-muted-foreground text-center mb-3 h-12 overflow-hidden">
          {creator.bio?.substring(0, 70) || 'A passionate creator on TipKesho.'}...
        </p>
        <div className="flex justify-center text-xs mb-2">
          <Badge variant="secondary" className="flex items-center gap-1 py-0.5 px-1.5">
            {categoryIcons[creator.category] || categoryIcons.Default}
            {creator.category}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="p-4 flex justify-center">
        <Link href={`/creators/${creator.id}`} passHref legacyBehavior>
          <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs">
            View & Tip <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
    </motion.div>
  );
}

interface FeaturedCreatorsClientProps {
  creators: Creator[];
}

export function FeaturedCreatorsClient({ creators }: FeaturedCreatorsClientProps) {
  if (!creators || creators.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-12 md:py-16 animate-fade-in">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-3 text-center mb-10">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold tracking-tighter sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent"
          >
            Meet Our Stars
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed"
          >
            Discover some of the most talented and inspiring creators on TipKesho.
          </motion.p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {creators.map((creator, index) => (
            <FeaturedCreatorCard 
              key={creator.id} 
              creator={creator} 
              animationDelayValue={0.2 + index * 0.1}
            />
          ))}
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 + creators.length * 0.1 }}
          className="text-center mt-10"
        >
            <Link href="/creators" passHref legacyBehavior>
                <Button size="lg" variant="outline" className="transform hover:scale-105 transition-transform">
                    Explore All Creators <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </Link>
        </motion.div>
      </div>
    </section>
  );
}
