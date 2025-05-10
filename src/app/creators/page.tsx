
"use client";
import type { Creator } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Palette, Music, Drama, Mic2, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const categoryIcons: { [key: string]: React.ReactNode } = {
  Art: <Palette className="w-4 h-4" />,
  Dance: <Drama className="w-4 h-4" />,
  Music: <Music className="w-4 h-4" />,
  Comedy: <Mic2 className="w-4 h-4" />,
  Default: <Users className="w-4 h-4" />,
};

function CreatorCard({ creator }: { creator: Creator }) {
  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fade-in">
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
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCreators = async () => {
      setLoading(true);
      setError(null);
      try {
        const creatorsRef = collection(db, 'creators');
        const q = query(creatorsRef, where('active', '==', true), orderBy('featured', 'desc'), orderBy('totalAmountReceived', 'desc'), limit(20));
        const querySnapshot = await getDocs(q);
        const fetchedCreators: Creator[] = [];
        querySnapshot.forEach((doc) => {
          fetchedCreators.push({ id: doc.id, ...doc.data() } as Creator);
        });
        setCreators(fetchedCreators);
      } catch (err) {
        console.error("Error fetching creators:", err);
        setError("Failed to load creators. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading creators...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center animate-fade-in">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Discover Creators</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Find and support talented Kenyan creators on TipKesho.
        </p>
      </div>
      {creators.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {creators.map((creator, index) => (
            <motion.div
              key={creator.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <CreatorCard creator={creator} />
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-10">No active creators found at the moment. Check back soon!</p>
      )}
    </div>
  );
}

// Add Framer Motion for animations if not already present in package.json
// Ensure this page uses client-side rendering for useEffect and useState.
// This is already a client component due to "use client" and hooks.
// For better SEO and initial load, consider fetching initial batch via Server Component / getStaticProps / getServerSideProps if applicable for your Next.js version & routing strategy.
// For App Router, you'd fetch in a Server Component parent or use Route Handlers.
// For now, client-side fetching is implemented.
