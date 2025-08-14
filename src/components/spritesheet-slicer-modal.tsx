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
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpritesheetSlicerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSlice: (tiles: Omit<Tile, 'id'>[]) => void;
  initialFiles?: File[];
}

interface FileData {
  id: string;
  file: File;
  src: string;
  name: string;
  tileWidth: number;
  tileHeight: number;
}

export const SpritesheetSlicerModal: FC<SpritesheetSlicerModalProps> = ({
  isOpen,
  onClose,
  onSlice,
  initialFiles = [],
}) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const sliceCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFiles = (incomingFiles: FileList | null) => {
    if (!incomingFiles) return;

    const newFiles: FileData[] = [];
    for (const file of Array.from(incomingFiles)) {
       const reader = new FileReader();
       reader.onload = (e) => {
         const newFile = {
           id: `${file.name}-${file.lastModified}`,
           file,
           src: e.target?.result as string,
           name: file.name.split('.')[0],
           tileWidth: 32,
           tileHeight: 32,
         };
         newFiles.push(newFile);
         if(newFiles.length === incomingFiles.length) {
            setFiles(f => [...f, ...newFiles]);
            if (!selectedFileId) {
                setSelectedFileId(newFiles[0].id);
            }
         }
       };
       reader.readAsDataURL(file);
    }
  };
  
  useEffect(() => {
    if(isOpen && initialFiles.length > 0) {
        const dataTransfer = new DataTransfer();
        initialFiles.forEach(file => dataTransfer.items.add(file));
        handleFiles(dataTransfer.files);
    }
  }, [isOpen, initialFiles]);


  const selectedFile = files.find(f => f.id === selectedFileId);

  const drawPreview = useCallback(() => {
    if (!selectedFile || !previewCanvasRef.current) return;
    const img = new Image();
    img.src = selectedFile.src;
    img.onload = () => {
      const canvas = previewCanvasRef.current!;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      for (let x = selectedFile.tileWidth; x < img.width; x += selectedFile.tileWidth) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, img.height);
      }
      
      for (let y = selectedFile.tileHeight; y < img.height; y += selectedFile.tileHeight) {
        ctx.moveTo(0, y);
        ctx.lineTo(img.width, y);
      }
      
      ctx.stroke();
    };
  }, [selectedFile]);

  useEffect(() => {
    if (isOpen) {
      drawPreview();
    }
  }, [isOpen, drawPreview]);

  const resetState = () => {
    setFiles([]);
    setSelectedFileId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const updateSelectedFileConfig = (width?: number, height?: number) => {
    if (!selectedFileId) return;
    setFiles(files.map(f => {
      if (f.id === selectedFileId) {
        return {
          ...f,
          tileWidth: width ?? f.tileWidth,
          tileHeight: height ?? f.tileHeight,
        };
      }
      return f;
    }));
  };

  const handleSlice = async () => {
    if (files.length === 0 || !sliceCanvasRef.current) return;
    const canvas = sliceCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let allNewTiles: Omit<Tile, 'id'>[] = [];
    let totalSlicedCount = 0;
    let totalSkippedCount = 0;

    for (const fileData of files) {
        const img = new Image();
        // Use a promise to handle image loading for each file
        await new Promise<void>((resolve, reject) => {
            img.src = fileData.src;
            img.onload = async () => {
                const cols = Math.floor(img.width / fileData.tileWidth);
                const rows = Math.floor(img.height / fileData.tileHeight);
                
                for (let y = 0; y < rows; y++) {
                    for (let x = 0; x < cols; x++) {
                        canvas.width = fileData.tileWidth;
                        canvas.height = fileData.tileHeight;
                        ctx.drawImage(img, x * fileData.tileWidth, y * fileData.tileHeight, fileData.tileWidth, fileData.tileHeight, 0, 0, fileData.tileWidth, fileData.tileHeight);
                        const dataUrl = canvas.toDataURL();
                        
                        if (await isTileTransparent(dataUrl)) {
                            totalSkippedCount++;
                        } else {
                            allNewTiles.push({ name: `${fileData.name}_${x}_${y}`, src: dataUrl });
                            totalSlicedCount++;
                        }
                    }
                }
                resolve();
            };
            img.onerror = reject;
        });
    }

    if (allNewTiles.length > 0) {
      onSlice(allNewTiles);
      toast({ title: 'Slicing Complete', description: `${totalSlicedCount} tiles added from ${files.length} spritesheet(s).` });
    }
    if (totalSkippedCount > 0) {
        toast({ title: 'Transparent Tiles Skipped', description: `${totalSkippedCount} tile(s) were transparent and ignored.` });
    }
    if (totalSlicedCount === 0 && files.length > 0) {
        toast({ variant: 'destructive', title: 'Slicing Error', description: 'Could not slice any tiles. Check tile dimensions.' });
    }

    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Batch Spritesheet Slicer</DialogTitle>
          <DialogDescription>
            Import one or more spritesheets, configure their slice dimensions, and add all tiles to your palette at once.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
          {/* File List */}
          <div className="md:col-span-1 h-full flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Spritesheets</h3>
            <ScrollArea className="flex-grow border rounded-md">
                <div className="p-2 space-y-1">
                    {files.map(file => (
                        <div key={file.id} 
                            className={cn("flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted", selectedFileId === file.id && "bg-muted")}
                            onClick={() => setSelectedFileId(file.id)}
                        >
                            <p className="text-sm truncate flex-grow">{file.file.name}</p>
                            <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFiles(f => f.filter(f => f.id !== file.id));
                                    if (selectedFileId === file.id) {
                                        setSelectedFileId(files.length > 1 ? files.find(f => f.id !== file.id)!.id : null);
                                    }
                                }}>
                                <X className="h-4 w-4"/>
                            </Button>
                        </div>
                    ))}
                </div>
            </ScrollArea>
             <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Add Spritesheet(s)
            </Button>
          </div>

          {/* Preview and Config */}
          <div className="md:col-span-2 h-full flex flex-col gap-4">
             <h3 className="text-sm font-semibold text-muted-foreground">Preview & Configuration</h3>
             {selectedFile ? (
                <>
                <ScrollArea className="w-full rounded-md border max-h-[60vh]">
                    <div className="flex items-center justify-center p-1">
                        <canvas ref={previewCanvasRef} className="max-w-full h-auto" style={{ imageRendering: 'pixelated' }} />
                    </div>
                </ScrollArea>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tile-width">Tile Width (px)</Label>
                    <Input id="tile-width" type="number" value={selectedFile.tileWidth}
                      onChange={(e) => updateSelectedFileConfig(Math.max(1, Number(e.target.value)))}
                      min="1" />
                  </div>
                  <div>
                    <Label htmlFor="tile-height">Tile Height (px)</Label>
                    <Input id="tile-height" type="number" value={selectedFile.tileHeight}
                      onChange={(e) => updateSelectedFileConfig(undefined, Math.max(1, Number(e.target.value)))}
                      min="1" />
                  </div>
                </div>
                </>
             ) : (
                <div className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">Select or upload a spritesheet to begin.</p>
                </div>
             )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="button" onClick={handleSlice} disabled={files.length === 0}>
            Slice All & Add ({files.length})
          </Button>
        </DialogFooter>
        <canvas ref={sliceCanvasRef} className="hidden" />
        <input ref={fileInputRef} type="file" accept="image/png" className="hidden" onChange={(e) => handleFiles(e.target.files)} multiple />
      </DialogContent>
    </Dialog>
  );
};
