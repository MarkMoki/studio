
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
  type ConfirmationResult,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation'; // For redirecting after profile creation.

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null; // Expose Firebase user object
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  setUpRecaptcha: (elementId: string) => Promise<RecaptchaVerifier | undefined>;
  signInWithPhone: (phoneNumber: string, appVerifier: RecaptchaVerifier) => Promise<ConfirmationResult | undefined>;
  confirmOtp: (confirmationResult: ConfirmationResult, otp: string) => Promise<FirebaseUser | null>;
  signOut: () => Promise<void>;
  completeUserProfile: (profileData: Partial<User>) => Promise<void>;
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
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        const userDocRef = doc(db, "users", fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUser({ id: fbUser.uid, ...userDocSnap.data() } as AuthUser);
        } else {
          // User exists in Firebase Auth but not in Firestore (e.g. first sign-in via Google/Phone)
          // Set a minimal user object, profile completion will fill the rest
          const newUserProfile: AuthUser = {
            id: fbUser.uid,
            email: fbUser.email,
            phoneNumber: fbUser.phoneNumber,
            profilePicUrl: fbUser.photoURL,
            isCreator: false,
            createdAt: serverTimestamp(), // Will be converted by Firestore
          };
          setUser(newUserProfile);
          // Optionally redirect to a profile completion page if necessary
          // router.push('/auth?slide=completeProfile'); // Handled in auth page
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]);

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      // Check if user exists in Firestore, if not, create basic profile
      const userDocRef = doc(db, "users", fbUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        const newUserProfile: Partial<User> = {
            email: fbUser.email,
            fullName: fbUser.displayName,
            profilePicUrl: fbUser.photoURL,
            isCreator: false,
            createdAt: serverTimestamp(),
        };
        await setDoc(userDocRef, newUserProfile, { merge: true }); // merge true in case of race conditions
        setUser({ id: fbUser.uid, ...newUserProfile } as AuthUser);
      }
      // User state will be updated by onAuthStateChanged listener
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      // Handle error (e.g., show toast)
    } finally {
      setLoading(false); // Listener will set loading to false too
    }
  };
  
  const setUpRecaptcha = async (elementId: string): Promise<RecaptchaVerifier | undefined> => {
    if (!auth) return undefined; // Ensure auth is initialized
    // cleanup existing verifier
    if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
    }
    try {
        const recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
            'size': 'invisible', // can be 'normal' or 'compact' or 'invisible'
            'callback': (response: any) => {
                // reCAPTCHA solved, allow signInWithPhoneNumber.
                console.log("Recaptcha verified", response);
            },
            'expired-callback': () => {
                // Response expired. Ask user to solve reCAPTCHA again.
                console.log("Recaptcha expired");
            }
        });
        (window as any).recaptchaVerifier = recaptchaVerifier; // Store it on window for persistence across renders if needed
        await recaptchaVerifier.render(); // Explicitly render if it's not already
        return recaptchaVerifier;
    } catch (error) {
        console.error("Error setting up reCAPTCHA:", error);
        return undefined;
    }
  };

  const signInWithPhone = async (phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult | undefined> => {
    setLoading(true);
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setLoading(false);
      return confirmationResult;
    } catch (error) {
      console.error("Error sending OTP:", error);
      setLoading(false);
      // Handle specific errors like 'auth/invalid-phone-number'
      throw error; // Rethrow to be caught by the caller
    }
  };

  const confirmOtp = async (confirmationResult: ConfirmationResult, otp: string): Promise<FirebaseUser | null> => {
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const fbUser = result.user;
       // Check if user exists in Firestore, if not, create basic profile
      const userDocRef = doc(db, "users", fbUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        const newUserProfile: Partial<User> = {
            phoneNumber: fbUser.phoneNumber,
            isCreator: false,
            createdAt: serverTimestamp(),
        };
        await setDoc(userDocRef, newUserProfile, { merge: true });
        setUser({ id: fbUser.uid, ...newUserProfile } as AuthUser);
      }
      // User state will be updated by onAuthStateChanged listener
      setLoading(false);
      return fbUser;
    } catch (error) {
      console.error("Error confirming OTP:", error);
      setLoading(false);
      // Handle specific errors like 'auth/invalid-verification-code'
      throw error; // Rethrow
    }
  };

  const completeUserProfile = async (profileData: Partial<User>) => {
    if (!firebaseUser) {
      console.error("No Firebase user to complete profile for.");
      return;
    }
    setLoading(true);
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const dataToSet: Partial<User> = {
        ...profileData,
        id: firebaseUser.uid, // Ensure id is set correctly
        email: firebaseUser.email || profileData.email, // Preserve from Firebase if available
        phoneNumber: firebaseUser.phoneNumber || profileData.phoneNumber, // Preserve from Firebase
        profilePicUrl: firebaseUser.photoURL || profileData.profilePicUrl,
        createdAt: serverTimestamp(), // Set on creation
      };
      await setDoc(userDocRef, dataToSet, { merge: true }); // Use merge:true to update if exists or create if not
      setUser(prevUser => ({ ...prevUser, ...dataToSet, id: firebaseUser.uid } as AuthUser));
      // If user becomes a creator during profile completion
      if (profileData.isCreator && profileData.tipHandle && profileData.category) {
        const creatorDocRef = doc(db, "creators", firebaseUser.uid);
        await setDoc(creatorDocRef, {
          userId: firebaseUser.uid,
          tipHandle: profileData.tipHandle,
          fullName: profileData.fullName,
          profilePicUrl: profileData.profilePicUrl,
          category: profileData.category,
          bio: profileData.bio || "",
          totalTips: 0,
          totalAmountReceived: 0,
          active: true,
          featured: false,
          createdAt: serverTimestamp(),
        }, { merge: true });
      }

    } catch (error) {
      console.error("Error completing user profile:", error);
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
    } finally {
      setLoading(false);
    }
  };


  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // User state will be set to null by onAuthStateChanged
    } catch (error) {
      console.error("Error signing out: ", error);
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
