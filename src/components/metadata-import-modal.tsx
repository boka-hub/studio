
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
import { ScrollArea } from './ui/scroll-area';

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
    if (!file || (!file.type.startsWith('text/') && !file.name.endsWith('.txt') && !file.name.endsWith('.json'))) {
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
            
            const currentTilesById = new Map(tiles.map(tile => [tile.id, tile]));
            const idRemap: { [oldId: number]: number } = {};
            const finalTiles: Tile[] = [emptyTile];
            const finalIds = new Set<number>([0]);
            
            const metaTilesByName = new Map(metadata.tiles.map((t: any) => [t.name, t]));
            const currentTilesByName = new Map(tiles.map(tile => [tile.name, tile]));

            // First pass: Match by name, re-ID, and gather new properties
            for (const [name, metaTile] of metaTilesByName.entries()) {
                const currentTile = currentTilesByName.get(name);
                if (currentTile) {
                    const newId = metaTile.id;
                    if (finalIds.has(newId)) {
                        console.warn(`Duplicate ID ${newId} in metadata file for tile "${name}". It will be assigned a new ID later.`);
                        continue;
                    }
                    finalTiles.push({
                        ...currentTile,
                        id: newId,
                        solid: metaTile.solid ?? currentTile.solid,
                        metadata: metaTile.metadata ?? currentTile.metadata,
                    });
                    idRemap[currentTile.id] = newId;
                    finalIds.add(newId);
                }
            }

            // Second pass: Handle tiles that are in the project but NOT in the metadata
            let nextAvailableId = 1;
            for (const tile of tiles) {
                if (tile.id !== 0 && !metaTilesByName.has(tile.name)) {
                     while (finalIds.has(nextAvailableId)) {
                        nextAvailableId++;
                    }
                    const newId = nextAvailableId;
                    finalTiles.push({ ...tile, id: newId });
                    idRemap[tile.id] = newId;
                    finalIds.add(newId);
                }
            }
            
            onImport(idRemap, finalTiles);
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
            Import a metadata file (.txt or .json) to re-ID your tiles and update the map grid accordingly.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] -mx-6 px-6">
            <div className="space-y-4 py-4">
                <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription>
                        This is a destructive action. It will change the IDs of your tiles and permanently alter your map grid to match the imported file. This action cannot be easily undone.
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
            </div>
        </ScrollArea>
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
