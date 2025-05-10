"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import type { Creator, SocialLink } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Image as ImageIcon, Link as LinkIcon, Trash2, PlusCircle } from 'lucide-react';
import Image from 'next/image';
import { placeholderCreators } from '@/lib/placeholder-data'; // For mock data

interface CreatorPublicProfileFormProps {
  creatorId: string;
}

const creatorCategories = ["Art", "Music", "Dance", "Comedy", "Gaming", "Education", "Tech", "Lifestyle", "Other"];
const socialPlatforms: SocialLink['platform'][] = ['twitter', 'instagram', 'facebook', 'youtube', 'tiktok', 'website', 'other'];

export function CreatorPublicProfileForm({ creatorId }: CreatorPublicProfileFormProps) {
  const [creator, setCreator] = useState<Partial<Creator>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching creator data
    const fetchedCreator = placeholderCreators.find(c => c.id === creatorId);
    if (fetchedCreator) {
      setCreator(fetchedCreator);
      setProfilePicPreview(fetchedCreator.profilePicUrl || null);
      setCoverImagePreview(fetchedCreator.coverImageUrl || null);
    }
    setIsLoading(false);
  }, [creatorId]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCreator(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value: string) => {
    setCreator(prev => ({ ...prev, category: value }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>, imageType: 'profile' | 'cover') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (imageType === 'profile') {
          setProfilePicPreview(result);
          setCreator(prev => ({ ...prev, profilePicUrl: result }));
        } else {
          setCoverImagePreview(result);
          setCreator(prev => ({ ...prev, coverImageUrl: result }));
        }
      }
      reader.readAsDataURL(file);
    }
  };

  const handleSocialLinkChange = (index: number, field: keyof SocialLink, value: string) => {
    const updatedLinks = [...(creator.socialLinks || [])];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    setCreator(prev => ({ ...prev, socialLinks: updatedLinks }));
  };

  const addSocialLink = () => {
    const newLink: SocialLink = { platform: 'other', url: '' };
    setCreator(prev => ({ ...prev, socialLinks: [...(prev.socialLinks || []), newLink] }));
  };

  const removeSocialLink = (index: number) => {
    const updatedLinks = (creator.socialLinks || []).filter((_, i) => i !== index);
    setCreator(prev => ({ ...prev, socialLinks: updatedLinks }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Updated creator profile:", creator);
    // In a real app, update placeholderCreators or make backend call
    const creatorIndex = placeholderCreators.findIndex(c => c.id === creatorId);
    if (creatorIndex !== -1) {
        placeholderCreators[creatorIndex] = { ...placeholderCreators[creatorIndex], ...creator } as Creator;
    }
    toast({
      title: "Profile Saved! ✨",
      description: "Your public creator profile has been updated.",
    });
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-lg">Loading profile...</p>
      </div>
    );
  }
  
  if (!creator || Object.keys(creator).length === 0) {
    return <p>Creator profile not found.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Profile & Cover Pictures */}
      <div className="space-y-6">
        <div>
          <Label htmlFor="coverImage" className="text-base font-semibold block mb-2">Cover Image</Label>
          {coverImagePreview && (
            <Image 
              src={coverImagePreview} 
              alt="Cover Preview" 
              width={800} 
              height={200}
              data-ai-hint="abstract background"
              className="w-full h-48 object-cover rounded-lg mb-2 border border-dashed border-muted-foreground"
            />
          )}
          <Input 
            id="coverImage" 
            type="file" 
            accept="image/*" 
            onChange={(e) => handleImageChange(e, 'cover')}
            className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          />
           <p className="text-xs text-muted-foreground mt-1">Recommended: 1200x400px. Max 2MB.</p>
        </div>
        
        <div>
          <Label htmlFor="profilePic" className="text-base font-semibold block mb-2">Profile Picture</Label>
           {profilePicPreview && (
            <Image 
              src={profilePicPreview} 
              alt="Profile Preview" 
              width={128} 
              height={128}
              data-ai-hint="profile avatar"
              className="w-32 h-32 object-cover rounded-full mb-2 border-2 border-primary"
            />
          )}
          <Input 
            id="profilePic" 
            type="file" 
            accept="image/*" 
            onChange={(e) => handleImageChange(e, 'profile')}
             className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          />
           <p className="text-xs text-muted-foreground mt-1">Recommended: 200x200px. Max 1MB.</p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="tipHandle" className="text-base font-semibold">Tip Handle</Label>
          <Input id="tipHandle" name="tipHandle" value={creator.tipHandle || ''} onChange={handleChange} placeholder="@YourUniqueHandle" className="mt-1"/>
        </div>
        <div>
          <Label htmlFor="fullName" className="text-base font-semibold">Display Name</Label>
          <Input id="fullName" name="fullName" value={creator.fullName || ''} onChange={handleChange} placeholder="Your Public Name" className="mt-1"/>
        </div>
      </div>
      
      <div>
        <Label htmlFor="category" className="text-base font-semibold">Primary Category</Label>
         <Select onValueChange={handleCategoryChange} value={creator.category || ''}>
            <SelectTrigger id="category" className="w-full mt-1">
              <SelectValue placeholder="Select your main content category" />
            </SelectTrigger>
            <SelectContent>
              {creatorCategories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
      </div>

      <div>
        <Label htmlFor="bio" className="text-base font-semibold">Public Bio</Label>
        <Textarea id="bio" name="bio" value={creator.bio || ''} onChange={handleChange} rows={5} placeholder="Tell your fans about yourself and your creations..." className="mt-1"/>
        <p className="text-xs text-muted-foreground mt-1">Max 500 characters. Make it catchy!</p>
      </div>

      {/* Social Links */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Social Links</h3>
          <Button type="button" variant="outline" size="sm" onClick={addSocialLink}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Link
          </Button>
        </div>
        {(creator.socialLinks || []).map((link, index) => (
          <div key={index} className="flex items-end gap-3 p-3 border rounded-lg bg-secondary/20">
            <div className="flex-grow">
              <Label htmlFor={`socialPlatform-${index}`} className="text-sm">Platform</Label>
              <Select 
                value={link.platform} 
                onValueChange={(value) => handleSocialLinkChange(index, 'platform', value as SocialLink['platform'])}
              >
                <SelectTrigger id={`socialPlatform-${index}`} className="w-full mt-1">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {socialPlatforms.map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-grow-[2]">
              <Label htmlFor={`socialUrl-${index}`} className="text-sm">URL</Label>
              <Input 
                id={`socialUrl-${index}`} 
                type="url" 
                value={link.url} 
                onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)} 
                placeholder="https://..."
                className="mt-1"
              />
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => removeSocialLink(index)} className="text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      
      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-3 transform hover:scale-105 transition-transform">
          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
          Save Profile
        </Button>
      </div>
    </form>
  );
}
