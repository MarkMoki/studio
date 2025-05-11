
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Gift, Zap, MessageSquareHeart, Users, Sparkles, Palette, TrendingUp, Loader2 } from "lucide-react"; 
import Image from "next/image";
import Link from "next/link";
import { HowItWorks } from "@/components/home/how-it-works"; 
import { Testimonials } from "@/components/home/testimonials"; 
import { FeaturedCreatorsClient } from "./featured-creators-client";
import { PlatformHighlights } from "@/components/home/platform-highlights";
import type { Creator } from '@/types';
import { cn } from "@/lib/utils";
import { useAuth } from '@/hooks/use-auth';

interface HomePageClientContentProps {
  featuredCreatorsData: Creator[];
}

export function HomePageClientContent({ featuredCreatorsData }: HomePageClientContentProps) {
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(true); // Start true to show loader initially

  useEffect(() => {
    if (!authLoading) {
      if (user && user.fullName && user.phoneNumber) { // Fully profiled user
        router.push('/dashboard');
        // setIsRedirecting will remain true until navigation occurs
      } else if (firebaseUser) { // Logged in but profile incomplete
        router.push('/auth');
        // setIsRedirecting will remain true
      } else { // Not logged in, or auth state still resolving but no firebaseUser
        setIsRedirecting(false); // Allow home page content to render
      }
    }
  }, [user, firebaseUser, authLoading, router]);

  if (authLoading || isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading your experience...</p>
      </div>
    );
  }
  
  const features = [
    {
      icon: <Gift className="w-8 h-8 text-primary" />,
      title: "Instant Tipping",
      description: "Easily send tips to your favorite creators in just a few clicks.",
    },
    {
      icon: <MessageSquareHeart className="w-8 h-8 text-primary" />,
      title: "AI Message Helper",
      description: "Get AI-powered suggestions for personalized messages to send with your tips.",
    },
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: "Secure Payments",
      description: "Reliable payment processing, (simulated M-Pesa for now).",
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "Creator Community",
      description: "Join a vibrant community supporting Kenyan talent and creativity.",
    },
  ];

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } }
  };

  return (
    <div className="flex flex-col items-center space-y-16 md:space-y-24 overflow-x-hidden">
      {/* Hero Section */}
      <motion.section 
        className="w-full py-12 md:py-24 lg:py-32 bg-secondary/30 rounded-xl shadow-2xl overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
              className="flex flex-col justify-center space-y-6"
            >
              <div className="space-y-3">
                <h1 className="text-5xl font-extrabold tracking-tighter sm:text-6xl xl:text-7xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary via-green-400 to-accent">
                  TipKesho <Sparkles className="inline-block w-10 h-10 text-accent animate-pulse" />
                </h1>
                <p className="text-2xl font-semibold text-foreground">
                  Support Your Favorite Kenyan Creators
                </p>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Empowering creativity, one tip at a time. Join a community that values talent and expression.
                </p>
              </div>
              <div className="flex flex-col gap-3 min-[400px]:flex-row">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    href="/creators" 
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300"
                    )}
                  >
                    Discover Creators <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    href="/auth" 
                    className={cn(
                      buttonVariants({ size: "lg", variant: "outline" }),
                      "shadow-md hover:shadow-lg transition-all duration-300"
                    )}
                  >
                    Sign Up & Shine
                  </Link>
                </motion.div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.4 }}
            >
            <Image
              src="https://picsum.photos/seed/kenya-vibes/600/400"
              alt="Hero Image showing vibrant Kenyan art or creative scene"
              data-ai-hint="vibrant kenyan art"
              width={600}
              height={400}
              className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square shadow-xl transform hover:scale-105 transition-transform duration-500"
              priority
            />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
       <motion.section 
        className="w-full py-12 md:py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
      >
        <div className="container px-4 md:px-6">
          <motion.div 
            initial={{ opacity: 0, y:20 }}
            whileInView={{ opacity: 1, y:0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center space-y-3 text-center mb-10"
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Why TipKesho?</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              We provide a seamless and engaging way for fans to support creators and for creators to thrive.
            </p>
          </motion.div>
          <div className="mx-auto grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                whileHover={{ y: -5, scale: 1.03, boxShadow: "0 10px 15px -3px hsl(var(--primary-hsl) / 0.1), 0 4px 6px -2px hsl(var(--primary-hsl) / 0.05)" }}
              >
              <Card 
                className="shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out h-full bg-card"
              >
                <CardHeader className="flex flex-row items-center gap-4 pb-2 p-6">
                  {feature.icon}
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <HowItWorks /> 

      <PlatformHighlights />

      <FeaturedCreatorsClient creators={featuredCreatorsData} />
      
      <motion.section 
        className="w-full py-12 md:py-16 bg-secondary/20 rounded-xl shadow-inner"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
      >
        <div className="container px-4 md:px-6">
          <motion.div 
            initial={{ opacity: 0, y:20 }}
            whileInView={{ opacity: 1, y:0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center space-y-3 text-center mb-10"
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Explore by Passion</h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
              Dive into worlds of art, music, dance, comedy, and more.
            </p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { name: "Art & Design", icon: <Palette className="w-10 h-10 text-accent" />, link: "/creators?category=Art", dataAiHint: "paint palette"},
              { name: "Music & Beats", icon: <Zap className="w-10 h-10 text-accent" />, link: "/creators?category=Music", dataAiHint: "music notes" },
              { name: "Dance Moves", icon: <TrendingUp className="w-10 h-10 text-accent" />, link: "/creators?category=Dance", dataAiHint: "dancer silhouette" },
              { name: "Comedy Hub", icon: <MessageSquareHeart className="w-10 h-10 text-accent" />, link: "/creators?category=Comedy", dataAiHint: "laughing emoji" },
            ].map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: index * 0.15 }}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              >
              <Link href={category.link} legacyBehavior>
                <Card className="text-center p-6 shadow-md hover:shadow-xl transition-shadow cursor-pointer h-full flex flex-col justify-center items-center bg-card hover:bg-card/90">
                  <div className="p-3 bg-accent/10 rounded-full mb-3 inline-block">
                    {category.icon}
                  </div>
                  <CardTitle className="text-lg font-semibold">{category.name}</CardTitle>
                </Card>
              </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <Testimonials />

      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
        className="w-full py-12 md:py-20 bg-gradient-to-br from-primary via-green-600 to-accent text-primary-foreground rounded-xl shadow-2xl"
      >
        <div className="container grid items-center justify-center gap-6 px-4 text-center md:px-6">
          <div className="space-y-4">
            <Sparkles className="w-12 h-12 mx-auto text-background/80 animate-bounce" />
            <h2 className="text-4xl font-bold tracking-tighter md:text-5xl/tight">
              Ready to Make a Difference?
            </h2>
            <p className="mx-auto max-w-[600px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed text-background/90">
              Start supporting your favorite creators today or sign up to receive tips for your work. Let&apos;s build something amazing together!
            </p>
          </div>
          <div className="mx-auto w-full max-w-sm space-x-3 flex justify-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
             <Link 
                href="/creators" 
                className={cn(
                  buttonVariants({ size: "lg", variant: "secondary" }),
                  "bg-background text-primary hover:bg-background/90 shadow-md hover:shadow-lg transition-all duration-300"
                )}
             >
                Explore Creators
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                href="/auth" 
                className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary shadow-md hover:shadow-lg transition-all duration-300"
                )}
              >
                  Join as a Creator
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

