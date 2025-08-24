
import type { FC } from 'react';
import React, from 'react';
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
import type { Tile, ExportFormat, Layer } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Download, FileImage, FileText, ShieldAlert } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface ExportTilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  tiles: Tile[];
  layers: Layer[];
  exportFormat: ExportFormat;
}

export const ExportTilesModal: FC<ExportTilesModalProps> = ({ isOpen, onClose, tiles, layers, exportFormat }) => {
  const [columns, setColumns] = useState(8);
  const [gap, setGap] = useState(0);
  const [tileWidth, setTileWidth] = useState(16);
  const [tileHeight, setTileHeight] = useState(16);
  const [dimensionMismatch, setDimensionMismatch] = useState(false);
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
        img.src = tile.src;
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${tile.name}`));
      }));

      try {
        const images = await Promise.all(imagePromises);
        setDimensionMismatch(false);
        if (images.length === 0) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        
        const firstImage = images[0];
        const effectiveTileWidth = firstImage.naturalWidth;
        const effectiveTileHeight = firstImage.naturalHeight;
        
        // Check if all images have the same dimensions
        for(const img of images) {
            if (img.naturalWidth !== effectiveTileWidth || img.naturalHeight !== effectiveTileHeight) {
                setDimensionMismatch(true);
                toast({
                    variant: 'destructive',
                    title: 'Dimension Mismatch',
                    description: 'Not all tiles have the same dimensions. Spritesheet export is disabled.',
                });
                return;
            }
        }
        
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
        metadata: tile.metadata || {},
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

  const handleExportMap = () => {
    let blob: Blob;
    let filename: string;

    if (exportFormat === 'json') {
      const jsonData = {
        tiles: tiles.map(({id, name, solid, metadata}) => ({id, name, solid, metadata: metadata || {}})),
        layers: layers.map(({id, name, grid, isVisible}) => ({id, name, grid, isVisible})),
        tileWidth: tileWidth,
        tileHeight: tileHeight,
      };
      blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      filename = 'tileforge-map.json';
    } else {
      // Default to .txt format for single layer
      const mapData = layers[0]?.grid.map(row => row.join(',')).join('\n') || '';
      blob = new Blob([mapData], { type: 'text/plain' });
      filename = 'tileforge-map.txt';
    }
    
    downloadFile(blob, filename);
    toast({ title: 'Map Exported', description: `Your map has been saved as ${filename}` });
  };


  const handleExportSpritesheet = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensionMismatch) return;
    
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
  }, [downloadMetadata, onClose, toast, downloadFile, getBaseFilename, dimensionMismatch]);
  
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
          <DialogTitle>Export Spritesheet & Map</DialogTitle>
          <DialogDescription>
            Configure and export your assets. Exporting as a Sheet also saves a metadata file.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] -mx-6 px-6">
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Map Export</h4>
               <Button type="button" variant="outline" onClick={handleExportMap} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Export Map as .{exportFormat}
              </Button>
            </div>
             <div className="space-y-2">
              <h4 className="font-medium leading-none">Tiles Export</h4>
            </div>
             {dimensionMismatch && (
                <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Tile Dimension Mismatch</AlertTitle>
                    <AlertDescription>
                        All tiles must have the same width and height to be exported as a single spritesheet.
                    </AlertDescription>
                </Alert>
            )}
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
               <Button type="button" variant="outline" onClick={handleDownloadMetadata} disabled={tilesToExport.length === 0 || dimensionMismatch} className="col-span-1">
                  <FileText className="mr-2 h-4 w-4" />
                  Metadata
              </Button>
              <Button type="button" variant="secondary" onClick={onClose} className="col-span-1">Cancel</Button>
              <Button type="button" onClick={handleExportSpritesheet} disabled={tilesToExport.length === 0 || dimensionMismatch} className="col-span-1">
                  <Download className="mr-2 h-4 w-4" />
                  Sheet
              </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

    
