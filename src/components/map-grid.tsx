
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { GridState, Tile, Tool, Selection } from '@/lib/types';

interface MapGridProps {
  grid: GridState;
  tiles: Tile[];
  tool: Tool;
  onCellAction: (row: number, col: number, newGrid?: GridState) => void;
  onShapeDraw: (start: { row: number, col: number }, end: { row: number, col: number }) => void;
  zoom?: number;
  selectedTileId: number;
  secondarySelectedTileId: number;
  selection: Selection | null;
  isPreviewMode: boolean;
  playerPos: {row: number, col: number};
}

const BASE_TILE_SIZE = 16;

export const MapGrid: FC<MapGridProps> = ({ 
  grid, 
  tiles, 
  tool, 
  onCellAction, 
  onShapeDraw, 
  zoom = 1, 
  selectedTileId, 
  secondarySelectedTileId, 
  selection,
  isPreviewMode,
  playerPos,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startCell, setStartCell] = useState<{ row: number; col: number } | null>(null);
  const [previewGrid, setPreviewGrid] = useState<GridState | null>(null);
  const [previewSelection, setPreviewSelection] = useState<Selection | null>(null);
  
  const TILE_SIZE = BASE_TILE_SIZE * zoom;
  const isBrushLikeTool = ['brush', 'eraser', 'spray', 'auto-tile'].includes(tool);

  const tileMap = useMemo(() => {
    return new Map(tiles.map(tile => [tile.id, tile]));
  }, [tiles]);

  const handleMouseDown = (row: number, col: number) => {
    if (isPreviewMode) return;
    setIsDrawing(true);
    
    if (tool === 'select' || tool === 'rectangle' || tool === 'gradient' || tool === 'noise' || tool === 'scatter') {
        setStartCell({ row, col });
        setPreviewSelection(null);
        if (tool !== 'select') {
            setPreviewGrid(grid); // Start preview from current grid state for shape tools
        }
    } else {
        // For brush-like tools, start a preview and perform the first action
        const newPreviewGrid = grid.map(r => [...r]);
        onCellAction(row, col, newPreviewGrid); // This will mutate newPreviewGrid
        setPreviewGrid(newPreviewGrid);
    }
  };

  const handleMouseOver = (row: number, col: number) => {
    if (!isDrawing || isPreviewMode) return;

    if (isBrushLikeTool) {
        setPreviewGrid(currentPreview => {
            if (!currentPreview) return null;
            const newPreviewGrid = currentPreview.map(r => [...r]);
            onCellAction(row, col, newPreviewGrid); // Mutate the preview grid
            return newPreviewGrid;
        });
    } else if (startCell) { // Shape tools
        const minRow = Math.min(startCell.row, row);
        const maxRow = Math.max(startCell.row, row);
        const minCol = Math.min(startCell.col, col);
        const maxCol = Math.max(startCell.col, col);
        
        if (tool === 'select') {
             setPreviewSelection({ minRow, minCol, maxRow, maxCol });
             return;
        }

        const newPreviewGrid = grid.map(r => [...r]);
        // This part seems to duplicate onShapeDraw logic, but it's for live preview
        if (tool === 'rectangle') {
            for (let r = minRow; r <= maxRow; r++) {
                for (let c = minCol; c <= maxCol; c++) {
                    if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) {
                        newPreviewGrid[r][c] = selectedTileId;
                    }
                }
            }
        } else if (tool === 'gradient') {
            const width = maxCol - minCol + 1;
            for (let r = minRow; r <= maxRow; r++) {
                for (let c = minCol; c <= maxCol; c++) {
                    if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) {
                        const step = (c - minCol) / Math.max(1, width - 1);
                        const threshold = ((r % 2 === 0) ? (c % 2 === 0 ? 0.25 : 0.75) : (c % 2 === 0 ? 0.75 : 0.25));
                        newPreviewGrid[r][c] = step < threshold ? selectedTileId : secondarySelectedTileId;
                    }
                }
            }
        } else if (tool === 'noise') {
            for (let r = minRow; r <= maxRow; r++) {
                for (let c = minCol; c <= maxCol; c++) {
                    if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) {
                        const random = Math.sin(r * 12.9898 + c * 78.233) * 43758.5453;
                        newPreviewGrid[r][c] = (random - Math.floor(random)) < 0.5 ? selectedTileId : secondarySelectedTileId;
                    }
                }
            }
        }
        setPreviewGrid(newPreviewGrid);
    }
  };

  const handleMouseUp = (row: number, col: number) => {
    if (isPreviewMode) return;

    if (isBrushLikeTool) {
        // Finalize the action with the complete previewGrid
        if(previewGrid) onCellAction(row, col, previewGrid);
    } else if (startCell) { // Shape tools
      onShapeDraw(startCell, { row, col });
    }

    setIsDrawing(false);
    setStartCell(null);
    setPreviewGrid(null);
    setPreviewSelection(null);
  };

  const handleMouseLeave = () => {
    if (isDrawing) {
        if (isBrushLikeTool) {
            // If mouse leaves while drawing, commit the changes made so far
            if(previewGrid) onCellAction(0, 0, previewGrid); // Coords don't matter here
        }
        setIsDrawing(false);
        setStartCell(null);
        setPreviewGrid(null);
        setPreviewSelection(null);
    }
  };
  
  const getCursorClass = () => {
    if (isPreviewMode) return 'cursor-none';
    switch (tool) {
      case 'brush':
      case 'auto-tile':
        return 'cursor-cell';
      case 'eraser':
        return 'cursor-crosshair';
      case 'picker':
        return 'cursor-pointer';
      case 'fill':
      case 'magic-wand':
        return 'cursor-copy';
      case 'spray':
        return 'cursor-cell';
      case 'rectangle':
      case 'gradient':
      case 'noise':
      case 'scatter':
      case 'select':
        return 'cursor-crosshair';
      default:
        return 'cursor-default';
    }
  };
  
  const finalSelection = selection || previewSelection;
  const gridToRender = previewGrid || grid;
  const gridHeight = gridToRender.length;
  const gridWidth = gridToRender[0]?.length || 0;
  const gridLineWidth = 1;

  return (
    <div
      className="relative flex items-center justify-center w-full h-full"
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={cn("bg-border p-px rounded-lg shadow-inner select-none", getCursorClass())}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridWidth}, ${TILE_SIZE}px)`,
          gridTemplateRows: `repeat(${gridHeight}, ${TILE_SIZE}px)`,
          width: `${gridWidth * TILE_SIZE + gridWidth * gridLineWidth}px`,
          height: `${gridHeight * TILE_SIZE + gridHeight * gridLineWidth}px`,
          gap: `${gridLineWidth}px`,
          imageRendering: zoom < 1 ? 'auto' : 'pixelated',
        }}
      >
        {gridToRender.map((row, rowIndex) =>
          row.map((tileId, colIndex) => {
            const tile = tileMap.get(tileId);
            const isCellSelectedByWand = selection?.selectedCells && selection.selectedCells[rowIndex][colIndex] === 1;

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="relative bg-card"
                onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                onMouseOver={() => handleMouseOver(rowIndex, colIndex)}
                onMouseUp={() => handleMouseUp(rowIndex, colIndex)}
                style={{ width: TILE_SIZE, height: TILE_SIZE }}
              >
                {tile && tile.id !== 0 && (
                  <Image
                    src={tile.src}
                    alt={tile.name}
                    fill
                    sizes={`${TILE_SIZE}px`}
                    className="pointer-events-none object-cover"
                    unoptimized
                    data-ai-hint="pixel art tile"
                  />
                )}
                 {isCellSelectedByWand && (
                  <div className="absolute inset-0 bg-blue-500/30 pointer-events-none" />
                )}
              </div>
            );
          })
        )}

         {isPreviewMode && (
          <div 
            className="absolute flex items-center justify-center pointer-events-none"
            style={{
              left: `${playerPos.col * (TILE_SIZE + gridLineWidth) + gridLineWidth}px`,
              top: `${playerPos.row * (TILE_SIZE + gridLineWidth) + gridLineWidth}px`,
              width: `${TILE_SIZE}px`,
              height: `${TILE_SIZE}px`,
              transition: 'left 150ms ease-out, top 150ms ease-out',
            }}
          >
            <div 
              className="bg-white rounded-md animate-pulse-small"
              style={{
                width: `${TILE_SIZE * 0.7}px`,
                height: `${TILE_SIZE * 0.7}px`,
                boxShadow: '0 0 8px rgba(255,255,255,0.7)'
              }}
            />
          </div>
        )}
      </div>
       {finalSelection && !finalSelection.selectedCells && !isPreviewMode && (
        <div
          className="absolute border-2 border-dashed border-blue-500 pointer-events-none"
          style={{
            left: `${finalSelection.minCol * (TILE_SIZE + gridLineWidth)}px`,
            top: `${finalSelection.minRow * (TILE_SIZE + gridLineWidth)}px`,
            width: `${(finalSelection.maxCol - finalSelection.minCol + 1) * TILE_SIZE + (finalSelection.maxCol - finalSelection.minCol) * gridLineWidth}px`,
            height: `${(finalSelection.maxRow - finalSelection.minRow + 1) * TILE_SIZE + (finalSelection.maxRow - finalSelection.minRow) * gridLineWidth}px`,
            boxSizing: 'content-box',
          }}
        />
      )}
    </div>
  );
};
