
"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels"
import {
  Brush,
  Eraser,
  Pipette,
  Scissors,
  Package,
  PaintBucket,
  PanelLeft,
  PanelRight,
  RectangleHorizontal,
  Lasso,
  FileCheck,
  Copy,
  ClipboardPaste,
  Trash2,
  Replace,
  SprayCan,
  Layers,
  Waves,
  Wand2,
  FlipHorizontal,
  FlipVertical,
  Play,
  StopCircle,
  ToyBrick,
  Upload,
  Download,
  Import,
  Export,
  PersonStanding,
  Dices,
} from 'lucide-react';
import { Header } from '@/components/header';
import { Toolbar } from '@/components/toolbar';
import { TilePalette } from '@/components/tile-palette';
import { SpritesheetSlicerModal } from '@/components/spritesheet-slicer-modal';
import { ExportTilesModal } from '@/components/export-tiles-modal';
import { SettingsModal } from '@/components/settings-modal';
import type { Tool, Tile, GridState, Selection } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { isTileTransparent } from '@/lib/utils';
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
import { cn } from '@/lib/utils';
import { MapGrid } from '@/components/map-grid';

const INITIAL_GRID_SIZE = 32;

const createEmptyGrid = (width: number, height: number): GridState =>
  Array(height)
    .fill(null)
    .map(() => Array(width).fill(0));

const initialGrid = createEmptyGrid(INITIAL_GRID_SIZE, INITIAL_GRID_SIZE);
const initialTiles: Tile[] = [{ id: 0, name: 'Empty', src: '', solid: false }];

const usePersistentState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    // This function runs only on the client, avoiding server/client mismatch
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    // This effect runs only on the client
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    }
  }, [key, state]);

  return [state, setState];
};


export default function Home() {
  const [grid, setGrid] = usePersistentState<GridState>('tileforge-grid', initialGrid);
  const [tiles, setTiles] = usePersistentState<Tile[]>( 'tileforge-tiles', initialTiles);
  const [gridSize, setGridSize] = useState({ width: grid[0]?.length || INITIAL_GRID_SIZE, height: grid.length || INITIAL_GRID_SIZE });

  const [selectedTileId, setSelectedTileId] = useState<number>(0);
  const [secondarySelectedTileId, setSecondarySelectedTileId] = useState<number>(0);
  const [scatterSet, setScatterSet] = useState<number[]>([]);
  const [tool, setTool] = useState<Tool>('brush');
  const [selection, setSelection] = useState<Selection | null>(null);
  const [clipboard, setClipboard] = useState<GridState | null>(null);
  const [isSlicerOpen, setSlicerOpen] = useState(false);
  const [slicerInitialFiles, setSlicerInitialFiles] = useState<File[]>([]);
  const [isExportOpen, setExportOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [zoom, setZoom] = usePersistentState('tileforge-zoom', 1);
  const [tileToDelete, setTileToDelete] = useState<Tile | null>(null);
  const [isToolbarCollapsed, setToolbarCollapsed] = useState(false);
  const [isPaletteCollapsed, setPaletteCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewMode, setPreviewMode] = useState(false);
  const [playerPos, setPlayerPos] = useState({ row: 0, col: 0 });
  
  const [sprayRadius, setSprayRadius] = useState(3);
  const [sprayDensity, setSprayDensity] = useState(0.4);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { toast } = useToast();

  const tileImportRef = useRef<HTMLInputElement>(null);
  const leftPanelRef = useRef<any>(null);
  const rightPanelRef = useRef<any>(null);
  
  const toggleToolbar = () => {
    const panel = leftPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.expand();
    } else {
      panel.collapse();
    }
  }

  const togglePalette = () => {
    const panel = rightPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.expand();
    } else {
      panel.collapse();
    }
  }


  const updateGridState = (newGrid: GridState) => {
    setGrid(newGrid);
    setGridSize({ width: newGrid[0]?.length || 0, height: newGrid.length || 0 });
  };
  
  const updateTilesState = (newTiles: Tile[]) => {
    setTiles(newTiles);
  };

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
    updateGridState(newGrid);
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
      let nextId = tiles.length > 0 ? Math.max(...tiles.map((t) => t.id)) + 1 : 1;
      const tilesWithIds = filteredTiles.map((tile) => ({
        ...tile,
        id: nextId++,
        solid: false,
      }));
      updateTilesState([...tiles, ...tilesWithIds]);
    }
  };

  const handleRenameTile = (tileId: number, newName: string) => {
    const isNameTaken = tiles.some(t => t.name === newName && t.id !== tileId);
    if (isNameTaken) {
      toast({ variant: 'destructive', title: 'Rename Failed', description: 'A tile with that name already exists.' });
      return;
    }
    const newTiles = tiles.map((tile) =>
      tile.id === tileId ? { ...tile, name: newName } : tile
    );
    updateTilesState(newTiles);
    toast({ title: 'Tile Renamed', description: `Tile has been renamed to "${newName}".` });
  };

  const handleToggleSolid = (tileId: number) => {
    const newTiles = tiles.map(t =>
      t.id === tileId ? { ...t, solid: !t.solid } : t
    );
    updateTilesState(newTiles);
  };

  const confirmDeleteTile = () => {
    if (!tileToDelete) return;

    const tileId = tileToDelete.id;
    
    // Remove tile from palette
    const newTiles = tiles.filter(t => t.id !== tileId);
    updateTilesState(newTiles);
    
    // Remove tile from grid and update history
    const newGrid = grid.map(row => row.map(cell => (cell === tileId ? 0 : cell)));
    updateGridState(newGrid);
    
    // If deleted tile was selected, select empty tile
    if (selectedTileId === tileId) {
      setSelectedTileId(0);
    }
    if (secondarySelectedTileId === tileId) {
      setSecondarySelectedTileId(0);
    }
    setScatterSet(s => s.filter(id => id !== tileId));

    toast({ 
      title: 'Tile Deleted', 
      description: `Tile "${tileToDelete.name}" has been removed.`,
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

    const fileList = Array.from(files);
    const newTiles: Omit<Tile, 'id'>[] = [];
    let processedCount = 0;

    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newTiles.push({ name: file.name.replace(/\.[^/.]+$/, ""), src: e.target?.result as string });
        processedCount++;
        if (processedCount === fileList.length) {
          addTiles(newTiles);
        }
      };
      reader.readAsDataURL(file);
    });
    event.target.value = '';
  };
  
  const openSlicer = (files: File[] = []) => {
    setSlicerInitialFiles(files);
    setSlicerOpen(true);
  }

  const handleExportMap = useCallback(() => {
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
  },[grid, toast]);
  
  const handleCellAction = useCallback(
    async (row: number, col: number) => {
      if (tool === 'select' || tool === 'rectangle' || tool === 'gradient' || tool === 'noise' || tool === 'scatter') {
        return;
      }
      setSelection(null);
      
      let newGrid = grid.map(r => [...r]);

      if (tool === 'brush') {
        if (grid[row][col] === selectedTileId) return;
        newGrid[row][col] = selectedTileId;
      } else if (tool === 'eraser') {
        if (grid[row][col] === 0) return;
        newGrid[row][col] = 0;
      } else if (tool === 'picker') {
        const tileId = grid[row][col];
        const pickedTile = tiles.find(t => t.id === tileId);
        if (pickedTile) {
          setSelectedTileId(tileId);
          setTool('brush');
          toast({title: 'Tile Picked', description: `Switched to brush with tile "${pickedTile.name}"`});
        }
        return; 
      } else if (tool === 'spray') {
        for (let r = -sprayRadius; r <= sprayRadius; r++) {
            for (let c = -sprayRadius; c <= sprayRadius; c++) {
                if (r * r + c * c <= sprayRadius * sprayRadius) {
                    const targetRow = row + r;
                    const targetCol = col + c;
                    if (targetRow >= 0 && targetRow < grid.length && targetCol >= 0 && targetCol < grid[0].length) {
                        if (Math.random() < sprayDensity) {
                            newGrid[targetRow][targetCol] = selectedTileId;
                        }
                    }
                }
            }
        }
      } else if (tool === 'fill') {
        const targetId = grid[row][col];
        const replacementId = selectedTileId;

        if (targetId === replacementId) return;

        const queue: [number, number][] = [[row, col]];
        const visited = new Set<string>();
        visited.add(`${row},${col}`);
        const width = newGrid[0].length;
        const height = newGrid.length;

        while (queue.length > 0) {
          const [r, c] = queue.shift()!;
          if (newGrid[r][c] === targetId) {
            newGrid[r][c] = replacementId;
            const neighbors: [number, number][] = [ [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1] ];
            for (const [nr, nc] of neighbors) {
              const key = `${nr},${nc}`;
              if (nr >= 0 && nr < height && nc >= 0 && nc < width && !visited.has(key)) {
                if(newGrid[nr][nc] === targetId) queue.push([nr, nc]);
                visited.add(key);
              }
            }
          }
        }
      } else if (tool === 'magic-wand') {
        const targetId = grid[row][col];
        if (targetId === 0) return;

        const queue: [number, number][] = [[row, col]];
        const visited = new Set<string>();
        visited.add(`${row},${col}`);
        let minRow = row, maxRow = row, minCol = col, maxCol = col;
        const width = grid[0].length;
        const height = grid.length;

        while (queue.length > 0) {
          const [r, c] = queue.shift()!;
          minRow = Math.min(minRow, r); maxRow = Math.max(maxRow, r);
          minCol = Math.min(minCol, c); maxCol = Math.max(maxCol, c);
          
          const neighbors: [number, number][] = [ [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1] ];
          for (const [nr, nc] of neighbors) {
            const key = `${nr},${nc}`;
            if (nr >= 0 && nr < height && nc >= 0 && nc < width && !visited.has(key)) {
                visited.add(key);
                if (grid[nr][nc] === targetId) queue.push([nr, nc]);
            }
          }
        }

        const selectedCellsGrid = createEmptyGrid(width, height);
        visited.forEach(key => {
            const [r, c] = key.split(',').map(Number);
            if(grid[r][c] === targetId) selectedCellsGrid[r][c] = 1; 
        });
        
        setSelection({ minRow, minCol, maxRow, maxCol, selectedCells: selectedCellsGrid });
        toast({ title: 'Area Selected', description: 'Selected all connected tiles.' });
        return; 
      }
      updateGridState(newGrid);
    },
    [grid, selectedTileId, tiles, toast, tool, sprayRadius, sprayDensity, updateGridState]
  );
  
  const handleShapeDraw = useCallback((start: {row: number, col: number}, end: {row: number, col: number}) => {
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);

    if (tool === 'select') {
      const selectedCellsGrid = createEmptyGrid(grid[0].length, grid.length);
        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                if (r < grid.length && c < grid[0].length) {
                    selectedCellsGrid[r][c] = 1;
                }
            }
        }
      setSelection({ minRow, minCol, maxRow, maxCol, selectedCells: selectedCellsGrid });
      return;
    }

    setSelection(null);
    let newGrid = grid.map(r => [...r]);

    if (tool === 'rectangle') {
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            if (r < grid.length && c < grid[0].length) {
              newGrid[r][c] = selectedTileId;
            }
          }
        }
    } else if (tool === 'gradient') {
        const width = maxCol - minCol + 1;
        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) {
                    const step = (c - minCol) / Math.max(1, width - 1);
                    const threshold = (r % 2 === 0) ? (c % 2 === 0 ? 0.25 : 0.75) : (c % 2 === 0 ? 0.75 : 0.25);
                    newGrid[r][c] = step < threshold ? selectedTileId : secondarySelectedTileId;
                }
            }
        }
    } else if (tool === 'noise') {
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) {
                const random = Math.sin(r * 12.9898 + c * 78.233) * 43758.5453;
                newGrid[r][c] = (random - Math.floor(random)) < 0.5 ? selectedTileId : secondarySelectedTileId;
            }
          }
        }
    } else if (tool === 'scatter') {
        if (scatterSet.length === 0) {
            toast({ variant: 'destructive', title: 'Scatter Failed', description: 'Your scatter set is empty. Click tiles in the palette to add them.' });
            return;
        }
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) {
                const randomIndex = Math.floor(Math.random() * scatterSet.length);
                newGrid[r][c] = scatterSet[randomIndex];
            }
          }
        }
    }
    updateGridState(newGrid);
  }, [grid, selectedTileId, secondarySelectedTileId, tool, scatterSet, toast, updateGridState]);

  const applyToSelection = (callback: (currentValue: number, rowIndex: number, colIndex: number, selection: Selection) => number) => {
     if (!selection) return;

    const newGrid = grid.map((r, rowIndex) => {
        if (rowIndex < selection.minRow || rowIndex > selection.maxRow) {
            return r;
        }
        return r.map((cell, colIndex) => {
            if (colIndex >= selection.minCol && colIndex <= selection.maxCol) {
                if (selection.selectedCells && selection.selectedCells[rowIndex][colIndex] === 0) {
                    return cell;
                }
                return callback(cell, rowIndex, colIndex, selection);
            }
            return cell;
        });
    });

    updateGridState(newGrid);
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
  
  const handleMirrorHorizontal = () => {
    if (!selection) return;
    const selectionWidth = selection.maxCol - selection.minCol + 1;
    const tempSelection = grid.slice(selection.minRow, selection.maxRow + 1).map(row => row.slice(selection.minCol, selection.maxCol + 1));
    
    applyToSelection((_cell, rowIndex, colIndex, sel) => {
        const sourceCol = sel.minCol + (selectionWidth - 1 - (colIndex - sel.minCol));
        return tempSelection[rowIndex - sel.minRow][sourceCol - sel.minCol];
    });
    toast({ title: 'Selection Mirrored', description: 'The selected area has been mirrored horizontally.' });
  }

  const handleMirrorVertical = () => {
    if (!selection) return;
    const selectionHeight = selection.maxRow - selection.minRow + 1;
    const tempSelection = grid.slice(selection.minRow, selection.maxRow + 1).map(row => row.slice(selection.minCol, selection.maxCol + 1));
    
    applyToSelection((_cell, rowIndex, colIndex, sel) => {
        const sourceRow = sel.minRow + (selectionHeight - 1 - (rowIndex - sel.minRow));
        return tempSelection[sourceRow - sel.minRow][colIndex - sel.minCol];
    });
     toast({ title: 'Selection Mirrored', description: 'The selected area has been mirrored vertically.' });
  }

  const handleCopySelection = useCallback(() => {
    if (!selection?.selectedCells) return;

    const copiedData = grid
      .slice(selection.minRow, selection.maxRow + 1)
      .map((row, rIndex) => row.slice(selection.minCol, selection.maxCol + 1)
        .map((cell, cIndex) => {
          if (selection.selectedCells && selection.selectedCells[selection.minRow + rIndex][selection.minCol + cIndex] === 0) {
            return -1; // Use -1 to signify not part of the selection
          }
          return cell;
        })
      );
    
    setClipboard(copiedData);
    toast({ title: 'Selection Copied', description: 'The selected area has been copied to the clipboard.' });
  }, [grid, selection, toast]);

  const handlePasteSelection = useCallback(() => {
    if (!selection || !clipboard) return;
    
    const newGrid = grid.map(r => [...r]);
    const pasteStartRow = selection.minRow;
    const pasteStartCol = selection.minCol;

    for(let r = 0; r < clipboard.length; r++) {
        for(let c = 0; c < clipboard[0].length; c++) {
            const targetRow = pasteStartRow + r;
            const targetCol = pasteStartCol + c;
            const copiedCell = clipboard[r][c];
            if (copiedCell !== -1 && targetRow < grid.length && targetCol < grid[0].length) {
                newGrid[targetRow][targetCol] = copiedCell;
            }
        }
    }
    updateGridState(newGrid);
    toast({ title: 'Pasted', description: 'Clipboard content has been pasted.' });
  }, [grid, selection, clipboard, toast, updateGridState]);
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const imageFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        openSlicer(imageFiles);
      } else {
        toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Only image files can be dropped.' });
      }
      e.dataTransfer.clearData();
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isPreviewMode) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape'].includes(e.key)) {
          e.preventDefault();
          if (e.key === 'Escape') {
              setPreviewMode(false);
              toast({ title: 'Exited Preview Mode' });
              return;
          }
          
          let { row, col } = playerPos;
          if (e.key === 'ArrowUp') row--;
          if (e.key === 'ArrowDown') row++;
          if (e.key === 'ArrowLeft') col--;
          if (e.key === 'ArrowRight') col++;

          row = Math.max(0, Math.min(grid.length - 1, row));
          col = Math.max(0, Math.min(grid[0].length - 1, col));

          const tileId = grid[row][col];
          const tile = tiles.find(t => t.id === tileId);
          if (!tile?.solid) {
              setPlayerPos({ row, col });
          }
      }
      return;
    }
    
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'y' || e.key === 's' || e.key === '0' || e.key === '=' || e.key === '-' || e.key === 'c' || e.key === 'v')) {
       e.preventDefault();
    }
    
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'textarea' || target.role === 'slider') return;

    if (e.ctrlKey || e.metaKey) {
      if (e.key === 's') {
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
        'b': 'brush', 'e': 'eraser', 'p': 'picker', 'g': 'fill',
        'r': 'rectangle', 'm': 'select', 'w': 'magic-wand', 's': 'spray',
        'l': 'gradient', 'n': 'noise', 'c': 'scatter',
      };

      if (keyMap[e.key]) {
        setTool(keyMap[e.key]);
      } else if (e.key === 'Escape') {
          if (selection) setSelection(null);
      } else if (e.key === 'Delete' && selection) {
         handleDeleteSelection();
      }
    }
  }, [clipboard, grid, handleCopySelection, handleExportMap, handlePasteSelection, isPreviewMode, playerPos, selection, setZoom, tiles, toast]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleToolSelect = (newTool: Tool) => {
    setTool(newTool);
    if (newTool !== 'select' && newTool !== 'magic-wand') {
      setSelection(null);
    }
    const toolsWithSettings: Tool[] = ['spray', 'rectangle', 'gradient', 'noise', 'scatter'];
    if (toolsWithSettings.includes(newTool)) {
      leftPanelRef.current?.expand();
    }
  };

  const togglePreviewMode = () => {
    const newPreviewState = !isPreviewMode;
    if (newPreviewState) {
      // Find first non-solid tile to start
      let startPos = { row: 0, col: 0 };
      let found = false;
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[0].length; c++) {
          const tileId = grid[r][c];
          const tile = tiles.find(t => t.id === tileId);
          if (!tile?.solid) {
            startPos = { row: r, col: c };
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (!found) {
        toast({
          variant: 'destructive',
          title: 'No Valid Start Position',
          description: 'The entire map is solid. Player placed at (0,0).'
        });
      }
      setPlayerPos(startPos);
    }
    setPreviewMode(newPreviewState);
  };

  const toolbarActions = {
    brush: { icon: Brush, label: 'Brush (B)' },
    eraser: { icon: Eraser, label: 'Eraser (E)' },
    picker: { icon: Pipette, label: 'Picker (P)' },
    fill: { icon: PaintBucket, label: 'Fill (G)'},
    spray: { icon: SprayCan, label: 'Spray (S)' },
    rectangle: { icon: RectangleHorizontal, label: 'Rectangle (R)' },
    gradient: { icon: Layers, label: 'Gradient (L)' },
    noise: { icon: Waves, label: 'Noise (N)' },
    scatter: { icon: Dices, label: 'Scatter (C)'},
    select: { icon: Lasso, label: 'Select (M)' },
    'magic-wand': { icon: Wand2, label: 'Wand (W)' },
  };

  const headerActions = [
    { icon: Upload, label: 'Import Tiles', onClick: () => tileImportRef.current?.click() },
    { icon: Scissors, label: 'Slice Sheet', onClick: () => openSlicer() },
    { icon: Package, label: 'Export Spritesheet', onClick: () => setExportOpen(true) },
    { icon: Download, label: 'Export Map', onClick: handleExportMap },
    { icon: isPreviewMode ? StopCircle : Play, label: isPreviewMode ? 'Stop Preview (Esc)' : 'Live Preview (Arrows to move, Esc to exit)', onClick: togglePreviewMode, isActive: isPreviewMode },
  ];
  
  const selectionActions = {
    fill: { icon: FileCheck, label: 'Fill Selection', onClick: handleFillSelection },
    copy: { icon: Copy, label: 'Copy (Ctrl+C)', onClick: handleCopySelection },
    paste: { icon: ClipboardPaste, label: 'Paste (Ctrl+V)', onClick: handlePasteSelection, disabled: !clipboard },
    delete: { icon: Trash2, label: 'Delete (Del)', onClick: handleDeleteSelection },
    invert: { icon: Replace, label: 'Invert', onClick: handleInvertSelection },
    mirrorHorizontal: { icon: FlipHorizontal, label: 'Mirror Horizontal', onClick: handleMirrorHorizontal },
    mirrorVertical: { icon: FlipVertical, label: 'Mirror Vertical', onClick: handleMirrorVertical },
  };
  
  const handleLayout = (sizes: number[]) => {
      if (typeof window !== 'undefined') {
          localStorage.setItem('tileforge-panel-layout', JSON.stringify(sizes));
      }
  }
  
  const defaultLayout = isClient && typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('tileforge-panel-layout') || '[15, 70, 15]')) : [15, 70, 15];

  if (!isClient) {
    return null; // Or a loading spinner
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div 
        className="flex flex-col h-screen bg-background text-foreground font-body relative"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
       {isDragging && (
          <div className="absolute inset-0 bg-primary/20 border-4 border-dashed border-primary z-50 flex items-center justify-center pointer-events-none">
            <div className="text-center p-8 bg-background/80 rounded-lg">
              <Upload className="h-16 w-16 mx-auto text-primary" />
              <h2 className="text-2xl font-bold mt-4">Drop to Upload</h2>
              <p className="text-muted-foreground">Drop image(s) to open in the Batch Slicer.</p>
            </div>
          </div>
        )}
        <Header 
            title="TileForge" 
            icon={ToyBrick} 
            actions={headerActions}
            onTitleClick={() => setSettingsOpen(true)}
        />
        <div className="flex flex-1 overflow-hidden">
          <PanelGroup direction="horizontal" onLayout={handleLayout} autoSaveId="tileforge-panels">
            <Panel
              ref={leftPanelRef}
              defaultSize={defaultLayout[0]}
              collapsible={true}
              collapsedSize={4}
              minSize={10}
              onCollapse={(collapsed) => setToolbarCollapsed(collapsed)}
            >
              <div className="bg-card border-r border-border flex flex-col h-full">
                <div className='flex-grow overflow-hidden'>
                  {!isPreviewMode && (
                    <Toolbar<Tool>
                      actions={toolbarActions}
                      selectedAction={tool}
                      onActionSelect={handleToolSelect}
                      gridSize={gridSize}
                      onGridResize={handleGridResize}
                      zoom={zoom}
                      onZoomChange={setZoom}
                      isCollapsed={isToolbarCollapsed}
                      selection={selection}
                      selectionActions={selectionActions}
                      sprayRadius={sprayRadius}
                      onSprayRadiusChange={setSprayRadius}
                      sprayDensity={sprayDensity}
                      onSprayDensityChange={setSprayDensity}
                    />
                  )}
                </div>
                <div className="flex-shrink-0 flex items-center justify-center border-t border-border">
                    <Tooltip>
                        <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleToolbar}
                            className="w-full h-8 rounded-none"
                        >
                            {isToolbarCollapsed ? <PanelRight /> : <PanelLeft />}
                        </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                        <p>{isToolbarCollapsed ? 'Expand Toolbar' : 'Collapse Toolbar'}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
              </div>
            </Panel>
            <PanelResizeHandle className="w-2 bg-border/50 hover:bg-border transition-colors flex items-center justify-center">
              <div className="w-1 h-8 bg-primary/20 rounded-full" />
            </PanelResizeHandle>
            <Panel defaultSize={defaultLayout[1]} minSize={30}>
              <main className="flex-1 flex flex-col items-center justify-center p-4 bg-muted/20 overflow-auto h-full">
                <MapGrid
                  grid={grid}
                  tiles={tiles}
                  onCellAction={handleCellAction}
                  onShapeDraw={handleShapeDraw}
                  tool={tool}
                  zoom={zoom}
                  selectedTileId={selectedTileId}
                  secondarySelectedTileId={secondarySelectedTileId}
                  selection={selection}
                  isPreviewMode={isPreviewMode}
                  playerPos={playerPos}
                />
              </main>
            </Panel>
            <PanelResizeHandle className="w-2 bg-border/50 hover:bg-border transition-colors flex items-center justify-center">
                <div className="w-1 h-8 bg-primary/20 rounded-full" />
            </PanelResizeHandle>
            <Panel
                ref={rightPanelRef}
                defaultSize={defaultLayout[2]}
                collapsible={true}
                collapsedSize={4}
                minSize={10}
                onCollapse={(collapsed) => setPaletteCollapsed(collapsed)}
            >
              <div className="bg-card border-l border-border flex flex-col h-full">
                <div className="flex-grow overflow-hidden">
                      {!isPreviewMode && (
                          <TilePalette
                          tiles={tiles}
                          selectedTileId={selectedTileId}
                          secondarySelectedTileId={secondarySelectedTileId}
                          scatterSet={scatterSet}
                          tool={tool}
                          onSelectTile={setSelectedTileId}
                          onSelectSecondaryTile={setSecondarySelectedTileId}
                          onToggleScatterTile={(id) => {
                            setScatterSet(s => s.includes(id) ? s.filter(i => i !== id) : [...s, id]);
                          }}
                          onClearScatterSet={() => setScatterSet([])}
                          onRenameTile={handleRenameTile}
                          onDeleteTile={handleDeleteTile}
                          onToggleSolid={handleToggleSolid}
                          isCollapsed={isPaletteCollapsed}
                          />
                      )}
                </div>
                  <div className="flex-shrink-0 flex items-center justify-center border-t border-border">
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button
                              variant="ghost"
                              size="icon"
                              onClick={togglePalette}
                              className="w-full h-8 rounded-none"
                              >
                              {isPaletteCollapsed ? <PanelLeft /> : <PanelRight />}
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                              <p>{isPaletteCollapsed ? 'Expand Palette' : 'Collapse Palette'}</p>
                          </TooltipContent>
                      </Tooltip>
                  </div>
              </div>
            </Panel>
          </PanelGroup>
        </div>

        <input
          type="file"
          ref={tileImportRef}
          onChange={handleImportTiles}
          accept="image/png,image/jpeg"
          multiple
          className="hidden"
        />
        
        <SpritesheetSlicerModal
          isOpen={isSlicerOpen}
          onClose={() => setSlicerOpen(false)}
          onSlice={addTiles}
          initialFiles={slicerInitialFiles}
        />
        <ExportTilesModal
          isOpen={isExportOpen}
          onClose={() => setExportOpen(false)}
          tiles={tiles.filter((t) => t.id !== 0)}
        />
        
         <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setSettingsOpen(false)}
        />

        <AlertDialog open={!!tileToDelete} onOpenChange={() => setTileToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this tile?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the tile &quot;{tileToDelete?.name}&quot; from the palette and replace all instances of it on the grid with an empty tile. This action cannot be undone.
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
