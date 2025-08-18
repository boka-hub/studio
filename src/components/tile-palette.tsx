
import React, { useState, useRef } from 'react';
import type { FC } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Tile, Tool } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { X, Shield, ShieldOff, Search, Dices, Wand } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from './ui/badge';

interface TilePaletteProps {
  tiles: Tile[];
  selectedTileId: number;
  secondarySelectedTileId: number;
  scatterSet: number[];
  autoTileSet: number[];
  tool: Tool;
  onSelectTile: (id: number) => void;
  onSelectSecondaryTile: (id: number) => void;
  onToggleScatterTile: (id: number) => void;
  onClearScatterSet: () => void;
  onToggleAutoTile: (id: number) => void;
  onClearAutoTileSet: () => void;
  onRenameTile: (id: number, newName: string) => void;
  onDeleteTile: (id: number) => void;
  onToggleSolid: (id: number) => void;
  onReorderTiles: (reorderedTiles: Tile[]) => void;
  isCollapsed: boolean;
}

export const TilePalette: FC<TilePaletteProps> = ({
  tiles,
  selectedTileId,
  secondarySelectedTileId,
  scatterSet,
  autoTileSet,
  tool,
  onSelectTile,
  onSelectSecondaryTile,
  onToggleScatterTile,
  onClearScatterSet,
  onToggleAutoTile,
  onClearAutoTileSet,
  onRenameTile,
  onDeleteTile,
  onToggleSolid,
  onReorderTiles,
  isCollapsed,
}) => {
  const [editingTileId, setEditingTileId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedTileId, setDraggedTileId] = useState<number | null>(null);
  
  const dragTargetRef = useRef<HTMLDivElement | null>(null);

  const handleStartEditing = (tile: Tile) => {
    if (isCollapsed || tile.id === 0) return;
    setEditingTileId(tile.id);
    setEditingName(tile.name);
  };

  const handleConfirmRename = () => {
    if (editingTileId !== null && editingName.trim() !== '') {
      onRenameTile(editingTileId, editingName.trim());
    }
    setEditingTileId(null);
    setEditingName('');
  };
  
  const handleDelete = (e: React.MouseEvent, tileId: number) => {
    e.stopPropagation();
    onDeleteTile(tileId);
  }

  const handleToggleSolid = (e: React.MouseEvent, tileId: number) => {
    e.stopPropagation();
    onToggleSolid(tileId);
  }

  const handleTileClick = (e: React.MouseEvent, tileId: number) => {
    if (tool === 'scatter') {
        if (tileId !== 0) onToggleScatterTile(tileId);
        return;
    }
    if (tool === 'auto-tile') {
        if (tileId !== 0) onToggleAutoTile(tileId);
        return;
    }
    if (e.button === 2) { // Right-click
      e.preventDefault();
      onSelectSecondaryTile(tileId);
    } else {
      onSelectTile(tileId);
    }
  };

  const getBorderStyle = (tileId: number) => {
    if (tool === 'scatter') {
        return scatterSet.includes(tileId) ? 'border-blue-500 scale-105 shadow-lg' : 'border-card hover:border-accent';
    }
    if (tool === 'auto-tile') {
        return autoTileSet.includes(tileId) ? 'border-yellow-500 scale-105 shadow-lg' : 'border-card hover:border-accent';
    }
    const isPrimary = selectedTileId === tileId;
    const isSecondary = secondarySelectedTileId === tileId;

    if (isPrimary && isSecondary) {
      return 'border-purple-500 scale-105 shadow-lg';
    }
    if (isPrimary) {
      return 'border-primary scale-105 shadow-lg';
    }
    if (isSecondary) {
      return 'border-green-500 scale-105 shadow-lg';
    }
    return 'border-card hover:border-accent';
  };

  const filteredTiles = tiles
    .filter(t => t.id !== 0)
    .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, tileId: number) => {
    if (searchQuery) {
        e.preventDefault();
        return;
    }
    e.stopPropagation(); // Prevent parent drag handlers
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTileId(tileId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetTileId: number) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent parent drag handlers
    if(draggedTileId === null || draggedTileId === targetTileId) return;

    if (dragTargetRef.current) {
      dragTargetRef.current.style.borderBottom = '';
    }

    const targetElement = e.currentTarget.closest('.tile-container');
    if (targetElement) {
        dragTargetRef.current = targetElement as HTMLDivElement;
        dragTargetRef.current.style.borderBottom = '2px solid hsl(var(--primary))';
    }
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent parent drag handlers
    if (dragTargetRef.current) {
        dragTargetRef.current.style.borderBottom = '';
        dragTargetRef.current = null;
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropTileId: number) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent parent drag handlers
    if (draggedTileId === null || draggedTileId === dropTileId || searchQuery) {
      return;
    }
    
    handleDragLeave(e);

    const emptyTile = tiles.find(t => t.id === 0);
    const currentTiles = tiles.filter(t => t.id !== 0);

    const draggedIndex = currentTiles.findIndex(t => t.id === draggedTileId);
    const dropIndex = currentTiles.findIndex(t => t.id === dropTileId);

    if (draggedIndex === -1 || dropIndex === -1) return;

    const reordered = Array.from(currentTiles);
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, draggedItem);
    
    onReorderTiles([emptyTile!, ...reordered]);
    setDraggedTileId(null);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation(); // Prevent parent drag handlers
    if (dragTargetRef.current) {
        dragTargetRef.current.style.borderBottom = '';
        dragTargetRef.current = null;
    }
    setDraggedTileId(null);
  };


  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className={cn("p-4 pb-2 flex-shrink-0 space-y-2", isCollapsed && "hidden")}>
        <h3 className="text-sm font-semibold text-muted-foreground">Palette</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tiles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        {tool === 'scatter' && (
            <div className="p-2 rounded-md bg-muted/50 text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                    <Dices className="h-4 w-4 text-muted-foreground"/>
                    <p className="text-sm text-muted-foreground">Scatter Set:</p>
                    <Badge variant="secondary">{scatterSet.length} tiles</Badge>
                </div>
                {scatterSet.length > 0 && (
                    <Button variant="outline" size="sm" className="h-7" onClick={onClearScatterSet}>Clear Set</Button>
                )}
            </div>
        )}
        {tool === 'auto-tile' && (
            <div className="p-2 rounded-md bg-muted/50 text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                    <Wand className="h-4 w-4 text-muted-foreground"/>
                    <p className="text-sm text-muted-foreground">Auto-Tile Set:</p>
                    <Badge variant="secondary">{autoTileSet.length} tiles</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Select exactly 47 tiles for a blob tileset.</p>
                {autoTileSet.length > 0 && (
                    <Button variant="outline" size="sm" className="h-7" onClick={onClearAutoTileSet}>Clear Set</Button>
                )}
            </div>
        )}
      </div>
      <ScrollArea className="flex-grow">
        <div className={cn(
            "grid gap-2 p-4 pt-2",
            isCollapsed ? "grid-cols-1 place-items-center" : "grid-cols-3"
          )}>
          {filteredTiles.map((tile) => (
              <div 
                key={tile.id} 
                className={cn("group flex flex-col items-center gap-1.5 tile-container", isCollapsed ? "w-10" : "w-full", draggedTileId === tile.id && "opacity-50")}
                draggable={!isCollapsed && !searchQuery}
                onDragStart={(e) => handleDragStart(e, tile.id)}
                onDragOver={(e) => handleDragOver(e, tile.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, tile.id)}
                onDragEnd={handleDragEnd}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      role="button"
                      tabIndex={0}
                      onContextMenu={(e) => handleTileClick(e, tile.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTileClick(e as any, tile.id); }}
                      onClick={(e) => handleTileClick(e, tile.id)}
                      className={cn(
                        'relative aspect-square w-full rounded-md overflow-hidden border-2 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                         searchQuery ? 'cursor-not-allowed' : 'cursor-grab',
                        getBorderStyle(tile.id)
                      )}
                      aria-label={`Select tile ${tile.name}`}
                      aria-pressed={selectedTileId === tile.id}
                      style={{ imageRendering: 'pixelated' }}
                    >
                      <Image
                        src={tile.src}
                        alt={tile.name}
                        fill
                        sizes="(max-width: 768px) 10vw, 5vw"
                        className="object-cover bg-muted/20 pointer-events-none"
                        unoptimized
                        data-ai-hint="pixel art"
                      />
                       {!isCollapsed && (
                          <div className="absolute top-0.5 right-0.5 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant={tile.solid ? 'secondary' : 'ghost'}
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => handleToggleSolid(e, tile.id)}
                                  aria-label={`Toggle solid property for tile ${tile.name}`}
                                >
                                  {tile.solid ? <Shield className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p>{tile.solid ? "Make Passable" : "Make Solid"}</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="destructive"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => handleDelete(e, tile.id)}
                                  aria-label={`Delete tile ${tile.name}`}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p>Delete Tile</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                       )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                     {isCollapsed ? <p>{tile.name}</p> : 
                     searchQuery ? <p>{tile.name}</p> :
                     tool === 'scatter' ? <p>Toggle in Scatter Set</p> :
                     tool === 'auto-tile' ? <p>Toggle in Auto-Tile Set</p> :
                     <div><p>Left-click: Set Primary</p><p>Right-click: Set Secondary</p><p>Drag to Reorder</p></div>}
                  </TooltipContent>
                </Tooltip>

                {!isCollapsed && (
                  <div className="w-full text-center h-6">
                    {editingTileId === tile.id ? (
                      <Input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={handleConfirmRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleConfirmRename();
                          }
                          if (e.key === 'Escape') setEditingTileId(null);
                        }}
                        className="text-xs h-full p-1 text-center bg-input border-primary ring-offset-background focus-visible:ring-primary"
                        autoFocus
                        onFocus={(e) => e.target.select()}
                      />
                    ) : (
                      <p
                        onDoubleClick={() => handleStartEditing(tile)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer w-full px-1 truncate"
                        title={tile.name}
                      >
                        {tile.name}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
            {filteredTiles.length === 0 && searchQuery && (
                <div className="col-span-full text-center text-sm text-muted-foreground py-4">
                    No tiles found for &quot;{searchQuery}&quot;.
                </div>
            )}
        </div>
      </ScrollArea>
    </div>
  );
};
