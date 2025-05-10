"use client";

import { useState, useEffect } from 'react';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

interface UserProfileFormProps {
  user: User;
}

export function UserProfileForm({ user: initialUser }: UserProfileFormProps) {
  const [user, setUser] = useState<User>(initialUser);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(initialUser.profilePicUrl || null);

  useEffect(() => {
    setUser(initialUser);
    setProfilePicPreview(initialUser.profilePicUrl || null);
  }, [initialUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setUser(prev => ({ ...prev, isCreator: checked }));
  };
  
  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result as string);
        // In a real app, you would upload the file and set user.profilePicUrl to the new URL
        setUser(prev => ({ ...prev, profilePicUrl: reader.result as string }));
      }
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Updated user profile:", user);
    toast({
      title: "Profile Updated",
      description: "Your profile information has been successfully updated.",
    });
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col items-center space-y-4">
        <Image 
          src={profilePicPreview || "https://picsum.photos/seed/default-avatar/128/128"} 
          alt="Profile Picture" 
          width={128} 
          height={128}
          data-ai-hint="profile avatar"
          className="rounded-full object-cover border-2 border-primary shadow-sm"
        />
        <div>
          <Label htmlFor="profilePic" className="sr-only">Change Profile Picture</Label>
          <Input 
            id="profilePic" 
            name="profilePic" 
            type="file" 
            accept="image/*" 
            onChange={handleProfilePicChange}
            className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" name="fullName" value={user.fullName || ''} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" value={user.username || ''} onChange={handleChange} />
        </div>
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" value={user.email || ''} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input id="phoneNumber" name="phoneNumber" type="tel" value={user.phoneNumber || ''} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" value={user.bio || ''} onChange={handleChange} rows={4} />
      </div>
      <div className="flex items-center space-x-2 pt-2">
        <Switch id="isCreator" checked={user.isCreator} onCheckedChange={handleSwitchChange} />
        <Label htmlFor="isCreator" className="text-sm">Are you a content creator?</Label>
      </div>
      <div className="pt-2 flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
