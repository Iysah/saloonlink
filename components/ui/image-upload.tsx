"use client";

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {  Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  serviceId: string;
  onImagesUploaded: (imageUrls: string[]) => void;
  maxImages?: number;
  className?: string;
}

const supabase = createClient()
export function ImageUpload({ 
  serviceId, 
  onImagesUploaded, 
  maxImages = 3,
  className 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const uploadImage = useCallback(async (file: File) => {
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${serviceId}/${Math.random()}.${fileExt}`;
    const filePath = `service-images/${fileName}`;

    setUploading(true);

    try {
      const { error: uploadError, data } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      // Save to service_images table
      const { error: dbError } = await supabase
        .from('service_images')
        .insert({
          service_id: serviceId,
          image_url: publicUrl,
          image_order: 0 // Will be updated based on existing images
        });

      if (dbError) throw dbError;

      onImagesUploaded([publicUrl]);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  }, [serviceId, onImagesUploaded]);

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
      uploadImage(e.dataTransfer.files[0]);
    }
  }, [uploadImage]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadImage(e.target.files[0]);
    }
  }, [uploadImage]);

  return (
    <Card className={cn("border-2 border-dashed", className)}>
      <CardContent className="p-6">
        <div
          className={cn(
            "relative flex flex-col items-center justify-center p-6 text-center transition-colors",
            dragActive ? "border-emerald-500 bg-emerald-50" : "border-gray-300 bg-gray-50",
            uploading && "opacity-50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop an image here, or click to select
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF up to 5MB
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => document.getElementById(`file-input-${serviceId}`)?.click()}
                disabled={uploading}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Choose Image
              </Button>
            </>
          )}
          
          <input
            id={`file-input-${serviceId}`}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            disabled={uploading}
          />
        </div>
      </CardContent>
    </Card>
  );
} 