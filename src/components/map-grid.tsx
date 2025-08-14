import React, { useState, useMemo } from 'react';
import type { FC } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { GridState, Tile, Tool } from '@/lib/types';

interface MapGridProps {
  grid: GridState;
  tiles: Tile[];
  tool: Tool;
  onCellAction: (row: number, col: number) => void;
  zoom?: number;
}

const BASE_TILE_SIZE = 32;

export const MapGrid: FC<MapGridProps> = ({ grid, tiles, tool, onCellAction, zoom = 1 }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const TILE_SIZE = BASE_TILE_SIZE * zoom;

  const tileMap = useMemo(() => {
    return new Map(tiles.map(tile => [tile.id, tile]));
  }, [tiles]);

  const handleMouseDown = (row: number, col: number) => {
    setIsDrawing(true);
    onCellAction(row, col);
  };

  const handleMouseOver = (row: number, col: number) => {
    if (isDrawing) {
      onCellAction(row, col);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleMouseLeave = () => {
    setIsDrawing(false);
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
      default:
        return 'cursor-default';
    }
  };
  
  const gridHeight = grid.length;
  const gridWidth = grid[0]?.length || 0;
  const gridLineWidth = 1;

  return (
    <div
      className="relative flex items-center justify-center w-full h-full"
      onMouseUp={handleMouseUp}
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
        {grid.map((row, rowIndex) =>
          row.map((tileId, colIndex) => {
            const tile = tileMap.get(tileId);
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="relative bg-card"
                onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                onMouseOver={() => handleMouseOver(rowIndex, colIndex)}
                style={{ width: TILE_SIZE, height: TILE_SIZE }}
              >
                {tile && tile.id !== 0 && (
                  <Image
                    src={tile.src}
                    alt={tile.name}
                    width={TILE_SIZE}
                    height={TILE_SIZE}
                    className="pointer-events-none"
                    unoptimized
                    data-ai-hint="pixel art tile"
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
