
"use client";

import type { AuthUser, User, Creator } from '@/types'; // Added Creator type
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type ConfirmationResult,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: (userRole: 'creator' | 'supporter') => Promise<void>;
  signUpWithEmailPassword: (email: string, password: string, userRole: 'creator' | 'supporter', additionalData?: Partial<User>) => Promise<FirebaseUser | null>;
  signInWithEmailPassword: (email: string, password: string) => Promise<FirebaseUser | null>;
  setUpRecaptcha: (elementId: string) => Promise<RecaptchaVerifier | undefined>;
  signInWithPhone: (phoneNumber: string, appVerifier: RecaptchaVerifier, userRole: 'creator' | 'supporter') => Promise<ConfirmationResult | undefined>;
  confirmOtp: (confirmationResult: ConfirmationResult, otp: string, userRole: 'creator' | 'supporter') => Promise<FirebaseUser | null>;
  signOut: () => Promise<void>;
  completeUserProfile: (profileData: Partial<User>, userRole: 'creator' | 'supporter') => Promise<void>;
  updateUserFirestoreProfile: (userId: string, data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const userDocRef = doc(db, "users", fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const localUser = { 
            id: fbUser.uid, 
            ...userData,
            // Convert Firestore Timestamps to ISO strings for client-side consistency
            createdAt: userData.createdAt instanceof Timestamp ? userData.createdAt.toDate().toISOString() : userData.createdAt,
            updatedAt: userData.updatedAt instanceof Timestamp ? userData.updatedAt.toDate().toISOString() : userData.updatedAt,
          } as AuthUser;
          setUser(localUser);
          // Redirection logic moved to page components based on user profile status
        } else {
          // User exists in Firebase Auth but not in Firestore (e.g., first time Google/Phone sign-in)
          // This state indicates profile needs completion.
          setUser({ 
            id: fbUser.uid, 
            email: fbUser.email || null, 
            phoneNumber: fbUser.phoneNumber || null, // May be null
            profilePicUrl: fbUser.photoURL || null,
            isCreator: false, // Default, will be set during profile completion
            createdAt: new Date().toISOString(), // Placeholder
          } as AuthUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const createInitialUserDocument = async (fbUser: FirebaseUser, userRole: 'creator' | 'supporter', additionalData?: Partial<User>) => {
    const userDocRef = doc(db, "users", fbUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists() || !userDocSnap.data()?.createdAt) { 
      const initialUserData: Partial<User> = {
          email: fbUser.email || additionalData?.email || null,
          fullName: fbUser.displayName || additionalData?.fullName || null,
          profilePicUrl: fbUser.photoURL || additionalData?.profilePicUrl || null,
          phoneNumber: fbUser.phoneNumber || additionalData?.phoneNumber || null, 
          isCreator: userRole === 'creator',
          username: additionalData?.username || null,
          bio: additionalData?.bio || null,
          tipHandle: userRole === 'creator' ? (additionalData?.tipHandle || null) : undefined,
          category: userRole === 'creator' ? (additionalData?.category || null) : undefined,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
      };
      
      const dataToWrite = Object.fromEntries(Object.entries(initialUserData).filter(([_, v]) => v !== undefined));
      await setDoc(userDocRef, dataToWrite, { merge: true });
      return dataToWrite as User;
    }
    return userDocSnap.data() as User;
  };

  const signInWithGoogle = async (userRole: 'creator' | 'supporter') => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await createInitialUserDocument(result.user, userRole); // Role here is tentative until profile completion
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      throw error;
    }
    // setLoading(false); // Managed by onAuthStateChanged
  };

  const signUpWithEmailPassword = async (email: string, password: string, userRole: 'creator' | 'supporter', additionalData?: Partial<User>) => {
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await createInitialUserDocument(result.user, userRole, additionalData);
      return result.user;
    } catch (error) {
      console.error("Error signing up with email: ", error);
      throw error;
    }
    // setLoading(false);
  };
  
  const signInWithEmailPassword = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Firestore doc should already exist or be handled by onAuthStateChanged logic if first time
      return result.user;
    } catch (error) {
      console.error("Error signing in with email: ", error);
      throw error;
    }
    // setLoading(false);
  };
  
  const setUpRecaptcha = async (elementId: string): Promise<RecaptchaVerifier | undefined> => {
    if (!auth) return undefined;
    if ((window as any).recaptchaVerifierInstance) {
        (window as any).recaptchaVerifierInstance.clear();
    }
    try {
        const recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
            'size': 'invisible',
            'callback': (response: any) => {},
            'expired-callback': () => {}
        });
        (window as any).recaptchaVerifierInstance = recaptchaVerifier;
        await recaptchaVerifier.render(); // Ensure it renders before returning
        return recaptchaVerifier;
    } catch (error) {
        console.error("Error setting up reCAPTCHA:", error);
        return undefined;
    }
  };

  const signInWithPhone = async (phoneNumber: string, appVerifier: RecaptchaVerifier, userRole: 'creator' | 'supporter') => {
    setLoading(true);
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      // Temporarily store userRole if needed, or pass to confirmOtp
      return confirmationResult;
    } catch (error) {
      console.error("Error sending OTP:", error);
      throw error;
    }
    // setLoading(false);
  };

  const confirmOtp = async (confirmationResult: ConfirmationResult, otp: string, userRole: 'creator' | 'supporter') => {
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      await createInitialUserDocument(result.user, userRole, { phoneNumber: result.user.phoneNumber || undefined });
      return result.user;
    } catch (error) {
      console.error("Error confirming OTP:", error);
      throw error;
    }
    // setLoading(false);
  };

  const completeUserProfile = async (profileData: Partial<User>, userRole: 'creator' | 'supporter') => {
    if (!firebaseUser) throw new Error("No Firebase user to complete profile for.");
    setLoading(true);
    const userDocRef = doc(db, "users", firebaseUser.uid);
    try {
      const dataForUserDoc: Partial<User> = {
        // Ensure required fields are present, falling back to null if explicitly not provided
        fullName: profileData.fullName || null,
        username: profileData.username || null,
        phoneNumber: profileData.phoneNumber || null, // Crucial: ensure this is set
        profilePicUrl: profileData.profilePicUrl === undefined ? (firebaseUser.photoURL || null) : profileData.profilePicUrl,
        bio: profileData.bio === undefined ? null : profileData.bio,
        isCreator: userRole === 'creator',
        updatedAt: serverTimestamp(),
      };
      
      // Email from Firebase Auth, or if provided (e.g. if auth method doesn't give email)
      dataForUserDoc.email = firebaseUser.email || profileData.email || null;

      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists() || !userDocSnap.data()?.createdAt) {
          dataForUserDoc.createdAt = serverTimestamp();
      }

      if (userRole === 'creator') {
          dataForUserDoc.tipHandle = profileData.tipHandle || null;
          dataForUserDoc.category = profileData.category || null;
      }
      
      const cleanedDataForUserDoc = Object.fromEntries(Object.entries(dataForUserDoc).filter(([_, v]) => v !== undefined)) as Partial<User>;
      await setDoc(userDocRef, cleanedDataForUserDoc, { merge: true });
      
      if (userRole === 'creator' && cleanedDataForUserDoc.isCreator) {
        const creatorDocRef = doc(db, "creators", firebaseUser.uid);
        const creatorDocSnap = await getDoc(creatorDocRef);

        const dataForCreatorDoc: Partial<Creator> = {
          userId: firebaseUser.uid,
          active: true,
          featured: false,
          tipHandle: cleanedDataForUserDoc.tipHandle!,
          category: cleanedDataForUserDoc.category!,
          fullName: cleanedDataForUserDoc.fullName,
          profilePicUrl: cleanedDataForUserDoc.profilePicUrl,
          bio: cleanedDataForUserDoc.bio,
          email: cleanedDataForUserDoc.email,
          phoneNumber: cleanedDataForUserDoc.phoneNumber,
          totalTips: creatorDocSnap.data()?.totalTips || 0,
          totalAmountReceived: creatorDocSnap.data()?.totalAmountReceived || 0,
          socialLinks: creatorDocSnap.data()?.socialLinks || [],
          coverImageUrl: creatorDocSnap.data()?.coverImageUrl || null,
          updatedAt: serverTimestamp(),
        };

        if (!creatorDocSnap.exists() || !creatorDocSnap.data()?.createdAt) {
          dataForCreatorDoc.createdAt = serverTimestamp();
        }
        
        const cleanedDataForCreatorDoc = Object.fromEntries(Object.entries(dataForCreatorDoc).filter(([_,v]) => v !== undefined)) as Partial<Creator>;
        await setDoc(creatorDocRef, cleanedDataForCreatorDoc, { merge: true });
      }
      
      const updatedUserDoc = await getDoc(userDocRef);
      if (updatedUserDoc.exists()) {
        const newUserData = updatedUserDoc.data();
        const localUser = { 
            id: firebaseUser.uid, 
            ...newUserData,
            createdAt: newUserData.createdAt instanceof Timestamp ? newUserData.createdAt.toDate().toISOString() : newUserData.createdAt,
            updatedAt: newUserData.updatedAt instanceof Timestamp ? newUserData.updatedAt.toDate().toISOString() : newUserData.updatedAt,
         } as AuthUser;
        setUser(localUser);
        // Redirect after profile completion
        router.push(localUser.isCreator ? "/creator/dashboard" : "/dashboard");
      }

    } catch (error) {
      console.error("Error completing user profile:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const updateUserFirestoreProfile = async (userId: string, data: Partial<User>) => {
    // setLoading(true); // Avoid race condition with main loading state if not careful
    try {
      const userDocRef = doc(db, "users", userId);
      const updatePayload: { [key: string]: any } = { updatedAt: serverTimestamp() };

      (Object.keys(data) as Array<keyof User>).forEach(key => {
        if (data[key] !== undefined) { // Only include defined values
          updatePayload[key] = data[key];
        }
      });
      
      await updateDoc(userDocRef, updatePayload);
      
      // Optimistically update local user state
      setUser(prevUser => {
        if (!prevUser || prevUser.id !== userId) return prevUser;
        // Create a new object for the updated user
        const updatedLocalUser = { ...prevUser, ...updatePayload };
        // Ensure timestamps are strings for local state if they were serverTimestamps
        if (updatePayload.updatedAt === serverTimestamp()) {
          updatedLocalUser.updatedAt = new Date().toISOString();
        }
        return updatedLocalUser as AuthUser;
      });

      const currentUserDataSnap = await getDoc(userDocRef);
      const currentUserData = currentUserDataSnap.data() as User | undefined;


      if (currentUserData?.isCreator) {
          const creatorUpdates: Partial<Creator> = { updatedAt: serverTimestamp() };
          if (updatePayload.fullName !== undefined) creatorUpdates.fullName = updatePayload.fullName;
          if (updatePayload.profilePicUrl !== undefined) creatorUpdates.profilePicUrl = updatePayload.profilePicUrl;
          if (updatePayload.bio !== undefined) creatorUpdates.bio = updatePayload.bio;
          
          if (Object.keys(creatorUpdates).length > 1) { 
              const creatorDocRef = doc(db, "creators", userId);
              await updateDoc(creatorDocRef, creatorUpdates);
          }
      }

    } catch (error) {
      console.error("Error updating user profile in Firestore:", error);
      throw error;
    } finally {
      // setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null); // Clear local user state
      router.push('/'); // Redirect to home after sign out
    } catch (error) {
      console.error("Error signing out: ", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      firebaseUser,
      loading, 
      signInWithGoogle,
      signUpWithEmailPassword,
      signInWithEmailPassword,
      setUpRecaptcha,
      signInWithPhone,
      confirmOtp,
      signOut,
      completeUserProfile,
      updateUserFirestoreProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
