
"use client";

import { useState, type FormEvent, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { HandCoins, Sparkles, ArrowLeft, Phone, Mail, CheckCircle, UserPlus, Loader2, ShieldCheck, Users, Briefcase, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import type { RecaptchaVerifier, ConfirmationResult } from "firebase/auth";
import { storage, db } from "@/lib/firebase"; // Added db
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { User } from "@/types";
import { Textarea } from "@/components/ui/textarea";
import Link from 'next/link';
import { doc, getDoc } from "firebase/firestore"; // Added for checking user doc

type UserRole = "creator" | "supporter";
type Slide = "roleSelection" | "authMethodSelection" | "phoneInput" | "otpVerification" | "emailAuth" | "completeProfile";
type AuthMethod = "phone" | "google" | "email" | null;
type EmailAuthMode = "signIn" | "signUp";

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
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentSlide, setCurrentSlide] = useState<Slide>("roleSelection");
  const [direction, setDirection] = useState(1);
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null);
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailAuthMode, setEmailAuthMode] = useState<EmailAuthMode>("signUp");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  // isCreator is now derived from userRole for the form
  const [tipHandle, setTipHandle] = useState('');
  const [category, setCategory] = useState('');
  const [bio, setBio] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | undefined>(undefined);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | undefined>(undefined);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  const { 
    user, 
    firebaseUser, 
    loading: authLoading, 
    signInWithGoogle, 
    signUpWithEmailPassword,
    signInWithEmailPassword,
    setUpRecaptcha, 
    signInWithPhone, 
    confirmOtp, 
    completeUserProfile 
  } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && user && user.fullName) { 
      router.push("/dashboard");
    } else if (!authLoading && firebaseUser && !user?.fullName && currentSlide !== 'completeProfile') {
      // If user is authenticated but profile is incomplete, navigate to completeProfile.
      // This check relies on 'fullName' as an indicator of a completed profile.
      // We need to ensure 'userRole' is available, perhaps from localStorage or query param if necessary,
      // or fetch user doc here to determine role if already set.
      // For now, assume if firebaseUser exists and profile is incomplete, role was previously set or will be prompted.
      if (!userRole && currentSlide !== 'roleSelection') {
        // If role is unknown and firebaseUser exists, but profile incomplete,
        // It means they likely authenticated but then refreshed or navigated away.
        // Try to fetch their existing role or default to prompting.
        const fetchUserRole = async () => {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if(userDocSnap.exists() && userDocSnap.data()?.isCreator !== undefined) {
                setUserRole(userDocSnap.data()?.isCreator ? 'creator' : 'supporter');
            }
            handleNextSlide("completeProfile");
        }
        fetchUserRole();

      } else if (userRole) { // if role is known
         handleNextSlide("completeProfile");
      }
      // If no userRole and no firebaseUser, they stay on current flow (e.g. roleSelection)
    }
  }, [user, firebaseUser, authLoading, router, currentSlide, userRole]);


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

  const handlePrevSlide = (prev: Slide) => {
    setDirection(-1);
    setCurrentSlide(prev);
  };

  const handleRoleSelection = (role: UserRole) => {
    setUserRole(role);
    handleNextSlide("authMethodSelection");
  };

  const handleAuthMethodSelection = (method: AuthMethod) => {
    setAuthMethod(method);
    if (method === "phone") {
      handleNextSlide("phoneInput");
      setTimeout(() => {
        if (recaptchaContainerRef.current && !recaptchaVerifier) {
             initializeRecaptcha();
        }
      }, 100);
    } else if (method === "google") {
      handleGoogleAuth();
    } else if (method === "email") {
      handleNextSlide("emailAuth");
    }
  };

  const handleGoogleAuth = async () => {
    if (!userRole) {
      toast({ title: "Role Selection Required", description: "Please select if you are a creator or supporter first.", variant: "destructive" });
      handlePrevSlide("roleSelection"); // Go back to role selection
      return;
    }
    setIsLoading(true);
    try {
      await signInWithGoogle(userRole);
      // onAuthStateChanged will handle navigation or next steps
    } catch (error) {
      toast({ title: "Google Sign-In Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    if (!userRole) {
      toast({ title: "Role Selection Required", variant: "destructive" });
      handlePrevSlide("roleSelection");
      return;
    }
    if (emailAuthMode === 'signUp' && password !== confirmPassword) {
      toast({ title: "Passwords Don't Match", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      if (emailAuthMode === 'signUp') {
        await signUpWithEmailPassword(email, password, userRole);
      } else {
        await signInWithEmailPassword(email, password);
      }
      // onAuthStateChanged handles navigation/next steps
    } catch (error: any) {
      let friendlyMessage = "Authentication failed. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        friendlyMessage = 'This email is already in use. Try signing in or use a different email.';
      } else if (error.code === 'auth/weak-password') {
        friendlyMessage = 'Password is too weak. It should be at least 6 characters.';
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        friendlyMessage = 'Invalid email or password.';
      }
      toast({ title: "Email Auth Failed", description: friendlyMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!userRole) {
      toast({ title: "Role Selection Required", variant: "destructive" });
      handlePrevSlide("roleSelection");
      return;
    }
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
      const result = await signInWithPhone(phoneNumber, recaptchaVerifier, userRole);
      setConfirmationResult(result);
      toast({ title: "OTP Sent", description: "Please check your messages." });
      handleNextSlide("otpVerification");
    } catch (error) {
      toast({ title: "OTP Send Failed", description: (error as Error).message, variant: "destructive" });
      if ((window as any).recaptchaVerifierInstance) (window as any).recaptchaVerifierInstance.clear();
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
    if (!userRole) { // Should not happen if flow is correct
        toast({ title: "Role Selection Missing", variant: "destructive" }); return;
    }
    setIsLoading(true);
    try {
      await confirmOtp(confirmationResult, otp, userRole);
      // onAuthStateChanged handles next steps
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
    if (!firebaseUser || !userRole) {
        toast({ title: "Error", description: "Authentication or role information missing.", variant: "destructive" });
        return;
    }
    const isCreatorProfile = userRole === 'creator';
    if (isCreatorProfile && (!tipHandle || !category)) {
        toast({ title: "Creator Info Missing", description: "Tip Handle and Category are required for creators.", variant: "destructive"});
        return;
    }
    setIsLoading(true);
    
    let profilePicUrl = firebaseUser.photoURL || null;
    if (profilePicFile) {
        const storageRefVal = ref(storage, `users/${firebaseUser.uid}/profile.${profilePicFile.name.split('.').pop()}`);
        try {
            const snapshot = await uploadBytes(storageRefVal, profilePicFile);
            profilePicUrl = await getDownloadURL(snapshot.ref);
        } catch (error) {
            toast({ title: "Image Upload Failed", variant: "destructive" }); setIsLoading(false); return;
        }
    }

    const profileData: Partial<User> = {
        username,
        fullName,
        profilePicUrl,
        isCreator: isCreatorProfile,
        bio,
        ...(isCreatorProfile && { tipHandle, category }),
    };

    try {
        await completeUserProfile(profileData, userRole);
        toast({ title: "Profile Created! 🎉", description: "Welcome to TipKesho!" });
        router.push("/dashboard");
    } catch (error) {
        toast({ title: "Profile Creation Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };


  const renderSlideContent = () => {
    switch (currentSlide) {
      case "roleSelection":
        return (
            <>
            <CardHeader className="text-center">
                <div className="mx-auto mb-6"><Sparkles className="h-16 w-16 text-primary" /></div>
                <CardTitle className="text-3xl font-bold">Join TipKesho As...</CardTitle>
                <CardDescription>Are you here to support or to create?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button onClick={() => handleRoleSelection("creator")} className="w-full text-lg py-8 bg-accent hover:bg-accent/90 text-accent-foreground">
                <Briefcase className="mr-3 h-6 w-6" /> A Creator
                </Button>
                <Button onClick={() => handleRoleSelection("supporter")} className="w-full text-lg py-8 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Users className="mr-3 h-6 w-6" /> A Supporter
                </Button>
            </CardContent>
             <CardFooter className="text-center">
                <p className="text-sm text-muted-foreground">Make your choice to continue.</p>
             </CardFooter>
            </>
        );
      case "authMethodSelection":
        return (
            <>
            <CardHeader className="text-center">
                <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => handlePrevSlide("roleSelection")}><ArrowLeft className="h-5 w-5" /></Button>
                <div className="mx-auto mb-6"><HandCoins className="h-16 w-16 text-primary" /></div>
                <CardTitle className="text-3xl font-bold text-primary">Get Started</CardTitle>
                <CardDescription>Sign up or sign in as a {userRole}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button onClick={() => handleAuthMethodSelection("phone")} className="w-full text-lg py-6 bg-green-500 hover:bg-green-600 text-white" disabled={isLoading || authLoading}>
                    <Phone className="mr-2 h-5 w-5" /> Continue with Phone
                </Button>
                <Button onClick={() => handleAuthMethodSelection("google")} variant="outline" className="w-full text-lg py-6" disabled={isLoading || authLoading}>
                     <svg className="mr-2 h-5 w-5" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.19,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.19,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.19,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z" /></svg> Continue with Google
                </Button>
                <Button onClick={() => handleAuthMethodSelection("email")} variant="outline" className="w-full text-lg py-6" disabled={isLoading || authLoading}>
                    <Mail className="mr-2 h-5 w-5" /> Continue with Email
                </Button>
            </CardContent>
             <CardFooter className="flex-col space-y-2 text-center">
                <p className="text-sm text-muted-foreground">
                    By continuing, you agree to TipKesho&apos;s <br/>
                    <Link href="/terms" className="underline hover:text-primary">Terms</Link> & <Link href="/privacy" className="underline hover:text-primary">Privacy</Link>.
                </p>
             </CardFooter>
            </>
        );
        case "emailAuth":
          return (
            <>
              <CardHeader>
                <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => handlePrevSlide("authMethodSelection")}><ArrowLeft className="h-5 w-5" /></Button>
                <CardTitle className="text-2xl pt-8 text-center">{emailAuthMode === 'signUp' ? 'Sign Up with Email' : 'Sign In with Email'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailAuth} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="text-lg p-4"/>
                  </div>
                  <div className="space-y-2 relative">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="text-lg p-4"/>
                    <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-8" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                  {emailAuthMode === 'signUp' && (
                    <div className="space-y-2 relative">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="text-lg p-4"/>
                      <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-8" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </Button>
                    </div>
                  )}
                  <Button type="submit" className="w-full text-lg py-6 bg-primary" disabled={isLoading || authLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (emailAuthMode === 'signUp' ? 'Sign Up' : 'Sign In')}
                  </Button>
                  <Button variant="link" className="w-full text-primary" onClick={() => setEmailAuthMode(emailAuthMode === 'signUp' ? 'signIn' : 'signUp')}>
                    {emailAuthMode === 'signUp' ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                  </Button>
                </form>
              </CardContent>
            </>
          );
      case "phoneInput":
        return (
            <>
            <CardHeader>
               <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => handlePrevSlide("authMethodSelection")}><ArrowLeft className="h-5 w-5" /></Button>
              <CardTitle className="text-2xl pt-8 text-center">Enter Phone Number</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (e.g. +254712345678)</Label>
                  <Input id="phone" type="tel" placeholder="+254 XXX XXX XXX" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required className="text-lg p-4"/>
                </div>
                <Button type="submit" className="w-full text-lg py-6 bg-primary" disabled={isLoading || authLoading || !recaptchaVerifier}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Send OTP"}
                </Button>
              </form>
            </CardContent>
            </>
        );
      case "otpVerification":
        return (
            <>
            <CardHeader>
              <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => handlePrevSlide("phoneInput")}><ArrowLeft className="h-5 w-5" /></Button>
              <CardTitle className="text-2xl pt-8 text-center">Verify OTP</CardTitle>
              <CardDescription className="text-center">Enter 6-digit code sent to {phoneNumber}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP Code</Label>
                  <Input id="otp" type="text" maxLength={6} placeholder="XXXXXX" value={otp} onChange={(e) => setOtp(e.target.value)} required className="text-lg p-4 text-center tracking-[0.5em]"/>
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
              {/* Back button logic needs to consider the auth method chosen */}
               <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => handlePrevSlide(authMethod === "phone" ? "otpVerification" : (authMethod === "email" ? "emailAuth" : "authMethodSelection"))}><ArrowLeft className="h-5 w-5" /></Button>
              <CardTitle className="text-2xl pt-8 text-center">Complete Your Profile</CardTitle>
              <CardDescription className="text-center">You&apos;re joining as a {userRole}.</CardDescription>
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
                
                {/* "I'm a Creator" switch could be pre-filled and disabled if role is already set */}
                <div className="flex items-center space-x-2 pt-2">
                  <Switch id="isCreatorSwitch" checked={userRole === 'creator'} disabled/> 
                  <Label htmlFor="isCreatorSwitch" className="text-base">
                    {userRole === 'creator' ? "Registered as Creator" : "Registered as Supporter"}
                  </Label>
                </div>

                {userRole === 'creator' && (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="tipHandle">Creator Tip Handle (e.g., @MyCreations)</Label>
                      <Input id="tipHandle" placeholder="@MyCreations" value={tipHandle} onChange={(e) => setTipHandle(e.target.value)} required={userRole === 'creator'} className="text-lg p-3"/>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="category">Creator Category</Label>
                      <Input id="category" placeholder="e.g., Art, Music, Dance" value={category} onChange={(e) => setCategory(e.target.value)} required={userRole === 'creator'} className="text-lg p-3"/>
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full text-lg py-6 bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading || authLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
                  Submit & Go 🎉
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
