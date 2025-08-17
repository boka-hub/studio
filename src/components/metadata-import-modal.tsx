
import type { FC } from 'react';
import React, { useState, useRef, useCallback } from 'react';
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
import type { Tile } from '@/lib/types';
import { Upload, FileJson2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetadataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tiles: Tile[];
  onImport: (sortedTiles: Tile[]) => void;
}

export const MetadataImportModal: FC<MetadataImportModalProps> = ({
  isOpen,
  onClose,
  tiles,
  onImport,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processFile = (file: File) => {
    if (!file || (!file.type.startsWith('text/') && !file.name.endsWith('.json') && !file.name.endsWith('.txt'))) {
        toast({ variant: 'destructive', title: 'Invalid File', description: 'Please drop a valid .txt or .json metadata file.' });
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target?.result as string;
            const metadata = JSON.parse(content);

            if (!metadata.tiles || !Array.isArray(metadata.tiles)) {
                throw new Error('Invalid metadata format: "tiles" array not found.');
            }

            const orderedTileNames: string[] = metadata.tiles
                .sort((a: any, b: any) => (a.index || 0) - (b.index || 0))
                .map((t: any) => t.name);
            
            const currentTiles = [...tiles];
            const sortedTiles = currentTiles.sort((a, b) => {
                const indexA = orderedTileNames.indexOf(a.name);
                const indexB = orderedTileNames.indexOf(b.name);

                if (a.id === 0) return -1; // Keep Empty tile first
                if (b.id === 0) return 1;

                if (indexA !== -1 && indexB !== -1) {
                    return indexA - indexB; // Both in metadata, sort by metadata index
                }
                if (indexA !== -1) return -1; // A is in metadata, B is not
                if (indexB !== -1) return 1;  // B is in metadata, A is not
                return 0; // Neither in metadata, keep original order
            });
            
            onImport(sortedTiles);
            toast({ title: 'Palette Sorted', description: 'Tiles have been reordered based on the metadata file.' });
            onClose();

        } catch (error: any) {
            console.error("Failed to parse metadata file", error);
            toast({ variant: 'destructive', title: 'Import Failed', description: error.message || 'Could not parse the metadata file.' });
        }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
        processFile(file);
    }
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-lg"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <DialogHeader>
          <DialogTitle>Import Palette Order</DialogTitle>
          <DialogDescription>
            Import a `tileforge-metadata.txt` file to reorder your current palette.
          </DialogDescription>
        </DialogHeader>

        <div className={cn(
            "relative flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg text-center p-4 transition-colors",
            isDragging ? "border-primary bg-primary/10" : "border-border"
        )}>
             {isDragging ? (
                 <p className="font-semibold text-primary">Drop file here to import</p>
             ) : (
                <>
                    <FileJson2 className="h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground mt-4">Drag & drop your metadata file here</p>
                    <p className="text-sm text-muted-foreground/80">or</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Select a File
                    </Button>
                </>
             )}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        </DialogFooter>
        <input 
          ref={fileInputRef} 
          type="file" 
          accept=".txt,.json" 
          className="hidden" 
          onChange={handleFileSelect} 
        />
      </DialogContent>
    </Dialog>
  );
};
