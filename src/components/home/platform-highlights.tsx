
"use client";

import { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Users, Gift, Smile } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HighlightStat {
  icon: React.ReactNode;
  value: number;
  label: string;
  suffix?: string;
}

const AnimatedCounter = ({ value, duration = 2 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const controls = useAnimation();
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  useEffect(() => {
    if (inView) {
      controls.start({
        opacity: 1,
        transition: { duration: 0.5 }
      });
      const animation = controls.start({
        innerHTML: value, // This is not how framer motion animates numbers
        transition: { duration, ease: "easeOut" }
      });
      
      // Custom number animation logic
      let start = 0;
      const end = value;
      const incrementTime = (duration * 1000) / end;

      const timer = setInterval(() => {
        start += 1;
        setCount(start);
        if (start === end) {
          clearInterval(timer);
        }
      }, incrementTime);

      return () => clearInterval(timer);
    }
  }, [inView, value, duration, controls]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
};


const platformStats: HighlightStat[] = [
  {
    icon: <Users className="w-10 h-10 text-primary" />,
    value: 1250, // Placeholder
    label: "Creators Joined",
  },
  {
    icon: <Gift className="w-10 h-10 text-accent" />,
    value: 500000, // Placeholder
    label: "KES Tipped",
    suffix: "+",
  },
  {
    icon: <Smile className="w-10 h-10 text-green-500" />,
    value: 10000, // Placeholder
    label: "Happy Supporters",
    suffix: "+",
  },
];

export function PlatformHighlights() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  return (
    <section ref={ref} className="w-full py-12 md:py-16 bg-background">
      <div className="container px-4 md:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center justify-center space-y-3 text-center mb-10"
        >
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
            Thriving Community
          </h2>
          <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
            TipKesho is growing, thanks to amazing creators and supportive fans like you!
          </p>
        </motion.div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {platformStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <Card className="text-center p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300 h-full bg-card hover:-translate-y-1">
                <CardHeader className="p-0 mb-4">
                  <div className="mx-auto p-3 bg-primary/10 rounded-full inline-block">
                    {stat.icon}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <CardTitle className="text-4xl font-extrabold text-primary mb-2">
                    <AnimatedCounter value={stat.value} />{stat.suffix}
                  </CardTitle>
                  <p className="text-lg text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
