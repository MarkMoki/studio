
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import type { User as AuthUserType } from '@/types'; // Renamed to avoid conflict with FirebaseUser
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch'; // Switch might not be needed here unless user can toggle creator status directly
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Camera } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import Link from 'next/link';

interface UserProfileFormProps {
  user: AuthUserType; // This is the AuthUser from our types
}

export function UserProfileForm({ user: initialUser }: UserProfileFormProps) {
  const { firebaseUser, loading: authLoading, updateUserFirestoreProfile } = useAuth();
  const [formData, setFormData] = useState<Partial<AuthUserType>>({
    fullName: initialUser.fullName || '',
    username: initialUser.username || '',
    email: initialUser.email || '', // Email usually not editable by user directly after creation
    phoneNumber: initialUser.phoneNumber || '', // Phone usually not editable directly
    bio: initialUser.bio || '',
  });
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(initialUser.profilePicUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Update form data if initialUser changes (e.g., after initial load from useAuth)
    setFormData({
      fullName: initialUser.fullName || '',
      username: initialUser.username || '',
      email: initialUser.email || '',
      phoneNumber: initialUser.phoneNumber || '',
      bio: initialUser.bio || '',
    });
    setProfilePicPreview(initialUser.profilePicUrl || null);
  }, [initialUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) { // Max 2MB
          toast({ title: "File too large", description: "Profile picture must be less than 2MB.", variant: "destructive" });
          return;
      }
      setProfilePicFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result as string);
      }
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      toast({ title: "Not Authenticated", description: "Please sign in again.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    let updatedProfilePicUrl = initialUser.profilePicUrl;

    if (profilePicFile) {
      const filePath = `users/${firebaseUser.uid}/profile.${profilePicFile.name.split('.').pop()}`;
      const storageRef = ref(storage, filePath);
      try {
        await uploadBytes(storageRef, profilePicFile);
        updatedProfilePicUrl = await getDownloadURL(storageRef);
      } catch (error) {
        toast({ title: "Image Upload Failed", description: (error as Error).message, variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
    }

    const dataToUpdate: Partial<AuthUserType> = {
      ...formData,
      profilePicUrl: updatedProfilePicUrl,
      updatedAt: serverTimestamp(),
    };
    // Remove fields that shouldn't be directly updated here or are immutable
    delete dataToUpdate.email; 
    delete dataToUpdate.phoneNumber;
    delete dataToUpdate.isCreator; // isCreator status handled in "Become Creator" or creator profile edit.
    delete dataToUpdate.createdAt;
    delete dataToUpdate.id;


    try {
      await updateUserFirestoreProfile(firebaseUser.uid, dataToUpdate);
      // If user is also a creator, update denormalized fields in creators collection
      if (initialUser.isCreator) {
          const creatorDocRef = doc(db, "creators", firebaseUser.uid);
          const creatorUpdateData: Partial<AuthUserType> = {};
          if (dataToUpdate.fullName) creatorUpdateData.fullName = dataToUpdate.fullName;
          if (dataToUpdate.profilePicUrl) creatorUpdateData.profilePicUrl = dataToUpdate.profilePicUrl;
          if (dataToUpdate.bio) creatorUpdateData.bio = dataToUpdate.bio;
          
          if(Object.keys(creatorUpdateData).length > 0) {
            await updateDoc(creatorDocRef, {...creatorUpdateData, updatedAt: serverTimestamp()});
          }
      }

      toast({ title: "Profile Updated", description: "Your profile information has been saved." });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Update Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
      return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <form onSubmit = {handleSubmit} className="space-y-6">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative group">
            <Image 
              src={profilePicPreview || "https://picsum.photos/seed/default-avatar/128/128"} 
              alt="Profile Picture" 
              width={128} 
              height={128}
              data-ai-hint="profile avatar"
              className="rounded-full object-cover border-2 border-primary shadow-sm"
            />
            <Label 
                htmlFor="profilePic" 
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
                <Camera className="h-8 w-8 text-white" />
            </Label>
        </div>
        <Input 
          id="profilePic" 
          name="profilePic" 
          type="file" 
          accept="image/png, image/jpeg, image/jpg" 
          onChange={handleProfilePicChange}
          className="hidden" // Visually hidden, triggered by label
        />
         <p className="text-xs text-muted-foreground">Click image to change. Max 2MB (PNG, JPG).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" name="fullName" value={formData.fullName || ''} onChange={handleChange} placeholder="Your full name" />
        </div>
        <div>
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" value={formData.username || ''} onChange={handleChange} placeholder="@your_username" />
        </div>
      </div>
      <div>
        <Label htmlFor="email">Email (cannot be changed)</Label>
        <Input id="email" name="email" type="email" value={formData.email || ''} readOnly disabled className="bg-muted/50 cursor-not-allowed" />
      </div>
      <div>
        <Label htmlFor="phoneNumber">Phone Number (cannot be changed here)</Label>
        <Input id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber || ''} readOnly disabled className="bg-muted/50 cursor-not-allowed" />
      </div>
      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" value={formData.bio || ''} onChange={handleChange} rows={4} placeholder="A little about yourself..." maxLength={300} />
        <p className="text-xs text-muted-foreground mt-1">Max 300 characters.</p>
      </div>
      
      {initialUser.isCreator && (
         <div className="pt-2 text-sm text-muted-foreground">
            You are a registered creator. To edit your public creator details like category or social links, go to{' '}
            <Link href="/creator/settings" className="text-primary hover:underline">
              Public Creator Profile Settings
            </Link>.
        </div>
      )}


      <div className="pt-4 flex justify-end border-t">
        <Button type="submit" disabled={isSubmitting || authLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 text-base">
          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}

