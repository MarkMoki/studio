import type { Creator } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TippingModal } from '@/components/tipping/tipping-modal';
import { Gift, Users, Palette, Music, Drama, Mic2, Link as LinkIcon, Mail, Phone, Twitter, Instagram, Facebook, Youtube, Globe, Link2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { AvatarImageClient } from './avatar-image-client'; // Client component for avatar

const categoryIcons: { [key: string]: React.ReactNode } = {
  Art: <Palette className="w-5 h-5 mr-2" />,
  Dance: <Drama className="w-5 h-5 mr-2" />,
  Music: <Music className="w-5 h-5 mr-2" />,
  Comedy: <Mic2 className="w-5 h-5 mr-2" />,
  Default: <Users className="w-5 h-5 mr-2" />,
};

const socialIcons: { [key: string]: React.ReactNode } = {
  twitter: <Twitter className="w-5 h-5" />,
  instagram: <Instagram className="w-5 h-5" />,
  facebook: <Facebook className="w-5 h-5" />,
  youtube: <Youtube className="w-5 h-5" />,
  tiktok: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7.5a4.5 4.5 0 0 1-4.5 4.5H12V4.5a4.5 4.5 0 0 1 4.5-4.5A4.5 4.5 0 0 1 21 4.5Z"></path><path d="M12 12.75a4.5 4.5 0 0 1 4.5 4.5v0A4.5 4.5 0 0 1 12 21.75v0a4.5 4.5 0 0 1-4.5-4.5v-4.5a4.5 4.5 0 0 1 4.5-4.5Z"></path></svg>,
  website: <Globe className="w-5 h-5" />,
  other: <Link2 className="w-5 h-5" />,
};

async function getCreator(id: string): Promise<Creator | null> {
  try {
    const creatorDocRef = doc(db, 'creators', id);
    const creatorDocSnap = await getDoc(creatorDocRef);

    if (creatorDocSnap.exists()) {
      const data = creatorDocSnap.data();
      // Ensure Timestamps are converted to strings or serializable format for client components
      const convertTimestamp = (ts: any): string | null => {
        if (!ts) return null;
        if (ts instanceof Timestamp) {
          return ts.toDate().toISOString();
        }
        if (ts && typeof ts.seconds === 'number' && typeof ts.nanoseconds === 'number') {
            return new Timestamp(ts.seconds, ts.nanoseconds).toDate().toISOString();
        }
        if (typeof ts === 'string') { 
          return ts;
        }
        if (ts instanceof Date) { 
          return ts.toISOString();
        }
        console.warn("Unrecognized timestamp format:", ts);
        return new Date().toISOString(); 
      };

      return {
        id: creatorDocSnap.id,
        userId: data.userId,
        tipHandle: data.tipHandle,
        fullName: data.fullName || null,
        profilePicUrl: data.profilePicUrl || null,
        coverImageUrl: data.coverImageUrl || null,
        bio: data.bio || null,
        totalTips: data.totalTips || 0,
        totalAmountReceived: data.totalAmountReceived || 0,
        category: data.category,
        active: data.active,
        featured: data.featured,
        socialLinks: data.socialLinks || null,
        createdAt: convertTimestamp(data.createdAt) || new Date().toISOString(),
        updatedAt: convertTimestamp(data.updatedAt),
        email: data.email || null,
        phoneNumber: data.phoneNumber || null,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching creator:", error);
    if ((error as any).code === 'failed-precondition' && (error as any).message.includes('requires an index')) {
      console.error("Firestore query failed due to a missing index. Please create the required composite index in your Firebase console for the 'creators' collection, likely involving 'active', 'featured', and 'totalAmountReceived' fields.");
    }
    return null;
  }
}

export default async function CreatorProfilePage({ params }: { params: { creatorId: string } }) {
  const creator = await getCreator(params.creatorId);

  if (!creator) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-6" />
        <h1 className="text-3xl font-semibold mb-3">Creator Not Found</h1>
        <p className="text-muted-foreground mb-6">The creator profile you are looking for does not exist or could not be loaded. This might be due to a permission issue, an invalid ID, or a missing Firestore index for querying creators.</p>
        <Button asChild variant="outline">
          <Link href="/creators">Back to Creators</Link>
        </Button>
      </div>
    );
  }
  
  const coverImageUrl = creator.coverImageUrl || `https://picsum.photos/seed/${creator.id}_cover/1200/400?grayscale&blur=2`;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <Card className="overflow-hidden shadow-2xl rounded-2xl">
        <div className="relative h-56 md:h-72 group">
          <Image
            src={coverImageUrl}
            alt={`${creator.fullName || creator.tipHandle}'s cover photo`}
            fill
            style={{ objectFit: 'cover' }}
            className="opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            data-ai-hint="abstract pattern"
            sizes="100vw" 
            priority
          />
           <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
        </div>
        <CardHeader className="relative -mt-20 md:-mt-24 flex flex-col items-center text-center p-6 z-10 animate-slide-up" style={{animationDelay: '0.2s'}}>
          <AvatarImageClient
            creator={creator}
            className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background bg-background shadow-lg mb-4 transform hover:scale-110 transition-transform duration-300"
          />
          <CardTitle className="text-3xl md:text-4xl font-bold">{creator.fullName || creator.tipHandle}</CardTitle>
          <CardDescription className="text-lg text-primary">{creator.tipHandle}</CardDescription>
          {creator.featured && (
            <Badge variant="outline" className="mt-2 border-accent text-accent font-semibold animate-pulse bg-accent/10">
              ✨ Featured Creator ✨
            </Badge>
          )}
        </CardHeader>
        <CardContent className="px-6 py-4 space-y-8 animate-slide-up" style={{animationDelay: '0.4s'}}>
          <p className="text-center text-muted-foreground leading-relaxed text-lg">{creator.bio || "A passionate creator on TipKesho."}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <InfoBox title="Category" value={creator.category} icon={categoryIcons[creator.category] || categoryIcons.Default} />
            <InfoBox title="Total Tips" value={creator.totalTips.toLocaleString()} icon={<Gift className="w-5 h-5 mr-2 text-green-400"/>} />
            <InfoBox title="Amount Received" value={`KES ${creator.totalAmountReceived.toLocaleString()}`} icon={<span className="text-green-400 font-bold mr-1">KES</span>} />
          </div>

          { (creator.socialLinks && creator.socialLinks.length > 0) && (
            <div className="pt-6 border-t">
              <h3 className="text-xl font-semibold mb-3 text-center md:text-left">Follow Me</h3>
              <div className="flex justify-center md:justify-start flex-wrap gap-3">
                {creator.socialLinks.map((link) => (
                  <Button key={link.platform + (link.url || '')} variant="outline" size="icon" asChild className="transform hover:scale-110 hover:border-primary transition-all duration-200 rounded-full">
                    <a href={link.url || '#'} target="_blank" rel="noopener noreferrer" aria-label={`${link.platform} profile`}>
                      {socialIcons[link.platform] || <LinkIcon className="w-5 h-5" />}
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          )}

          { (creator.email || creator.phoneNumber) && (
            <div className="pt-6 border-t">
              <h3 className="text-xl font-semibold mb-3 text-center md:text-left">Contact Information</h3>
              <div className="flex flex-col md:flex-row md:space-x-6 space-y-2 md:space-y-0 items-center md:justify-center">
                {creator.email && (
                  <div className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="w-4 h-4 mr-2" /> <a href={`mailto:${creator.email}`}>{creator.email}</a>
                  </div>
                )}
                {creator.phoneNumber && (
                  <div className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Phone className="w-4 h-4 mr-2" /> <span>{creator.phoneNumber}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-6 bg-secondary/20 animate-slide-up rounded-b-2xl" style={{animationDelay: '0.6s'}}>
          <TippingModal creator={creator} />
        </CardFooter>
      </Card>
    </div>
  );
}

function InfoBox({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="p-4 bg-secondary/50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center justify-center mb-1 text-primary">
        {typeof icon === 'string' ? <span className="text-xl font-bold">{icon}</span> : icon}
        <h4 className="text-sm font-medium text-muted-foreground ml-1">{title}</h4>
      </div>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
