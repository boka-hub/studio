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
import { Download, FileImage, FileText } from 'lucide-react';

interface ExportTilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  tiles: Tile[];
}

export const ExportTilesModal: FC<ExportTilesModalProps> = ({ isOpen, onClose, tiles }) => {
  const [columns, setColumns] = useState(8);
  const [gap, setGap] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const drawSpritesheet = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || tiles.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const imagePromises = tiles.map(tile => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = tile.src;
        img.onload = () => resolve(img);
        img.onerror = reject;
      }));
      const images = await Promise.all(imagePromises);

      const tileWidth = images[0]?.naturalWidth || 32;
      const tileHeight = images[0]?.naturalHeight || 32;
      
      const numCols = Math.min(columns > 0 ? columns : 1, tiles.length);
      const numRows = Math.ceil(tiles.length / numCols);

      canvas.width = numCols * tileWidth + Math.max(0, numCols - 1) * gap;
      canvas.height = numRows * tileHeight + Math.max(0, numRows - 1) * gap;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      images.forEach((img, index) => {
        const col = index % numCols;
        const row = Math.floor(index / numCols);
        const x = col * (tileWidth + gap);
        const y = row * (tileHeight + gap);
        ctx.drawImage(img, x, y, tileWidth, tileHeight);
      });

    } catch (error) {
      console.error("Failed to load tile images for export", error);
      toast({ variant: 'destructive', title: 'Export Error', description: 'Could not load tile images for spritesheet.' });
    }
  }, [tiles, columns, gap, toast]);

  useEffect(() => {
    if (isOpen) {
      drawSpritesheet();
    }
  }, [isOpen, drawSpritesheet]);
  
  const downloadFile = (blobOrDataUrl: Blob | string, filename: string) => {
    const url = typeof blobOrDataUrl === 'string' ? blobOrDataUrl : URL.createObjectURL(blobOrDataUrl);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (typeof blobOrDataUrl !== 'string') {
        URL.revokeObjectURL(url);
    }
  }

  const downloadMetadata = () => {
    const metadata = {
      tileCount: tiles.length,
      columns: Math.min(columns > 0 ? columns : 1, tiles.length),
      tiles: tiles.map((tile, index) => ({
        id: tile.id,
        name: tile.name,
        index: index,
      })),
    };
    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'text/plain' });
    downloadFile(metadataBlob, 'tileforge-metadata.txt');
  };

  const handleDownloadMetadata = () => {
    downloadMetadata();
    toast({ title: 'Metadata Downloaded', description: 'tileforge-metadata.txt has been downloaded.' });
  }

  const handleExportSpritesheet = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Export Spritesheet
    canvas.toBlob((blob) => {
      if (!blob) {
        toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not generate image file.' });
        return;
      }
      downloadFile(blob, 'tileforge-spritesheet.png');
    }, 'image/png');
    
    // Export Metadata
    downloadMetadata();

    toast({ title: 'Export Complete', description: 'Spritesheet and metadata.txt have been downloaded.' });
    onClose();
  };
  
  const handleExportIndividual = () => {
    if (tiles.length === 0) {
        toast({ variant: 'destructive', title: 'Export Failed', description: 'No tiles to export.' });
        return;
    }
    
    // Export Individual Tiles
    tiles.forEach(tile => {
        const filename = `${tile.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
        downloadFile(tile.src, filename);
    });

    // Export Metadata
    downloadMetadata();

    toast({ title: 'Export Complete', description: `${tiles.length} individual tiles and metadata.txt have been downloaded.` });
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Spritesheet & Tiles</DialogTitle>
          <DialogDescription>
            Configure and export your tile palette as a single spritesheet or as individual files.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Spritesheet Preview</h4>
            <div className="rounded-md border bg-muted/50 p-2 overflow-auto max-h-64">
                <canvas ref={canvasRef} className="mx-auto" style={{ imageRendering: 'pixelated' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="columns">Columns</Label>
              <Input
                id="columns"
                type="number"
                value={columns}
                onChange={(e) => setColumns(Math.max(1, Number(e.target.value)))}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gap">Gap (px)</Label>
              <Input
                id="gap"
                type="number"
                value={gap}
                onChange={(e) => setGap(Math.max(0, Number(e.target.value)))}
                min="0"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col-reverse items-center gap-2 sm:flex-row sm:justify-between sm:space-x-2">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button type="button" variant="outline" onClick={handleExportIndividual} disabled={tiles.length === 0} className="w-full sm:w-auto">
                <FileImage className="mr-2 h-4 w-4" />
                Individual PNGs
            </Button>
             <Button type="button" variant="outline" onClick={handleDownloadMetadata} disabled={tiles.length === 0} className="w-full sm:w-auto">
                <FileText className="mr-2 h-4 w-4" />
                Metadata Only
            </Button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
            <Button type="button" onClick={handleExportSpritesheet} disabled={tiles.length === 0} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Spritesheet
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
