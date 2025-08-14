"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { ImageUpload } from './image-upload';

interface ServiceImage {
  id: string;
  image_url: string;
  image_order: number;
}

interface ServiceImageGalleryProps {
  serviceId: string;
  maxImages?: number;
}

const supabase = createClient()

export function ServiceImageGallery({ serviceId, maxImages = 3 }: ServiceImageGalleryProps) {
  const [images, setImages] = useState<ServiceImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, [serviceId]);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('service_images')
        .select('*')
        .eq('service_id', serviceId)
        .order('image_order');

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUploaded = async (imageUrls: string[]) => {
    // Refresh the images list
    await fetchImages();
  };

  const deleteImage = async (imageId: string, imageUrl: string) => {
    setDeleting(imageId);
    
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `service-images/${serviceId}/${fileName}`;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('images')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('service_images')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      // Update local state
      setImages(images.filter(img => img.id !== imageId));
    } catch (error) {
      console.error('Error deleting image:', error);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <Card key={image.id} className="relative group">
              <CardContent className="p-2">
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  <img
                    src={image.image_url}
                    alt={`Service image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={() => deleteImage(image.id, image.image_url)}
                      disabled={deleting === image.id}
                    >
                      {deleting === image.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    Image {index + 1}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {images.length < maxImages && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Add Service Images</h4>
            <Badge variant="secondary" className="text-xs">
              {images.length}/{maxImages} images
            </Badge>
          </div>
          <ImageUpload
            serviceId={serviceId}
            onImagesUploaded={handleImageUploaded}
            maxImages={maxImages}
          />
        </div>
      )}

      {/* Info when max images reached */}
      {images.length >= maxImages && (
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            Maximum {maxImages} images reached. Remove an image to add more.
          </p>
        </div>
      )}
    </div>
  );
} 