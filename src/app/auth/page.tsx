
"use client";

import { useState, type FormEvent, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { HandCoins, Sparkles, ArrowLeft, Phone, Mail, CheckCircle, UserPlus, Loader2, ShieldCheck, Users, Briefcase, Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import type { RecaptchaVerifier, ConfirmationResult } from "firebase/auth";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { User } from "@/types";
import { Textarea } from "@/components/ui/textarea";
import Link from 'next/link';
import { doc, getDoc } from "firebase/firestore";

type Slide = "welcome" | "authInput" | "otpVerification" | "completeProfile";
type AuthMethod = "phone" | "google" | "email" | null;

const slideVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  }),
};

export default function AuthPage() {
  const [currentSlide, setCurrentSlide] = useState<Slide>("welcome");
  const [direction, setDirection] = useState(1);
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null);
  const [isCreatorRole, setIsCreatorRole] = useState(false); // For "Complete Profile" toggle

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState(""); // For email auth if added
  const [password, setPassword] = useState(""); // For email auth if added

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [formPhoneNumber, setFormPhoneNumber] = useState(""); // For profile completion form
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [tipHandle, setTipHandle] = useState('');
  const [category, setCategory] = useState('');
  const [bio, setBio] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(true);

  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | undefined>(undefined);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | undefined>(undefined);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  const {
    user,
    firebaseUser,
    loading: authLoading,
    signInWithGoogle,
    setUpRecaptcha,
    signInWithPhone,
    confirmOtp,
    completeUserProfile,
    // Email auth methods can be added here if needed
  } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading) {
      if (user && user.fullName && user.phoneNumber) { // Fully profiled user
        router.push(user.isCreator ? "/creator/dashboard" : "/dashboard");
      } else if (firebaseUser && (!user?.fullName || !user?.phoneNumber) && currentSlide !== 'completeProfile') {
        // User is logged in via Firebase, but local user profile is incomplete or not yet fetched.
        // Fetch their role from Firestore to decide if they are a creator for the profile form
        const fetchUserDocAndTransition = async () => {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setIsCreatorRole(userData.isCreator || false); // Set for the toggle
            if (userData.fullName) setFullName(userData.fullName);
            if (userData.username) setUsername(userData.username);
            if (userData.phoneNumber) setFormPhoneNumber(userData.phoneNumber);
            if (userData.profilePicUrl) setProfilePicPreview(userData.profilePicUrl);
            if (userData.bio) setBio(userData.bio);
            if (userData.isCreator) {
              if (userData.tipHandle) setTipHandle(userData.tipHandle);
              if (userData.category) setCategory(userData.category);
            }
          } else {
            // Pre-fill from firebaseUser if available, and set default role based on how they initiated sign-up if that info is available
            if (firebaseUser.displayName) setFullName(firebaseUser.displayName);
            if (firebaseUser.photoURL) setProfilePicPreview(firebaseUser.photoURL);
            if (firebaseUser.phoneNumber) setFormPhoneNumber(firebaseUser.phoneNumber);
          }
          handleNextSlide("completeProfile");
          setIsRedirecting(false);
        };
        fetchUserDocAndTransition();
      } else {
        setIsRedirecting(false);
      }
    }
  }, [user, firebaseUser, authLoading, router, currentSlide]);


  const initializeRecaptcha = async () => {
    if (recaptchaContainerRef.current && !recaptchaVerifier) {
      try {
        const verifier = await setUpRecaptcha("recaptcha-container-id");
        setRecaptchaVerifier(verifier);
      } catch (error) {
        toast({ title: "reCAPTCHA Error", description: "Failed to initialize reCAPTCHA. Please refresh.", variant: "destructive" });
      }
    }
  };

  const handleNextSlide = (next: Slide) => {
    setDirection(1);
    setCurrentSlide(next);
  };

  const handlePrevSlide = () => {
    setDirection(-1);
    // Determine previous slide logically
    if (currentSlide === 'authInput') setCurrentSlide('welcome');
    else if (currentSlide === 'otpVerification') setCurrentSlide('authInput');
    else if (currentSlide === 'completeProfile') {
        if(authMethod === 'phone') setCurrentSlide('otpVerification');
        else setCurrentSlide('authInput'); // Or welcome if Google was direct
    }
  };

  const handleAuthMethodSelection = (method: AuthMethod) => {
    setAuthMethod(method);
    if (method === "phone") {
      handleNextSlide("authInput");
      setTimeout(() => {
        if (recaptchaContainerRef.current && !recaptchaVerifier) {
          initializeRecaptcha();
        }
      }, 100);
    } else if (method === "google") {
      handleGoogleAuth();
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      // Google sign-in itself doesn't pre-define role. Role is set at profile completion.
      await signInWithGoogle(isCreatorRole ? 'creator' : 'supporter'); // Pass a default or let profile completion decide
      // onAuthStateChanged will trigger effect to check profile and move to completeProfile or dashboard
    } catch (error) {
      toast({ title: "Google Sign-In Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!recaptchaVerifier) {
      toast({ title: "reCAPTCHA not ready", description: "Please wait for reCAPTCHA.", variant: "destructive" });
      await initializeRecaptcha(); return;
    }
    if (!phoneNumber.match(/^\+254[17]\d{8}$/)) {
      toast({ title: "Invalid Phone Number", description: "Format: +2547XXXXXXXX or +2541XXXXXXXX.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const result = await signInWithPhone(phoneNumber, recaptchaVerifier, isCreatorRole ? 'creator' : 'supporter');
      setConfirmationResult(result);
      setFormPhoneNumber(phoneNumber);
      toast({ title: "OTP Sent", description: "Please check your messages." });
      handleNextSlide("otpVerification");
    } catch (error) {
      toast({ title: "OTP Send Failed", description: (error as Error).message, variant: "destructive" });
      if ((window as any).recaptchaVerifierInstance) (window as any).recaptchaVerifierInstance.clear();
      setRecaptchaVerifier(undefined);
      await initializeRecaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) {
      toast({ title: "Verification Error", variant: "destructive" }); return;
    }
    setIsLoading(true);
    try {
      await confirmOtp(confirmationResult, otp, isCreatorRole ? 'creator' : 'supporter');
      // onAuthStateChanged will handle profile check / redirection
    } catch (error) {
      toast({ title: "OTP Verification Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicFile(file);
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      toast({ title: "Error", description: "Authentication information missing.", variant: "destructive" });
      return;
    }
    if (!formPhoneNumber || !formPhoneNumber.match(/^\+254[17]\d{8}$/)) {
      toast({ title: "Invalid Phone Number", description: "Phone number is required. Format: +2547XXXXXXXX or +2541XXXXXXXX.", variant: "destructive" });
      return;
    }
    if (!username.trim()) {
      toast({ title: "Username Required", description: "Please enter a username.", variant: "destructive" });
      return;
    }
     if (!username.match(/^@?([a-zA-Z0-9_]+)$/)) {
      toast({ title: "Invalid Username", description: "Username can contain letters, numbers, or underscores. Optional @ at start.", variant: "destructive"});
      return;
    }
    if (!fullName.trim()) {
      toast({ title: "Full Name Required", description: "Please enter your full name.", variant: "destructive" });
      return;
    }

    if (isCreatorRole) {
      if (!tipHandle.match(/^@([a-zA-Z0-9_]+)$/)) {
        toast({ title: "Invalid Tip Handle", description: "Tip Handle must start with @ and contain letters, numbers, or underscores.", variant: "destructive" });
        return;
      }
      if (!category) {
        toast({ title: "Creator Category Missing", description: "Category is required for creators.", variant: "destructive" });
        return;
      }
    }
    setIsLoading(true);

    let finalProfilePicUrl = profilePicPreview || firebaseUser.photoURL || null;
    if (profilePicFile) {
      const storageRefVal = ref(storage, `users/${firebaseUser.uid}/profile.${profilePicFile.name.split('.').pop()}`);
      try {
        const snapshot = await uploadBytes(storageRefVal, profilePicFile);
        finalProfilePicUrl = await getDownloadURL(snapshot.ref);
      } catch (error) {
        toast({ title: "Image Upload Failed", description: (error as Error).message, variant: "destructive" }); setIsLoading(false); return;
      }
    }
    
    const finalUsername = username.startsWith('@') ? username : `@${username}`;

    const profileDataForCompletion: Partial<User> = {
      username: finalUsername,
      fullName: fullName.trim(),
      phoneNumber: formPhoneNumber, // This is now required
      profilePicUrl: finalProfilePicUrl,
      isCreator: isCreatorRole,
      bio: bio.trim() || null,
      ...(isCreatorRole && { tipHandle: tipHandle.trim(), category: category }),
    };
    
    const cleanedProfileData = Object.fromEntries(
      Object.entries(profileDataForCompletion).filter(([_, v]) => v !== undefined)
    ) as Partial<User>;


    try {
      await completeUserProfile(cleanedProfileData, isCreatorRole ? 'creator' : 'supporter');
      toast({ title: "Profile Created! 🎉", description: "Welcome to TipKesho!" });
      // Redirection is handled by onAuthStateChanged effect
    } catch (error) {
      toast({ title: "Profile Creation Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  if (authLoading || isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Checking your session...</p>
      </div>
    );
  }


  const renderSlideContent = () => {
    switch (currentSlide) {
      case "welcome":
        return (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-6"><Sparkles className="h-16 w-16 text-primary" /></div>
              <CardTitle className="text-3xl font-bold">Support Your Favorite Kenyan Creators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => handleAuthMethodSelection("phone")} className="w-full text-lg py-6 bg-green-500 hover:bg-green-600 text-white">
                <Phone className="mr-2 h-5 w-5" /> Continue with Phone
              </Button>
              <Button onClick={() => handleAuthMethodSelection("google")} variant="outline" className="w-full text-lg py-6">
                <svg className="mr-2 h-5 w-5" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.19,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.19,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.19,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z" /></svg> Continue with Google
              </Button>
            </CardContent>
            <CardFooter className="justify-center">
              <Button variant="link" className="text-primary" onClick={() => { setAuthMethod('email'); handleNextSlide('authInput'); }}> {/* Assuming email is another form of 'authInput' */}
                Already have an account? Sign In
              </Button>
            </CardFooter>
          </>
        );
      case "authInput": // This slide is for phone or email input
        return (
          <>
            <CardHeader>
              <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={handlePrevSlide}><ArrowLeft className="h-5 w-5" /></Button>
              <CardTitle className="text-2xl pt-8 text-center">
                {authMethod === 'phone' ? 'Enter Phone Number' : 'Sign In / Sign Up with Email'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {authMethod === 'phone' && (
                <form onSubmit={handleSendOtp} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone-input">Phone (e.g. +254712345678)</Label>
                    <Input id="phone-input" type="tel" placeholder="+254 XXX XXX XXX" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required className="text-lg p-4" />
                  </div>
                  <Button type="submit" className="w-full text-lg py-6 bg-primary" disabled={isLoading || authLoading || !recaptchaVerifier}>
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Send OTP"}
                  </Button>
                </form>
              )}
              {/* Add Email Auth Form here if authMethod === 'email' */}
            </CardContent>
          </>
        );
      case "otpVerification":
        return (
          <>
            <CardHeader>
              <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={handlePrevSlide}><ArrowLeft className="h-5 w-5" /></Button>
              <CardTitle className="text-2xl pt-8 text-center">Verify OTP</CardTitle>
              <CardDescription className="text-center">Enter 6-digit code sent to {phoneNumber}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP Code</Label>
                  <Input id="otp" type="text" maxLength={6} placeholder="XXXXXX" value={otp} onChange={(e) => setOtp(e.target.value)} required className="text-lg p-4 text-center tracking-[0.5em]" />
                </div>
                <Button type="submit" className="w-full text-lg py-6 bg-primary" disabled={isLoading || authLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />} Verify
                </Button>
                <Button variant="link" className="w-full text-primary" onClick={handleSendOtp} disabled={isLoading || authLoading || !recaptchaVerifier}>
                  Resend Code
                </Button>
              </form>
            </CardContent>
          </>
        );
      case "completeProfile":
        return (
          <>
            <CardHeader>
              <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={handlePrevSlide}><ArrowLeft className="h-5 w-5" /></Button>
              <CardTitle className="text-2xl pt-8 text-center">Complete Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="flex flex-col items-center space-y-3">
                  {profilePicPreview ? (
                    <Image src={profilePicPreview} alt="Profile Preview" width={100} height={100} data-ai-hint="profile avatar" className="rounded-full object-cover h-24 w-24 border-2 border-primary" />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-primary">
                      <UserPlus className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <Input id="profilePic" type="file" accept="image/*" onChange={handleProfilePicChange} className="text-sm file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="username">Username (@handle)</Label>
                  <Input id="username" placeholder="@your_handle" value={username} onChange={(e) => setUsername(e.target.value)} required className="text-lg p-3" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" placeholder="Your Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="text-lg p-3" />
                </div>
                 <div className="space-y-1">
                  <Label htmlFor="formPhoneNumber">Phone Number (e.g. +2547XXXXXXXX)</Label>
                  <Input
                    id="formPhoneNumber"
                    type="tel"
                    placeholder="+2547XXXXXXXX"
                    value={formPhoneNumber}
                    onChange={(e) => setFormPhoneNumber(e.target.value)}
                    required
                    className="text-lg p-3"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bio">Bio (Optional)</Label>
                  <Textarea id="bio" placeholder="Tell us a bit about yourself..." value={bio} onChange={(e) => setBio(e.target.value)} className="text-lg p-3" rows={3} />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch id="isCreatorSwitch" checked={isCreatorRole} onCheckedChange={setIsCreatorRole} />
                  <Label htmlFor="isCreatorSwitch" className="text-base">I&apos;m a Creator</Label>
                </div>
                {isCreatorRole && (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="tipHandle">Creator Tip Handle (e.g., @MyCreations)</Label>
                      <Input id="tipHandle" placeholder="@MyCreations" value={tipHandle} onChange={(e) => setTipHandle(e.target.value)} required={isCreatorRole} className="text-lg p-3" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="category">Creator Category</Label>
                      <Input id="category" placeholder="e.g., Art, Music, Dance" value={category} onChange={(e) => setCategory(e.target.value)} required={isCreatorRole} className="text-lg p-3" />
                    </div>
                  </>
                )}
                <Button type="submit" className="w-full text-lg py-6 bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading || authLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
                  Submit &amp; Go 🎉
                </Button>
              </form>
            </CardContent>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] py-8">
      <Card className="w-full max-w-md shadow-xl overflow-hidden relative">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full"
          >
            {renderSlideContent()}
          </motion.div>
        </AnimatePresence>
        <div id="recaptcha-container-id" ref={recaptchaContainerRef} className="absolute top-[-9999px] left-[-9999px]"></div>
      </Card>
    </div>
  );
}
