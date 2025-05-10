// src/ai/flows/suggest-tip-message.ts
'use server';

/**
 * @fileOverview AI-powered message suggestions for tipping.
 *
 * - suggestTipMessage - A function that suggests personalized tip messages.
 * - SuggestTipMessageInput - The input type for the suggestTipMessage function.
 * - SuggestTipMessageOutput - The return type for the suggestTipMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTipMessageInputSchema = z.object({
  tippingAmount: z
    .number()
    .describe('The amount being tipped, in Kenyan Shillings.'),
  creatorCategory: z
    .string()
    .describe('The category of the content creator (e.g., Dance, Music, Art).'),
});
export type SuggestTipMessageInput = z.infer<typeof SuggestTipMessageInputSchema>;

const SuggestTipMessageOutputSchema = z.object({
  suggestedMessage: z
    .string()
    .describe('An AI-generated personalized message suggestion for the tip.'),
});
export type SuggestTipMessageOutput = z.infer<typeof SuggestTipMessageOutputSchema>;

export async function suggestTipMessage(input: SuggestTipMessageInput): Promise<SuggestTipMessageOutput> {
  return suggestTipMessageFlow(input);
}

const suggestTipMessagePrompt = ai.definePrompt({
  name: 'suggestTipMessagePrompt',
  input: {schema: SuggestTipMessageInputSchema},
  output: {schema: SuggestTipMessageOutputSchema},
  prompt: `You are an AI assistant that generates personalized thank you messages for users who are tipping content creators on TipKesho.

  Given the tipping amount and the creator's category, suggest a thoughtful and engaging message that the user can send along with their tip.

  Tipping Amount: KES {{{tippingAmount}}}
  Creator Category: {{{creatorCategory}}}

  Suggested Message:`,
});

const suggestTipMessageFlow = ai.defineFlow(
  {
    name: 'suggestTipMessageFlow',
    inputSchema: SuggestTipMessageInputSchema,
    outputSchema: SuggestTipMessageOutputSchema,
  },
  async input => {
    const {output} = await suggestTipMessagePrompt(input);
    return output!;
  }
);
