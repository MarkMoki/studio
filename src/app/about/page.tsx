
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { HeartHandshake, Lightbulb, Users, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AboutPage() {
  const teamMembers = [
    { name: "Alex Kipkorir", role: "Lead Spark", avatar: "https://picsum.photos/seed/alex/100/100", dataAiHint: "male portrait" },
    { name: "Brenda Wanjiru", role: "Creative Dynamo", avatar: "https://picsum.photos/seed/brenda/100/100", dataAiHint: "female portrait" },
    { name: "Chris Omondi", role: "Tech Whiz", avatar: "https://picsum.photos/seed/chris/100/100", dataAiHint: "male developer" },
  ];

  return (
    <div className="space-y-12">
      <section className="text-center py-12 animate-fade-in">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            About TipKesho
          </span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-xl text-muted-foreground animate-slide-up" style={{ animationDelay: '0.2s' }}>
          We&apos;re passionate about fueling the creative fire of Kenyan talent. TipKesho is more than a platform; it&apos;s a movement to empower creators and connect them with fans who appreciate their unique spark.
        </p>
      </section>

      <section className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center flex items-center justify-center gap-2">
              <Lightbulb className="w-8 h-8 text-accent" /> Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg text-center text-muted-foreground space-y-4">
            <p>
              To build a thriving ecosystem where Kenyan creators can showcase their work, connect with a supportive audience, and earn directly from their craft. We believe in the power of direct support to unlock limitless creative potential.
            </p>
            <p>
              TipKesho aims to break down barriers, making it simple and joyful for fans to contribute to the artists, musicians, performers, and innovators who enrich our culture.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid md:grid-cols-3 gap-8 text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
        {[
          { icon: <HeartHandshake className="w-12 h-12 text-primary mx-auto mb-4" />, title: "Empower Creators", description: "Providing tools and a platform for creators to gain financial independence and focus on their art." },
          { icon: <Users className="w-12 h-12 text-primary mx-auto mb-4" />, title: "Build Community", description: "Fostering a vibrant community where fans and creators can interact, share, and grow together." },
          { icon: <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />, title: "Drive Innovation", description: "Continuously innovating to offer the best experience for discovering, supporting, and celebrating Kenyan talent." },
        ].map((value, index) => (
          <Card key={value.title} className="p-6 shadow-lg hover:scale-105 transition-transform duration-300 animate-slide-up" style={{ animationDelay: `${0.7 + index * 0.1}s` }}>
            {value.icon}
            <h3 className="text-2xl font-semibold mb-2">{value.title}</h3>
            <p className="text-muted-foreground">{value.description}</p>
          </Card>
        ))}
      </section>
      
      <section className="text-center py-10 animate-fade-in" style={{ animationDelay: '1s' }}>
        <h2 className="text-4xl font-bold mb-8">Meet the Sparks Behind TipKesho</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <Card key={member.name} className="p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 animate-slide-up" style={{ animationDelay: `${1.1 + index * 0.1}s` }}>
              <Image 
                src={member.avatar} 
                alt={member.name}
                data-ai-hint={member.dataAiHint} 
                width={100} 
                height={100} 
                className="rounded-full mx-auto mb-4 border-2 border-accent"
              />
              <h3 className="text-xl font-semibold">{member.name}</h3>
              <p className="text-primary">{member.role}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="text-center py-10 bg-secondary/30 rounded-xl shadow-inner animate-fade-in" style={{ animationDelay: '1.4s' }}>
        <h2 className="text-4xl font-bold mb-4">Join the Movement!</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
          Whether you&apos;re a creator ready to share your gift, or a fan eager to support, TipKesho is your stage.
        </p>
        <div className="flex justify-center gap-4">
          <Link 
            href="/creators" 
            className={cn(
                buttonVariants({ size: "lg" }),
                "bg-primary hover:bg-primary/90 text-primary-foreground transform hover:scale-105 transition-transform"
            )}
          >
            Discover Creators
          </Link>
          <Link 
            href="/auth" 
            className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "transform hover:scale-105 transition-transform"
            )}
          >
            Sign Up
          </Link>
        </div>
      </section>
    </div>
  );
}
