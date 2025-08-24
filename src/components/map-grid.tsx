
import React, { useState, useMemo, useCallback, MouseEvent as ReactMouseEvent, useEffect, useRef } from 'react';
import type { FC } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { GridState, Tile, Tool, Selection, AutoTileMode, Shape, Layer, ShapeStyle } from '@/lib/types';
import { getAutoTileId } from '@/lib/auto-tiler';

interface MapGridProps {
  containerRef: React.RefObject<HTMLElement>;
  layers: Layer[];
  activeLayer: Layer | null;
  tiles: Tile[];
  tool: Tool;
  shape: Shape;
  shapeStyle: ShapeStyle;
  onCellAction: (row: number, col: number) => void;
  onDrawCommit: (newGrid: GridState) => void;
  onSelectionCommit: (start: { row: number, col: number }, end: { row: number, col: number }) => void;
  onCoordsChange: (coords: {row: number, col: number} | null) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
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
  gridVisible: boolean;
}

const BASE_TILE_SIZE = 16;

// Memoized TileCell component for performance optimization
const TileCell = React.memo(function TileCell({
    tile,
    isCellSelectedByWand,
    tileSize,
}: {
    tile: Tile | undefined;
    isCellSelectedByWand: boolean;
    tileSize: number;
}) {
    return (
        <div className="relative" style={{ width: tileSize, height: tileSize }}>
            {tile && tile.id !== 0 && (
                <Image
                    src={tile.src}
                    alt={tile.name}
                    fill
                    sizes={`${tileSize}px`}
                    className="object-cover"
                    unoptimized
                />
            )}
            {isCellSelectedByWand && (
                <div className="absolute inset-0 bg-primary/30" />
            )}
        </div>
    );
});


export const MapGrid: FC<MapGridProps> = ({ 
  containerRef,
  layers,
  activeLayer, 
  tiles, 
  tool,
  shape,
  shapeStyle,
  onCellAction, 
  onDrawCommit,
  onSelectionCommit,
  onCoordsChange,
  zoom = 1, 
  onZoomChange,
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
  gridVisible,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [startCell, setStartCell] = useState<{ row: number; col: number } | null>(null);
  const [currentCell, setCurrentCell] = useState<{ row: number; col: number } | null>(null);
  const [previewGrid, setPreviewGrid] = useState<GridState | null>(null);
  const gridWrapperRef = useRef<HTMLDivElement>(null);
  
  const TILE_SIZE = useMemo(() => BASE_TILE_SIZE * zoom, [zoom]);
  const isBrushLikeTool = ['brush', 'eraser', 'spray', 'auto-tile'].includes(tool);
  const isShapeTool = ['shape', 'gradient', 'noise', 'scatter'].includes(tool);
  
  const gridLineWidth = useMemo(() => gridVisible ? 1 : 0, [gridVisible]);
  
  useEffect(() => {
    if (!isDrawing) {
      setPreviewGrid(null);
    }
  }, [isDrawing]);
  
  const tileMap = useMemo(() => {
    return new Map(tiles.map(tile => [tile.id, tile]));
  }, [tiles]);

  const performDraw = useCallback((
    baseGrid: GridState, 
    row: number, 
    col: number, 
    currentTool: Tool,
    isCtrlPressed: boolean,
    startCoords?: {row: number, col: number} | null
    ): GridState => {
      let newGrid = baseGrid.map(r => [...r]);

      if (!newGrid || !newGrid[row] || newGrid[row][col] === undefined) {
          return baseGrid;
      }
      const endCoords = { row, col };
      
      if (isCtrlPressed && startCoords) {
        const minRow = Math.min(startCoords.row, endCoords.row);
        const maxRow = Math.max(startCoords.row, endCoords.row);
        const minCol = Math.min(startCoords.col, endCoords.col);
        const maxCol = Math.max(startCoords.col, endCoords.col);
        const tileId = tool === 'eraser' ? 0 : selectedTileId;
        
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            if (r >= 0 && r < newGrid.length && c >= 0 && c < newGrid[0].length) newGrid[r][c] = tileId;
          }
        }
        return newGrid;
      }

      if (currentTool === 'brush') {
          if (newGrid[row][col] !== selectedTileId) newGrid[row][col] = selectedTileId;
      } else if (currentTool === 'eraser') {
          if (newGrid[row][col] !== 0) newGrid[row][col] = 0;
      } else if (currentTool === 'spray') {
         for (let r_offset = -sprayRadius; r_offset <= sprayRadius; r_offset++) {
            for (let c_offset = -sprayRadius; c_offset <= sprayRadius; c_offset++) {
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
        if (autoTileMode === '47-tile' && autoTileSet.length < 16) return newGrid;
        if (autoTileMode !== '47-tile' && autoTileSet.length !== requiredTiles[autoTileMode]) {
          return newGrid;
        }

        const autoTileSet_ = new Set(autoTileSet);
        
        const tileToPlace = getAutoTileId(baseGrid, row, col, autoTileSet, autoTileMode);

        if(newGrid[row]?.[col] !== undefined) {
             if (autoTileOverwrite || newGrid[row][col] === 0 || autoTileSet_.has(newGrid[row][col])) {
                newGrid[row][col] = tileToPlace;
            }
        }
        
        // Update all its direct neighbors
        for (let r_offset = -1; r_offset <= 1; r_offset++) {
          for (let c_offset = -1; c_offset <= 1; c_offset++) {
             if (r_offset === 0 && c_offset === 0) continue; // Don't update the cell we just placed
            const nr = row + r_offset;
            const nc = col + c_offset;
            
            if (nr >= 0 && nr < newGrid.length && nc >= 0 && nc < newGrid[0].length) {
                if (autoTileSet_.has(newGrid[nr][nc])) {
                     const newTileId = getAutoTileId(newGrid, nr, nc, autoTileSet, autoTileMode);
                     if (newGrid[nr]?.[nc] !== undefined) {
                        newGrid[nr][nc] = newTileId;
                     }
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
                if (shapeStyle === 'fill' || r === minRow || r === maxRow || c === minCol || c === maxCol) {
                  if (r >= 0 && r < newGrid.length && c >= 0 && c < newGrid[0].length) newGrid[r][c] = tileId;
                }
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
                   const distSq = (dx * dx) + (dy * dy);
                   if (distSq <= 1) {
                        if (shapeStyle === 'fill') {
                            if (r >= 0 && r < newGrid.length && c >= 0 && c < newGrid[0].length) newGrid[r][c] = tileId;
                        } else { // outline
                            const isEdge = 
                                (((c + 1 - centerX) / radiusX) ** 2 + ((r - centerY) / radiusY) ** 2 > 1) ||
                                (((c - 1 - centerX) / radiusX) ** 2 + ((r - centerY) / radiusY) ** 2 > 1) ||
                                (((c - centerX) / radiusX) ** 2 + ((r + 1 - centerY) / radiusY) ** 2 > 1) ||
                                (((c - centerX) / radiusX) ** 2 + ((r - 1 - centerY) / radiusY) ** 2 > 1);

                            if (isEdge) {
                                if (r >= 0 && r < newGrid.length && c >= 0 && c < newGrid[0].length) newGrid[r][c] = tileId;
                            }
                        }
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
                  if (y0 >= 0 && y0 < newGrid.length && x0 >= 0 && x0 < newGrid[0].length) newGrid[y0][x0] = tileId;
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
                    if (r >= 0 && r < newGrid.length && c >= 0 && c < newGrid[0].length) {
                        const step = (c - minCol) / Math.max(1, width - 1);
                        const threshold = ((r % 2 === 0) ? (c % 2 === 0 ? 0.25 : 0.75) : (c % 2 === 0 ? 0.75 : 0.25));
                        newGrid[r][c] = step < threshold ? selectedTileId : secondarySelectedTileId;
                    }
                }
            }
        } else if (currentTool === 'noise') {
            for (let r = minRow; r <= maxRow; r++) {
                for (let c = minCol; c <= maxCol; c++) {
                    if (r >= 0 && r < newGrid.length && c >= 0 && c < newGrid[0].length) {
                        newGrid[r][c] = Math.random() < 0.5 ? selectedTileId : secondarySelectedTileId;
                    }
                }
            }
        } else if (currentTool === 'scatter') {
             if (scatterSet.length === 0) return newGrid;
             for (let r = minRow; r <= maxRow; r++) {
                for (let c = minCol; c <= maxCol; c++) {
                    if (r >= 0 && r < newGrid.length && c >= 0 && c < newGrid[0].length) {
                        const randomIndex = Math.floor(Math.random() * scatterSet.length);
                        newGrid[r][c] = scatterSet[randomIndex];
                    }
                }
            }
        }
    }
    return newGrid;
  }, [tool, shape, shapeStyle, selectedTileId, secondarySelectedTileId, sprayRadius, sprayDensity, scatterSet, autoTileSet, autoTileMode, autoTileOverwrite]);

  const getCoordsFromEvent = (e: ReactMouseEvent<HTMLDivElement> | MouseEvent | WheelEvent): { row: number, col: number } | null => {
    const gridEl = gridWrapperRef.current;
    if (!gridEl) return null;
    
    const rect = gridEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!activeLayer || !activeLayer.grid) return null;
    const gridHeight = activeLayer.grid.length;
    const gridWidth = activeLayer.grid[0]?.length || 0;
    
    const col = Math.floor(x / (TILE_SIZE + gridLineWidth));
    const row = Math.floor(y / (TILE_SIZE + gridLineWidth));

    if (row >= 0 && row < gridHeight && col >= 0 && col < gridWidth) {
        return { row, col };
    }
    return null;
  };

  const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (isPreviewMode || !activeLayer || !activeLayer.grid || e.button !== 0) return;
    e.preventDefault();

    if (tool === 'pan') {
      setIsPanning(true);
      return;
    }

    const coords = getCoordsFromEvent(e);
    if (!coords) return;
    
    setIsDrawing(true);
    setStartCell(coords);
    setCurrentCell(coords);
    
    const isCtrlPressed = e.ctrlKey || e.metaKey;

    if (isBrushLikeTool || isCtrlPressed) {
      setPreviewGrid(performDraw(activeLayer.grid, coords.row, coords.col, tool, isCtrlPressed, coords));
    }
  };

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const coords = getCoordsFromEvent(e);
    if (coords) {
      onCoordsChange(coords);
    } else {
      onCoordsChange(null);
    }
    
    if (isPanning && containerRef.current) {
      containerRef.current.scrollLeft -= e.movementX;
      containerRef.current.scrollTop -= e.movementY;
      return;
    }

    if (!isDrawing || !activeLayer || !activeLayer.grid) return;
    if (!coords) return;

    if (currentCell && currentCell.row === coords.row && currentCell.col === coords.col) return;
    setCurrentCell(coords);
    
    const isCtrlPressed = e.ctrlKey || e.metaKey;
    
    if (isBrushLikeTool || isCtrlPressed) {
      const baseGrid = previewGrid ?? activeLayer.grid;
      setPreviewGrid(performDraw(baseGrid, coords.row, coords.col, tool, isCtrlPressed, startCell));
    } else if (isShapeTool && startCell) {
      setPreviewGrid(performDraw(activeLayer.grid, coords.row, coords.col, tool, isCtrlPressed, startCell));
    }
  };

  const handleMouseUp = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    if (!activeLayer || !activeLayer.grid || !isDrawing) return;
    
    const coords = getCoordsFromEvent(e) || currentCell;
    setIsDrawing(false);

    if (coords) {
      const isClick = startCell && startCell.row === coords.row && startCell.col === coords.col;
      const isCtrlPressed = e.ctrlKey || e.metaKey;

      if (!isCtrlPressed && (tool === 'picker' || tool === 'fill' || tool === 'magic-wand')) {
        if(isClick) onCellAction(coords.row, coords.col);
      } else if (!isCtrlPressed && tool === 'select' && startCell) {
        onSelectionCommit(startCell, coords);
      } else {
          if (previewGrid) {
            onDrawCommit(previewGrid);
          }
      }
    }
    
    setStartCell(null);
    setCurrentCell(null);
    setPreviewGrid(null);
  };
  
  const handleMouseLeave = () => {
    onCoordsChange(null);
    if (isPanning) setIsPanning(false);

    if (isDrawing && activeLayer && activeLayer.grid) {
        if (previewGrid) {
           onDrawCommit(previewGrid);
        } else if (tool === 'select' && startCell && currentCell) {
           onSelectionCommit(startCell, currentCell);
        }
        setIsDrawing(false);
        setStartCell(null);
        setCurrentCell(null);
        setPreviewGrid(null);
    }
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -Math.sign(e.deltaY);
        const newZoom = Math.max(0.1, Math.min(2, zoom + delta * 0.1));

        const container = containerRef.current;
        const gridEl = gridWrapperRef.current;
        if (!container || !gridEl) return;

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;

        // Position on map before zoom
        const mapX = scrollLeft + mouseX;
        const mapY = scrollTop + mouseY;

        // Ratio of position on map
        const mapXRatio = mapX / (gridEl.offsetWidth * zoom);
        const mapYRatio = mapY / (gridEl.offsetHeight * zoom);
        
        onZoomChange(newZoom);
        
        // After zoom change, scroll to keep the same point under the cursor
        requestAnimationFrame(() => {
          const newMapX = mapXRatio * (gridEl.offsetWidth * newZoom);
          const newMapY = mapYRatio * (gridEl.offsetHeight * newZoom);
          container.scrollLeft = newMapX - mouseX;
          container.scrollTop = newMapY - mouseY;
        });
    }
  }, [zoom, onZoomChange, containerRef]);

  useEffect(() => {
      const container = containerRef.current;
      if (container) {
          container.addEventListener('wheel', handleWheel, { passive: false });
          return () => {
              container.removeEventListener('wheel', handleWheel);
          };
      }
  }, [containerRef, handleWheel]);
  
  const getCursorClass = () => {
    if (isPreviewMode) return 'cursor-none';
    if (!activeLayer) return 'cursor-not-allowed';
    if (isPanning) return 'cursor-grabbing';
    switch (tool) {
      case 'pan': return 'cursor-grab';
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

  if (!activeLayer || !activeLayer.grid) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">No active layer selected or grid is empty.</div>
  }
  
  const gridHeight = activeLayer.grid.length;
  const gridWidth = activeLayer.grid[0]?.length || 0;
  
  let selectionToRender = selection;
  if (isDrawing && tool === 'select' && startCell && currentCell) {
    selectionToRender = {
      minRow: Math.min(startCell.row, currentCell.row),
      maxRow: Math.max(startCell.row, currentCell.row),
      minCol: Math.min(startCell.col, currentCell.col),
      maxCol: Math.max(startCell.col, currentCell.col),
      selectedCells: undefined
    };
  }

  const renderLayerGrid = (layer: Layer, isPrimaryActiveLayer: boolean) => {
    const gridData = isPrimaryActiveLayer && previewGrid ? previewGrid : layer.grid;
    if (!gridData || gridData.length === 0 || gridData[0].length === 0) return null;

    return gridData.map((row, rowIndex) =>
        row.map((tileId, colIndex) => {
            const tile = tileMap.get(tileId);
            const isCellSelectedByWand = isPrimaryActiveLayer && selection?.selectedCells?.[rowIndex]?.[colIndex] === 1;

            return (
                <TileCell
                    key={`${layer.id}-${rowIndex}-${colIndex}`}
                    tile={tile}
                    isCellSelectedByWand={isCellSelectedByWand}
                    tileSize={TILE_SIZE}
                />
            );
        })
    );
  };

  return (
    <div
      ref={gridWrapperRef}
      className={cn(
        "relative rounded-lg shadow-inner select-none bg-muted/20",
        getCursorClass()
      )}
      style={{
          width: `${gridWidth * TILE_SIZE + (gridWidth + 1) * gridLineWidth}px`,
          height: `${gridHeight * TILE_SIZE + (gridHeight + 1) * gridLineWidth}px`,
          imageRendering: zoom < 1 ? 'auto' : 'pixelated',
          padding: `${gridLineWidth}px`,
          transition: 'width 0.2s, height 0.2s',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
        {layers
          .map((layer, index) => ({ layer, index }))
          .sort((a,b) => a.index - b.index) 
          .map(({ layer, index }) => {
            const isLayerActive = layer.id === activeLayer?.id;
            return layer.isVisible && (
              <div
                  key={layer.id}
                  className="absolute inset-0 grid pointer-events-none"
                  style={{
                    gridTemplateColumns: `repeat(${gridWidth}, 1fr)`,
                    gridTemplateRows: `repeat(${gridHeight}, 1fr)`,
                    gap: `${gridLineWidth}px`,
                    backgroundColor: gridVisible ? 'hsl(var(--border) / 0.75)' : 'transparent',
                    opacity: isLayerActive ? 1 : 0.75,
                    zIndex: index,
                  }}
              >
               {renderLayerGrid(layer, isLayerActive)}
              </div>
            )
          })
        }
       
       {isPreviewMode && (
          <div 
            className="absolute flex items-center justify-center pointer-events-none"
            style={{
              left: `${playerPos.col * (TILE_SIZE + gridLineWidth) + gridLineWidth}px`,
              top: `${playerPos.row * (TILE_SIZE + gridLineWidth) + gridLineWidth}px`,
              width: `${TILE_SIZE}px`,
              height: `${TILE_SIZE}px`,
              transition: 'left 150ms ease-out, top 150ms ease-out',
              zIndex: layers.length + 2,
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

       {selectionToRender && !selectionToRender.selectedCells && !isPreviewMode && (
        <div
          className="absolute border-2 border-dashed border-primary pointer-events-none"
          style={{
            left: `${selectionToRender.minCol * (TILE_SIZE + gridLineWidth)}px`,
            top: `${selectionToRender.minRow * (TILE_SIZE + gridLineWidth)}px`,
            width: `${(selectionToRender.maxCol - selectionToRender.minCol + 1) * (TILE_SIZE + gridLineWidth) - gridLineWidth}px`,
            height: `${(selectionToRender.maxRow - selectionToRender.minRow + 1) * (TILE_SIZE + gridLineWidth) - gridLineWidth}px`,
            boxSizing: 'content-box',
            zIndex: layers.length + 3,
          }}
        />
      )}
    </div>
  );
};
