
"use client";

import type { AuthUser, User } from '@/types';
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
            // Ensure timestamps are handled correctly if they come from Firestore
            createdAt: userData.createdAt instanceof Timestamp ? userData.createdAt.toDate().toISOString() : userData.createdAt,
            updatedAt: userData.updatedAt instanceof Timestamp ? userData.updatedAt.toDate().toISOString() : userData.updatedAt,
          } as AuthUser);
        } else {
          // This case might be hit if user authenticates but profile creation is pending
          // Minimal user object, profile completion should handle the rest.
          // The role selection would happen before this, so it should be passed to profile creation.
          setUser({ 
            id: fbUser.uid, 
            email: fbUser.email, 
            phoneNumber: fbUser.phoneNumber,
            profilePicUrl: fbUser.photoURL,
            isCreator: false, // Default, will be updated by completeUserProfile
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
    if (!userDocSnap.exists()) {
      const newUserProfile: Partial<User> = {
        email: fbUser.email,
        fullName: fbUser.displayName || additionalData?.fullName,
        profilePicUrl: fbUser.photoURL || additionalData?.profilePicUrl,
        phoneNumber: fbUser.phoneNumber || additionalData?.phoneNumber,
        isCreator: userRole === 'creator',
        createdAt: serverTimestamp(),
        username: additionalData?.username,
        bio: additionalData?.bio,
        ...(userRole === 'creator' && {
          tipHandle: additionalData?.tipHandle,
          category: additionalData?.category,
        }),
      };
      await setDoc(userDocRef, newUserProfile, { merge: true });
      return newUserProfile;
    }
    return userDocSnap.data() as User;
  };

  const signInWithGoogle = async (userRole: 'creator' | 'supporter') => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await createInitialUserDocument(result.user, userRole);
      // onAuthStateChanged will handle setting user state and navigation
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      throw error;
    } finally {
      // setLoading(false); // onAuthStateChanged handles final loading state
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
    } finally {
      // setLoading(false);
    }
  };
  
  const signInWithEmailPassword = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle if user doc needs update or creation
      return result.user;
    } catch (error) {
      console.error("Error signing in with email: ", error);
      throw error;
    } finally {
      // setLoading(false);
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
      // Store userRole or pass it to confirmOtp
      (window as any).pendingUserRole = userRole; 
      return confirmationResult;
    } catch (error) {
      console.error("Error sending OTP:", error);
      throw error;
    } finally {
      // setLoading(false);
    }
  };

  const confirmOtp = async (confirmationResult: ConfirmationResult, otp: string, userRole: 'creator' | 'supporter') => {
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      await createInitialUserDocument(result.user, userRole, { phoneNumber: result.user.phoneNumber });
      return result.user;
    } catch (error) {
      console.error("Error confirming OTP:", error);
      throw error;
    } finally {
      // setLoading(false);
    }
  };

  const completeUserProfile = async (profileData: Partial<User>, userRole: 'creator' | 'supporter') => {
    if (!firebaseUser) throw new Error("No Firebase user to complete profile for.");
    setLoading(true);
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const dataToSet: Partial<User> = {
        ...profileData,
        id: firebaseUser.uid,
        email: firebaseUser.email || profileData.email,
        phoneNumber: firebaseUser.phoneNumber || profileData.phoneNumber,
        // profilePicUrl might be from Google/Phone initial, or from form
        profilePicUrl: profileData.profilePicUrl || firebaseUser.photoURL,
        isCreator: userRole === 'creator',
        updatedAt: serverTimestamp(),
      };
      // Ensure createdAt is only set if it's truly a new profile, or merge:true handles it
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists() || !userDoc.data()?.createdAt) {
          dataToSet.createdAt = serverTimestamp();
      }

      await setDoc(userDocRef, dataToSet, { merge: true });
      
      // If user is a creator, create/update creator document
      if (userRole === 'creator' && dataToSet.isCreator && profileData.tipHandle && profileData.category) {
        const creatorDocRef = doc(db, "creators", firebaseUser.uid);
        const creatorData: Partial<Creator> = {
          userId: firebaseUser.uid,
          tipHandle: profileData.tipHandle,
          fullName: profileData.fullName,
          profilePicUrl: dataToSet.profilePicUrl,
          category: profileData.category,
          bio: profileData.bio || "",
          totalTips: 0,
          totalAmountReceived: 0,
          active: true,
          featured: false,
          // email and phone can be denormalized from user doc
          email: dataToSet.email,
          phoneNumber: dataToSet.phoneNumber,
          updatedAt: serverTimestamp(),
        };
        const creatorDoc = await getDoc(creatorDocRef);
         if (!creatorDoc.exists() || !creatorDoc.data()?.createdAt) {
          creatorData.createdAt = serverTimestamp();
        }
        await setDoc(creatorDocRef, creatorData, { merge: true });
      }
      // Trigger onAuthStateChanged to update local user state with full profile
      // For immediate UI update, can call setUser here, but onAuthStateChanged is safer.
      // A manual fetch and setUser might be needed if onAuthStateChanged doesn't re-fetch fast enough
      const updatedUserDoc = await getDoc(userDocRef);
      if (updatedUserDoc.exists()) {
        setUser({ id: firebaseUser.uid, ...updatedUserDoc.data() } as AuthUser);
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
      await updateDoc(userDocRef, { ...data, updatedAt: serverTimestamp() });
      setUser(prevUser => prevUser ? ({ ...prevUser, ...data } as AuthUser) : null);
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
    } finally {
      // setLoading(false); // onAuthStateChanged will handle this
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
