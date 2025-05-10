import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Gift, Zap, MessageSquareHeart, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
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
      description: "Reliable payment processing, initially supporting M-Pesa.",
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "Creator Community",
      description: "Join a vibrant community supporting Kenyan talent and creativity.",
    },
  ];

  return (
    <div className="flex flex-col items-center space-y-16">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50 rounded-xl shadow-lg">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                  TipKesho
                </h1>
                <p className="text-2xl font-semibold text-foreground">
                  Support Your Favorite Kenyan Creators
                </p>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Empowering creativity, one tip at a time. Join a community that values talent and expression.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/creators" legacyBehavior>
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Discover Creators <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth/signup" legacyBehavior>
                  <Button size="lg" variant="outline">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </div>
            <Image
              src="https://picsum.photos/seed/kenya-art/600/400"
              alt="Hero"
              data-ai-hint="vibrant kenyan art"
              width={600}
              height={400}
              className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square shadow-md"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Why TipKesho?</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              We provide a seamless and engaging way for fans to support creators and for creators to thrive.
            </p>
          </div>
          <div className="mx-auto grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  {feature.icon}
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="w-full py-12 md:py-24 bg-gradient-to-r from-primary to-green-600 text-primary-foreground rounded-xl shadow-lg">
        <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
              Ready to Make a Difference?
            </h2>
            <p className="mx-auto max-w-[600px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Start supporting your favorite creators today or sign up to receive tips for your work.
            </p>
          </div>
          <div className="mx-auto w-full max-w-sm space-x-2 flex justify-center">
             <Link href="/creators" legacyBehavior>
                <Button size="lg" variant="secondary" className="bg-background text-primary hover:bg-background/90">
                  Explore Creators
                </Button>
              </Link>
              <Link href="/auth/signup" legacyBehavior>
                 <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  Join as a Creator
                </Button>
              </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
