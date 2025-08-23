
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
  Database,
  Grid,
  ArchiveX,
  FileJson2,
  Undo2,
  Redo2,
  Dices,
  FileText,
  Wand,
  Shapes,
  Circle,
  Slash,
  Lasso,
  FileUp,
} from 'lucide-react';
import { Header } from '@/components/header';
import { Toolbar } from '@/components/toolbar';
import { LayersPanel } from '@/components/layers-panel';
import { TilePalette } from '@/components/tile-palette';
import { SpritesheetSlicerModal } from '@/components/spritesheet-slicer-modal';
import { MetadataImportModal } from '@/components/metadata-import-modal';
import { ExportTilesModal } from '@/components/export-tiles-modal';
import { SettingsModal } from '@/components/settings-modal';
import { StorageModal } from '@/components/storage-modal';
import type { Tool, Tile, GridState, Selection, AutoTileMode, Shape, TileImportData, Layer, AppSettings, ExportFormat } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { useProjects } from '@/hooks/use-projects';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import { isTileTransparent } from '@/lib/utils';

const INITIAL_GRID_SIZE = 32;
const SETTINGS_KEY = 'tileforge-app-settings';

const createEmptyGrid = (width: number, height: number): GridState =>
  Array(height)
    .fill(null)
    .map(() => Array(width).fill(0));

export default function Home() {
  const {
    currentProject,
    loadProject,
    saveProject,
    deleteProject,
    renameProject,
    projects,
    isLoading,
    updateGridInLayer,
    updateTiles,
    remapGrid,
    addTiles,
    deleteTile,
    undo,
    redo,
    canUndo,
    canRedo,
    addLayer,
    deleteLayer,
    selectLayer,
    renameLayer,
    toggleLayerVisibility,
    reorderLayers,
    mergeAllLayers,
    clearAllLayers,
  } = useProjects();
  
  const { tiles, layers, activeLayerId } = currentProject;
  const activeLayer = layers.find(l => l.id === activeLayerId) || null;
  const grid = activeLayer?.grid ?? [[]];

  const [gridSize, setGridSize] = useState({ width: grid[0]?.length || INITIAL_GRID_SIZE, height: grid.length || INITIAL_GRID_SIZE });

  const [selectedTileId, setSelectedTileId] = useState<number>(0);
  const [secondarySelectedTileId, setSecondarySelectedTileId] = useState<number>(0);
  const [scatterSet, setScatterSet] = useState<number[]>([]);
  const [autoTileSet, setAutoTileSet] = useState<number[]>([]);
  const [autoTileMode, setAutoTileMode] = useState<AutoTileMode>('9-tile');
  const [autoTileOverwrite, setAutoTileOverwrite] = useState<boolean>(false);
  const [tool, setTool] = useState<Tool>('brush');
  const [shape, setShape] = useState<Shape>('rectangle');
  const [selection, setSelection] = useState<Selection | null>(null);
  const [clipboard, setClipboard] = useState<GridState | null>(null);
  const [isSlicerOpen, setSlicerOpen] = useState(false);
  const [slicerInitialFiles, setSlicerInitialFiles] = useState<File[]>([]);
  const [isExportOpen, setExportOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isStorageOpen, setStorageOpen] = useState(false);
  const [isMetadataModalOpen, setMetadataModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isConfirmClearMapOpen, setConfirmClearMapOpen] = useState(false);
  const [isConfirmClearPaletteOpen, setConfirmClearPaletteOpen] = useState(false);
  const [isConfirmMergeLayersOpen, setConfirmMergeLayersOpen] = useState(false);
  const [pendingSettings, setPendingSettings] = useState<AppSettings | null>(null);
  const [isToolbarCollapsed, setToolbarCollapsed] = useState(false);
  const [isPaletteCollapsed, setPaletteCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragFileType, setDragFileType] = useState<'image' | 'map' | 'other' | null>(null);
  const [isPreviewMode, setPreviewMode] = useState(false);
  const [playerPos, setPlayerPos] = useState({ row: 0, col: 0 });
  const [settings, setSettings] = useState<AppSettings>({ layersEnabled: false, exportFormat: 'json' });
  
  const [sprayRadius, setSprayRadius] = useState(3);
  const [sprayDensity, setSprayDensity] = useState(0.4);
  const [panelLayout, setPanelLayout] = useState<number[]>([15, 70, 15]);

  const { toast } = useToast();

  const tileImportRef = useRef<HTMLInputElement>(null);
  const mapImportRef = useRef<HTMLInputElement>(null);
  const leftPanelRef = useRef<any>(null);
  const rightPanelRef = useRef<any>(null);
  const mapGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const savedSettings = window.localStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }
  }, []);

  const handleSettingsChange = useCallback((newSettings: AppSettings) => {
    // If user is disabling layers, show confirmation dialog first
    if (settings.layersEnabled && !newSettings.layersEnabled && layers.length > 1) {
      setPendingSettings(newSettings);
      setConfirmMergeLayersOpen(true);
    } else {
      setSettings(newSettings);
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      toast({ title: "Settings Updated", description: "Your changes have been applied."});
    }
  }, [settings.layersEnabled, layers, toast]);

  const confirmMergeLayers = useCallback(() => {
    if (pendingSettings) {
        mergeAllLayers();
        setSettings(pendingSettings);
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(pendingSettings));
        toast({ title: "Layers Merged", description: "All visible layers have been flattened into one." });
        setPendingSettings(null);
    }
    setConfirmMergeLayersOpen(false);
  }, [pendingSettings, mergeAllLayers, toast]);


  // Sync grid size state when grid changes from project load
  useEffect(() => {
    setGridSize({ width: grid[0]?.length || INITIAL_GRID_SIZE, height: grid.length || INITIAL_GRID_SIZE });
  }, [grid]);

  // Reset relevant state when project changes
  useEffect(() => {
    setSelection(null);
    setClipboard(null);
    setPreviewMode(false);
    setPlayerPos({ row: 0, col: 0 });
    setZoom(1);
  }, [currentProject.id]);
  
  const toggleToolbar = useCallback(() => {
    const panel = leftPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.expand();
    } else {
      panel.collapse();
    }
  }, []);

  const togglePalette = useCallback(() => {
    const panel = rightPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.expand();
    } else {
      panel.collapse();
    }
  }, []);

  const handleGridResize = useCallback((newWidth: number, newHeight: number) => {
    if (!activeLayer) return;
    const oldGrid = grid;
    const oldHeight = oldGrid.length;
    const oldWidth = oldGrid[0]?.length || 0;
    const newGrid = createEmptyGrid(newWidth, newHeight);

    for (let r = 0; r < Math.min(oldHeight, newHeight); r++) {
      for (let c = 0; c < Math.min(oldWidth, newWidth); c++) {
        newGrid[r][c] = oldGrid[r][c];
      }
    }
    updateGridInLayer(activeLayer.id, newGrid);
    setGridSize({ width: newGrid[0]?.length || 0, height: newGrid.length || 0 });
    setSelection(null);
    toast({ title: 'Grid Resized', description: `Grid is now ${newWidth}x${newHeight} tiles.` });
  }, [grid, activeLayer, updateGridInLayer, toast]);
  
  const handleRenameTile = useCallback((tileId: number, newName: string) => {
    const tileBeingRenamed = tiles.find(t => t.id === tileId);
    if (tileBeingRenamed && tileBeingRenamed.name === newName) {
      return; // No change, so no action needed.
    }
    const isNameTaken = tiles.some(t => t.name === newName);
    if (isNameTaken) {
      toast({ variant: 'destructive', title: 'Rename Failed', description: 'A tile with that name already exists.' });
      return;
    }
    const newTiles = tiles.map((tile) =>
      tile.id === tileId ? { ...tile, name: newName } : tile
    );
    updateTiles(newTiles);
    toast({ title: 'Tile Renamed', description: `Tile has been renamed to "${newName}".` });
  }, [tiles, toast, updateTiles]);

  const handleToggleSolid = useCallback((tileId: number) => {
    const newTiles = tiles.map(t =>
      t.id === tileId ? { ...t, solid: !t.solid } : t
    );
    updateTiles(newTiles);
  }, [tiles, updateTiles]);
  
  const confirmDeleteTile = useCallback((tileId: number) => {
    const tileToDelete = tiles.find(t => t.id === tileId);
    if (!tileToDelete) return;
    
    deleteTile(tileToDelete.id);
    
    if (selectedTileId === tileToDelete.id) setSelectedTileId(0);
    if (secondarySelectedTileId === tileToDelete.id) setSecondarySelectedTileId(0);
    setScatterSet(s => s.filter(id => id !== tileToDelete.id));
    if (autoTileSet.includes(tileToDelete.id)) {
      setAutoTileSet([]);
    }

    toast({ 
      title: 'Tile Deleted', 
      description: `Tile "${tileToDelete.name}" has been removed.`,
    });
  }, [tiles, selectedTileId, secondarySelectedTileId, autoTileSet, deleteTile, toast]);
  
  const handleReorderTiles = useCallback((reorderedTiles: Tile[]) => {
    updateTiles(reorderedTiles, false);
  }, [updateTiles]);

  const handleImportTiles = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileList = Array.from(files);
    
    const readFiles = fileList.map(file => {
      return new Promise<{ file: File; isSolid: boolean } | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const src = e.target?.result as string;
          if (await isTileTransparent(src)) {
            resolve(null);
          } else {
            resolve({ file, isSolid: false });
          }
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    });

    const results = await Promise.all(readFiles);
    const validTileData = results.filter((r): r is TileImportData => r !== null);
    
    const skippedCount = fileList.length - validTileData.length;
    if (skippedCount > 0) {
      toast({
        title: 'Transparent Tiles Skipped',
        description: `${skippedCount} tile(s) were fully transparent and have been ignored.`,
      });
    }

    if (validTileData.length > 0) {
      addTiles(validTileData);
    }

    event.target.value = '';
  }, [addTiles, toast]);
  
  const openSlicer = useCallback((files: File[] = []) => {
    setSlicerInitialFiles(files);
    setSlicerOpen(true);
  }, []);
  
    const handleImportMap = useCallback((file: File) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                let newGrid: GridState;

                if (file.name.endsWith('.json')) {
                    const mapData = JSON.parse(content);
                    // For now, just import the grid of the first layer from a JSON file
                    // A more advanced implementation could handle multiple layers.
                    newGrid = mapData.layers[0]?.grid;
                     if (!newGrid) {
                        throw new Error('JSON map file is missing layer data.');
                    }
                } else { // Assume .txt
                    newGrid = content
                        .split('\n')
                        .map(row => row.trim())
                        .filter(row => row)
                        .map(row => row.split(',').map(cell => parseInt(cell, 10) || 0));
                }
                
                if (newGrid.length === 0 || newGrid[0].length === 0) {
                    throw new Error('Map file is empty or invalid.');
                }
                const width = newGrid[0].length;
                if (!newGrid.every(row => row.length === width)) {
                    throw new Error('Map rows have inconsistent lengths.');
                }

                if(activeLayer) {
                  updateGridInLayer(activeLayer.id, newGrid);
                  toast({ title: 'Map Imported', description: `Successfully loaded map into current layer from ${file.name}` });
                }
            } catch (error: any) {
                console.error("Failed to parse map file", error);
                toast({ variant: 'destructive', title: 'Import Failed', description: error.message || 'Could not parse the map file.' });
            }
        };
        reader.readAsText(file);
    }, [toast, updateGridInLayer, activeLayer]);

  const handleMapFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImportMap(file);
    }
    event.target.value = '';
  }, [handleImportMap]);

  const handlePasteSelection = useCallback((row: number, col: number) => {
    if (!clipboard || !activeLayer) return;

    const newGrid = grid.map(r => [...r]);
    const pasteStartRow = row;
    const pasteStartCol = col;

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
    updateGridInLayer(activeLayer.id, newGrid);
    toast({ title: 'Pasted', description: 'Clipboard content has been pasted.' });
    setTool('brush'); // Revert to a default tool after pasting
  }, [grid, clipboard, toast, activeLayer, updateGridInLayer]);


  const handleCellAction = useCallback((row: number, col: number) => {
      if (!activeLayer) return;
      
      if(tool === 'paste') {
        handlePasteSelection(row, col);
        return;
      }

      let newGrid = grid.map(r => [...r]);
      
      // Handle tools that are just simple clicks and don't use the preview system.
      if (tool === 'picker') {
        const tileId = newGrid[row][col];
        const pickedTile = tiles.find(t => t.id === tileId);
        if (pickedTile) {
          setSelectedTileId(tileId);
          setTool('brush');
          toast({title: 'Tile Picked', description: `Switched to brush with tile "${pickedTile.name}"`});
        }
        return; 
      } else if (tool === 'fill') {
        const targetId = newGrid[row][col];
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
        const targetId = newGrid[row][col];
        if (targetId === 0) return;

        const queue: [number, number][] = [[row, col]];
        const visited = new Set<string>();
        visited.add(`${row},${col}`);
        let minRow = row, maxRow = row, minCol = col, maxCol = col;
        const width = newGrid[0].length;
        const height = newGrid.length;

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
            const [r_sel, c_sel] = key.split(',').map(Number);
            if(grid[r_sel][c_sel] === targetId) selectedCellsGrid[r_sel][c_sel] = 1; 
        });
        
        setSelection({ minRow, minCol, maxRow, maxCol, selectedCells: selectedCellsGrid });
        toast({ title: 'Area Selected', description: 'Selected all connected tiles.' });
        return; 
      }
      
      // If we reach here, it means a tool that doesn't use the preview system modified the grid.
      updateGridInLayer(activeLayer.id, newGrid);
      setSelection(null);
    },
    [grid, selectedTileId, tiles, toast, tool, activeLayer, updateGridInLayer, handlePasteSelection]
  );
  
  const handleDrawCommit = useCallback((newGridState: GridState) => {
    if (!activeLayer) return;
    updateGridInLayer(activeLayer.id, newGridState);
    setSelection(null);
  }, [updateGridInLayer, activeLayer]);
  
  const handleSelectionCommit = useCallback((start: {row: number, col: number}, end: {row: number, col: number}) => {
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);

    const selectedCellsGrid = createEmptyGrid(grid[0].length, grid.length);
      for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
              if (r < grid.length && c < grid[0].length) {
                  selectedCellsGrid[r][c] = 1;
              }
          }
      }
    setSelection({ minRow, minCol, maxRow, maxCol, selectedCells: selectedCellsGrid });
  }, [grid]);


  const applyToSelection = useCallback((callback: (currentValue: number, rowIndex: number, colIndex: number, selection: Selection) => number) => {
     if (!selection || !activeLayer) return;

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

    updateGridInLayer(activeLayer.id, newGrid);
  }, [selection, grid, activeLayer, updateGridInLayer]);

  const handleFillSelection = useCallback(() => {
    applyToSelection(() => selectedTileId);
    toast({ title: 'Selection Filled', description: 'The selected area has been filled with the current tile.' });
  }, [applyToSelection, selectedTileId, toast]);

  const handleDeleteSelection = useCallback(() => {
    applyToSelection(() => 0);
    toast({ title: 'Selection Deleted', description: 'The selected area has been cleared.' });
  }, [applyToSelection, toast]);
  
  const handleInvertSelection = useCallback(() => {
    if (selectedTileId === 0) {
      toast({
        variant: 'destructive',
        title: 'Invert Failed',
        description: 'Cannot invert with an empty tile. Please select a valid tile from the palette first.',
      });
      return;
    }
    applyToSelection((cell) => (cell === selectedTileId ? 0 : selectedTileId));
    toast({
      title: 'Selection Inverted',
      description: 'Tiles in the selected area have been inverted.',
    });
  }, [applyToSelection, selectedTileId, toast]);
  
  const handleMirrorHorizontal = useCallback(() => {
    if (!selection) return;
    const selectionWidth = selection.maxCol - selection.minCol + 1;
    const tempSelection = grid.slice(selection.minRow, selection.maxRow + 1).map(row => row.slice(selection.minCol, selection.maxCol + 1));
    
    applyToSelection((_cell, rowIndex, colIndex, sel) => {
        const sourceCol = sel.minCol + (selectionWidth - 1 - (colIndex - sel.minCol));
        return tempSelection[rowIndex - sel.minRow][sourceCol - sel.minCol];
    });
    toast({ title: 'Selection Mirrored', description: 'The selected area has been mirrored horizontally.' });
  }, [selection, grid, applyToSelection, toast]);

  const handleMirrorVertical = useCallback(() => {
    if (!selection) return;
    const selectionHeight = selection.maxRow - selection.minRow + 1;
    const tempSelection = grid.slice(selection.minRow, selection.maxRow + 1).map(row => row.slice(selection.minCol, selection.maxCol + 1));
    
    applyToSelection((_cell, rowIndex, colIndex, sel) => {
        const sourceRow = sel.minRow + (selectionHeight - 1 - (rowIndex - sel.minRow));
        return tempSelection[sourceRow - sel.minRow][colIndex - sel.minCol];
    });
     toast({ title: 'Selection Mirrored', description: 'The selected area has been mirrored vertically.' });
  }, [selection, grid, applyToSelection, toast]);

  const handleCopySelection = useCallback(() => {
    if (!selection) return;

    const copiedData = grid
      .slice(selection.minRow, selection.maxRow + 1)
      .map((row, rIndex) =>
        row.slice(selection.minCol, selection.maxCol + 1).map((cell, cIndex) => {
          // If using magic wand, only copy the selected cells
          if (selection.selectedCells && selection.selectedCells[selection.minRow + rIndex][selection.minCol + cIndex] === 0) {
            return -1; // Use -1 to represent a non-copied cell
          }
          return cell;
        })
      );

    setClipboard(copiedData);
    toast({ title: 'Selection Copied', description: 'The selected area has been copied to the clipboard.' });
  }, [grid, selection, toast]);

  const handleActivatePaste = useCallback(() => {
    if (!clipboard) {
        toast({ variant: 'destructive', title: 'Paste Failed', description: 'Your clipboard is empty.' });
        return;
    }
    setTool('paste');
    toast({ title: 'Paste Mode Activated', description: 'Click on the grid to paste at the desired location.' });
  }, [clipboard, toast]);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragFileType(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      if (dragFileType === 'image') {
        const imageFiles = filesArray.filter(file => file.type.startsWith('image/'));
        if (imageFiles.length > 0) openSlicer(imageFiles);
      } else if (dragFileType === 'map') {
        const mapFile = filesArray.find(file => file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.json'));
        if (mapFile) handleImportMap(mapFile);
      } else {
        toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please drop an image or a map file (.txt, .json).' });
      }
      e.dataTransfer.clearData();
    }
  }, [dragFileType, handleImportMap, openSlicer, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!e.dataTransfer.types.includes('Files')) {
        return;
    }

    if (!isDragging) setIsDragging(true);

    const items = e.dataTransfer.items;
    if (items && items.length > 0) {
        const firstItem = items[0];
        if (firstItem.kind === 'file') {
            if (firstItem.type.startsWith('image/')) {
                setDragFileType('image');
            } else if (firstItem.type === 'text/plain' || firstItem.name.endsWith('.txt') || firstItem.name.endsWith('.json')) {
                setDragFileType('map');
            } else {
                setDragFileType('other');
            }
        }
    }
  }, [isDragging]);

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragFileType(null);
  };

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!mapGridRef.current?.contains(e.target as Node)) {
        if (selection && e.key !== 'Escape') {
          // Prevent deselection on outside click
        }
    }
  }, [selection]);

  const togglePreviewMode = useCallback(() => {
    const newPreviewState = !isPreviewMode;
    if (newPreviewState) {
        if (leftPanelRef.current && !leftPanelRef.current.isCollapsed()) leftPanelRef.current.collapse();
        if (rightPanelRef.current && !rightPanelRef.current.isCollapsed()) rightPanelRef.current.collapse();

        let startPos = { row: 0, col: 0 };
        let found = false;
        
        const startArea = selection 
          ? { minR: selection.minRow, maxR: selection.maxRow, minC: selection.minCol, maxC: selection.maxCol } 
          : { minR: 0, maxR: grid.length - 1, minC: 0, maxC: (grid[0]?.length || 0) - 1};

        for (let r = startArea.minR; r <= startArea.maxR; r++) {
            for (let c = startArea.minC; c <= startArea.maxC; c++) {
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
                description: 'The entire map (or selection) is solid. Player placed at (0,0).'
            });
            startPos = {row: 0, col: 0};
        }
        setPlayerPos(startPos);
    } else {
        if (leftPanelRef.current && leftPanelRef.current.isCollapsed()) leftPanelRef.current.expand();
        if (rightPanelRef.current && rightPanelRef.current.isCollapsed()) rightPanelRef.current.expand();
        toast({ title: 'Exited Preview Mode' });
    }
    setPreviewMode(newPreviewState);
  }, [grid, isPreviewMode, tiles, toast, selection]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isPreviewMode) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape'].includes(e.key)) {
          e.preventDefault();
          if (e.key === 'Escape') {
              togglePreviewMode();
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
    
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'textarea' || target.getAttribute('role') === 'slider') return;

    if ((e.ctrlKey || e.metaKey)) {
        if (['c', 'v', 'z', 'y', 's', '0', '=', '-'].includes(e.key)) {
            e.preventDefault();
        }
      if (e.key === 'c' && selection) handleCopySelection();
      else if (e.key === 'v') handleActivatePaste();
      else if (e.key === 'z') undo();
      else if (e.key === 'y') redo();
      else if (e.key === 's') setExportOpen(true);
      else if (e.key === '=') setZoom(z => Math.min(z + 0.1, 2));
      else if (e.key === '-') setZoom(z => Math.max(z - 0.1, 0.1));
      else if (e.key === '0') setZoom(1);

    } else if (e.key === 'Delete' && selection) {
        e.preventDefault();
        handleDeleteSelection();
    } else if (e.key === 'Escape') {
        e.preventDefault();
        if (tool === 'paste') {
          setTool('brush');
          toast({ title: 'Paste Canceled' });
        }
        if (selection) setSelection(null);
    } else {
       const keyMap: { [key: string]: Tool } = {
        'b': 'brush', 'e': 'eraser', 'p': 'picker', 'g': 'fill',
        'r': 'shape', 'm': 'select', 'w': 'magic-wand', 's': 'spray',
        'l': 'gradient', 'n': 'noise', 'c': 'scatter', 'a': 'auto-tile',
      };

      if (keyMap[e.key]) {
        setTool(keyMap[e.key]);
      }
    }
  }, [selection, handleCopySelection, handleActivatePaste, undo, redo, handleDeleteSelection, isPreviewMode, playerPos, grid, tiles, toast, tool, togglePreviewMode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown as any);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown as any);
    }
  }, [handleKeyDown, handleMouseDown]);

  const handleToolSelect = useCallback((newTool: Tool) => {
    setTool(newTool);
    if (newTool !== 'select' && newTool !== 'magic-wand' && newTool !== 'paste') {
      setSelection(null);
    }
    const toolsWithSettings: Tool[] = ['spray', 'shape', 'gradient', 'noise', 'scatter', 'auto-tile'];
    if (toolsWithSettings.includes(newTool) || settings.layersEnabled) {
      if (leftPanelRef.current?.isCollapsed()) {
         leftPanelRef.current?.expand();
      }
    }
  }, [settings.layersEnabled]);
  
  const handleClearMap = useCallback(() => {
    if (!activeLayer) return;
    updateGridInLayer(activeLayer.id, createEmptyGrid(gridSize.width, gridSize.height));
    setConfirmClearMapOpen(false);
    toast({ title: "Map Cleared", description: "The grid has been reset."});
  }, [gridSize, toast, updateGridInLayer, activeLayer]);
  
  const handleClearPalette = useCallback(() => {
    clearAllLayers(gridSize.width, gridSize.height);
    updateTiles([{ id: 0, name: 'Empty', src: '', solid: false }]);
    setSelectedTileId(0);
    setSecondarySelectedTileId(0);
    setScatterSet([]);
    setAutoTileSet([]);
    setConfirmClearPaletteOpen(false);
    toast({ title: "Palette Cleared", description: "All tiles have been removed and all layers cleared."});
  }, [gridSize, toast, updateTiles, clearAllLayers]);
  
  const onToggleScatterTile = useCallback((id: number) => {
    setScatterSet(s => s.includes(id) ? s.filter(i => i !== id) : [...s, id]);
  }, []);

  const onClearScatterSet = useCallback(() => setScatterSet([]), []);
  
  const onToggleAutoTile = useCallback((id: number) => {
    setAutoTileSet(s => s.includes(id) ? s.filter(i => i !== id) : [...s, id]);
  }, []);

  const onClearAutoTileSet = useCallback(() => setAutoTileSet([]), []);
  
  const handleSelectSecondaryTile = useCallback((id: number) => {
      setSecondarySelectedTileId(id);
      const tile = tiles.find(t => t.id === id);
      toast({ title: 'Secondary Tile Selected', description: `"${tile?.name || 'Unknown'}" set as secondary.`});
  }, [tiles, toast]);

  const toolbarActions = {
    brush: { icon: Brush, label: 'Brush (B)' },
    eraser: { icon: Eraser, label: 'Eraser (E)' },
    picker: { icon: Pipette, label: 'Picker (P)' },
    fill: { icon: PaintBucket, label: 'Fill (G)'},
    spray: { icon: SprayCan, label: 'Spray (S)' },
    'auto-tile': { icon: Wand, label: 'Auto-Tile (A)' },
    shape: { icon: Shapes, label: 'Shape (R)' },
    gradient: { icon: Layers, label: 'Gradient (L)' },
    noise: { icon: Waves, label: 'Noise (N)' },
    scatter: { icon: Dices, label: 'Scatter (C)'},
    select: { icon: Lasso, label: 'Select (M)' },
    'magic-wand': { icon: Wand2, label: 'Wand (W)' },
    paste: { icon: ClipboardPaste, label: 'Paste (Ctrl+V)', disabled: !clipboard },
  };

  const headerActions = [
    { icon: Upload, label: 'Import Tiles', onClick: () => tileImportRef.current?.click() },
    { icon: Scissors, label: 'Slice Sheet', onClick: () => openSlicer() },
    { icon: FileJson2, label: 'Import Metadata', onClick: () => setMetadataModalOpen(true) },
    { icon: FileUp, label: 'Import Map', onClick: () => mapImportRef.current?.click() },
    { icon: Package, label: 'Export...', onClick: () => setExportOpen(true) },
  ];
  
  const projectActions = [
      { icon: Undo2, label: 'Undo (Ctrl+Z)', onClick: undo, disabled: !canUndo },
      { icon: Redo2, label: 'Redo (Ctrl+Y)', onClick: redo, disabled: !canRedo },
      { icon: Database, label: 'Manage Projects', onClick: () => setStorageOpen(true) },
      { icon: Grid, label: 'Clear Map', onClick: () => setConfirmClearMapOpen(true) },
      { icon: ArchiveX, label: 'Clear Palette', onClick: () => setConfirmClearPaletteOpen(true) },
  ]
  
  const gameplayActions = [
    { icon: isPreviewMode ? StopCircle : Play, label: isPreviewMode ? 'Stop Preview (Esc)' : 'Live Preview (Arrows to move, Esc to exit)', onClick: togglePreviewMode, isActive: isPreviewMode },
  ];
  
  const selectionActions = {
    fill: { icon: FileCheck, label: 'Fill Selection', onClick: handleFillSelection },
    copy: { icon: Copy, label: 'Copy (Ctrl+C)', onClick: handleCopySelection },
    delete: { icon: Trash2, label: 'Delete (Del)', onClick: handleDeleteSelection },
    invert: { icon: Replace, label: 'Invert', onClick: handleInvertSelection },
    mirrorHorizontal: { icon: FlipHorizontal, label: 'Mirror Horizontal', onClick: handleMirrorHorizontal },
    mirrorVertical: { icon: FlipVertical, label: 'Mirror Vertical', onClick: handleMirrorVertical },
  };
  
  const handleLayout = (sizes: number[]) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('tileforge-panel-layout', JSON.stringify(sizes));
        setPanelLayout(sizes);
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLayout = localStorage.getItem('tileforge-panel-layout');
      if (savedLayout) {
          try {
              const parsedLayout = JSON.parse(savedLayout);
              if (Array.isArray(parsedLayout) && parsedLayout.length === 3) {
                setPanelLayout(parsedLayout);
              }
          } catch(e) {
              // ignore parse error
          }
      }
    }
  }, []);

  const renderDragOverlay = () => {
    if (!dragFileType || dragFileType === 'other') {
      return (
        <div className="absolute inset-0 bg-destructive/20 border-4 border-dashed border-destructive z-50 flex items-center justify-center pointer-events-none">
          <div className="text-center p-8 bg-background/80 rounded-lg">
            <h2 className="text-2xl font-bold mt-4 text-destructive-foreground">Invalid File Type</h2>
            <p className="text-muted-foreground">Only images (.png, .jpg) or map files (.txt) are supported.</p>
          </div>
        </div>
      );
    }
    
    const isImage = dragFileType === 'image';
    return (
       <div className="absolute inset-0 bg-primary/20 border-4 border-dashed border-primary z-50 flex items-center justify-center pointer-events-none">
            <div className="text-center p-8 bg-background/80 rounded-lg">
              {isImage ? <Upload className="h-16 w-16 mx-auto text-primary" /> : <FileText className="h-16 w-16 mx-auto text-primary" />}
              <h2 className="text-2xl font-bold mt-4">Drop to {isImage ? 'Upload' : 'Import'}</h2>
              <p className="text-muted-foreground">{isImage ? 'Drop image(s) to open in the Batch Slicer.' : 'Drop a map file to load.'}</p>
            </div>
        </div>
    );
  };

  const handleMetadataImport = useCallback((remap: { [oldId: number]: number }, newTiles: Tile[]) => {
    updateTiles(newTiles, true);
    remapGrid(remap);
  }, [updateTiles, remapGrid]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <ToyBrick className="h-12 w-12 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-screen bg-background text-foreground font-body">
        <Header 
            title="TileForge"
            subtitle={currentProject.name}
            icon={ToyBrick} 
            actionGroups={[headerActions, projectActions, gameplayActions]}
            onTitleClick={() => setSettingsOpen(true)}
        />
        <div className="flex flex-1 overflow-hidden">
          <PanelGroup direction="horizontal" onLayout={handleLayout} autoSaveId="tileforge-panels">
            <Panel
              ref={leftPanelRef}
              defaultSize={panelLayout[0]}
              collapsible={true}
              collapsedSize={4}
              minSize={10}
              onCollapse={() => setToolbarCollapsed(true)}
              onExpand={() => setToolbarCollapsed(false)}
            >
              <div className="bg-card border-r border-border flex flex-col h-full">
                <div className={cn('flex-grow overflow-hidden transition-opacity duration-300', (isToolbarCollapsed) && 'opacity-0')}>
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
                      autoTileMode={autoTileMode}
                      onAutoTileModeChange={setAutoTileMode}
                      autoTileOverwrite={autoTileOverwrite}
                      onAutoTileOverwriteChange={setAutoTileOverwrite}
                      shape={shape}
                      onShapeChange={setShape}
                      layersEnabled={settings.layersEnabled}
                      layersPanel={
                        <LayersPanel
                            layers={layers}
                            activeLayerId={activeLayerId}
                            onAddLayer={addLayer}
                            onDeleteLayer={deleteLayer}
                            onSelectLayer={selectLayer}
                            onRenameLayer={renameLayer}
                            onToggleVisibility={toggleLayerVisibility}
                            onReorderLayers={reorderLayers}
                        />
                      }
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
                            aria-label={isToolbarCollapsed ? 'Expand Toolbar' : 'Collapse Toolbar'}
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
            <Panel defaultSize={panelLayout[1]} minSize={30}>
              <main 
                className="flex-1 flex flex-col items-center justify-center p-4 bg-muted/20 overflow-auto h-full relative"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {isDragging && renderDragOverlay()}
                <div ref={mapGridRef}>
                  <MapGrid
                    layers={layers}
                    activeLayer={activeLayer}
                    tiles={tiles}
                    onCellAction={handleCellAction}
                    onDrawCommit={handleDrawCommit}
                    onSelectionCommit={handleSelectionCommit}
                    tool={tool}
                    shape={shape}
                    zoom={zoom}
                    selectedTileId={selectedTileId}
                    secondarySelectedTileId={secondarySelectedTileId}
                    selection={selection}
                    isPreviewMode={isPreviewMode}
                    playerPos={playerPos}
                    autoTileMode={autoTileMode}
                    autoTileSet={autoTileSet}
                    autoTileOverwrite={autoTileOverwrite}
                    sprayRadius={sprayRadius}
                    sprayDensity={sprayDensity}
                    scatterSet={scatterSet}
                    clipboard={clipboard}
                  />
                </div>
              </main>
            </Panel>
            <PanelResizeHandle className="w-2 bg-border/50 hover:bg-border transition-colors flex items-center justify-center">
                <div className="w-1 h-8 bg-primary/20 rounded-full" />
            </PanelResizeHandle>
            <Panel
                ref={rightPanelRef}
                defaultSize={panelLayout[2]}
                collapsible={true}
                collapsedSize={4}
                minSize={10}
                onCollapse={() => setPaletteCollapsed(true)}
                onExpand={() => setPaletteCollapsed(false)}
            >
              <div className="bg-card border-l border-border flex flex-col h-full">
                <div className={cn('flex-grow overflow-hidden transition-opacity duration-300', isPaletteCollapsed && 'opacity-0')}>
                      {!isPreviewMode && (
                          <TilePalette
                          tiles={tiles}
                          selectedTileId={selectedTileId}
                          secondarySelectedTileId={secondarySelectedTileId}
                          scatterSet={scatterSet}
                          autoTileSet={autoTileSet}
                          autoTileMode={autoTileMode}
                          tool={tool}
                          onSelectTile={setSelectedTileId}
                          onSelectSecondaryTile={handleSelectSecondaryTile}
                          onToggleScatterTile={onToggleScatterTile}
                          onClearScatterSet={onClearScatterSet}
                          onToggleAutoTile={onToggleAutoTile}
                          onClearAutoTileSet={onClearAutoTileSet}
                          onRenameTile={handleRenameTile}
                          onDeleteTile={confirmDeleteTile}
                          onToggleSolid={handleToggleSolid}
                          onReorderTiles={handleReorderTiles}
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
                              aria-label={isPaletteCollapsed ? 'Expand Palette' : 'Collapse Palette'}
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
          aria-hidden="true"
        />

        <input
          type="file"
          ref={mapImportRef}
          onChange={handleMapFileSelect}
          accept=".txt,text/plain,.json"
          className="hidden"
          aria-hidden="true"
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
          layers={layers}
          settings={settings}
        />
        
         <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          onSettingsChange={handleSettingsChange}
        />

        <StorageModal
          isOpen={isStorageOpen}
          onClose={() => setStorageOpen(false)}
          projects={projects}
          currentProjectId={currentProject.id}
          onLoadProject={loadProject}
          onSaveProject={saveProject}
          onDeleteProject={deleteProject}
          onRenameProject={renameProject}
        />

        <MetadataImportModal
          isOpen={isMetadataModalOpen}
          onClose={() => setMetadataModalOpen(false)}
          tiles={tiles}
          onImport={handleMetadataImport}
        />
        
        <AlertDialog open={isConfirmClearMapOpen} onOpenChange={setConfirmClearMapOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will clear the entire map grid on the current layer, replacing all tiles with empty space. This can be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearMap}>Clear Map</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isConfirmClearPaletteOpen} onOpenChange={setConfirmClearPaletteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will permanently delete all tiles from your palette and clear all layers of the map. This action can be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearPalette}>Clear Palette</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isConfirmMergeLayersOpen} onOpenChange={setConfirmMergeLayersOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Merge All Layers?</AlertDialogTitle>
              <AlertDialogDescription>
                This will flatten all visible layers into a single layer. This action cannot be easily undone. Are you sure you want to continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingSettings(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmMergeLayers}>Merge Layers</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
      </div>
    </TooltipProvider>
  );
}
