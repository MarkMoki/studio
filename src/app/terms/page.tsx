import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollText, ShieldCheck, UserCheck, AlertTriangle } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="space-y-10">
      <section className="text-center py-10 animate-fade-in">
        <ScrollText className="w-20 h-20 text-primary mx-auto mb-6" />
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-lg text-muted-foreground animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Please read these terms carefully before using TipKesho.
        </p>
        <p className="text-sm text-muted-foreground mt-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>Last Updated: {new Date().toLocaleDateString()}</p>
      </section>

      <Card className="shadow-lg animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-accent" /> Acceptance of Terms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            By accessing or using the TipKesho platform (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you disagree with any part of the terms, then you may not access the Service.
          </p>
          <p>
            These Terms apply to all visitors, users, and others who access or use the Service. This is a placeholder document and does not constitute legal advice.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg animate-slide-up" style={{ animationDelay: '0.5s' }}>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-accent" /> User Accounts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
          </p>
          <p>
            You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
          </p>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg animate-slide-up" style={{ animationDelay: '0.6s' }}>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-destructive" /> Content & Conduct
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Our Service allows users to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material (&quot;Content&quot;). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.
          </p>
          <p>
            You agree not to use the Service to:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Upload or distribute any content that is unlawful, defamatory, harassing, abusive, fraudulent, obscene, or otherwise objectionable.</li>
            <li>Violate the intellectual property rights of others.</li>
            <li>Engage in any activity that interferes with or disrupts the Service.</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="shadow-lg animate-slide-up" style={{ animationDelay: '0.7s' }}>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Modifications to Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days&apos; notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
          </p>
        </CardContent>
      </Card>

      <div className="text-center py-6 animate-fade-in" style={{ animationDelay: '0.8s' }}>
        <p className="text-muted-foreground">
          For any questions about these Terms, please contact us. This is placeholder text.
        </p>
      </div>
    </div>
  );
}
