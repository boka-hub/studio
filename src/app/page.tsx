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
} from 'lucide-react';
import { Header } from '@/components/header';
import { Toolbar } from '@/components/toolbar';
import { TilePalette } from '@/components/tile-palette';
import { MapGrid } from '@/components/map-grid';
import { SpritesheetSlicerModal } from '@/components/spritesheet-slicer-modal';
import { ExportTilesModal } from '@/components/export-tiles-modal';
import type { Tool, Tile, GridState } from '@/lib/types';
import { useUndoRedo } from '@/hooks/use-undo-redo';
import { intelligentTilePlacement } from '@/ai/flows/intelligent-tile-placement';
import { useToast } from "@/hooks/use-toast";
import { TooltipProvider } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  } = useUndoRedo<GridState>(createEmptyGrid(gridSize.width, gridSize.height));

  const [tiles, setTiles] = useState<Tile[]>([
    { id: 0, name: 'Empty', src: '' }, // Empty tile
  ]);
  const [selectedTileId, setSelectedTileId] = useState<number>(1);
  const [tool, setTool] = useState<Tool>('brush');
  const [isSlicerOpen, setSlicerOpen] = useState(false);
  const [isExportOpen, setExportOpen] = useState(false);
  const [isProcessingAI, setProcessingAI] = useState(false);
  const [zoom, setZoom] = useState(1);
  const { toast } = useToast();

  const tileImportRef = useRef<HTMLInputElement>(null);

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
    setGrid(newGrid);
    toast({ title: 'Grid Resized', description: `Grid is now ${newWidth}x${newHeight} tiles.` });
  };
  
  const addTiles = (newTiles: Omit<Tile, 'id'>[]) => {
    setTiles((prevTiles) => {
      let nextId = prevTiles.length > 0 ? Math.max(...prevTiles.map((t) => t.id)) + 1 : 1;
      const tilesWithIds = newTiles.map((tile) => {
        const uniqueName = tile.name;
        // Ensure unique name on import, though renaming handles conflicts later
        return { ...tile, name: uniqueName, id: nextId++ };
      });
      return [...prevTiles, ...tilesWithIds];
    });
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
    const mapData = JSON.stringify(grid);
    const blob = new Blob([mapData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tileforge-map.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Map Exported', description: 'Your map has been saved as tileforge-map.json' });
  };
  
  const handleCellAction = useCallback(
    async (row: number, col: number) => {
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
        if (tiles.find(t => t.id === tileId)) {
          setSelectedTileId(tileId);
          setTool('brush');
          toast({title: 'Tile Picked', description: `Switched to brush with tile "${tiles.find(t => t.id === tileId)?.name}"`});
        }
      } else if (tool === 'ai') {
        if (grid[row][col] !== 0) return;
        setProcessingAI(true);
        try {
          const availableTiles = tiles.filter(t => t.id !== 0).map(t => t.id);
          if (availableTiles.length === 0) {
            toast({ variant: 'destructive', title: 'AI Error', description: 'No tiles available for AI placement.' });
            return;
          }
          const numericGrid = grid.map(r => r.map(c => c));
          const result = await intelligentTilePlacement({ grid: numericGrid, row, col, availableTiles });
          
          const newGrid = grid.map((r, rIndex) =>
            rIndex === row ? r.map((c, cIndex) => (cIndex === col ? result.suggestedTile : c)) : r
          );
          setGrid(newGrid);
        } catch (error) {
          console.error('AI placement failed:', error);
          toast({ variant: 'destructive', title: 'AI Error', description: 'Could not suggest a tile.' });
        } finally {
          setProcessingAI(false);
        }
      }
    },
    [grid, selectedTileId, tool, setGrid, tiles, toast]
  );
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // prevent browser shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'y' || e.key === 's' || e.key === '0' || e.key === '=' || e.key === '-')) {
         e.preventDefault();
      }
      
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
        }
      } else {
         const keyMap: { [key: string]: Tool } = {
          'b': 'brush',
          'e': 'eraser',
          'p': 'picker',
          'i': 'ai',
        };
        const target = e.target as HTMLElement;
        // Do not switch tools if user is typing in an input
        if (target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'textarea') return;

        if (keyMap[e.key]) {
          setTool(keyMap[e.key]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setZoom]);


  const toolbarActions = {
    brush: { icon: Brush, label: 'Brush (B)' },
    eraser: { icon: Eraser, label: 'Eraser (E)' },
    picker: { icon: Pipette, label: 'Picker (P)' },
    ai: { icon: isProcessingAI ? Loader : Sparkles, label: isProcessingAI ? 'Thinking...' : 'AI Place (I)', disabled: isProcessingAI },
  };

  const headerActions = [
    { icon: Upload, label: 'Import Tiles', onClick: () => tileImportRef.current?.click() },
    { icon: Scissors, label: 'Slice Sheet', onClick: () => setSlicerOpen(true) },
    { icon: Package, label: 'Export Tiles', onClick: () => setExportOpen(true) },
    { icon: Download, label: 'Export Map', onClick: handleExportMap },
    { icon: Undo, label: 'Undo (Ctrl+Z)', onClick: undo, disabled: !canUndo },
    { icon: Redo, label: 'Redo (Ctrl+Y)', onClick: redo, disabled: !canRedo },
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-screen bg-background text-foreground font-body">
        <Header title="TileForge" icon={GridIcon} actions={headerActions} />
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-72 flex flex-col bg-card border-r border-border">
             <ScrollArea className="flex-1">
              <Toolbar<Tool>
                actions={toolbarActions}
                selectedAction={tool}
                onActionSelect={setTool}
                gridSize={gridSize}
                onGridResize={handleGridResize}
                zoom={zoom}
                onZoomChange={setZoom}
              />
              <TilePalette
                tiles={tiles}
                selectedTileId={selectedTileId}
                onSelectTile={setSelectedTileId}
                onRenameTile={handleRenameTile}
              />
            </ScrollArea>
          </aside>
          <main className="flex-1 flex items-center justify-center p-4 bg-muted/20 overflow-auto">
            <MapGrid
              grid={grid}
              tiles={tiles}
              onCellAction={handleCellAction}
              tool={tool}
              zoom={zoom}
            />
          </main>
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
      </div>
    </TooltipProvider>
  );
}
