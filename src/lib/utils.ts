import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isTileTransparent(imageSrc: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imageSrc;
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return resolve(false); // Cannot check, assume not transparent
      }

      ctx.drawImage(img, 0, 0);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data; // RGBA values

        for (let i = 3; i < data.length; i += 4) {
          if (data[i] !== 0) {
            // Found a non-transparent pixel
            return resolve(false);
          }
        }
        // All pixels are transparent
        return resolve(true);
      } catch (e) {
        // Security error (e.g., tainted canvas), cannot check
        console.error('Could not check tile transparency:', e);
        return resolve(false);
      }
    };

    img.onerror = (e) => {
      console.error('Failed to load image for transparency check', e);
      reject('Image load error');
    };
  });
}
