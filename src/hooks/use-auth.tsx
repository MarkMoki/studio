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
          setUser({ 
            id: fbUser.uid, 
            ...userData,
            createdAt: userData.createdAt instanceof Timestamp ? userData.createdAt.toDate().toISOString() : userData.createdAt,
            updatedAt: userData.updatedAt instanceof Timestamp ? userData.updatedAt.toDate().toISOString() : userData.updatedAt,
          } as AuthUser);
        } else {
          setUser({ 
            id: fbUser.uid, 
            email: fbUser.email || null, 
            phoneNumber: fbUser.phoneNumber || null,
            profilePicUrl: fbUser.photoURL || null,
            isCreator: false, // Default, this will be updated by completeUserProfile or become-creator flow
            createdAt: new Date().toISOString(), // Placeholder, actual value set on doc creation
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

    if (!userDocSnap.exists() || !userDocSnap.data()?.createdAt) { // Ensure we only write initial data once
      const initialUserData: Partial<User> = {
          email: fbUser.email || null,
          fullName: fbUser.displayName || additionalData?.fullName || null,
          profilePicUrl: fbUser.photoURL || additionalData?.profilePicUrl || null,
          // phoneNumber is critical. If it's from phone auth, additionalData.phoneNumber should be it.
          // If Google/Email auth, it might be null initially and set during completeProfile.
          phoneNumber: fbUser.phoneNumber || additionalData?.phoneNumber || null, 
          isCreator: userRole === 'creator',
          username: additionalData?.username || null,
          bio: additionalData?.bio || null,
          tipHandle: userRole === 'creator' ? (additionalData?.tipHandle || null) : undefined, // Undefined for non-creators
          category: userRole === 'creator' ? (additionalData?.category || null) : undefined, // Undefined for non-creators
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
      };
      // Remove fields that are explicitly undefined (e.g. tipHandle for non-creators)
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
      await createInitialUserDocument(result.user, userRole);
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      throw error;
    }
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
  };
  
  const signInWithEmailPassword = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      console.error("Error signing in with email: ", error);
      throw error;
    }
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
        await recaptchaVerifier.render();
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
      (window as any).pendingUserRole = userRole; 
      return confirmationResult;
    } catch (error) {
      console.error("Error sending OTP:", error);
      throw error;
    }
  };

  const confirmOtp = async (confirmationResult: ConfirmationResult, otp: string, userRole: 'creator' | 'supporter') => {
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      // Pass the phone number explicitly if available from result.user to createInitialUserDocument
      await createInitialUserDocument(result.user, userRole, { phoneNumber: result.user.phoneNumber || undefined });
      return result.user;
    } catch (error) {
      console.error("Error confirming OTP:", error);
      throw error;
    }
  };

  const completeUserProfile = async (profileData: Partial<User>, userRole: 'creator' | 'supporter') => {
    if (!firebaseUser) throw new Error("No Firebase user to complete profile for.");
    setLoading(true);
    const userDocRef = doc(db, "users", firebaseUser.uid);
    try {
      const dataForUserDoc: Partial<User> = {
        updatedAt: serverTimestamp(),
        isCreator: userRole === 'creator',
      };

      // Required fields from form (profileData), ensure they are not undefined
      dataForUserDoc.phoneNumber = profileData.phoneNumber || null; // Critical: ensure not undefined
      dataForUserDoc.fullName = profileData.fullName || null;
      dataForUserDoc.username = profileData.username || null;

      // Optional fields
      dataForUserDoc.bio = profileData.bio === undefined ? null : profileData.bio;
      dataForUserDoc.profilePicUrl = profileData.profilePicUrl === undefined ? (firebaseUser.photoURL || null) : profileData.profilePicUrl;
      
      // Email from Firebase Auth, should not be changed by this form usually
      dataForUserDoc.email = firebaseUser.email || profileData.email || null;

      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists() || !userDocSnap.data()?.createdAt) {
          dataForUserDoc.createdAt = serverTimestamp();
      }

      if (userRole === 'creator') {
          dataForUserDoc.tipHandle = profileData.tipHandle || null; // Required for creators
          dataForUserDoc.category = profileData.category || null; // Required for creators
      }
      
      // Remove any top-level undefined values before writing
      const cleanedDataForUserDoc = Object.fromEntries(Object.entries(dataForUserDoc).filter(([_, v]) => v !== undefined)) as Partial<User>;
      await setDoc(userDocRef, cleanedDataForUserDoc, { merge: true });
      
      if (userRole === 'creator' && cleanedDataForUserDoc.isCreator) {
        const creatorDocRef = doc(db, "creators", firebaseUser.uid);
        const creatorDocSnap = await getDoc(creatorDocRef); // Fetch existing to preserve stats

        const dataForCreatorDoc: Partial<Creator> = {
          userId: firebaseUser.uid,
          active: true,
          featured: false,
          tipHandle: cleanedDataForUserDoc.tipHandle!, // Should be present if creator
          category: cleanedDataForUserDoc.category!, // Should be present if creator
          fullName: cleanedDataForUserDoc.fullName,
          profilePicUrl: cleanedDataForUserDoc.profilePicUrl,
          bio: cleanedDataForUserDoc.bio,
          email: cleanedDataForUserDoc.email,
          phoneNumber: cleanedDataForUserDoc.phoneNumber, // From user doc
          totalTips: creatorDocSnap.data()?.totalTips || 0,
          totalAmountReceived: creatorDocSnap.data()?.totalAmountReceived || 0,
          socialLinks: creatorDocSnap.data()?.socialLinks || [],
          coverImageUrl: creatorDocSnap.data()?.coverImageUrl || null,
          updatedAt: serverTimestamp(),
        };

        if (!creatorDocSnap.exists() || !creatorDocSnap.data()?.createdAt) {
          dataForCreatorDoc.createdAt = serverTimestamp();
        }
        
        const cleanedDataForCreatorDoc = Object.fromEntries(Object.entries(dataForCreatorDoc).filter(([_, v]) => v !== undefined)) as Partial<Creator>;
        await setDoc(creatorDocRef, cleanedDataForCreatorDoc, { merge: true });
      }
      
      const updatedUserDoc = await getDoc(userDocRef);
      if (updatedUserDoc.exists()) {
        const newUserData = updatedUserDoc.data();
        setUser({ 
            id: firebaseUser.uid, 
            ...newUserData,
            createdAt: newUserData.createdAt instanceof Timestamp ? newUserData.createdAt.toDate().toISOString() : newUserData.createdAt,
            updatedAt: newUserData.updatedAt instanceof Timestamp ? newUserData.updatedAt.toDate().toISOString() : newUserData.updatedAt,
         } as AuthUser);
      }

    } catch (error) {
      console.error("Error completing user profile:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const updateUserFirestoreProfile = async (userId: string, data: Partial<User>) => {
    setLoading(true);
    try {
      const userDocRef = doc(db, "users", userId);
      const updateData: { [key: string]: any } = { updatedAt: serverTimestamp() };

      (Object.keys(data) as Array<keyof User>).forEach(key => {
        if (data[key] !== undefined) {
          updateData[key] = data[key] === undefined ? null : data[key]; // Ensure undefined becomes null
        }
      });
      
      // Filter out any fields that are still undefined (shouldn't happen with above logic)
      const finalUpdateData = Object.fromEntries(Object.entries(updateData).filter(([_, v]) => v !== undefined));


      await updateDoc(userDocRef, finalUpdateData);
      setUser(prevUser => prevUser ? ({ ...prevUser, ...finalUpdateData, updatedAt: new Date().toISOString() } as AuthUser) : null);

      const currentUser = user || (await getDoc(userDocRef).then(snap => snap.data() as AuthUser | null));

      if (currentUser?.isCreator) {
          const creatorUpdates: Partial<Creator> = { updatedAt: serverTimestamp() };
          if (finalUpdateData.fullName !== undefined) creatorUpdates.fullName = finalUpdateData.fullName;
          if (finalUpdateData.profilePicUrl !== undefined) creatorUpdates.profilePicUrl = finalUpdateData.profilePicUrl;
          if (finalUpdateData.bio !== undefined) creatorUpdates.bio = finalUpdateData.bio;
          // tipHandle and category are usually part of creator profile specific edits, not general user profile update.
          // if (finalUpdateData.tipHandle !== undefined) creatorUpdates.tipHandle = finalUpdateData.tipHandle;
          // if (finalUpdateData.category !== undefined) creatorUpdates.category = finalUpdateData.category;
          
          if (Object.keys(creatorUpdates).length > 1) { // more than just updatedAt
              const creatorDocRef = doc(db, "creators", userId);
              await updateDoc(creatorDocRef, creatorUpdates);
          }
      }

    } catch (error) {
      console.error("Error updating user profile in Firestore:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
      throw error;
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
