
import type { FC } from 'react';
import React, { useState, useRef } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

interface MetadataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tiles: Tile[];
  onImport: (remap: { [oldId: number]: number }, newTiles: Tile[]) => void;
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
            
            const emptyTile = tiles.find(t => t.id === 0);
            if (!emptyTile) {
              throw new Error("Could not find the essential 'Empty' tile.");
            }

            const currentTilesByName = new Map(tiles.map(tile => [tile.name, tile]));
            const idRemap: { [oldId: number]: number } = {};
            const newTiles: Tile[] = [emptyTile];
            const processedNewIds = new Set<number>([0]);

            // Process tiles from metadata, creating the remap and the new tile set
            metadata.tiles.forEach((metaTile: any) => {
                const currentTile = currentTilesByName.get(metaTile.name);
                if (currentTile) {
                    const newId = metaTile.id;
                    if (processedNewIds.has(newId)) {
                        // This would be a problem in the metadata file itself.
                        console.warn(`Duplicate ID ${newId} found in metadata file for tile "${metaTile.name}". Skipping.`);
                        return;
                    }
                    if (currentTile.id !== newId) {
                        idRemap[currentTile.id] = newId;
                    }
                    newTiles.push({ ...currentTile, id: newId });
                    processedNewIds.add(newId);
                }
            });

            // Handle tiles that are in the current project but not in the metadata
            let nextAvailableId = Math.max(...Array.from(processedNewIds)) + 1;
            tiles.forEach(currentTile => {
                if (currentTile.id !== 0 && !newTiles.some(nt => nt.name === currentTile.name)) {
                    while (processedNewIds.has(nextAvailableId)) {
                        nextAvailableId++;
                    }
                    const newId = nextAvailableId;
                    idRemap[currentTile.id] = newId;
                    newTiles.push({ ...currentTile, id: newId });
                    processedNewIds.add(newId);
                }
            });
            
            onImport(idRemap, newTiles);
            toast({ title: 'Palette & Map Remapped', description: 'Tiles have been re-identified and the map has been updated.' });
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
          <DialogTitle>Import & Remap Palette</DialogTitle>
          <DialogDescription>
            Import a metadata file to re-ID your tiles and update the map grid accordingly.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
                This is a destructive action. It will change the IDs of your tiles and permanently alter your map grid to match the imported file. This cannot be undone easily.
            </AlertDescription>
        </Alert>

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
