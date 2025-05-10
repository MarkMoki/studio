
"use client";

import { useState, type FormEvent, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { HandCoins, Sparkles, ArrowLeft, Phone, Mail, CheckCircle, UserPlus, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import type { RecaptchaVerifier, ConfirmationResult } from "firebase/auth";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { User } from "@/types";
import { Textarea } from "@/components/ui/textarea";
import Link from 'next/link';

type Slide = "welcome" | "phoneInput" | "otpVerification" | "completeProfile";
type AuthMethod = "phone" | "google" | null;

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
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [tipHandle, setTipHandle] = useState('');
  const [category, setCategory] = useState('');
  const [bio, setBio] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);

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
    completeUserProfile 
  } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && user && user.fullName) { // If user profile is complete
      router.push("/dashboard");
    } else if (!authLoading && firebaseUser && !user?.fullName && currentSlide !== 'completeProfile') {
      // Firebase user exists but local profile (with fullName) doesn't, means profile needs completion
      handleNextSlide("completeProfile");
    }
  }, [user, firebaseUser, authLoading, router, currentSlide]);

  const initializeRecaptcha = async () => {
    if (recaptchaContainerRef.current) {
        try {
            const verifier = await setUpRecaptcha("recaptcha-container-id"); // Ensure this ID matches div
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

  const handlePrevSlide = (prev: Slide) => {
    setDirection(-1);
    setCurrentSlide(prev);
  };

  const handleContinueWithPhone = () => {
    setAuthMethod("phone");
    handleNextSlide("phoneInput");
    // Initialize reCAPTCHA when phone input slide is shown
    // Needs a small delay for the div to be in DOM if it's part of conditional rendering
    setTimeout(() => {
        if (recaptchaContainerRef.current && !recaptchaVerifier) {
             initializeRecaptcha();
        }
    }, 100);
  };

  const handleContinueWithGoogle = async () => {
    setAuthMethod("google");
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // onAuthStateChanged will handle user state and redirection or slide change
      // If new user, it should redirect to completeProfile
      // For existing user, it will redirect to dashboard
      // toast({ title: "Google Sign-In Initiated", description: "Follow the Google sign-in prompts." });
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
      await initializeRecaptcha(); // Try to re-initialize
      return;
    }
    if (!phoneNumber.match(/^\+254[17]\d{8}$/)) {
        toast({ title: "Invalid Phone Number", description: "Please use format +2547XXXXXXXX or +2541XXXXXXXX.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    try {
      const result = await signInWithPhone(phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
      setIsOtpSent(true);
      toast({ title: "OTP Sent", description: "Please check your messages." });
      handleNextSlide("otpVerification");
    } catch (error) {
      toast({ title: "OTP Send Failed", description: (error as Error).message, variant: "destructive" });
      recaptchaVerifier.clear(); // Clear previous verifier
      await initializeRecaptcha(); // Re-initialize for next attempt
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) {
      toast({ title: "Verification Error", description: "No OTP confirmation context found.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const authedFirebaseUser = await confirmOtp(confirmationResult, otp);
      if (authedFirebaseUser) {
        toast({ title: "OTP Verified!", description: "Authentication successful." });
        // onAuthStateChanged will pick up the new user and check if profile exists.
        // If profile exists (e.g. user.fullName is present), it will redirect to dashboard.
        // If not, it will redirect/stay on completeProfile.
        const userDocRef = doc(db, "users", authedFirebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data()?.fullName) {
            router.push("/dashboard");
        } else {
            handleNextSlide("completeProfile");
        }
      }
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result as string);
      }
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
        toast({ title: "Authentication Error", description: "No authenticated user found.", variant: "destructive" });
        return;
    }
    if (isCreator && (!tipHandle || !category)) {
        toast({ title: "Creator Info Missing", description: "Tip Handle and Category are required for creators.", variant: "destructive"});
        return;
    }
    setIsLoading(true);
    
    let profilePicUrl = firebaseUser.photoURL || null; // Use existing from Google/Phone if any
    if (profilePicFile) {
        const storageRef = ref(storage, `users/${firebaseUser.uid}/profile.${profilePicFile.name.split('.').pop()}`);
        try {
            const snapshot = await uploadBytes(storageRef, profilePicFile);
            profilePicUrl = await getDownloadURL(snapshot.ref);
        } catch (error) {
            toast({ title: "Image Upload Failed", description: (error as Error).message, variant: "destructive" });
            setIsLoading(false);
            return;
        }
    }

    const profileData: Partial<User> & { tipHandle?: string; category?: string } = {
        username,
        fullName,
        profilePicUrl,
        isCreator,
        bio, // Added bio
        // Conditionally add creator fields if isCreator is true
        ...(isCreator && { tipHandle, category }),
    };

    try {
        await completeUserProfile(profileData);
        toast({ title: "Profile Created! 🎉", description: "Welcome to TipKesho!" });
        router.push("/dashboard");
    } catch (error) {
        toast({ title: "Profile Creation Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };


  const renderSlide = () => {
    switch (currentSlide) {
      case "welcome":
        return (
          <motion.div key="welcome" custom={direction} variants={slideVariants} initial="initial" animate="animate" exit="exit" className="w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-6"><HandCoins className="h-16 w-16 text-primary" /></div>
              <CardTitle className="text-3xl font-bold text-primary">Welcome to TipKesho</CardTitle>
              <CardDescription>Support Your Favorite Kenyan Creators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleContinueWithPhone} className="w-full text-lg py-6 bg-green-500 hover:bg-green-600 text-white" disabled={isLoading || authLoading}>
                { (isLoading && authMethod === 'phone') ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Phone className="mr-2 h-5 w-5" />} Continue with Phone
              </Button>
              <Button onClick={handleContinueWithGoogle} variant="outline" className="w-full text-lg py-6" disabled={isLoading || authLoading}>
                { (isLoading && authMethod === 'google') ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Mail className="mr-2 h-5 w-5" />} Continue with Google
              </Button>
            </CardContent>
             <CardFooter className="flex-col space-y-2 text-center">
                <p className="text-sm text-muted-foreground">
                    By continuing, you agree to TipKesho&apos;s <br/>
                    <Link href="/terms" className="underline hover:text-primary">Terms of Service</Link> & <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link>.
                </p>
             </CardFooter>
          </motion.div>
        );
      case "phoneInput":
        return (
          <motion.div key="phoneInput" custom={direction} variants={slideVariants} initial="initial" animate="animate" exit="exit" className="w-full">
            <CardHeader>
               <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => handlePrevSlide("welcome")}><ArrowLeft className="h-5 w-5" /></Button>
              <CardTitle className="text-2xl pt-8 text-center">Enter Your Phone Number</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (e.g. +254712345678)</Label>
                  <Input id="phone" type="tel" placeholder="+254 XXX XXX XXX" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required className="text-lg p-4"/>
                </div>
                <Button type="submit" className="w-full text-lg py-6 bg-primary" disabled={isLoading || authLoading || !recaptchaVerifier}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Send OTP"}
                </Button>
              </form>
            </CardContent>
          </motion.div>
        );
      case "otpVerification":
        return (
          <motion.div key="otpVerification" custom={direction} variants={slideVariants} initial="initial" animate="animate" exit="exit" className="w-full">
            <CardHeader>
              <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => handlePrevSlide("phoneInput")}><ArrowLeft className="h-5 w-5" /></Button>
              <CardTitle className="text-2xl pt-8 text-center">Verify OTP</CardTitle>
              <CardDescription className="text-center">Enter the 6-digit code sent to {phoneNumber}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP Code</Label>
                  <Input id="otp" type="text" maxLength={6} placeholder="XXXXXX" value={otp} onChange={(e) => setOtp(e.target.value)} required className="text-lg p-4 text-center tracking-[0.5em]"/>
                </div>
                <Button type="submit" className="w-full text-lg py-6 bg-primary" disabled={isLoading || authLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />} Verify Code
                </Button>
                 <Button variant="link" className="w-full text-primary" onClick={handleSendOtp} disabled={isLoading || authLoading || !recaptchaVerifier}> {/* Re-use handleSendOtp for resend */}
                  Resend Code
                </Button>
              </form>
            </CardContent>
          </motion.div>
        );
      case "completeProfile":
        return (
          <motion.div key="completeProfile" custom={direction} variants={slideVariants} initial="initial" animate="animate" exit="exit" className="w-full">
            <CardHeader>
               <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => handlePrevSlide(authMethod === "phone" ? "otpVerification" : "welcome")}><ArrowLeft className="h-5 w-5" /></Button>
              <CardTitle className="text-2xl pt-8 text-center">Complete Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                 <div className="flex flex-col items-center space-y-3">
                    {profilePicPreview ? (
                      <Image src={profilePicPreview} alt="Profile Preview" width={100} height={100} data-ai-hint="profile image" className="rounded-full object-cover h-24 w-24 border-2 border-primary"/>
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-primary">
                        <UserPlus className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <Input id="profilePic" type="file" accept="image/*" onChange={handleProfilePicChange} className="text-sm file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="username">Username (@handle)</Label>
                  <Input id="username" placeholder="@your_handle" value={username} onChange={(e) => setUsername(e.target.value)} required className="text-lg p-3"/>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" placeholder="Your Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="text-lg p-3"/>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bio">Bio (Optional)</Label>
                  <Textarea id="bio" placeholder="Tell us a bit about yourself..." value={bio} onChange={(e) => setBio(e.target.value)} className="text-lg p-3" rows={3}/>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch id="isCreator" checked={isCreator} onCheckedChange={setIsCreator} />
                  <Label htmlFor="isCreator" className="text-base">I&apos;m a Creator</Label>
                </div>

                {isCreator && (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="tipHandle">Creator Tip Handle (e.g., @MyCreations)</Label>
                      <Input id="tipHandle" placeholder="@MyCreations" value={tipHandle} onChange={(e) => setTipHandle(e.target.value)} required={isCreator} className="text-lg p-3"/>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="category">Creator Category</Label>
                      <Input id="category" placeholder="e.g., Art, Music, Dance" value={category} onChange={(e) => setCategory(e.target.value)} required={isCreator} className="text-lg p-3"/>
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full text-lg py-6 bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading || authLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
                  Submit & Go 🎉
                </Button>
              </form>
            </CardContent>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] py-8">
      <Card className="w-full max-w-md shadow-xl overflow-hidden relative">
        <AnimatePresence initial={false} custom={direction}>
          {renderSlide()}
        </AnimatePresence>
         {/* Invisible reCAPTCHA container - MUST be visible in DOM for phone auth */}
        <div id="recaptcha-container-id" ref={recaptchaContainerRef} className="absolute top-[-9999px] left-[-9999px]"></div>
      </Card>
    </div>
  );
}
