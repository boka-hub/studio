
import React, { useState, useCallback, useRef } from 'react';
import type { FC } from 'react';
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
import { useToast } from "@/hooks/use-toast";
import { Upload, ImagePlus, X } from 'lucide-react';
import type { TileImportData } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';

interface TileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (files: TileImportData[]) => void;
}

interface FilePreview {
  id: string;
  file: File;
  src: string;
  name: string;
}

export const TileImportModal: FC<TileImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFiles = useCallback((incomingFiles: FileList | null) => {
    if (!incomingFiles) return;

    const imageFiles = Array.from(incomingFiles).filter(f => f.type.startsWith('image/'));
    
    if (imageFiles.length === 0) return;

    const newFilePreviews: FilePreview[] = imageFiles.map(file => ({
      id: `${file.name}-${file.lastModified}`,
      file,
      src: URL.createObjectURL(file),
      name: file.name.replace(/\.[^/.]+$/, ""),
    }));

    setFiles(currentFiles => {
        const existingIds = new Set(currentFiles.map(f => f.id));
        const uniqueNewFiles = newFilePreviews.filter(f => !existingIds.has(f.id));
        return [...currentFiles, ...uniqueNewFiles];
    });

  }, []);
  
  const removeFile = (id: string) => {
    setFiles(currentFiles => {
      const fileToRemove = currentFiles.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.src);
      }
      return currentFiles.filter(f => f.id !== id);
    });
  };

  const handleImport = async () => {
    if (files.length === 0) return;

    try {
      const tileDataPromises: Promise<TileImportData>[] = files.map(preview => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              resolve({
                name: preview.name,
                src: e.target.result as string,
                isSolid: false,
              });
            } else {
              reject(new Error(`Failed to read file: ${preview.file.name}`));
            }
          };
          reader.onerror = (e) => reject(new Error(`Error reading file ${preview.file.name}: ${e}`));
          reader.readAsDataURL(preview.file);
        });
      });

      const newTileData = await Promise.all(tileDataPromises);
      onImport(newTileData);
      handleClose();

    } catch (error) {
       console.error("Failed to import tiles", error);
       toast({ variant: 'destructive', title: 'Import Failed', description: 'Could not import one or more tiles.' });
    }
  };

  const handleClose = () => {
    files.forEach(f => URL.revokeObjectURL(f.src));
    setFiles([]);
    setIsDragging(false);
    if(fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-2xl h-[70vh] flex flex-col"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <DialogHeader>
          <DialogTitle>Import Tiles</DialogTitle>
          <DialogDescription>
            Select or drag and drop one or more image files to add them to your palette.
          </DialogDescription>
        </DialogHeader>
        
        <div className={cn(
            "flex-grow border-2 border-dashed rounded-lg flex flex-col transition-colors",
            isDragging ? "border-primary bg-primary/10" : "border-border",
            files.length > 0 && "border-solid"
        )}>
            {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <ImagePlus className="h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground mt-4">Drag & drop your tile images here</p>
                    <p className="text-sm text-muted-foreground/80 my-2">or</p>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Select Files
                    </Button>
                </div>
            ) : (
                <ScrollArea className="h-full">
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-4 p-4">
                        {files.map(preview => (
                            <div key={preview.id} className="relative group aspect-square">
                                <Image 
                                    src={preview.src} 
                                    alt={preview.name} 
                                    fill 
                                    className="object-contain rounded-md bg-muted/20" 
                                />
                                <Button 
                                    variant="destructive"
                                    size="icon" 
                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removeFile(preview.id)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="button" onClick={handleImport} disabled={files.length === 0}>
            Import {files.length > 0 ? `(${files.length})` : ''} Tiles
          </Button>
        </DialogFooter>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          multiple
        />
      </DialogContent>
    </Dialog>
  );
};
