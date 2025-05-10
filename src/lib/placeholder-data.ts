
export interface Testimonial {
  id: string;
  name: string;
  role: string; // e.g., "Fan", "Creator"
  avatar: string; // URL to avatar image
  dataAiHint: string; // For Unsplash search
  quote: string;
  stars: number; // 0-5
}

export const mockTestimonials: Testimonial[] = [
  {
    id: "1",
    name: "Aisha Njeri",
    role: "Super Fan",
    avatar: "https://picsum.photos/seed/aisha/100/100",
    dataAiHint: "woman smiling",
    quote:
      "TipKesho makes it so easy to support my favorite artists! The AI message suggestions are a fun touch.",
    stars: 5,
  },
  {
    id: "2",
    name: "Kevin Otieno",
    role: "Music Producer (Creator)",
    avatar: "https://picsum.photos/seed/kevin/100/100",
    dataAiHint: "man music studio",
    quote:
      "Finally, a platform that understands the Kenyan creative scene. Receiving tips directly helps me invest back into my music.",
    stars: 5,
  },
  {
    id: "3",
    name: "Wambui Kimani",
    role: "Digital Artist (Creator)",
    avatar: "https://picsum.photos/seed/wambui/100/100",
    dataAiHint: "woman artist",
    quote:
      "I love how TipKesho connects me with my audience. The interface is clean and getting support is straightforward.",
    stars: 4,
  },
   {
    id: "4",
    name: "John Doe",
    role: "Gamer (Creator)",
    avatar: "https://picsum.photos/seed/john/100/100",
    dataAiHint: "man gaming",
    quote:
      "TipKesho has been a game-changer for my streaming. My fans love the easy tipping options!",
    stars: 5,
  },
  {
    id: "5",
    name: "Fatuma Said",
    role: "Dance Enthusiast",
    avatar: "https://picsum.photos/seed/fatuma/100/100",
    dataAiHint: "woman dancing",
    quote:
      "Discovering new dancers on TipKesho is amazing. I'm happy to support their passion directly.",
    stars: 4,
  },
];
