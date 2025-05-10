"use client";

import { useState, useEffect, type ChangeEvent } from 'react';
import type { Creator } from '@/types';
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
import { Loader2, Wand2, Gift, CheckCircle, AlertTriangle } from 'lucide-react';

interface TippingModalProps {
  creator: Creator;
}

const presetAmounts = [50, 100, 250, 500];

export function TippingModal({ creator }: TippingModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<number | string>(presetAmounts[1]);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [message, setMessage] = useState('');
  const [suggestedMessage, setSuggestedMessage] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'form' | 'confirmation'>('form');
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
       // If custom amount is cleared or invalid, revert to last selected preset or default
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
      toast({
        title: "Amount Required",
        description: "Please enter or select a tip amount first.",
        variant: "destructive",
      });
      return;
    }
    setIsSuggesting(true);
    setSuggestedMessage('');
    try {
      const input: SuggestTipMessageInput = {
        tippingAmount: finalAmount,
        creatorCategory: creator.category,
      };
      const result = await suggestTipMessage(input);
      setSuggestedMessage(result.suggestedMessage);
      setMessage(result.suggestedMessage); // Auto-fill the message input
      toast({
        title: "Message Suggested!",
        description: "AI has generated a message for you.",
      });
    } catch (error) {
      console.error("Error suggesting message:", error);
      toast({
        title: "Suggestion Failed",
        description: "Could not generate a message suggestion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSubmitTip = async () => {
    if (!finalAmount || finalAmount <= 0) {
       toast({
        title: "Invalid Amount",
        description: "Please enter a valid tip amount.",
        variant: "destructive",
      });
      return;
    }
    // Simulate payment processing
    console.log('Processing tip:', {
      toCreatorId: creator.id,
      amount: finalAmount,
      message,
    });
    
    // In a real app, call a server action or API route here
    // For now, just show confirmation
    setCurrentStep('confirmation');
  };

  const resetForm = () => {
    setAmount(presetAmounts[1]);
    setCustomAmount('');
    setMessage('');
    setSuggestedMessage('');
    setCurrentStep('form');
  };

  useEffect(() => {
    if(isOpen) {
      resetForm();
    }
  }, [isOpen]);


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6 shadow-md">
          <Gift className="mr-2 h-5 w-5" /> Tip {creator.fullName || creator.tipHandle}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] shadow-xl">
        {currentStep === 'form' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Send a Tip to {creator.fullName || creator.tipHandle}</DialogTitle>
              <DialogDescription>
                Show your support for their amazing work!
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-base">Amount (KES)</Label>
                <RadioGroup
                  value={customAmount !== '' ? 'custom' : amount.toString()}
                  onValueChange={handleAmountChange}
                  className="flex flex-wrap gap-2"
                >
                  {presetAmounts.map((pa) => (
                    <div key={pa} className="flex items-center">
                      <RadioGroupItem value={pa.toString()} id={`amount-${pa}`} />
                      <Label htmlFor={`amount-${pa}`} className="ml-2 cursor-pointer rounded-md border px-3 py-2 hover:bg-secondary transition-colors data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground">
                        KES {pa}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                <Input
                  id="custom-amount"
                  type="number"
                  placeholder="Or enter custom amount"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  className="mt-2 text-base"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="message" className="text-base">Optional Message</Label>
                  <Button variant="outline" size="sm" onClick={handleSuggestMessage} disabled={isSuggesting}>
                    {isSuggesting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="mr-2 h-4 w-4" />
                    )}
                    Suggest
                  </Button>
                </div>
                <Textarea
                  id="message"
                  placeholder={`Love your ${creator.category.toLowerCase()} work, ${creator.fullName || creator.tipHandle}!`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="text-base"
                />
                {suggestedMessage && !isSuggesting && (
                  <p className="text-xs text-muted-foreground p-2 bg-secondary/50 rounded-md border border-dashed">
                    <span className="font-semibold">Suggestion:</span> {suggestedMessage}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-base">Payment Method</Label>
                <div className="mt-2 flex items-center space-x-2 p-3 border rounded-md bg-secondary/30">
                   <Image src="https://picsum.photos/seed/mpesa/40/25" alt="M-Pesa Logo" width={40} height={25} data-ai-hint="mpesa logo" />
                  <span className="font-medium">M-Pesa (Coming Soon)</span>
                </div>
                 <p className="text-xs text-muted-foreground mt-1">Currently, M-Pesa is the primary payment method. More options will be added.</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" onClick={handleSubmitTip} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Proceed to Tip KES {finalAmount > 0 ? finalAmount.toLocaleString() : '0'}
              </Button>
            </DialogFooter>
          </>
        )}
        {currentStep === 'confirmation' && (
          <>
            <DialogHeader className="items-center text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <DialogTitle className="text-2xl">Tip Sent Successfully!</DialogTitle>
              <DialogDescription>
                Thank you for supporting {creator.fullName || creator.tipHandle}.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 text-center space-y-2">
              <p className="text-lg">You tipped <span className="font-bold text-primary">KES {finalAmount.toLocaleString()}</span>.</p>
              {message && (
                <p className="text-muted-foreground italic">Your message: "{message}"</p>
              )}
            </div>
            <DialogFooter className="sm:justify-center">
              <Button type="button" onClick={() => { setIsOpen(false); resetForm(); }} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
