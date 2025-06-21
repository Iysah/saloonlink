"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";

export default function CustomerProfile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({ name: "", profile_picture: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }
    setUser(user);
    await fetchProfile(user.id);
    setLoading(false);
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("name, profile_picture")
      .eq("id", userId)
      .single();
    if (data) setProfile(data);
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
    if (avatarFile) {
      setUploadProgress("Uploading image...");
      
      const fileExt = avatarFile.name.split('.').pop();
      const filePath = `${user.id}/profile.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, {
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Failed to upload image. Please try again.');
        setSaving(false);
        setUploadProgress("");
        return;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      profilePictureUrl = data.publicUrl;
      setUploadProgress("Image uploaded successfully!");
    }

    // Update profile in database
    const { error } = await supabase
      .from("profiles")
      .update({ 
        name: profile.name, 
        profile_picture: profilePictureUrl 
      })
      .eq("id", user.id);

    if (error) {
      console.error('Update error:', error);
      alert('Failed to update profile. Please try again.');
    } else {
      alert('Profile updated successfully!');
      // Update local state with new profile picture URL
      setProfile({ ...profile, profile_picture: profilePictureUrl });
      setAvatarFile(null);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-rose-50">
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