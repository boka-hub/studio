import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { FC } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { GridState, Tile, Tool, Selection } from '@/lib/types';

interface MapGridProps {
  grid: GridState;
  tiles: Tile[];
  tool: Tool;
  onCellAction: (row: number, col: number) => void;
  onShapeDraw: (start: { row: number, col: number }, end: { row: number, col: number }) => void;
  zoom?: number;
  selectedTileId: number;
  selection: Selection | null;
}

const BASE_TILE_SIZE = 32;

export const MapGrid: FC<MapGridProps> = ({ grid, tiles, tool, onCellAction, onShapeDraw, zoom = 1, selectedTileId, selection }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startCell, setStartCell] = useState<{ row: number; col: number } | null>(null);
  const [previewGrid, setPreviewGrid] = useState<GridState | null>(null);
  
  const TILE_SIZE = BASE_TILE_SIZE * zoom;

  const tileMap = useMemo(() => {
    return new Map(tiles.map(tile => [tile.id, tile]));
  }, [tiles]);

  const handleMouseDown = (row: number, col: number) => {
    setIsDrawing(true);
    if (tool === 'rectangle' || tool === 'select') {
        setStartCell({ row, col });
        if (tool === 'rectangle') {
            setPreviewGrid(grid); // Start preview from current grid state
        }
    } else {
        onCellAction(row, col);
    }
  };

  const handleMouseOver = (row: number, col: number) => {
    if (!isDrawing) return;

    if (tool === 'brush' || tool === 'eraser') {
      onCellAction(row, col);
    } else if (tool === 'rectangle' && startCell) {
        const newPreviewGrid = grid.map(r => [...r]);
        const minRow = Math.min(startCell.row, row);
        const maxRow = Math.max(startCell.row, row);
        const minCol = Math.min(startCell.col, col);
        const maxCol = Math.max(startCell.col, col);

        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) {
                    newPreviewGrid[r][c] = selectedTileId;
                }
            }
        }
        setPreviewGrid(newPreviewGrid);
    } else if (tool === 'select' && startCell) {
        onShapeDraw(startCell, { row, col });
    }
  };

  const handleMouseUp = (row: number, col: number) => {
    if ((tool === 'rectangle' || tool === 'select') && startCell) {
      onShapeDraw(startCell, { row, col });
    }
    setIsDrawing(false);
    setStartCell(null);
    setPreviewGrid(null);
  };

  const handleMouseLeave = () => {
    // If leaving grid while drawing a shape, commit the shape up to the last known cell
    if (isDrawing && (tool === 'rectangle' || tool === 'select') && startCell) {
        // This is tricky because we don't have the end cell.
        // For now, we'll just cancel the drawing. A more advanced implementation could track the last cell.
    }
    setIsDrawing(false);
    setStartCell(null);
    setPreviewGrid(null);
  };
  
  const getCursorClass = () => {
    switch (tool) {
      case 'brush':
        return 'cursor-cell';
      case 'eraser':
        return 'cursor-crosshair';
      case 'picker':
        return 'cursor-pointer';
      case 'ai':
        return 'cursor-help';
      case 'fill':
        return 'cursor-copy';
      case 'rectangle':
        return 'cursor-crosshair';
      case 'select':
        return 'cursor-crosshair';
      default:
        return 'cursor-default';
    }
  };
  
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
          width: `${gridWidth * TILE_SIZE + (gridWidth + 1) * gridLineWidth}px`,
          height: `${gridHeight * TILE_SIZE + (gridHeight + 1) * gridLineWidth}px`,
          gap: `${gridLineWidth}px`,
          imageRendering: zoom < 1 ? 'auto' : 'pixelated',
        }}
      >
        {gridToRender.map((row, rowIndex) =>
          row.map((tileId, colIndex) => {
            const tile = tileMap.get(tileId);
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
              </div>
            );
          })
        )}
      </div>
       {selection && (
        <div
          className="absolute border-2 border-dashed border-blue-500 pointer-events-none"
          style={{
            left: `${selection.minCol * (TILE_SIZE + gridLineWidth)}px`,
            top: `${selection.minRow * (TILE_SIZE + gridLineWidth)}px`,
            width: `${(selection.maxCol - selection.minCol + 1) * (TILE_SIZE + gridLineWidth)}px`,
            height: `${(selection.maxRow - selection.minRow + 1) * (TILE_SIZE + gridLineWidth)}px`,
            boxSizing: 'border-box',
          }}
        />
      )}
    </div>
  );
};
