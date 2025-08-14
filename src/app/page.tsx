"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Brush,
  Eraser,
  Pipette,
  Sparkles,
  Upload,
  Scissors,
  Download,
  Undo,
  Redo,
  Loader,
  Grid as GridIcon,
  Package,
  PaintBucket,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  RectangleHorizontal,
  Lasso,
  FileCheck,
  Copy,
  ClipboardPaste,
  Trash2,
  Replace,
} from 'lucide-react';
import { Header } from '@/components/header';
import { Toolbar } from '@/components/toolbar';
import { TilePalette } from '@/components/tile-palette';
import { MapGrid } from '@/components/map-grid';
import { SpritesheetSlicerModal } from '@/components/spritesheet-slicer-modal';
import { ExportTilesModal } from '@/components/export-tiles-modal';
import type { Tool, Tile, GridState, Selection } from '@/lib/types';
import { useUndoRedo } from '@/hooks/use-undo-redo';
import { intelligentTilePlacement } from '@/ai/flows/intelligent-tile-placement';
import { useToast } from "@/hooks/use-toast";
import { TooltipProvider } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { isTileTransparent } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Terminal } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const INITIAL_GRID_SIZE = 32;

const createEmptyGrid = (width: number, height: number): GridState =>
  Array(height)
    .fill(null)
    .map(() => Array(width).fill(0));

export default function Home() {
  const [gridSize, setGridSize] = useState({ width: INITIAL_GRID_SIZE, height: INITIAL_GRID_SIZE });
  
  const {
    state: grid,
    setState: setGrid,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
    history,
    setCurrentIndex,
  } = useUndoRedo<GridState>(createEmptyGrid(gridSize.width, gridSize.height));

  const [tiles, setTiles] = useState<Tile[]>([
    { id: 0, name: 'Empty', src: '' }, // Empty tile
  ]);
  const [selectedTileId, setSelectedTileId] = useState<number>(0);
  const [tool, setTool] = useState<Tool>('brush');
  const [selection, setSelection] = useState<Selection | null>(null);
  const [clipboard, setClipboard] = useState<GridState | null>(null);
  const [isSlicerOpen, setSlicerOpen] = useState(false);
  const [isExportOpen, setExportOpen] = useState(false);
  const [isProcessingAI, setProcessingAI] = useState(false);
  const [showApiKeyAlert, setShowApiKeyAlert] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [tileToDelete, setTileToDelete] = useState<Tile | null>(null);
  const [isToolbarCollapsed, setToolbarCollapsed] = useState(false);
  const [isPaletteCollapsed, setPaletteCollapsed] = useState(false);
  const { toast } = useToast();

  const tileImportRef = useRef<HTMLInputElement>(null);
  const lastDeletedTile = useRef<{ tile: Tile; grid: GridState; tiles: Tile[] } | null>(null);

  const handleGridResize = (newWidth: number, newHeight: number) => {
    const oldGrid = grid;
    const oldHeight = oldGrid.length;
    const oldWidth = oldGrid[0]?.length || 0;
    const newGrid = createEmptyGrid(newWidth, newHeight);

    for (let r = 0; r < Math.min(oldHeight, newHeight); r++) {
      for (let c = 0; c < Math.min(oldWidth, newWidth); c++) {
        newGrid[r][c] = oldGrid[r][c];
      }
    }
    setGridSize({ width: newWidth, height: newHeight });
    resetHistory(newGrid);
    setSelection(null);
    toast({ title: 'Grid Resized', description: `Grid is now ${newWidth}x${newHeight} tiles.` });
  };
  
  const addTiles = async (newTiles: Omit<Tile, 'id'>[]) => {
    const filteredTiles = [];
    for (const tile of newTiles) {
      if (!(await isTileTransparent(tile.src))) {
        filteredTiles.push(tile);
      }
    }

    if (filteredTiles.length < newTiles.length) {
      const skippedCount = newTiles.length - filteredTiles.length;
      toast({
        title: 'Transparent Tiles Skipped',
        description: `${skippedCount} tile(s) were fully transparent and have been ignored.`,
      });
    }
    
    if (filteredTiles.length > 0) {
      setTiles((prevTiles) => {
        let nextId = prevTiles.length > 0 ? Math.max(...prevTiles.map((t) => t.id)) + 1 : 1;
        const tilesWithIds = filteredTiles.map((tile) => ({
          ...tile,
          id: nextId++,
        }));
        return [...prevTiles, ...tilesWithIds];
      });
    }
  };

  const handleRenameTile = (tileId: number, newName: string) => {
    setTiles((prevTiles) => {
      const isNameTaken = prevTiles.some(t => t.name === newName && t.id !== tileId);
      if (isNameTaken) {
        toast({ variant: 'destructive', title: 'Rename Failed', description: 'A tile with that name already exists.' });
        return prevTiles;
      }
      toast({ title: 'Tile Renamed', description: `Tile has been renamed to "${newName}".` });
      return prevTiles.map((tile) =>
        tile.id === tileId ? { ...tile, name: newName } : tile
      );
    });
  };

  const handleUndoDelete = () => {
    if (lastDeletedTile.current) {
      setTiles(lastDeletedTile.current.tiles);
      setGrid(lastDeletedTile.current.grid, true); // bypass history
      lastDeletedTile.current = null;
      toast({ title: 'Deletion Undone', description: 'The tile has been restored.' });
    }
  };

  const confirmDeleteTile = () => {
    if (!tileToDelete) return;

    const tileId = tileToDelete.id;
    
    lastDeletedTile.current = {
      tile: tileToDelete,
      grid: grid,
      tiles: tiles,
    };

    // Remove tile from palette
    setTiles(prevTiles => prevTiles.filter(t => t.id !== tileId));
    // Remove tile from grid and update history
    const newGrid = grid.map(row => row.map(cell => (cell === tileId ? 0 : cell)));
    setGrid(newGrid);
    // If deleted tile was selected, select empty tile
    if (selectedTileId === tileId) {
      setSelectedTileId(0);
    }
    toast({ 
      title: 'Tile Deleted', 
      description: `Tile "${tileToDelete.name}" has been removed.`,
      action: <Button variant="secondary" onClick={handleUndoDelete}>Undo</Button>,
      duration: 5000,
    });
    setTileToDelete(null);
  };

  const handleDeleteTile = (tileId: number) => {
    const tile = tiles.find(t => t.id === tileId);
    if(tile) {
      setTileToDelete(tile);
    }
  };

  const handleImportTiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newTiles: Omit<Tile, 'id'>[] = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newTiles.push({ name: file.name.replace(/\.[^/.]+$/, ""), src: e.target?.result as string });
        if (newTiles.length === files.length) {
          addTiles(newTiles);
        }
      };
      reader.readAsDataURL(file);
    });
    event.target.value = ''; // Reset file input
  };

  const handleExportMap = () => {
    const mapData = grid.map(row => row.join(',')).join('\n');
    const blob = new Blob([mapData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tileforge-map.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Map Exported', description: 'Your map has been saved as tileforge-map.txt' });
  };
  
  const handleCellAction = useCallback(
    (row: number, col: number) => {
      if (tool === 'select') {
        // Selection handled by onShapeDraw
        return;
      }
      setSelection(null);
      
      if (tool === 'brush') {
        if (grid[row][col] === selectedTileId) return;
        const newGrid = grid.map((r, rIndex) =>
          rIndex === row ? r.map((c, cIndex) => (cIndex === col ? selectedTileId : c)) : r
        );
        setGrid(newGrid);
      } else if (tool === 'eraser') {
        if (grid[row][col] === 0) return;
        const newGrid = grid.map((r, rIndex) =>
          rIndex === row ? r.map((c, cIndex) => (cIndex === col ? 0 : c)) : r
        );
        setGrid(newGrid);
      } else if (tool === 'picker') {
        const tileId = grid[row][col];
        const pickedTile = tiles.find(t => t.id === tileId);
        if (pickedTile) {
          setSelectedTileId(tileId);
          setTool('brush');
          toast({title: 'Tile Picked', description: `Switched to brush with tile "${pickedTile.name}"`});
        }
      } else if (tool === 'fill') {
        const targetId = grid[row][col];
        const replacementId = selectedTileId;

        if (targetId === replacementId) return;

        const newGrid = grid.map(r => [...r]);
        const queue: [number, number][] = [[row, col]];
        const visited = new Set<string>();
        visited.add(`${row},${col}`);

        const width = newGrid[0].length;
        const height = newGrid.length;

        while (queue.length > 0) {
          const [r, c] = queue.shift()!;
          
          if (newGrid[r][c] === targetId) {
            newGrid[r][c] = replacementId;

            const neighbors: [number, number][] = [
              [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
            ];

            for (const [nr, nc] of neighbors) {
              const key = `${nr},${nc}`;
              if (nr >= 0 && nr < height && nc >= 0 && nc < width && !visited.has(key)) {
                queue.push([nr, nc]);
                visited.add(key);
              }
            }
          }
        }
        setGrid(newGrid);

      } else if (tool === 'ai') {
        if (grid[row][col] !== 0) return;
        setProcessingAI(true);
        try {
          const availableTiles = tiles.filter(t => t.id !== 0).map(t => t.id);
          if (availableTiles.length === 0) {
            toast({ variant: 'destructive', title: 'AI Error', description: 'No tiles available for AI placement.' });
            setProcessingAI(false);
            return;
          }
          
          // Create a 5x5 window around the target cell
          const windowSize = 5;
          const halfWindow = Math.floor(windowSize / 2);
          const surroundingTiles: number[][] = [];
          for (let r = -halfWindow; r <= halfWindow; r++) {
            const rowTiles: number[] = [];
            for (let c = -halfWindow; c <= halfWindow; c++) {
              const neighborRow = row + r;
              const neighborCol = col + c;
              if (
                neighborRow >= 0 &&
                neighborRow < grid.length &&
                neighborCol >= 0 &&
                neighborCol < grid[0].length
              ) {
                rowTiles.push(grid[neighborRow][neighborCol]);
              } else {
                rowTiles.push(0); // Use empty tile for out-of-bounds
              }
            }
            surroundingTiles.push(rowTiles);
          }
          
          const result = await intelligentTilePlacement({ surroundingTiles, availableTiles });
          
          const newGrid = grid.map((r, rIndex) =>
            rIndex === row ? r.map((c, cIndex) => (cIndex === col ? result.suggestedTile : c)) : r
          );
          setGrid(newGrid);
        } catch (error: any) {
          console.error('AI placement failed:', error);
          if (error.message?.includes('API key not found')) {
            setShowApiKeyAlert(true);
          }
          toast({ variant: 'destructive', title: 'AI Error', description: 'Could not suggest a tile. Check your API key and network.' });
        } finally {
          setProcessingAI(false);
        }
      }
    },
    [grid, selectedTileId, tool, setGrid, tiles, toast]
  );
  
  const handleShapeDraw = useCallback((start: {row: number, col: number}, end: {row: number, col: number}) => {
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);

    if (tool === 'select') {
      setSelection({ minRow, minCol, maxRow, maxCol });
      return;
    }

    setSelection(null);

    const newGrid = grid.map(r => [...r]);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (r < grid.length && c < grid[0].length) {
          newGrid[r][c] = selectedTileId;
        }
      }
    }
    setGrid(newGrid);
  }, [grid, selectedTileId, setGrid, tool]);

  const applyToSelection = (callback: (currentValue: number) => number) => {
     if (!selection) return;

    const newGrid = grid.map((r, rowIndex) => {
        if (rowIndex < selection.minRow || rowIndex > selection.maxRow) {
            return r;
        }
        return r.map((cell, colIndex) => {
            if (colIndex >= selection.minCol && colIndex <= selection.maxCol) {
                return callback(cell);
            }
            return cell;
        });
    });

    setGrid(newGrid);
  }

  const handleFillSelection = () => {
    applyToSelection(() => selectedTileId);
    toast({ title: 'Selection Filled', description: 'The selected area has been filled with the current tile.' });
  }

  const handleDeleteSelection = () => {
    applyToSelection(() => 0);
    toast({ title: 'Selection Deleted', description: 'The selected area has been cleared.' });
  }
  
  const handleInvertSelection = () => {
    if (selectedTileId === 0) {
      toast({ variant: 'destructive', title: 'Invert Failed', description: 'Cannot invert with Empty tile. Please select a tile.' });
      return;
    }
    applyToSelection((cell) => cell === selectedTileId ? 0 : selectedTileId);
    toast({ title: 'Selection Inverted', description: 'Tiles in the selected area have been inverted.' });
  }

  const handleCopySelection = () => {
    if (!selection) return;

    const copiedData = grid
      .slice(selection.minRow, selection.maxRow + 1)
      .map(row => row.slice(selection.minCol, selection.maxCol + 1));
    
    setClipboard(copiedData);
    toast({ title: 'Selection Copied', description: 'The selected area has been copied to the clipboard.' });
  }

  const handlePasteSelection = () => {
    if (!selection || !clipboard) return;
    
    const newGrid = grid.map(r => [...r]);
    const pasteStartRow = selection.minRow;
    const pasteStartCol = selection.minCol;

    for(let r = 0; r < clipboard.length; r++) {
        for(let c = 0; c < clipboard[0].length; c++) {
            const targetRow = pasteStartRow + r;
            const targetCol = pasteStartCol + c;
            if (targetRow < grid.length && targetCol < grid[0].length) {
                newGrid[targetRow][targetCol] = clipboard[r][c];
            }
        }
    }
    setGrid(newGrid);
    toast({ title: 'Pasted', description: 'Clipboard content has been pasted.' });
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // prevent browser shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'y' || e.key === 's' || e.key === '0' || e.key === '=' || e.key === '-' || e.key === 'c' || e.key === 'v')) {
         e.preventDefault();
      }
      
      const target = e.target as HTMLElement;
      // Do not process shortcuts if user is typing in an input
      if (target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'textarea') return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (e.key === 'y') {
          redo();
        } else if (e.key === 's') {
          handleExportMap();
        } else if (e.key === '=') {
          setZoom(z => Math.min(z + 0.1, 2));
        } else if (e.key === '-') {
          setZoom(z => Math.max(z - 0.1, 0.1));
        } else if (e.key === '0') {
          setZoom(1);
        } else if (e.key === 'c' && selection) {
          handleCopySelection();
        } else if (e.key === 'v' && selection && clipboard) {
          handlePasteSelection();
        }
      } else {
         const keyMap: { [key: string]: Tool } = {
          'b': 'brush',
          'e': 'eraser',
          'p': 'picker',
          'i': 'ai',
          'g': 'fill', // G for GIMP/Photoshop bucket fill
          'r': 'rectangle',
          'm': 'select', // M for marquee
        };

        if (keyMap[e.key]) {
          setTool(keyMap[e.key]);
        } else if (e.key === 'Escape') {
            if (selection) {
                setSelection(null);
            }
        } else if (e.key === 'Delete' && selection) {
           handleDeleteSelection();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setZoom, selection, grid, clipboard]);


  const toolbarActions = {
    brush: { icon: Brush, label: 'Brush (B)' },
    eraser: { icon: Eraser, label: 'Eraser (E)' },
    picker: { icon: Pipette, label: 'Picker (P)' },
    fill: { icon: PaintBucket, label: 'Fill (G)'},
    rectangle: { icon: RectangleHorizontal, label: 'Rectangle (R)' },
    select: { icon: Lasso, label: 'Select (M)' },
    ai: { icon: isProcessingAI ? Loader : Sparkles, label: isProcessingAI ? 'Thinking...' : 'AI Place (I)', disabled: isProcessingAI },
  };

  const headerActions = [
    { icon: Upload, label: 'Import Tiles', onClick: () => tileImportRef.current?.click() },
    { icon: Scissors, label: 'Slice Sheet', onClick: () => setSlicerOpen(true) },
    { icon: Package, label: 'Export Spritesheet', onClick: () => setExportOpen(true) },
    { icon: Download, label: 'Export Map', onClick: handleExportMap },
    { icon: Undo, label: 'Undo (Ctrl+Z)', onClick: undo, disabled: !canUndo },
    { icon: Redo, label: 'Redo (Ctrl+Shift+Z)', onClick: redo, disabled: !canRedo },
  ];
  
  const selectionActions = {
    fill: { icon: FileCheck, label: 'Fill Selection', onClick: handleFillSelection },
    copy: { icon: Copy, label: 'Copy (Ctrl+C)', onClick: handleCopySelection },
    paste: { icon: ClipboardPaste, label: 'Paste (Ctrl+V)', onClick: handlePasteSelection, disabled: !clipboard },
    delete: { icon: Trash2, label: 'Delete (Del)', onClick: handleDeleteSelection },
    invert: { icon: Replace, label: 'Invert', onClick: handleInvertSelection },
  };


  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-screen bg-background text-foreground font-body">
        <Header title="TileForge" icon={GridIcon} actions={headerActions} />
        <div className="flex flex-1 overflow-hidden">
          <aside
            className={cn(
              'bg-card border-r border-border flex flex-col transition-all duration-300',
              isToolbarCollapsed ? 'w-[73px]' : 'w-60'
            )}
          >
            <div className="flex-grow overflow-y-auto">
               <Toolbar<Tool>
                actions={toolbarActions}
                selectedAction={tool}
                onActionSelect={(t) => {
                    setTool(t);
                    if (t !== 'select') setSelection(null);
                }}
                gridSize={gridSize}
                onGridResize={handleGridResize}
                zoom={zoom}
                onZoomChange={setZoom}
                isCollapsed={isToolbarCollapsed}
                selection={selection}
                selectionActions={selectionActions}
              />
            </div>
            <Separator />
            <div className="p-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setToolbarCollapsed(!isToolbarCollapsed)}
                    className="w-full"
                  >
                    {isToolbarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{isToolbarCollapsed ? 'Expand Toolbar' : 'Collapse Toolbar'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </aside>
          <main className="flex-1 flex flex-col items-center justify-center p-4 bg-muted/20 overflow-auto">
             {showApiKeyAlert && (
              <Alert className="mb-4 max-w-2xl">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Gemini API Key Needed</AlertTitle>
                <AlertDescription>
                  The AI tool requires a Gemini API key. Please get one from{' '}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">
                    Google AI Studio
                  </a> and add it to a <code>.env</code> file in your project:
                  <pre className="mt-2 p-2 bg-muted rounded-md text-xs overflow-x-auto">
                    GEMINI_API_KEY="YOUR_API_KEY_HERE"
                  </pre>
                </AlertDescription>
              </Alert>
            )}
            <MapGrid
              grid={grid}
              tiles={tiles}
              onCellAction={handleCellAction}
              onShapeDraw={handleShapeDraw}
              tool={tool}
              zoom={zoom}
              selectedTileId={selectedTileId}
              selection={selection}
            />
          </main>
          <aside className={cn(
              "bg-card border-l border-border flex flex-col transition-all duration-300",
              isPaletteCollapsed ? 'w-[73px]' : 'w-80'
            )}>
            <div className="flex-grow overflow-y-auto">
              <TilePalette
                tiles={tiles}
                selectedTileId={selectedTileId}
                onSelectTile={setSelectedTileId}
                onRenameTile={handleRenameTile}
                onDeleteTile={handleDeleteTile}
                isCollapsed={isPaletteCollapsed}
              />
            </div>
            <Separator />
            <div className="p-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPaletteCollapsed(!isPaletteCollapsed)}
                    className="w-full"
                  >
                    {isPaletteCollapsed ? <PanelRightOpen /> : <PanelRightClose />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>{isPaletteCollapsed ? 'Expand Palette' : 'Collapse Palette'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </aside>
        </div>

        <input
          type="file"
          ref={tileImportRef}
          onChange={handleImportTiles}
          accept="image/png"
          multiple
          className="hidden"
        />
        
        <SpritesheetSlicerModal
          isOpen={isSlicerOpen}
          onClose={() => setSlicerOpen(false)}
          onSlice={addTiles}
        />
        <ExportTilesModal
          isOpen={isExportOpen}
          onClose={() => setExportOpen(false)}
          tiles={tiles.filter((t) => t.id !== 0)}
        />
        
        <AlertDialog open={!!tileToDelete} onOpenChange={() => setTileToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this tile?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the tile &quot;{tileToDelete?.name}&quot; from the palette and replace all instances of it on the grid with an empty tile. This action can be undone for a few seconds.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setTileToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteTile}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </TooltipProvider>
  );
}
