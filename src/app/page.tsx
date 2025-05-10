
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Gift, Zap, MessageSquareHeart, Users, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { placeholderCreators } from "@/lib/placeholder-data";
import { FeaturedCreators } from "@/components/home/featured-creators";
import { HowItWorks } from "@/components/home/how-it-works";
import { Testimonials } from "@/components/home/testimonials";

export default function HomePage() {
  const features = [
    {
      icon: <Gift className="w-8 h-8 text-primary" />,
      title: "Instant Tipping",
      description: "Easily send tips to your favorite creators in just a few clicks.",
      delay: "0.7s"
    },
    {
      icon: <MessageSquareHeart className="w-8 h-8 text-primary" />,
      title: "AI Message Helper",
      description: "Get AI-powered suggestions for personalized messages to send with your tips.",
      delay: "0.8s"
    },
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: "Secure Payments",
      description: "Reliable payment processing, initially supporting M-Pesa.",
      delay: "0.9s"
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "Creator Community",
      description: "Join a vibrant community supporting Kenyan talent and creativity.",
      delay: "1.0s"
    },
  ];

  const featuredCreators = placeholderCreators.filter(c => c.featured && c.active).slice(0, 4);

  return (
    <div className="flex flex-col items-center space-y-16 md:space-y-24">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/30 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-6 animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
              <div className="space-y-3">
                <h1 className="text-5xl font-extrabold tracking-tighter sm:text-6xl xl:text-7xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary via-green-400 to-accent">
                  TipKesho <Sparkles className="inline-block w-10 h-10 text-accent" />
                </h1>
                <p className="text-2xl font-semibold text-foreground">
                  Support Your Favorite Kenyan Creators
                </p>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Empowering creativity, one tip at a time. Join a community that values talent and expression.
                </p>
              </div>
              <div className="flex flex-col gap-3 min-[400px]:flex-row">
                <Link href="/creators" legacyBehavior>
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                    Discover Creators <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth" legacyBehavior>
                  <Button size="lg" variant="outline" className="shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                    Sign Up & Shine
                  </Button>
                </Link>
              </div>
            </div>
            <Image
              src="https://picsum.photos/seed/kenya-vibes/600/400"
              alt="Hero Image showing vibrant Kenyan art or creative scene"
              data-ai-hint="vibrant kenyan art"
              width={600}
              height={400}
              className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square shadow-xl transform hover:scale-105 transition-transform duration-500 animate-slide-in-right"
              style={{ animationDelay: '0.4s' }}
              priority
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-16 animate-fade-in" style={{ animationDelay: '0.5s' }}>
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-3 text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Why TipKesho?</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              We provide a seamless and engaging way for fans to support creators and for creators to thrive.
            </p>
          </div>
          <div className="mx-auto grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card 
                key={feature.title} 
                className="shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out hover:scale-105 animate-slide-up"
                style={{ animationDelay: feature.delay }}
              >
                <CardHeader className="flex flex-row items-center gap-4 pb-2 p-6">
                  {feature.icon}
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Featured Creators Section */}
      <FeaturedCreators creators={featuredCreators} />

      {/* Testimonials Section */}
      <Testimonials />

      {/* Call to Action Section */}
      <section className="w-full py-12 md:py-20 bg-gradient-to-br from-primary via-green-600 to-accent text-primary-foreground rounded-xl shadow-2xl animate-fade-in" style={{ animationDelay: '1.2s' }}>
        <div className="container grid items-center justify-center gap-6 px-4 text-center md:px-6">
          <div className="space-y-4 animate-slide-up" style={{ animationDelay: '1.3s' }}>
            <Sparkles className="w-12 h-12 mx-auto text-background/80" />
            <h2 className="text-4xl font-bold tracking-tighter md:text-5xl/tight">
              Ready to Make a Difference?
            </h2>
            <p className="mx-auto max-w-[600px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed text-background/90">
              Start supporting your favorite creators today or sign up to receive tips for your work. Let&apos;s build something amazing together!
            </p>
          </div>
          <div className="mx-auto w-full max-w-sm space-x-3 flex justify-center animate-slide-up" style={{ animationDelay: '1.4s' }}>
             <Link href="/creators" legacyBehavior>
                <Button size="lg" variant="secondary" className="bg-background text-primary hover:bg-background/90 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                  Explore Creators
                </Button>
              </Link>
              <Link href="/auth" legacyBehavior>
                 <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                  Join as a Creator
                </Button>
              </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
