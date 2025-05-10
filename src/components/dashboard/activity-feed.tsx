"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Gift, UserPlus, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'new_tip' | 'new_follower' | 'goal_achieved' | 'feature_update';
  timestamp: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
}

// Mock data - replace with actual data fetching
const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'new_tip',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    title: 'You received a new tip of KES 250!',
    description: 'From @SuperFan99 for your latest artwork.',
    icon: <Gift className="w-5 h-5 text-green-500" />
  },
  {
    id: '2',
    type: 'new_follower',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    title: '@CreativeKenya started following you.',
    icon: <UserPlus className="w-5 h-5 text-blue-500" />
  },
  {
    id: '3',
    type: 'goal_achieved',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    title: 'Congrats! You reached your monthly tipping goal!',
    description: 'KES 50,000 target met. Amazing work!',
    icon: <TrendingUp className="w-5 h-5 text-accent" />
  },
  {
    id: '4',
    type: 'feature_update',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    title: 'New Feature: Cover Images for Profiles!',
    description: 'You can now add a cover image to make your creator profile stand out.',
    icon: <Bell className="w-5 h-5 text-primary" />
  },
];


export function ActivityFeed({ userId }: { userId: string }) {
  // In a real app, filter activities based on userId and whether they are a creator
  const activities = mockActivities;

  return (
    <Card className="shadow-lg animate-fade-in">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" /> Activity Feed
        </CardTitle>
        <CardDescription>Stay updated with recent events and notifications.</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No recent activity.</p>
        ) : (
          <div className="space-y-6">
            {activities.map((activity, index) => (
              <div 
                key={activity.id} 
                className="flex items-start gap-4 p-4 border-b last:border-b-0 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-2 bg-secondary/50 rounded-full mt-1">
                  {activity.icon}
                </div>
                <div className="flex-grow">
                  <p className="font-semibold">{activity.title}</p>
                  {activity.description && (
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
