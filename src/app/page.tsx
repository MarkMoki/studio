
import type { Creator } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { HomePageClientContent } from './home/home-page-client-content';

// Function to fetch featured creators - can be used by Server Component
async function getFeaturedCreators(): Promise<Creator[]> {
  try {
    const creatorsRef = collection(db, 'creators');
    // Query for active AND featured creators, order by total amount received or a specific featured order field
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
    // If there's an error (e.g., missing index), return empty or handle as per app's requirements
    // For now, returning empty to prevent build failure if index is not yet set up by user
    if ((error as any).code === 'failed-precondition') {
        console.warn("Firestore query for featured creators failed, likely due to a missing index. Please check your Firestore indexes.");
    }
    return []; 
  }
}


export default async function HomePage() {
  const featuredCreatorsData = await getFeaturedCreators();

  return (
    <HomePageClientContent featuredCreatorsData={featuredCreatorsData} />
  );
}

