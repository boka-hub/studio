
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
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, X, FileJson2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SpritesheetSlicerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSlice: (files: File[]) => void;
  initialFiles?: File[];
}

interface FileData {
  id: string;
  file: File;
  src: string;
  name: string;
  tileWidth: number;
  tileHeight: number;
  metadata?: any; // To store parsed metadata
}

// Regex to parse filenames like: tileforge_sheet_16x16_8c_0g.png
const FILENAME_REGEX = /_(\d+)x(\d+)_(\d+)c_(\d+)g\.(png|jpg|jpeg)$/i;
const EXTENSION_REGEX = /\.(png|jpg|jpeg|txt)$/i;


export const SpritesheetSlicerModal: FC<SpritesheetSlicerModalProps> = ({
  isOpen,
  onClose,
  onSlice,
  initialFiles = [],
}) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFiles = useCallback(async (incomingFiles: FileList | null) => {
    if (!incomingFiles) return;

    const newFiles: FileData[] = [];
    const fileList = Array.from(incomingFiles);

    const imageFiles = fileList.filter(f => f.type.startsWith('image/'));
    const textFiles = fileList.filter(f => f.name.endsWith('.txt'));

    for (const file of imageFiles) {
       const baseName = file.name.replace(EXTENSION_REGEX, '');
       const companionText = textFiles.find(txtFile => txtFile.name.replace(EXTENSION_REGEX, '') === baseName);

      let tileWidth = 16, tileHeight = 16, metadata = null;

      // Try parsing from filename
      const match = file.name.match(FILENAME_REGEX);
      if (match) {
        tileWidth = parseInt(match[1], 10);
        tileHeight = parseInt(match[2], 10);
      }
      
      // Override with data from companion .txt if it exists
      if (companionText) {
        try {
          const jsonContent = await companionText.text();
          metadata = JSON.parse(jsonContent);
          tileWidth = metadata.tileWidth || tileWidth;
          tileHeight = metadata.tileHeight || tileHeight;
        } catch (e) {
          console.error("Failed to parse companion .txt file", e);
          toast({ variant: 'destructive', title: 'Metadata Error', description: `Could not parse ${companionText.name}.` });
        }
      }

      const src = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      newFiles.push({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        src,
        name: file.name.split('.')[0],
        tileWidth,
        tileHeight,
        metadata,
      });
    }

    if (newFiles.length > 0) {
      setFiles(f => {
        const updatedFiles = [...f, ...newFiles];
        if (!selectedFileId) {
          setSelectedFileId(newFiles[0]?.id || null);
        }
        return updatedFiles;
      });
    }
  }, [selectedFileId, toast]);
  
  useEffect(() => {
    if(isOpen && initialFiles.length > 0) {
        const dataTransfer = new DataTransfer();
        initialFiles.forEach(file => dataTransfer.items.add(file));
        handleFiles(dataTransfer.files);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (files.length === 0) return;
    
    let allSlicedFiles: File[] = [];

    const sliceCanvas = document.createElement('canvas');
    const ctx = sliceCanvas.getContext('2d');
    if (!ctx) {
        toast({ variant: 'destructive', title: 'Slicing Error', description: 'Could not create a canvas for slicing.' });
        return;
    }

    for (const fileData of files) {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
            img.src = fileData.src;
            img.onload = async () => {
                const cols = Math.floor(img.width / fileData.tileWidth);
                const rows = Math.floor(img.height / fileData.tileHeight);
                
                sliceCanvas.width = fileData.tileWidth;
                sliceCanvas.height = fileData.tileHeight;
                
                const tilesFromMetadata = fileData.metadata?.tiles;

                for (let y = 0; y < rows; y++) {
                    for (let x = 0; x < cols; x++) {
                        ctx.clearRect(0, 0, sliceCanvas.width, sliceCanvas.height);
                        ctx.drawImage(img, x * fileData.tileWidth, y * fileData.tileHeight, fileData.tileWidth, fileData.tileHeight, 0, 0, fileData.tileWidth, fileData.tileHeight);
                        
                        await new Promise<void>(resolveBlob => {
                           sliceCanvas.toBlob(blob => {
                               if(blob) {
                                   const index = y * cols + x;
                                   const tileName = tilesFromMetadata?.[index]?.name || `${fileData.name}_${y}_${x}`;
                                   const newFile = new File([blob], `${tileName}.png`, { type: 'image/png' });
                                   allSlicedFiles.push(newFile);
                               }
                               resolveBlob();
                           }, 'image/png');
                        });
                    }
                }
                resolve();
            };
            img.onerror = reject;
        });
    }

    if (allSlicedFiles.length > 0) {
      onSlice(allSlicedFiles);
    } else {
       toast({ variant: 'destructive', title: 'Slicing Error', description: 'Could not slice any tiles. Check tile dimensions.' });
    }

    handleClose();
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
        className="max-w-4xl h-[90vh] flex flex-col"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <DialogHeader>
          <DialogTitle>Batch Spritesheet Slicer</DialogTitle>
          <DialogDescription>
            Import spritesheets to slice them. If you provide a companion `.txt` file, names and dimensions will be loaded automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden relative">
          {isDragging && (
            <div className="absolute inset-0 bg-primary/20 border-2 border-dashed border-primary z-10 flex items-center justify-center pointer-events-none">
              <div className="text-center p-4 bg-background/80 rounded-lg">
                <h3 className="font-bold text-primary">Drop to add spritesheet(s)</h3>
              </div>
            </div>
          )}
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
                                    const newFiles = files.filter(f => f.id !== file.id);
                                    setFiles(newFiles);
                                    if (selectedFileId === file.id) {
                                        setSelectedFileId(newFiles.length > 0 ? newFiles[0].id : null);
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

          <div className="md:col-span-2 h-full flex flex-col gap-4">
             <h3 className="text-sm font-semibold text-muted-foreground">Preview & Configuration</h3>
             {selectedFile ? (
                <>
                {selectedFile.metadata && (
                  <Alert variant="default">
                    <FileJson2 className="h-4 w-4" />
                    <AlertTitle>Metadata Detected!</AlertTitle>
                    <AlertDescription>
                      Tile names and dimensions have been automatically configured from the companion .txt file.
                    </AlertDescription>
                  </Alert>
                )}
                <ScrollArea className="w-full rounded-md border max-h-[60vh] bg-muted/20">
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
                <div className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-lg text-center p-4">
                    <Upload className="h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground mt-4">Select or upload a spritesheet to begin.</p>
                     <p className="text-sm text-muted-foreground/80">You can also drag and drop files here.</p>
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
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,.txt" className="hidden" onChange={(e) => handleFiles(e.target.files)} multiple />
      </DialogContent>
    </Dialog>
  );
};
