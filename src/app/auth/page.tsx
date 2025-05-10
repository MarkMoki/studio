
"use client";

import { useState, type FormEvent, useEffect } from "react";
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

type Slide = "welcome" | "phoneInput" | "googleAuth" | "otpVerification" | "completeProfile";
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
  
  // Form state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);

  const { signIn, signUp, user } = useAuth(); // using existing methods as placeholders
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

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
  };

  const handleContinueWithGoogle = async () => {
    setAuthMethod("google");
    setIsLoading(true);
    // Mock Google Sign In
    toast({ title: "Simulating Google Sign In...", description: "Using placeholder auth."});
    await new Promise(resolve => setTimeout(resolve, 1500));
    try {
      await signIn("testuser@tipkesho.com", "password"); // Placeholder
      // In a real app, Firebase would return a user object.
      // Then check if profile exists. For now, assume new user.
      toast({ title: "Google Sign-In Successful (Mock)", description: "Proceed to complete your profile." });
      handleNextSlide("completeProfile");
    } catch (error) {
      toast({ title: "Google Sign-In Failed (Mock)", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Mock Send OTP
    toast({ title: "Simulating OTP Send...", description: `OTP would be sent to ${phoneNumber}`});
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setIsOtpSent(true);
    toast({ title: "OTP Sent (Mock)", description: "Please check your messages."});
    handleNextSlide("otpVerification");
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Mock Verify OTP
    toast({ title: "Simulating OTP Verification..."});
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Assume OTP is correct
    // In a real app, check if user profile exists. For now, assume new user.
    toast({ title: "OTP Verified (Mock)", description: "Proceed to complete your profile."});
    setIsLoading(false);
    handleNextSlide("completeProfile");
  };
  
  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePic(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result as string);
      }
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    toast({ title: "Creating Profile (Mock)..." });
    // Mock profile creation & sign up
    await new Promise(resolve => setTimeout(resolve, 1500));
    try {
        await signUp("newuser@tipkesho.com", "password", fullName); // Placeholder, actual email/UID from Firebase
        toast({ title: "Profile Created! 🎉", description: "Welcome to TipKesho!" });
        router.push("/dashboard");
    } catch (error) {
        toast({ title: "Profile Creation Failed", description: "Please try again.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };


  const renderSlide = () => {
    switch (currentSlide) {
      case "welcome":
        return (
          <motion.div
            key="welcome"
            custom={direction}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full"
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-6">
                <HandCoins className="h-16 w-16 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold text-primary">Welcome to TipKesho</CardTitle>
              <CardDescription>Support Your Favorite Kenyan Creators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleContinueWithPhone} className="w-full text-lg py-6 bg-green-500 hover:bg-green-600 text-white">
                <Phone className="mr-2 h-5 w-5" /> Continue with Phone
              </Button>
              <Button onClick={handleContinueWithGoogle} variant="outline" className="w-full text-lg py-6">
                <Mail className="mr-2 h-5 w-5" /> Continue with Google
              </Button>
            </CardContent>
            <CardFooter className="justify-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Button variant="link" className="p-0 h-auto text-primary" onClick={handleContinueWithPhone}>
                  Sign In
                </Button>
              </p>
            </CardFooter>
          </motion.div>
        );
      case "phoneInput":
        return (
          <motion.div
            key="phoneInput"
            custom={direction}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full"
          >
            <CardHeader>
               <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => handlePrevSlide("welcome")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <CardTitle className="text-2xl pt-8 text-center">Enter Your Phone Number</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="+254 7XX XXX XXX" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required 
                    className="text-lg p-4"
                  />
                </div>
                <Button type="submit" className="w-full text-lg py-6 bg-primary" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Send OTP"}
                </Button>
              </form>
            </CardContent>
          </motion.div>
        );
      case "otpVerification":
        return (
          <motion.div
            key="otpVerification"
            custom={direction}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full"
          >
            <CardHeader>
              <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => handlePrevSlide("phoneInput")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <CardTitle className="text-2xl pt-8 text-center">Verify OTP</CardTitle>
              <CardDescription className="text-center">Enter the 6-digit code sent to {phoneNumber}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP Code</Label>
                  <Input 
                    id="otp" 
                    type="text" 
                    maxLength={6} 
                    placeholder="XXXXXX" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required 
                    className="text-lg p-4 text-center tracking-[0.5em]"
                  />
                </div>
                <Button type="submit" className="w-full text-lg py-6 bg-primary" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />} 
                  Verify Code
                </Button>
                 <Button variant="link" className="w-full text-primary" onClick={() => { /* Resend OTP logic */ toast({title: "OTP Resent (Mock)"})}} disabled={isLoading}>
                  Resend Code
                </Button>
              </form>
            </CardContent>
          </motion.div>
        );
      case "completeProfile":
        return (
          <motion.div
            key="completeProfile"
            custom={direction}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full"
          >
            <CardHeader>
               <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => handlePrevSlide(authMethod === "phone" ? "otpVerification" : "welcome")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
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
                <div className="flex items-center space-x-2 pt-2">
                  <Switch id="isCreator" checked={isCreator} onCheckedChange={setIsCreator} />
                  <Label htmlFor="isCreator" className="text-base">I&apos;m a Creator</Label>
                </div>
                <Button type="submit" className="w-full text-lg py-6 bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
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
      <Card className="w-full max-w-md shadow-xl overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          {renderSlide()}
        </AnimatePresence>
      </Card>
      <div id="recaptcha-container"></div> {/* For Firebase phone auth */}
    </div>
  );
}
