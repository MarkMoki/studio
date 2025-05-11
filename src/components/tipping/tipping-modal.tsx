
"use client";

import { useState, useEffect, type ChangeEvent } from 'react';
import type { Creator, Tip, AuthUser as TipKeshoAuthUser } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { suggestTipMessage, type SuggestTipMessageInput } from '@/ai/flows/suggest-tip-message';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Loader2, Wand2, Gift, CheckCircle, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { app as firebaseApp } from '@/lib/firebase'; // Import initialized Firebase app

interface TippingModalProps {
  creator: Creator;
}

const presetAmounts = [50, 100, 250, 500];
const functions = getFunctions(firebaseApp);
const sendTipViaMpesaFunction = httpsCallable(functions, 'sendTipViaMpesa');


export function TippingModal({ creator }: TippingModalProps) {
  const { user: authUser, loading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<number | string>(presetAmounts[1]);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [message, setMessage] = useState('');
  const [suggestedMessage, setSuggestedMessage] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isProcessingTip, setIsProcessingTip] = useState(false);
  const [currentStep, setCurrentStep] = useState<'form' | 'confirmation' | 'error' | 'processing_stk'>('form');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAmountChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setAmount(numValue);
      setCustomAmount('');
    }
  };

  const handleCustomAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomAmount(value);
    if (value === '' || isNaN(Number(value))) {
      if (typeof amount === 'number' && presetAmounts.includes(amount)) {
        // keep preset
      } else {
        setAmount(presetAmounts[1]); // default
      }
    } else {
      setAmount(Number(value));
    }
  };
  
  const finalAmount = typeof amount === 'string' ? (customAmount !== '' ? parseFloat(customAmount) : 0) : amount;

  const handleSuggestMessage = async () => {
    if (!finalAmount || finalAmount <= 0) {
      toast({ title: "Amount Required", description: "Please enter or select a tip amount first.", variant: "destructive" });
      return;
    }
    setIsSuggesting(true);
    setSuggestedMessage('');
    try {
      const input: SuggestTipMessageInput = { tippingAmount: finalAmount, creatorCategory: creator.category };
      const result = await suggestTipMessage(input);
      setSuggestedMessage(result.suggestedMessage);
      setMessage(result.suggestedMessage); 
      toast({ title: "Message Suggested!", description: "AI has generated a message for you." });
    } catch (error) {
      console.error("Error suggesting message:", error);
      toast({ title: "Suggestion Failed", description: "Could not generate message. Please try again.", variant: "destructive" });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSubmitTip = async () => {
    if (!authUser) {
      toast({ title: "Not Authenticated", description: "Please sign in to send a tip.", variant: "destructive" });
      setIsOpen(false); 
      return;
    }
    if (!finalAmount || finalAmount <= 0) {
       toast({ title: "Invalid Amount", description: "Please enter a valid tip amount.", variant: "destructive" });
      return;
    }
    if (!authUser.phoneNumber) {
        toast({ title: "Phone Number Required", description: "Your M-Pesa phone number is needed for STK push. Please update your profile.", variant: "destructive" });
        // Optionally redirect to profile settings: router.push('/dashboard/settings');
        return;
    }


    setIsProcessingTip(true);
    setErrorDetails(null);
    setCurrentStep("processing_stk");


    const tipData = {
      toCreatorId: creator.id,
      tipAmount: finalAmount,
      message: message.trim() === '' ? null : message.trim(),
      tipperPhoneNumber: authUser.phoneNumber, // User's M-Pesa phone for STK Push
      tipperEmail: authUser.email || null,
      tipperName: authUser.fullName || authUser.username || "Anonymous Tipper",
    };

    try {
      const result: any = await sendTipViaMpesaFunction(tipData);
      if (result.data.success) {
        // The function in this case now returns a success message, but the STK push is async.
        // The user needs to complete payment on their phone.
        // The UI should reflect "STK Push Sent"
        toast({ title: "STK Push Sent!", description: result.data.message || "Check your phone to complete the M-Pesa payment."});
        // setCurrentStep('confirmation'); // Don't go to final confirmation yet, just info about STK push
        // Keep modal open, or close and show a global toast/notification
        // For now, let's close the modal and rely on a toast.
        // A more advanced flow would involve listening for webhook updates or polling.
        resetFormAndClose();
      } else {
        setErrorDetails(result.data.message || "Payment initiation failed.");
        setCurrentStep('error');
      }
    } catch (error: any) {
      console.error('Error calling sendTipViaMpesa function:', error);
      setErrorDetails(error.message || "An unknown error occurred while initiating the tip.");
      setCurrentStep('error');
    } finally {
      setIsProcessingTip(false);
      // If not an error that closes modal, might want to revert step from 'processing_stk'
      if (currentStep === 'processing_stk' && !isOpen) { // if modal was closed by success
        // do nothing
      } else if (currentStep === 'processing_stk') {
        setCurrentStep('form'); // revert to form if still open and not success/error handled
      }
    }
  };

  const resetFormAndClose = () => {
    setAmount(presetAmounts[1]);
    setCustomAmount('');
    setMessage('');
    setSuggestedMessage('');
    setCurrentStep('form');
    setErrorDetails(null);
    setIsOpen(false);
  };

  useEffect(() => {
    if(isOpen && currentStep !== 'confirmation' && currentStep !== 'error' && currentStep !== 'processing_stk') {
      setAmount(presetAmounts[1]);
      setCustomAmount('');
      setMessage('');
      setSuggestedMessage('');
    }
  }, [isOpen, currentStep]);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) resetFormAndClose(); 
      else setIsOpen(true); 
    }}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6 shadow-md animate-pulse hover:animate-none">
          <Gift className="mr-2 h-5 w-5" /> Tip {creator.fullName || creator.tipHandle}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] shadow-xl">
        {currentStep === 'form' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Send a Tip to {creator.fullName || creator.tipHandle}</DialogTitle>
              <DialogDescription>Show your support for their amazing work! Payment via M-Pesa STK Push.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-base">Amount (KES)</Label>
                <RadioGroup value={customAmount !== '' ? 'custom' : amount.toString()} onValueChange={handleAmountChange} className="flex flex-wrap gap-2">
                  {presetAmounts.map((pa) => (
                    <div key={pa} className="flex items-center">
                      <RadioGroupItem value={pa.toString()} id={`amount-${pa}`} />
                      <Label htmlFor={`amount-${pa}`} className="ml-2 cursor-pointer rounded-md border px-3 py-2 hover:bg-secondary transition-colors data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground">KES {pa}</Label>
                    </div>
                  ))}
                </RadioGroup>
                <Input id="custom-amount" type="number" placeholder="Or enter custom amount" value={customAmount} onChange={handleCustomAmountChange} className="mt-2 text-base" min="1"/>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="message" className="text-base">Optional Message</Label>
                  <Button variant="outline" size="sm" onClick={handleSuggestMessage} disabled={isSuggesting || authLoading}>
                    {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}Suggest
                  </Button>
                </div>
                <Textarea id="message" placeholder={`Love your ${creator.category.toLowerCase()} work, ${creator.fullName || creator.tipHandle}!`} value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="text-base"/>
                {suggestedMessage && !isSuggesting && (
                  <p className="text-xs text-muted-foreground p-2 bg-secondary/50 rounded-md border border-dashed">
                    <span className="font-semibold">Suggestion:</span> {suggestedMessage}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-base">Payment via M-Pesa</Label>
                <div className="mt-2 flex items-center space-x-2 p-3 border rounded-md bg-secondary/30">
                   <Image src="https://picsum.photos/seed/mpesa-logo/40/25" alt="M-Pesa Logo" width={40} height={25} data-ai-hint="mpesa logo" />
                  <span className="font-medium">Your number: {authUser?.phoneNumber || "Not Set"}</span>
                </div>
                 <p className="text-xs text-muted-foreground mt-1">An STK Push will be sent to your M-Pesa number to complete the payment.</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetFormAndClose}>Cancel</Button>
              <Button 
                type="submit" 
                onClick={handleSubmitTip} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground" 
                disabled={isProcessingTip || authLoading || finalAmount <=0 || !authUser?.phoneNumber}
              >
                {isProcessingTip ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send KES {finalAmount > 0 ? finalAmount.toLocaleString() : '0'}
              </Button>
            </DialogFooter>
          </>
        )}
        {currentStep === 'processing_stk' && (
           <>
            <DialogHeader className="items-center text-center">
              <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
              <DialogTitle className="text-2xl">Processing Payment...</DialogTitle>
              <DialogDescription>
                An STK push is being sent to {authUser?.phoneNumber}. Please check your phone to authorize the M-Pesa payment of KES {finalAmount.toLocaleString()}.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center">
              <Button type="button" variant="outline" onClick={resetFormAndClose} disabled={isProcessingTip}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}
        {currentStep === 'confirmation' && ( // This step might be less used if we close on STK push sent
          <>
            <DialogHeader className="items-center text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <DialogTitle className="text-2xl">Tip Processed!</DialogTitle>
              <DialogDescription>
                Your tip of KES {finalAmount.toLocaleString()} to {creator.fullName || creator.tipHandle} has been processed. Thank you!
              </DialogDescription>
            </DialogHeader>
            {message && (<p className="text-center text-muted-foreground italic">Your message: "{message}"</p>)}
            <DialogFooter className="sm:justify-center">
              <Button type="button" onClick={resetFormAndClose} className="bg-primary hover:bg-primary/90 text-primary-foreground">Done</Button>
            </DialogFooter>
          </>
        )}
         {currentStep === 'error' && (
          <>
            <DialogHeader className="items-center text-center">
              <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
              <DialogTitle className="text-2xl">Tip Failed</DialogTitle>
              <DialogDescription>We couldn&apos;t process your tip at this time.</DialogDescription>
            </DialogHeader>
            <div className="py-6 text-center space-y-2">
              <p className="text-muted-foreground">Details: {errorDetails || "An unexpected error occurred."}</p>
            </div>
            <DialogFooter className="sm:justify-center">
              <Button type="button" variant="outline" onClick={() => setCurrentStep('form')}>Try Again</Button>
              <Button type="button" onClick={resetFormAndClose}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
