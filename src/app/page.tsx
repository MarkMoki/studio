
import type { Creator } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { HomePageClientContent } from './home/home-page-client-content';

async function getFeaturedCreators(): Promise<Creator[]> {
  try {
    const creatorsRef = collection(db, 'creators');
    const q = query(creatorsRef, 
                    where('active', '==', true), 
                    where('featured', '==', true), 
                    orderBy('totalAmountReceived', 'desc'), 
                    limit(4));
    const querySnapshot = await getDocs(q);
    const fetchedCreators: Creator[] = [];
    querySnapshot.forEach((doc) => {
      fetchedCreators.push({ id: doc.id, ...doc.data() } as Creator);
    });
    return fetchedCreators;
  } catch (error) {
    console.error("Error fetching featured creators:", error);
    if ((error as any).code === 'failed-precondition') {
        console.warn("Firestore query for featured creators failed, likely due to a missing index. Please check your Firestore indexes.");
    }
    return []; 
  }
}


export default async function HomePage() {
  // Redirection for authenticated users is now handled by AppRouterRedirect in RootLayout
  const featuredCreatorsData = await getFeaturedCreators();

  return (
    <HomePageClientContent featuredCreatorsData={featuredCreatorsData} />
  );
}
