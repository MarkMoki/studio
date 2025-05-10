import { mockTestimonials } from "@/lib/placeholder-data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";
import type { Testimonial } from "@/lib/placeholder-data"; // Import the type

export function Testimonials() {
  if (!mockTestimonials || mockTestimonials.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-12 md:py-16 animate-fade-in">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-3 text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
            Loved by Fans & Creators
          </h2>
          <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Hear what our community is saying about TipKesho.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {mockTestimonials.map((testimonial: Testimonial, index: number) => (
            <Card 
              key={testimonial.id} 
              className="shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out hover:-translate-y-2 animate-slide-up"
              style={{ animationDelay: `${0.2 + index * 0.1}s` }}
            >
              <CardHeader className="p-6 pb-2">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12 border-2 border-primary">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint={testimonial.dataAiHint} />
                    <AvatarFallback>{testimonial.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{testimonial.name}</h3>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <Quote className="w-8 h-8 text-primary/50 mb-2 transform -scale-x-100" />
                <p className="text-muted-foreground italic mb-4 leading-relaxed">
                  &quot;{testimonial.quote}&quot;
                </p>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < testimonial.stars ? "fill-accent text-accent" : "text-muted-foreground/50"
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
