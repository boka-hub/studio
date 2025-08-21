
import React, { useState, useMemo, useCallback, MouseEvent, useEffect } from 'react';
import type { FC } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { GridState, Tile, Tool, Selection, AutoTileMode, Shape, Layer } from '@/lib/types';
import { getAutoTileId9, getAutoTileId13, getAutoTileId47 } from '@/lib/auto-tiler';

interface MapGridProps {
  layers: Layer[];
  activeLayer: Layer | null;
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
  layers,
  activeLayer, 
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
  const [currentCell, setCurrentCell] = useState<{ row: number; col: number } | null>(null);
  const [previewGrid, setPreviewGrid] = useState<GridState | null>(null);
  
  const TILE_SIZE = useMemo(() => BASE_TILE_SIZE * zoom, [zoom]);
  const isBrushLikeTool = ['brush', 'eraser', 'spray', 'auto-tile'].includes(tool);
  const isShapeTool = ['shape', 'gradient', 'noise', 'scatter'].includes(tool);
  const grid = activeLayer?.grid ?? [[]];

  const tileMap = useMemo(() => {
    return new Map(tiles.map(tile => [tile.id, tile]));
  }, [tiles]);

  const performDraw = useCallback((
    gridState: GridState, 
    row: number, 
    col: number, 
    currentTool: Tool,
    startCoords?: {row: number, col: number} | null
    ): GridState => {
      let newGrid = gridState.map(r => [...r]);
      const endCoords = { row, col };

      if (currentTool === 'brush') {
          if (newGrid[row][col] !== selectedTileId) newGrid[row][col] = selectedTileId;
      } else if (currentTool === 'eraser') {
          if (newGrid[row][col] !== 0) newGrid[row][col] = 0;
      } else if (currentTool === 'spray') {
         for (let r_offset = -sprayRadius; r_offset <= sprayRadius; r_offset++) {
            for (let c_offset = -c_offset; c_offset <= sprayRadius; c_offset++) {
                if (r_offset * r_offset + c_offset * c_offset <= sprayRadius * sprayRadius) {
                    const targetRow = row + r_offset;
                    const targetCol = col + c_offset;
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
      } else if (isShapeTool && startCoords) {
        const minRow = Math.min(startCoords.row, endCoords.row);
        const maxRow = Math.max(startCoords.row, endCoords.row);
        const minCol = Math.min(startCoords.col, endCoords.col);
        const maxCol = Math.max(startCoords.col, endCoords.col);
        const tileId = selectedTileId;
        
        if (currentTool === 'shape') {
          if (shape === 'rectangle') {
            for (let r = minRow; r <= maxRow; r++) {
              for (let c = minCol; c <= maxCol; c++) {
                if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) newGrid[r][c] = tileId;
              }
            }
          } else if (shape === 'circle') {
              const centerX = (minCol + maxCol) / 2;
              const centerY = (minRow + maxRow) / 2;
              const radiusX = (maxCol - minCol) / 2;
              const radiusY = (maxRow - minRow) / 2;
              for (let r = minRow; r <= maxRow; r++) {
                for (let c = minCol; c <= maxCol; c++) {
                   const dx = radiusX === 0 ? 0 : (c - centerX) / radiusX;
                   const dy = radiusY === 0 ? 0 : (r - centerY) / radiusY;
                   if ((dx * dx) + (dy * dy) <= 1) {
                      if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) newGrid[r][c] = tileId;
                   }
                }
              }
          } else if (shape === 'line') {
              let x0 = startCoords.col; let y0 = startCoords.row;
              const x1 = endCoords.col; const y1 = endCoords.row;
              const dx = Math.abs(x1 - x0); const sx = x0 < x1 ? 1 : -1;
              const dy = -Math.abs(y1 - y0); const sy = y0 < y1 ? 1 : -1;
              let err = dx + dy;
              while (true) {
                  if (y0 >= 0 && y0 < grid.length && x0 >= 0 && x0 < grid[0].length) newGrid[y0][x0] = tileId;
                  if (x0 === x1 && y0 === y1) break;
                  const e2 = 2 * err;
                  if (e2 >= dy) { err += dy; x0 += sx; }
                  if (e2 <= dx) { err += dx; y0 += sy; }
              }
          }
        } else if (currentTool === 'gradient') {
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
        } else if (currentTool === 'noise') {
            for (let r = minRow; r <= maxRow; r++) {
                for (let c = minCol; c <= maxCol; c++) {
                    if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) {
                        newGrid[r][c] = Math.random() < 0.5 ? selectedTileId : secondarySelectedTileId;
                    }
                }
            }
        } else if (currentTool === 'scatter') {
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
    }
    return newGrid;
  }, [tool, shape, selectedTileId, secondarySelectedTileId, sprayRadius, sprayDensity, scatterSet, autoTileSet, autoTileMode, autoTileOverwrite, grid]);

  const handleMouseDown = (e: MouseEvent, row: number, col: number) => {
    if (isPreviewMode || !activeLayer || e.button !== 0) return;
    e.preventDefault();
    setIsDrawing(true);
    setStartCell({ row, col });
    setCurrentCell({ row, col });

    if (isBrushLikeTool) {
      setPreviewGrid(performDraw(grid, row, col, tool));
    }
  };

  const handleMouseMove = (row: number, col: number) => {
    if (!isDrawing || !activeLayer) return;

    if (currentCell && currentCell.row === row && currentCell.col === col) return;
    setCurrentCell({ row, col });

    if (isBrushLikeTool) {
      setPreviewGrid(prevGrid => performDraw(prevGrid || grid, row, col, tool));
    } else if (isShapeTool && startCell) {
      setPreviewGrid(performDraw(grid, row, col, tool, startCell));
    }
  };

  const handleMouseUp = (row: number, col: number) => {
    if (!isDrawing || !activeLayer) return;

    const isClick = startCell && startCell.row === row && startCell.col === col;

    if (tool === 'picker' || tool === 'fill' || tool === 'magic-wand') {
      if(isClick) onCellAction(row, col);
    } else if (tool === 'select' && startCell) {
      onSelectionCommit(startCell, { row, col });
    } else if (previewGrid) {
      onDrawCommit(previewGrid);
    } else if (isClick && (isBrushLikeTool || isShapeTool)) {
      // Handle single click for brush-like and shape tools
      onDrawCommit(performDraw(grid, row, col, tool, {row, col}));
    }

    // Reset drawing state
    setIsDrawing(false);
    setStartCell(null);
    setCurrentCell(null);
    setPreviewGrid(null);
  };
  
  const handleMouseLeave = () => {
    if (isDrawing && previewGrid) {
      onDrawCommit(previewGrid);
    }
    setIsDrawing(false);
    setStartCell(null);
    setCurrentCell(null);
    setPreviewGrid(null);
  };
  
  const getCursorClass = () => {
    if (isPreviewMode) return 'cursor-none';
    if (!activeLayer) return 'cursor-not-allowed';
    switch (tool) {
      case 'brush': case 'auto-tile': case 'spray':
        return 'cursor-cell';
      case 'eraser':
        return 'cursor-crosshair';
      case 'picker': case 'fill': case 'magic-wand':
        return 'cursor-pointer';
      case 'shape': case 'gradient': case 'noise': case 'scatter': case 'select':
        return 'cursor-crosshair';
      default:
        return 'cursor-default';
    }
  };
  
  let selectionToRender = selection;
  if (isDrawing && tool === 'select' && startCell && currentCell) {
    selectionToRender = {
      minRow: Math.min(startCell.row, currentCell.row),
      maxRow: Math.max(startCell.row, currentCell.row),
      minCol: Math.min(startCell.col, currentCell.col),
      maxCol: Math.max(startCell.col, currentCell.col),
    };
  }

  const gridToRender = activeLayer ? (previewGrid || activeLayer.grid) : [[]];
  const gridHeight = gridToRender.length;
  const gridWidth = gridToRender[0]?.length || 0;
  const gridLineWidth = 1;

  if (gridHeight === 0 || gridWidth === 0) {
    return <div className="text-muted-foreground">No layers available or grid is empty.</div>
  }

  return (
    <div
      className="relative flex items-center justify-center w-full h-full"
      onMouseLeave={handleMouseLeave}
    >
        <div className="absolute inset-0 grid"
            style={{
                gridTemplateColumns: `repeat(${gridWidth}, ${TILE_SIZE}px)`,
                gridTemplateRows: `repeat(${gridHeight}, ${TILE_SIZE}px)`,
                width: `${gridWidth * TILE_SIZE + gridWidth * gridLineWidth}px`,
                height: `${gridHeight * TILE_SIZE + gridHeight * gridLineWidth}px`,
                gap: `${gridLineWidth}px`,
            }}
        >
            {/* Render all visible layers underneath the active one */}
            {layers.filter(l => l.isVisible && l.id !== activeLayer?.id).map(layer => (
                <div key={layer.id} className="absolute inset-0 pointer-events-none grid"
                    style={{
                        gridTemplateColumns: `repeat(${gridWidth}, ${TILE_SIZE}px)`,
                        gridTemplateRows: `repeat(${gridHeight}, ${TILE_SIZE}px)`,
                        gap: `${gridLineWidth}px`,
                        imageRendering: zoom < 1 ? 'auto' : 'pixelated',
                    }}
                >
                    {layer.grid.map((row, rowIndex) =>
                        row.map((tileId, colIndex) => {
                            const tile = tileMap.get(tileId);
                            return (
                                <div key={`${layer.id}-${rowIndex}-${colIndex}`} className="relative bg-transparent">
                                    {tile && tile.id !== 0 && (
                                        <Image
                                            src={tile.src}
                                            alt={tile.name}
                                            fill
                                            sizes={`${TILE_SIZE}px`}
                                            className="pointer-events-none object-cover"
                                            unoptimized
                                        />
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            ))}
        </div>
      <div
        className={cn("bg-transparent p-px rounded-lg shadow-inner select-none", getCursorClass())}
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
                className={cn(
                    "relative",
                    activeLayer?.isVisible ? 'bg-card/50' : 'bg-card/20'
                 )}
                onMouseDown={(e) => handleMouseDown(e as unknown as MouseEvent, rowIndex, colIndex)}
                onMouseMove={() => handleMouseMove(rowIndex, colIndex)}
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
       {selectionToRender && !selectionToRender.selectedCells && !isPreviewMode && (
        <div
          className="absolute border-2 border-dashed border-blue-500 pointer-events-none"
          style={{
            left: `${selectionToRender.minCol * (TILE_SIZE + gridLineWidth)}px`,
            top: `${selectionToRender.minRow * (TILE_SIZE + gridLineWidth)}px`,
            width: `${(selectionToRender.maxCol - selectionToRender.minCol + 1) * TILE_SIZE + (selectionToRender.maxCol - selectionToRender.minCol) * gridLineWidth}px`,
            height: `${(selectionToRender.maxRow - selectionToRender.minRow + 1) * TILE_SIZE + (selectionToRender.maxRow - selectionToRender.minRow) * gridLineWidth}px`,
            boxSizing: 'content-box',
          }}
        />
      )}
    </div>
  );
};
