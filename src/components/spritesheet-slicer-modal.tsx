import type { FC } from 'react';
import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

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

  const handleSlice = useCallback(() => {
    if (!imageSrc || !canvasRef.current) return;

    const img = document.createElement('img');
    img.src = imageSrc;
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cols = Math.floor(img.width / tileWidth);
      const rows = Math.floor(img.height / tileHeight);
      const newTiles: Omit<Tile, 'id'>[] = [];

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
          newTiles.push({ name: `${imageName}_${x}_${y}`, src: dataUrl });
        }
      }
      onSlice(newTiles);
      toast({ title: 'Spritesheet Sliced', description: `${newTiles.length} tiles added to your palette.` });
      onClose();
      setImageSrc(null);
    };
    img.onerror = () => {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load image.' });
    };

  }, [imageSrc, tileWidth, tileHeight, onSlice, onClose, imageName, toast]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Slice Spritesheet</DialogTitle>
          <DialogDescription>
            Import a spritesheet and slice it into individual tiles.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            Upload Spritesheet
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png"
            className="hidden"
            onChange={handleFileChange}
          />
          
          {imageSrc && (
            <div className="relative w-full h-48 border rounded-md overflow-hidden">
                <Image src={imageSrc} alt="Spritesheet preview" layout="fill" objectFit="contain" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tile-width">Tile Width (px)</Label>
              <Input
                id="tile-width"
                type="number"
                value={tileWidth}
                onChange={(e) => setTileWidth(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="tile-height">Tile Height (px)</Label>
              <Input
                id="tile-height"
                type="number"
                value={tileHeight}
                onChange={(e) => setTileHeight(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={handleSlice} disabled={!imageSrc}>Slice and Add</Button>
        </DialogFooter>
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};
