import { placeholderCreators } from '@/lib/placeholder-data';
import type { Creator } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Palette, Music, Drama, Mic2 } from 'lucide-react'; // Added Mic2 for Comedy

const categoryIcons: { [key: string]: React.ReactNode } = {
  Art: <Palette className="w-4 h-4" />,
  Dance: <Drama className="w-4 h-4" />, // Using Drama for Dance
  Music: <Music className="w-4 h-4" />,
  Comedy: <Mic2 className="w-4 h-4" />,
  Default: <Users className="w-4 h-4" />,
};

function CreatorCard({ creator }: { creator: Creator }) {
  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="items-center text-center">
        <Image
          src={creator.profilePicUrl || 'https://picsum.photos/seed/default-avatar/200/200'}
          alt={creator.fullName || creator.tipHandle}
          data-ai-hint="profile avatar"
          width={100}
          height={100}
          className="rounded-full mb-4 border-2 border-primary shadow-sm"
        />
        <CardTitle className="text-xl">{creator.fullName || creator.tipHandle}</CardTitle>
        <CardDescription className="text-sm text-primary">{creator.tipHandle}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground text-center mb-4 h-16 overflow-hidden">
          {creator.bio || 'A passionate creator on TipKesho.'}
        </p>
        <div className="flex justify-around text-sm mb-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            {categoryIcons[creator.category] || categoryIcons.Default}
            {creator.category}
          </Badge>
          {creator.featured && <Badge variant="outline" className="border-accent text-accent">Featured</Badge>}
        </div>
         <div className="text-xs text-muted-foreground text-center">
          <p>Total Tips: {creator.totalTips}</p>
          <p>Amount Received: KES {creator.totalAmountReceived.toLocaleString()}</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link href={`/creators/${creator.id}`} passHref legacyBehavior>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">View Profile & Tip</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function CreatorsPage() {
  const creators = placeholderCreators.filter(c => c.active); // Only show active creators

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Discover Creators</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Find and support talented Kenyan creators on TipKesho.
        </p>
      </div>
      {creators.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {creators.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">No creators found at the moment. Check back soon!</p>
      )}
    </div>
  );
}
