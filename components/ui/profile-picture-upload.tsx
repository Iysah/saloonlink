"use client";

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload, Camera, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfilePictureUploadProps {
  userId: string;
  currentImageUrl?: string;
  onImageUploaded: (imageUrl: string) => void;
  className?: string;
}

const supabase = createClient()


export function ProfilePictureUpload({ 
  userId, 
  currentImageUrl, 
  onImageUploaded,
  className 
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const uploadImage = useCallback(async (file: File) => {
    if (!file) return;

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

    const fileExt = file.name.split('.').pop();
    const fileName = `profile.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    setUploading(true);

    try {
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      onImageUploaded(publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [userId, onImageUploaded]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      uploadImage(file);
    }
  }, [uploadImage]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      uploadImage(file);
    }
  }, [uploadImage]);

  const removeImage = () => {
    setPreviewUrl(null);
    onImageUploaded('');
  };

  const displayImage = previewUrl || currentImageUrl;

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      <div className="relative">
        <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
          <AvatarImage src={displayImage || ''} />
          <AvatarFallback className="text-lg">
            {userId.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {displayImage && (
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            title="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer",
          dragActive ? "border-emerald-500 bg-emerald-50" : "border-gray-300 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50",
          uploading && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && document.getElementById(`profile-picture-input-${userId}`)?.click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : (
          <>
            <Camera className="h-6 w-6 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">
              {displayImage ? 'Click to change photo' : 'Click to upload photo'}
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF up to 5MB
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Photo
            </Button>
          </>
        )}
        
        <input
          id={`profile-picture-input-${userId}`}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={uploading}
        />
      </div>
    </div>
  );
} 