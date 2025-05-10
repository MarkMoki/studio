import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Gift, HeartHandshake, Zap } from "lucide-react";

const steps = [
  {
    icon: <Search className="w-10 h-10 text-primary mb-4" />,
    title: "Discover Creators",
    description: "Explore a diverse range of talented Kenyan creators across various categories.",
    delay: "0.2s",
  },
  {
    icon: <Gift className="w-10 h-10 text-primary mb-4" />,
    title: "Send a Tip",
    description: "Found someone you love? Send a tip of any amount with an optional personalized message.",
    delay: "0.3s",
  },
  {
    icon: <Zap className="w-10 h-10 text-primary mb-4" />,
    title: "Secure Payment",
    description: "Your tips are processed securely, starting with M-Pesa. It's quick and easy!",
    delay: "0.4s",
  },
  {
    icon: <HeartHandshake className="w-10 h-10 text-primary mb-4" />,
    title: "Empower Talent",
    description: "Your support directly helps creators continue their passion and produce amazing content.",
    delay: "0.5s",
  },
];

export function HowItWorks() {
  return (
    <section className="w-full py-12 md:py-16 bg-secondary/30 rounded-xl shadow-inner animate-fade-in">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-3 text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">How TipKesho Works</h2>
          <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Supporting your favorite creators is simple, secure, and impactful. Here&apos;s the lowdown:
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <Card 
              key={step.title} 
              className="text-center p-6 shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out hover:scale-105 animate-slide-up"
              style={{ animationDelay: step.delay }}
            >
              <CardHeader className="p-0 mb-2">
                {step.icon}
                <CardTitle className="text-xl font-semibold">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
