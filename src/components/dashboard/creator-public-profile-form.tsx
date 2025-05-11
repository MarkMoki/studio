"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import type { Creator, SocialLink, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Trash2, PlusCircle, Camera } from 'lucide-react';
import Image from 'next/image';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Removed deleteObject for simplicity
import { useAuth } from '@/hooks/use-auth'; 

const creatorCategories = ["Art", "Music", "Dance", "Comedy", "Gaming", "Education", "Tech", "Lifestyle", "Other"];
const socialPlatforms: SocialLink['platform'][] = ['twitter', 'instagram', 'facebook', 'youtube', 'tiktok', 'website', 'other'];

interface CreatorPublicProfileFormProps {
  creatorId: string; 
}

export function CreatorPublicProfileForm({ creatorId }: CreatorPublicProfileFormProps) {
  const { user: authUser, loading: authLoading, updateUserFirestoreProfile } = useAuth(); 
  const [creator, setCreator] = useState<Partial<Creator>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchCreatorData = async () => {
      if (!creatorId) {
        setIsLoading(false);
        toast({title: "Error", description: "Creator ID is missing.", variant : "destructive"});
        return;
      }
      setIsLoading(true);
      try {
        const creatorDocRef = doc(db, 'creators', creatorId);
        const creatorDocSnap = await getDoc(creatorDocRef);
        if (creatorDocSnap.exists()) {
          const data = creatorDocSnap.data() as Creator;
          setCreator(data);
          setProfilePicPreview(data.profilePicUrl || null);
          setCoverImagePreview(data.coverImageUrl || null);
        } else {
          toast({title: "Not Found", description: "Creator profile not found.", variant : "destructive"});
        }
      } catch (error) {
        console.error("Error fetching creator data:", error);
        toast({title: "Fetch Error", description: "Could not load creator profile.", variant : "destructive"});
      } finally {
        setIsLoading(false);
      }
    };
    fetchCreatorData();
  }, [creatorId, toast]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, imageType: 'profile' | 'cover') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (imageType === 'profile') {
          setProfilePicFile(file);
          setProfilePicPreview(result);
        } else {
          setCoverImageFile(file);
          setCoverImagePreview(result);
        }
      }
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCreator(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value: string) => {
    setCreator(prev => ({ ...prev, category: value }));
  };

  const handleSocialLinkChange = (index: number, field: keyof SocialLink, value: string) => {
    const updatedLinks = [...(creator.socialLinks || [])];
    // Ensure platform type safety
    if (field === 'platform' && !socialPlatforms.includes(value as SocialLink['platform'])) {
        console.warn("Invalid social platform selected:", value);
        return; // Or set to 'other' as a default
    }
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
    if (!authUser || authUser.id !== creatorId) {
      toast({ title: "Unauthorized", description: "You can only edit your own profile.", variant : "destructive" });
      return;
    }
    if (!creator.category) {
      toast({ title: "Category Required", description: "Please select your main content category.", variant : "destructive" });
      return;
    }


    setIsSubmitting(true);

    let newProfilePicUrl = creator.profilePicUrl || null;
    if (profilePicFile) {
      const filePath = `creators/${creatorId}/profile.${profilePicFile.name.split('.').pop()}`;
      const storageRefVal = ref(storage, filePath); // Renamed to avoid conflict with storage import
      try {
        await uploadBytes(storageRefVal, profilePicFile);
        newProfilePicUrl = await getDownloadURL(storageRefVal);
      } catch (error) {
        toast({ title: "Profile Pic Upload Failed", description: (error as Error).message, variant : "destructive" });
        setIsSubmitting(false); return;
      }
    }

    let newCoverImageUrl = creator.coverImageUrl || null;
    if (coverImageFile) {
      const filePath = `creators/${creatorId}/cover.${coverImageFile.name.split('.').pop()}`;
      const storageRefVal = ref(storage, filePath); // Renamed
      try {
        await uploadBytes(storageRefVal, coverImageFile);
        newCoverImageUrl = await getDownloadURL(storageRefVal);
      } catch (error) {
        toast({ title: "Cover Image Upload Failed", description: (error as Error).message, variant : "destructive" });
        setIsSubmitting(false); return;
      }
    }
    
    const validSocialLinks = (creator.socialLinks || [])
        .map(link => ({
            platform: link.platform,
            url: link.url || null // Ensure url is null if empty
        }))
        .filter(link => link.platform && link.url && link.url.trim() !== ''); // Filter out links with no url

    const dataForCreatorDoc: Partial<Creator> = {
      fullName: creator.fullName || null,
      bio: creator.bio || null,
      category: creator.category, // Already validated
      socialLinks: validSocialLinks,
      profilePicUrl: newProfilePicUrl,
      coverImageUrl: newCoverImageUrl,
      updatedAt: serverTimestamp(),
    };
    // tipHandle is not editable here, so we don't include it.
    // Remove any top-level undefined properties before sending to Firestore
    const finalCreatorUpdates = Object.fromEntries(Object.entries(dataForCreatorDoc).filter(([_,v])=> v !== undefined)) as Partial<Creator>;

    try {
      const creatorDocRef = doc(db, 'creators', creatorId);
      await updateDoc(creatorDocRef, finalCreatorUpdates);
      
      // Prepare data for user document update (denormalized fields)
      const dataForUserDoc: Partial<User> = { updatedAt: serverTimestamp() };
      if (finalCreatorUpdates.fullName !== undefined) dataForUserDoc.fullName = finalCreatorUpdates.fullName;
      if (finalCreatorUpdates.profilePicUrl !== undefined) dataForUserDoc.profilePicUrl = finalCreatorUpdates.profilePicUrl;
      if (finalCreatorUpdates.bio !== undefined) dataForUserDoc.bio = finalCreatorUpdates.bio;
      if (finalCreatorUpdates.category !== undefined) dataForUserDoc.category = finalCreatorUpdates.category;
      // tipHandle is not changed here, so no need to update it in user doc from here

      if (Object.keys(dataForUserDoc).length > 1) { // If more than just updatedAt
        await updateUserFirestoreProfile(creatorId, dataForUserDoc); // Uses the cleaned update from useAuth
      }

      toast({ title: "Profile Saved! ✨", description: "Your public creator profile has been updated." });
    } catch (error) {
      console.error("Error updating creator profile:", error);
      toast({ title: "Update Failed", description: (error as Error).message, variant : "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-lg">Loading profile editor...</p>
      </div>
    );
  }
  
  if (!creator || Object.keys(creator).length === 0) {
    return <p className="text-center text-muted-foreground p-8">Creator profile data could not be loaded. You might need to complete the "Become a Creator" step first.</p>;
  }
  
  if (authUser?.id !== creatorId) {
     return <p className="text-center text-destructive p-8">You are not authorized to edit this profile.</p>;
  }


  return (
    <form onSubmit = {handleSubmit} className="space-y-8">
      {/* Profile & Cover Pictures */}
      <div className="space-y-6">
        <div>
          <Label htmlFor="coverImage" className="text-base font-semibold block mb-2 flex items-center"><Camera className="w-5 h-5 mr-2 text-muted-foreground"/>Cover Image</Label>
          <div className="w-full h-48 relative bg-muted rounded-lg border border-dashed border-muted-foreground flex items-center justify-center overflow-hidden group">
            {coverImagePreview ? (
              <Image src={coverImagePreview} alt="Cover Preview" layout="fill" objectFit="cover" data-ai-hint="abstract background"/>
            ) : <span className="text-muted-foreground text-sm">No cover image</span>}
             <Input 
              id="coverImage" 
              type="file" 
              accept="image/*" 
              onChange={(e) => handleFileChange(e, 'cover')}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
             <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white font-semibold">Change Cover</span>
            </div>
          </div>
           <p className="text-xs text-muted-foreground mt-1">Recommended: 1200x400px. Max 5MB.</p>
        </div>
        
        <div>
          <Label htmlFor="profilePic" className="text-base font-semibold block mb-2 flex items-center"><Camera className="w-5 h-5 mr-2 text-muted-foreground"/>Profile Picture</Label>
          <div className="w-32 h-32 relative rounded-full bg-muted border-2 border-primary flex items-center justify-center overflow-hidden group">
            {profilePicPreview ? (
              <Image src={profilePicPreview} alt="Profile Preview" layout="fill" objectFit="cover" data-ai-hint="profile avatar" className="rounded-full"/>
            ) : <span className="text-muted-foreground text-xs p-2 text-center">No profile pic</span> }
            <Input 
              id="profilePic" 
              type="file" 
              accept="image/*" 
              onChange={(e) => handleFileChange(e, 'profile')}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <span className="text-white font-semibold text-sm">Change</span>
            </div>
          </div>
           <p className="text-xs text-muted-foreground mt-1">Recommended: 200x200px. Max 2MB.</p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="tipHandle" className="text-base font-semibold">Tip Handle (cannot be changed)</Label>
          <Input id="tipHandle" name="tipHandle" value={creator.tipHandle || ''} className="mt-1 bg-muted/50" readOnly disabled/>
        </div>
        <div>
          <Label htmlFor="fullName" className="text-base font-semibold">Display Name</Label>
          <Input id="fullName" name="fullName" value={creator.fullName || ''} onChange={handleChange} placeholder="Your Public Name" className="mt-1"/>
        </div>
      </div>
      
      <div>
        <Label htmlFor="category" className="text-base font-semibold">Primary Category</Label>
         <Select onValueChange={handleCategoryChange} value={creator.category || ''} required>
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
        <Textarea id="bio" name="bio" value={creator.bio || ''} onChange={handleChange} rows={5} placeholder="Tell your fans about yourself and your creations..." className="mt-1" maxLength={500}/>
        <p className="text-xs text-muted-foreground mt-1">Max 500 characters. Make it catchy!</p>
      </div>

      {/* Social Links */}
      <div className="space-y-4 pt-4 border-t">
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
                value={link.url || ''} 
                onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)} 
                placeholder="https://..."
                className="mt-1"
              />
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={ () => removeSocialLink(index)} className="text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {(!creator.socialLinks || creator.socialLinks.length === 0) && <p className="text-sm text-muted-foreground">No social links added yet.</p>}
      </div>
      
      <div className="pt-6 flex justify-end border-t">
        <Button type="submit" disabled={isSubmitting || isLoading} className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-3 transform hover:scale-105 transition-transform">
          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
          Save Profile
        </Button>
      </div>
    </form>
  );
}
