
import type { FC } from 'react';
import React, { useState, useCallback } from 'react';
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
import { Upload, FileJson2 } from 'lucide-react';
import type { Tile } from '@/lib/types';

interface MetadataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tiles: Tile[];
  onRemap: (tiles: Tile[]) => void;
}

export const MetadataImportModal: FC<MetadataImportModalProps> = ({
  isOpen,
  onClose,
  tiles,
  onRemap,
}) => {
  const [fileContent, setFileContent] = useState<any | null>(null);
  const [fileName, setFileName] = useState('');
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const metadata = JSON.parse(content);
        if (!metadata.tiles || !Array.isArray(metadata.tiles)) {
          throw new Error('Invalid metadata format. "tiles" array not found.');
        }
        setFileContent(metadata);
        toast({ title: 'Metadata Loaded', description: `Ready to remap from ${file.name}.` });
      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: 'Import Error',
          description: `Failed to parse metadata file: ${err.message}`,
        });
        setFileContent(null);
        setFileName('');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };
  
  const handleRemap = useCallback(() => {
    if (!fileContent || !fileContent.tiles) return;

    let nextId = Math.max(0, ...tiles.map(t => t.id)) + 1;
    const existingTilesByName = new Map(tiles.map(t => [t.name, t]));
    const remappedTiles: Tile[] = [];
    const newTiles: Tile[] = [];

    // Process tiles from metadata, remapping IDs
    for (const metaTile of fileContent.tiles) {
      const existing = existingTilesByName.get(metaTile.name);
      if (existing) {
        // If tile with same name exists, update it but keep its ID
        remappedTiles.push({
          ...existing,
          id: metaTile.id, // Use ID from metadata
          solid: metaTile.solid || false,
          metadata: metaTile.metadata || {},
        });
      } else {
        // If it's a new tile, add it with the new ID
        newTiles.push({
          id: metaTile.id,
          name: metaTile.name,
          src: '', // No image source available from just metadata
          solid: metaTile.solid || false,
          metadata: metaTile.metadata || {},
        });
      }
    }

    // Add back any tiles from the original set that weren't in the metadata
    const metaTileNames = new Set(fileContent.tiles.map((t: any) => t.name));
    for (const originalTile of tiles) {
      if (originalTile.id !== 0 && !metaTileNames.has(originalTile.name)) {
        remappedTiles.push({
          ...originalTile,
          id: nextId++, // Assign a new ID to avoid conflicts
        });
      }
    }
    
    const finalTiles = [...remappedTiles, ...newTiles];

    onRemap(finalTiles);
    toast({ title: 'Palette Remapped', description: `Tile IDs and properties updated from metadata.` });
    onClose();
  }, [fileContent, tiles, onRemap, toast, onClose]);


  const handleClose = () => {
    setFileContent(null);
    setFileName('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remap Palette from Metadata</DialogTitle>
          <DialogDescription>
            Import a metadata .txt file to remap tile IDs and properties for your existing tiles. This is useful for syncing with external tools.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex flex-col items-center justify-center space-y-2 border-2 border-dashed rounded-lg p-8">
            <FileJson2 className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {fileName || 'No file selected.'}
            </p>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Select .txt File
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,application/json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="button" onClick={handleRemap} disabled={!fileContent}>
            Remap Palette
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
