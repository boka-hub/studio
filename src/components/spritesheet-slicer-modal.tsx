import type { FC } from 'react';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Tile } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { isTileTransparent } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SpritesheetSlicerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSlice: (tiles: Omit<Tile, 'id'>[]) => void;
}

export const SpritesheetSlicerModal: FC<SpritesheetSlicerModalProps> = ({
  isOpen,
  onClose,
  onSlice,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState('');
  const [tileWidth, setTileWidth] = useState(32);
  const [tileHeight, setTileHeight] = useState(32);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sliceCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const drawPreview = useCallback(() => {
    if (!imageSrc || !previewCanvasRef.current) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = previewCanvasRef.current!;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size to match image to avoid distortion
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image
      ctx.drawImage(img, 0, 0);

      // Draw grid lines
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      // Vertical lines
      for (let x = tileWidth; x < img.width; x += tileWidth) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, img.height);
      }
      
      // Horizontal lines
      for (let y = tileHeight; y < img.height; y += tileHeight) {
        ctx.moveTo(0, y);
        ctx.lineTo(img.width, y);
      }
      
      ctx.stroke();
    };
  }, [imageSrc, tileWidth, tileHeight]);

  useEffect(() => {
    if (isOpen) {
      drawPreview();
    }
  }, [isOpen, drawPreview]);
  
  const resetState = () => {
    setImageSrc(null);
    setImageName('');
    setTileWidth(32);
    setTileHeight(32);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  const handleClose = () => {
    resetState();
    onClose();
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
        setImageName(file.name.split('.')[0]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSlice = useCallback(async () => {
    if (!imageSrc || !sliceCanvasRef.current) return;

    const img = document.createElement('img');
    img.src = imageSrc;
    img.onload = async () => {
      const canvas = sliceCanvasRef.current!;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cols = Math.floor(img.width / tileWidth);
      const rows = Math.floor(img.height / tileHeight);
      const newTiles: Omit<Tile, 'id'>[] = [];
      let transparentCount = 0;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          canvas.width = tileWidth;
          canvas.height = tileHeight;
          ctx.drawImage(
            img,
            x * tileWidth,
            y * tileHeight,
            tileWidth,
            tileHeight,
            0,
            0,
            tileWidth,
            tileHeight
          );
          const dataUrl = canvas.toDataURL();
          
          if (await isTileTransparent(dataUrl)) {
            transparentCount++;
          } else {
            newTiles.push({ name: `${imageName}_${x}_${y}`, src: dataUrl });
          }
        }
      }
      
      onSlice(newTiles);
      
      if (newTiles.length > 0) {
        toast({ title: 'Spritesheet Sliced', description: `${newTiles.length} tiles added to your palette.` });
      }
      if (transparentCount > 0) {
        toast({ title: 'Transparent Tiles Skipped', description: `${transparentCount} tile(s) were fully transparent and have been ignored.` });
      }
      if (newTiles.length === 0 && transparentCount === 0) {
         toast({ variant: 'destructive', title: 'Slicing Error', description: 'Could not slice any tiles. Check tile dimensions.' });
      }
      
      handleClose();
    };
    img.onerror = () => {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load image.' });
    };

  }, [imageSrc, tileWidth, tileHeight, onSlice, imageName, toast]);
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Slice Spritesheet</DialogTitle>
          <DialogDescription>
            Import a spritesheet and slice it into individual tiles.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!imageSrc && (
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Upload Spritesheet
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png"
            className="hidden"
            onChange={handleFileChange}
          />
          
          {imageSrc && (
            <>
            <ScrollArea className="w-full rounded-md border max-h-[50vh]">
              <div className="flex items-center justify-center p-1">
                <canvas 
                  ref={previewCanvasRef} 
                  className="max-w-full h-auto"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            </ScrollArea>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tile-width">Tile Width (px)</Label>
                <Input
                  id="tile-width"
                  type="number"
                  value={tileWidth}
                  onChange={(e) => setTileWidth(Math.max(1, Number(e.target.value)))}
                  className="w-full"
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="tile-height">Tile Height (px)</Label>
                <Input
                  id="tile-height"
                  type="number"
                  value={tileHeight}
                  onChange={(e) => setTileHeight(Math.max(1, Number(e.target.value)))}
                  className="w-full"
                  min="1"
                />
              </div>
            </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="button" onClick={handleSlice} disabled={!imageSrc}>Slice and Add</Button>
        </DialogFooter>
        <canvas ref={sliceCanvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};
