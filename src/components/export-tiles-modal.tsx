
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
import { ScrollArea } from './ui/scroll-area';

interface ExportTilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  tiles: Tile[];
}

export const ExportTilesModal: FC<ExportTilesModalProps> = ({ isOpen, onClose, tiles }) => {
  const [columns, setColumns] = useState(8);
  const [gap, setGap] = useState(0);
  const [tileWidth, setTileWidth] = useState(16);
  const [tileHeight, setTileHeight] = useState(16);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const tilesToExport = tiles.filter(t => t.id !== 0);

  useEffect(() => {
    if (!isOpen) return;

    const draw = async () => {
      const canvas = canvasRef.current;
      if (!canvas || tilesToExport.length === 0) return;

      const imagePromises = tilesToExport.map(tile => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = tile.src;
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${tile.name}`));
      }));

      try {
        const images = await Promise.all(imagePromises);
        if (images.length === 0) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        
        const firstImage = images[0];
        const effectiveTileWidth = firstImage.naturalWidth;
        const effectiveTileHeight = firstImage.naturalHeight;
        
        setTileWidth(effectiveTileWidth);
        setTileHeight(effectiveTileHeight);

        const numCols = Math.max(1, Math.min(columns, tilesToExport.length));
        const numRows = Math.ceil(tilesToExport.length / numCols);

        canvas.width = numCols * effectiveTileWidth + Math.max(0, numCols - 1) * gap;
        canvas.height = numRows * effectiveTileHeight + Math.max(0, numRows - 1) * gap;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        images.forEach((img, index) => {
          const col = index % numCols;
          const row = Math.floor(index / numCols);
          const x = col * (effectiveTileWidth + gap);
          const y = row * (effectiveTileHeight + gap);
          ctx.drawImage(img, x, y, effectiveTileWidth, effectiveTileHeight);
        });

      } catch (error) {
        console.error("Failed to load tile images for export", error);
        toast({ variant: 'destructive', title: 'Export Error', description: 'Could not load tile images for spritesheet.' });
      }
    };
    
    requestAnimationFrame(draw);

  }, [isOpen, tilesToExport, columns, gap, toast]);
  
  const getBaseFilename = () => {
    return `tileforge_sheet_${tileWidth}x${tileHeight}_${columns}c_${gap}g`;
  }

  const downloadFile = useCallback((blobOrDataUrl: Blob | string, filename: string) => {
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
  }, []);

  const downloadMetadata = useCallback((filename: string) => {
    const numCols = Math.max(1, Math.min(columns, tilesToExport.length));
    const metadata = {
      tileWidth,
      tileHeight,
      columns: numCols,
      gap,
      tiles: tilesToExport.map((tile, index) => ({
        id: tile.id,
        name: tile.name,
        index: index,
        solid: tile.solid,
      })),
    };
    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
    downloadFile(metadataBlob, filename);
  }, [tilesToExport, columns, downloadFile, tileWidth, tileHeight, gap]);

  const handleDownloadMetadata = useCallback(() => {
    const filename = `${getBaseFilename()}.txt`;
    downloadMetadata(filename);
    toast({ title: 'Metadata Downloaded', description: `${filename} has been downloaded.` });
  }, [downloadMetadata, toast, getBaseFilename]);

  const handleExportSpritesheet = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const baseFilename = getBaseFilename();
    const sheetFilename = `${baseFilename}.png`;
    const metadataFilename = `${baseFilename}.txt`;

    // Export Spritesheet
    canvas.toBlob((blob) => {
      if (!blob) {
        toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not generate image file.' });
        return;
      }
      downloadFile(blob, sheetFilename);
    }, 'image/png');
    
    // Export Metadata
    downloadMetadata(metadataFilename);

    toast({ title: 'Export Complete', description: 'Spritesheet and metadata file have been downloaded.' });
    onClose();
  }, [downloadMetadata, onClose, toast, downloadFile, getBaseFilename]);
  
  const handleExportIndividual = useCallback(() => {
    if (tilesToExport.length === 0) {
        toast({ variant: 'destructive', title: 'Export Failed', description: 'No tiles to export.' });
        return;
    }
    
    // Export Individual Tiles
    tilesToExport.forEach(tile => {
        const filename = `${tile.name}.png`;
        downloadFile(tile.src, filename);
    });

    toast({ title: 'Export Complete', description: `${tilesToExport.length} individual tiles have been downloaded.` });
    onClose();
  }, [tilesToExport, onClose, toast, downloadFile]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Spritesheet & Tiles</DialogTitle>
          <DialogDescription>
            Configure and export your tile palette. Exporting as a Sheet also saves a metadata file.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] -mx-6 px-6">
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
        </ScrollArea>
        <DialogFooter>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
              <Button type="button" variant="outline" onClick={handleExportIndividual} disabled={tilesToExport.length === 0} className="col-span-1">
                  <FileImage className="mr-2 h-4 w-4" />
                  PNGs
              </Button>
               <Button type="button" variant="outline" onClick={handleDownloadMetadata} disabled={tilesToExport.length === 0} className="col-span-1">
                  <FileText className="mr-2 h-4 w-4" />
                  .txt
              </Button>
              <Button type="button" variant="secondary" onClick={onClose} className="col-span-1">Cancel</Button>
              <Button type="button" onClick={handleExportSpritesheet} disabled={tilesToExport.length === 0} className="col-span-1">
                  <Download className="mr-2 h-4 w-4" />
                  Sheet
              </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
