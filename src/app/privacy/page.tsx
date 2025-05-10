import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LockKeyhole, FileText, DatabaseZap, UserCog } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="space-y-10">
      <section className="text-center py-10 animate-fade-in">
        <LockKeyhole className="w-20 h-20 text-primary mx-auto mb-6" />
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-lg text-muted-foreground animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Your privacy is important to us. This policy explains how we handle your data.
        </p>
        <p className="text-sm text-muted-foreground mt-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>Last Updated: {new Date().toLocaleDateString()}</p>
      </section>

      <Card className="shadow-lg animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <FileText className="w-6 h-6 text-accent" /> Introduction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Welcome to TipKesho. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.
          </p>
          <p>
            This Privacy Policy governs the privacy policies and practices of our Website, located at tipkesho.com. This is placeholder text and not legally binding.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg animate-slide-up" style={{ animationDelay: '0.5s' }}>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
             <DatabaseZap className="w-6 h-6 text-accent" /> Information We Collect
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            We collect personal information that you voluntarily provide to us when registering an account, expressing an interest in obtaining information about us or our products and services, when participating in activities on the Website or otherwise contacting us.
          </p>
          <p>
            The personal information that we collect depends on the context of your interactions with us and the Website, the choices you make and the products and features you use. The personal information we collect can include the following: Name, Email Address, Payment Information (mocked), etc.
          </p>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg animate-slide-up" style={{ animationDelay: '0.6s' }}>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <UserCog className="w-6 h-6 text-accent" /> How We Use Your Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            We use personal information collected via our Website for a variety of business purposes described below. 
          </p>
           <ul className="list-disc list-inside ml-4 space-y-1">
            <li>To facilitate account creation and logon process.</li>
            <li>To send administrative information to you.</li>
            <li>To protect our Services.</li>
            <li>To enforce our terms, conditions and policies for business purposes, to comply with legal and regulatory requirements or in connection with our contract.</li>
          </ul>
        </CardContent>
      </Card>

       <Card className="shadow-lg animate-slide-up" style={{ animationDelay: '0.7s' }}>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Your Privacy Rights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            In some regions (like the European Economic Area), you have rights that allow you greater access to and control over your personal information. You may review, change, or terminate your account at any time.
          </p>
        </CardContent>
      </Card>

      <div className="text-center py-6 animate-fade-in" style={{ animationDelay: '0.8s' }}>
        <p className="text-muted-foreground">
          This is a simplified placeholder privacy policy. Consult with a legal professional for a comprehensive policy.
        </p>
      </div>
    </div>
  );
}
