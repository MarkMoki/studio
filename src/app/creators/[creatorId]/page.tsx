import { placeholderCreators, placeholderUsers } from '@/lib/placeholder-data';
import type { Creator } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TippingModal } from '@/components/tipping/tipping-modal';
import { Gift, Users, Palette, Music, Drama, Mic2, Link as LinkIcon, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

const categoryIcons: { [key: string]: React.ReactNode } = {
  Art: <Palette className="w-5 h-5 mr-2" />,
  Dance: <Drama className="w-5 h-5 mr-2" />,
  Music: <Music className="w-5 h-5 mr-2" />,
  Comedy: <Mic2 className="w-5 h-5 mr-2" />,
  Default: <Users className="w-5 h-5 mr-2" />,
};

// Mock function to get creator by ID
async function getCreator(id: string): Promise<Creator | null> {
  await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
  const creator = placeholderCreators.find(c => c.id === id);
  if (creator) {
    // Try to find corresponding user for more details if needed (e.g. email, phone)
    // This is optional, as creator object already has denormalized name, bio, pic.
    const user = placeholderUsers.find(u => u.id === creator.userId);
    return { ...creator, email: user?.email, phoneNumber: user?.phoneNumber };
  }
  return null;
}

export default async function CreatorProfilePage({ params }: { params: { creatorId: string } }) {
  const creator = await getCreator(params.creatorId);

  if (!creator) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-semibold">Creator not found</h1>
        <p className="text-muted-foreground">The creator profile you are looking for does not exist.</p>
        <Link href="/creators" legacyBehavior>
          <Button variant="link" className="mt-4">Back to Creators</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="overflow-hidden shadow-xl">
        <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary via-green-400 to-accent">
          <Image
            src={`https://picsum.photos/seed/${creator.id}/1200/400`}
            alt={`${creator.fullName || creator.tipHandle}'s cover photo`}
            layout="fill"
            objectFit="cover"
            className="opacity-50"
            data-ai-hint="abstract background"
          />
        </div>
        <CardHeader className="relative -mt-16 md:-mt-24 flex flex-col items-center text-center p-6">
          <AvatarImage
            creator={creator}
            className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background shadow-lg mb-4"
          />
          <CardTitle className="text-3xl md:text-4xl font-bold">{creator.fullName || creator.tipHandle}</CardTitle>
          <CardDescription className="text-lg text-primary">{creator.tipHandle}</CardDescription>
          {creator.featured && (
            <Badge variant="outline" className="mt-2 border-accent text-accent font-semibold">
              Featured Creator
            </Badge>
          )}
        </CardHeader>
        <CardContent className="px-6 py-4 space-y-6">
          <p className="text-center text-muted-foreground leading-relaxed">{creator.bio || "A passionate creator on TipKesho."}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <InfoBox title="Category" value={creator.category} icon={categoryIcons[creator.category] || categoryIcons.Default} />
            <InfoBox title="Total Tips" value={creator.totalTips.toLocaleString()} icon={<Gift className="w-5 h-5 mr-2 text-green-500"/>} />
            <InfoBox title="Amount Received" value={`KES ${creator.totalAmountReceived.toLocaleString()}`} icon={<span className="text-green-500 font-bold mr-1">KES</span>} />
          </div>

          { (creator.email || creator.phoneNumber) && (
            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold mb-2 text-center md:text-left">Contact Information</h3>
              <div className="flex flex-col md:flex-row md:space-x-6 space-y-2 md:space-y-0 items-center md:justify-center">
                {creator.email && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" /> {creator.email}
                  </div>
                )}
                {creator.phoneNumber && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" /> {creator.phoneNumber}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Placeholder for Social Links */}
          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-2 text-center md:text-left">Follow Me</h3>
            <div className="flex justify-center md:justify-start space-x-4">
              {[...Array(3)].map((_, i) => (
                <Button key={i} variant="outline" size="icon" asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer" aria-label={`Social link ${i+1}`}>
                    <LinkIcon className="w-5 h-5 text-muted-foreground hover:text-primary" />
                  </a>
                </Button>
              ))}
            </div>
          </div>

        </CardContent>
        <CardFooter className="p-6 bg-secondary/30">
          <TippingModal creator={creator} />
        </CardFooter>
      </Card>
    </div>
  );
}

function AvatarImage({ creator, className }: { creator: Creator, className?: string }) {
  return (
     <Image
        src={creator.profilePicUrl || 'https://picsum.photos/seed/default-avatar/200/200'}
        alt={creator.fullName || creator.tipHandle}
        data-ai-hint="profile avatar"
        width={160} // Larger default size
        height={160}
        className={className}
      />
  );
}

function InfoBox({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="p-4 bg-secondary/50 rounded-lg shadow-sm">
      <div className="flex items-center justify-center mb-1 text-primary">
        {typeof icon === 'string' ? <span className="text-xl font-bold">{icon}</span> : icon}
        <h4 className="text-sm font-medium text-muted-foreground ml-1">{title}</h4>
      </div>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

// Generate static paths for a few creators for demonstration
export async function generateStaticParams() {
  // In a real app, fetch first N creators or featured creators
  return placeholderCreators.slice(0, 3).map(creator => ({
    creatorId: creator.id,
  }));
}
