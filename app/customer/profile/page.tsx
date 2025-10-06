"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from '@/lib/firebase-client';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from 'lucide-react';

export default function CustomerProfile() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<any>({ name: "", profile_picture: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth/login");
        return;
      }
      setUser(currentUser);
      await fetchProfile(currentUser.uid);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const snap = await getDoc(doc(db, 'profiles', userId));
      if (snap.exists()) {
        const data = snap.data() as any;
        setProfile({
          name: data?.name || "",
          profile_picture: data?.profile_picture || data?.avatar_url || "",
        });
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setAvatarFile(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setUploadProgress("");

    let profilePictureUrl = profile.profile_picture;

    // Upload new avatar if selected
    if (avatarFile && user) {
      setUploadProgress("Uploading image...");

      const fileExt = avatarFile.name.split('.').pop();
      const storageRef = ref(storage, `avatars/${user.uid}/profile.${fileExt}`);

      try {
        await uploadBytes(storageRef, avatarFile);
        const publicUrl = await getDownloadURL(storageRef);
        profilePictureUrl = publicUrl;
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Failed to upload image. Please try again.');
        setSaving(false);
        setUploadProgress("");
        return;
      }
    }

    // Update profile in Firestore
    if (user) {
      try {
        await setDoc(
          doc(db, 'profiles', user.uid),
          {
            name: profile.name,
            profile_picture: profilePictureUrl,
            avatar_url: profilePictureUrl,
          },
          { merge: true }
        );
        alert('Profile updated successfully!');
        setProfile({ ...profile, profile_picture: profilePictureUrl });
        setAvatarFile(null);
      } catch (error) {
        console.error('Update error:', error);
        alert('Failed to update profile. Please try again.');
      }
    }

    setSaving(false);
    setUploadProgress("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-rose-50 relative">
      {/* Back button absolutely positioned at top left */}
      <button
        onClick={() => router.back()}
        className="absolute top-8 left-8 flex items-center text-gray-600 hover:text-emerald-600"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </button>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.profile_picture} />
              <AvatarFallback>{profile.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <Input
              name="name"
              value={profile.name}
              onChange={handleChange}
              placeholder="Your Name"
              className="mb-2"
            />
            
            <div className="w-full space-y-2">
              <Label htmlFor="avatar-upload">Profile Picture</Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mb-2"
              />
              {avatarFile && (
                <p className="text-sm text-gray-600">
                  Selected: {avatarFile.name}
                </p>
              )}
            </div>

            {uploadProgress && (
              <p className="text-sm text-blue-600">
                {uploadProgress}
              </p>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}