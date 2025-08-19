
import React, { useState, useMemo, useCallback, MouseEvent } from 'react';
import type { FC } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { GridState, Tile, Tool, Selection, AutoTileMode, Shape } from '@/lib/types';
import { getAutoTileId9, getAutoTileId13, getAutoTileId47 } from '@/lib/auto-tiler';

interface MapGridProps {
  grid: GridState;
  tiles: Tile[];
  tool: Tool;
  shape: Shape;
  onCellAction: (row: number, col: number) => void;
  onDrawCommit: (newGrid: GridState) => void;
  onSelectionCommit: (start: { row: number, col: number }, end: { row: number, col: number }) => void;
  zoom?: number;
  selectedTileId: number;
  secondarySelectedTileId: number;
  selection: Selection | null;
  isPreviewMode: boolean;
  playerPos: {row: number, col: number};
  autoTileMode: AutoTileMode;
  autoTileSet: number[];
  autoTileOverwrite: boolean;
  sprayRadius: number;
  sprayDensity: number;
  scatterSet: number[];
}

const BASE_TILE_SIZE = 16;

export const MapGrid: FC<MapGridProps> = ({ 
  grid, 
  tiles, 
  tool,
  shape,
  onCellAction, 
  onDrawCommit,
  onSelectionCommit,
  zoom = 1, 
  selectedTileId, 
  secondarySelectedTileId, 
  selection,
  isPreviewMode,
  playerPos,
  autoTileMode,
  autoTileSet,
  autoTileOverwrite,
  sprayRadius,
  sprayDensity,
  scatterSet,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startCell, setStartCell] = useState<{ row: number; col: number } | null>(null);
  const [previewGrid, setPreviewGrid] = useState<GridState | null>(null);
  const [previewSelection, setPreviewSelection] = useState<Selection | null>(null);
  const [isShapeDrag, setIsShapeDrag] = useState(false);
  
  const TILE_SIZE = BASE_TILE_SIZE * zoom;
  const isBrushLikeTool = ['brush', 'eraser', 'spray', 'auto-tile'].includes(tool);
  const isShapeTool = ['shape', 'gradient', 'noise', 'scatter', 'select'].includes(tool);

  const tileMap = useMemo(() => {
    return new Map(tiles.map(tile => [tile.id, tile]));
  }, [tiles]);
  
  const performFreeformDraw = useCallback((gridState: GridState, row: number, col: number): GridState => {
      let newGrid = gridState.map(r => [...r]);
      if (tool === 'brush') {
          if (newGrid[row][col] === selectedTileId) return newGrid;
          newGrid[row][col] = selectedTileId;
      } else if (tool === 'eraser') {
          if (newGrid[row][col] === 0) return newGrid;
          newGrid[row][col] = 0;
      } else if (tool === 'spray') {
         for (let r = -sprayRadius; r <= sprayRadius; r++) {
            for (let c = -sprayRadius; c <= sprayRadius; c++) {
                if (r * r + c * c <= sprayRadius * sprayRadius) {
                    const targetRow = row + r;
                    const targetCol = col + c;
                    if (targetRow >= 0 && targetRow < newGrid.length && targetCol >= 0 && targetCol < newGrid[0].length) {
                        if (Math.random() < sprayDensity) {
                            newGrid[targetRow][targetCol] = selectedTileId;
                        }
                    }
                }
            }
        }
      } else if (tool === 'auto-tile') {
        const requiredTiles = { '9-tile': 9, '13-tile': 13, '47-tile': 47 };
        if (autoTileSet.length !== requiredTiles[autoTileMode]) {
          return newGrid;
        }

        const autoTileSet_ = new Set(autoTileSet);
        const getTileIdFunc = {
          '9-tile': getAutoTileId9,
          '13-tile': getAutoTileId13,
          '47-tile': getAutoTileId47,
        }[autoTileMode];

        const centerIndex = autoTileMode === '9-tile' ? 4 : autoTileMode === '13-tile' ? 12 : 2;
        newGrid[row][col] = autoTileSet[centerIndex];

        for (let r_offset = -1; r_offset <= 1; r_offset++) {
          for (let c_offset = -1; c_offset <= 1; c_offset++) {
            const nr = row + r_offset;
            const nc = col + c_offset;

            if (nr >= 0 && nr < newGrid.length && nc >= 0 && nc < newGrid[0].length) {
              const neighborTile = newGrid[nr][nc];
              const isNeighborAutoTile = autoTileSet_.has(neighborTile);
              
              if (isNeighborAutoTile || autoTileOverwrite || neighborTile === 0) {
                 const newTileId = getTileIdFunc(newGrid, nr, nc, autoTileSet);
                 newGrid[nr][nc] = newTileId;
              }
            }
          }
        }
      }
      return newGrid;
  }, [tool, selectedTileId, autoTileMode, autoTileSet, sprayRadius, sprayDensity, autoTileOverwrite]);

  const performShapeDraw = useCallback((gridState: GridState, start: {row: number, col: number}, end: {row: number, col: number}, currentTool: Tool, currentShape: Shape): GridState => {
    let newGrid = gridState.map(r => [...r]);
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);

    let drawTool = currentTool;
    // For Ctrl+Drag, the "tool" is brush/eraser, but we want to draw a shape
    if (currentTool === 'brush' || currentTool === 'eraser' || currentTool === 'auto-tile') {
      drawTool = 'shape'; 
    }
    const tileId = currentTool === 'eraser' ? 0 : selectedTileId;

    if (drawTool === 'shape') {
      if(currentShape === 'rectangle') {
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) {
              newGrid[r][c] = tileId;
            }
          }
        }
      } else if (currentShape === 'circle') {
          const centerX = (minCol + maxCol) / 2;
          const centerY = (minRow + maxRow) / 2;
          const radiusX = (maxCol - minCol) / 2;
          const radiusY = (maxRow - minRow) / 2;
          for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
               const dx = (c - centerX) / radiusX;
               const dy = (r - centerY) / radiusY;
               if ((dx * dx) + (dy * dy) <= 1) {
                  if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) {
                    newGrid[r][c] = tileId;
                  }
               }
            }
          }
      } else if (currentShape === 'line') {
          // Bresenham's line algorithm
          let x0 = start.col;
          let y0 = start.row;
          const x1 = end.col;
          const y1 = end.row;

          const dx = Math.abs(x1 - x0);
          const sx = x0 < x1 ? 1 : -1;
          const dy = -Math.abs(y1 - y0);
          const sy = y0 < y1 ? 1 : -1;
          let err = dx + dy;

          while (true) {
              if (y0 >= 0 && y0 < grid.length && x0 >= 0 && x0 < grid[0].length) {
                  newGrid[y0][x0] = tileId;
              }
              if (x0 === x1 && y0 === y1) break;
              const e2 = 2 * err;
              if (e2 >= dy) {
                  err += dy;
                  x0 += sx;
              }
              if (e2 <= dx) {
                  err += dx;
                  y0 += sy;
              }
          }
      }
    } else if (drawTool === 'gradient') {
        const width = maxCol - minCol + 1;
        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) {
                    const step = (c - minCol) / Math.max(1, width - 1);
                    const threshold = ((r % 2 === 0) ? (c % 2 === 0 ? 0.25 : 0.75) : (c % 2 === 0 ? 0.75 : 0.25));
                    newGrid[r][c] = step < threshold ? selectedTileId : secondarySelectedTileId;
                }
            }
        }
    } else if (drawTool === 'noise') {
        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) {
                    const random = Math.sin(r * 12.9898 + c * 78.233) * 43758.5453;
                    newGrid[r][c] = (random - Math.floor(random)) < 0.5 ? selectedTileId : secondarySelectedTileId;
                }
            }
        }
    } else if (drawTool === 'scatter') {
         if (scatterSet.length === 0) return newGrid;
         for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) {
                    const randomIndex = Math.floor(Math.random() * scatterSet.length);
                    newGrid[r][c] = scatterSet[randomIndex];
                }
            }
        }
    }
    return newGrid;
  }, [selectedTileId, secondarySelectedTileId, scatterSet, grid]);

  const handleMouseDown = (e: MouseEvent, row: number, col: number) => {
    if (isPreviewMode) return;
    setIsDrawing(true);
    
    const isCtrlDrag = (e.ctrlKey || e.metaKey) && isBrushLikeTool;
    setIsShapeDrag(isCtrlDrag || isShapeTool);

    if (isCtrlDrag || isShapeTool) {
        setStartCell({ row, col });
        setPreviewSelection(null);
    } else if (isBrushLikeTool) {
        const newPreviewGrid = performFreeformDraw(grid, row, col);
        setPreviewGrid(newPreviewGrid);
    } else {
        // For simple click tools like Fill, Picker, Magic Wand
        onCellAction(row, col);
    }
  };

  const handleMouseOver = (row: number, col: number) => {
    if (!isDrawing || isPreviewMode) return;

    if (isShapeDrag) {
        if(!startCell) return;
        const minRow = Math.min(startCell.row, row);
        const maxRow = Math.max(startCell.row, row);
        const minCol = Math.min(startCell.col, col);
        const maxCol = Math.max(startCell.col, col);

        if (tool === 'select') {
             setPreviewSelection({ minRow, minCol, maxRow, maxCol, selectedCells: undefined });
             return;
        }

        const newPreviewGrid = performShapeDraw(grid, startCell, {row, col}, tool, shape);
        setPreviewGrid(newPreviewGrid);

    } else if (isBrushLikeTool) {
        setPreviewGrid(currentPreview => {
            if (!currentPreview) return null;
            return performFreeformDraw(currentPreview, row, col);
        });
    }
  };

  const handleMouseUp = (row: number, col: number) => {
    if (isPreviewMode || !isDrawing) return;

    setIsDrawing(false);
    
    if (previewGrid) {
      onDrawCommit(previewGrid);
    } else if (startCell && tool === 'select') {
      onSelectionCommit(startCell, { row, col });
    }

    setStartCell(null);
    setPreviewGrid(null);
    setPreviewSelection(null);
    setIsShapeDrag(false);
  };

  const handleMouseLeave = () => {
    if (isDrawing) {
      // Cancel the drawing if the mouse leaves the grid area while pressed
      setIsDrawing(false);
      setStartCell(null);
      setPreviewGrid(null);
      setPreviewSelection(null);
      setIsShapeDrag(false);
    }
  };
  
  const getCursorClass = () => {
    if (isPreviewMode) return 'cursor-none';
    switch (tool) {
      case 'brush':
      case 'auto-tile':
      case 'spray':
        return 'cursor-cell';
      case 'eraser':
        return 'cursor-crosshair';
      case 'picker':
      case 'fill':
      case 'magic-wand':
        return 'cursor-pointer';
      case 'shape':
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
                onMouseDown={(e) => handleMouseDown(e as unknown as MouseEvent, rowIndex, colIndex)}
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
