import { useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';

export interface UploadedImage {
  readonly file: File;
  readonly b64: string;
}

export const useImageUploads = () => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const processFiles = (files: FileList): void => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result !== 'string') return;
        setUploadedImages((prev) => {
          const isDuplicate = prev.some((item) => item.file.name === file.name && item.file.size === file.size);
          if (isDuplicate) return prev;
          return [...prev, { file, b64: result }];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrag = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true);
      return;
    }
    if (event.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      processFiles(event.dataTransfer.files);
    }
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>): void => {
    if (event.target.files && event.target.files.length > 0) {
      processFiles(event.target.files);
    }
  };

  const removeUploadedImage = (index: number): void => {
    setUploadedImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const clearAllImages = (): void => {
    setUploadedImages([]);
  };

  return {
    uploadedImages,
    dragActive,
    handleDrag,
    handleDrop,
    handleImageChange,
    clearAllImages,
    removeUploadedImage,
  };
};

