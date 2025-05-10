"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare, Phone, MapPin, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, type FormEvent } from "react";

export default function ContactPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Contact form submitted:", formData);
    toast({
      title: "Message Sent! 🚀",
      description: "Thanks for reaching out! We'll get back to you soon.",
    });
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-12">
      <section className="text-center py-10 animate-fade-in">
        <MessageSquare className="w-20 h-20 text-primary mx-auto mb-6" />
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
          Get In Touch
        </h1>
        <p className="mt-4 text-xl text-muted-foreground animate-slide-up" style={{ animationDelay: '0.2s' }}>
          We&apos;d love to hear from you! Whether you have a question, feedback, or just want to say hi.
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-10 items-start">
        <Card className="shadow-xl animate-slide-in-left" style={{ animationDelay: '0.4s' }}>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Send Us a Message</CardTitle>
            <CardDescription>Fill out the form and we&apos;ll respond ASAP.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Your Name</Label>
                  <Input id="name" placeholder="e.g., Juma Khalid" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Your Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="Question about..." value={formData.subject} onChange={handleChange} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message">Your Message</Label>
                <Textarea id="message" placeholder="Hey TipKesho team..." rows={5} value={formData.message} onChange={handleChange} required />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3 transform hover:scale-105 transition-transform" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg> Sending...</>
                ) : (
                  <><Send className="mr-2 h-5 w-5" /> Send Message</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-xl animate-slide-in-right" style={{ animationDelay: '0.6s' }}>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Contact Information</CardTitle>
            <CardDescription>Other ways to reach us.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-lg">
            <div className="flex items-start gap-4">
              <Mail className="w-7 h-7 text-primary mt-1" />
              <div>
                <h4 className="font-semibold">Email Us</h4>
                <a href="mailto:hello@tipkesho.com" className="text-muted-foreground hover:text-primary transition-colors">
                  hello@tipkesho.com
                </a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="w-7 h-7 text-primary mt-1" />
              <div>
                <h4 className="font-semibold">Call Us (Mon-Fri, 9am-5pm)</h4>
                <p className="text-muted-foreground">+254 700 000 000 (Placeholder)</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <MapPin className="w-7 h-7 text-primary mt-1" />
              <div>
                <h4 className="font-semibold">Our Office</h4>
                <p className="text-muted-foreground">
                  123 Creative Lane, Nairobi, Kenya (Placeholder)
                </p>
              </div>
            </div>
            {/* Placeholder for social media links */}
            <div className="pt-4 border-t border-border">
                <h4 className="font-semibold mb-2">Follow Us</h4>
                <div className="flex space-x-3">
                    {/* Add social icons here once decided */}
                    <Button variant="outline" size="icon" aria-label="Twitter Placeholder"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg></Button>
                    <Button variant="outline" size="icon" aria-label="Instagram Placeholder"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg></Button>
                    <Button variant="outline" size="icon" aria-label="Facebook Placeholder"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></Button>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
