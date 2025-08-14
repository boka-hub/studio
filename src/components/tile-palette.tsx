import React, { useState } from 'react';
import type { FC } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Tile } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TilePaletteProps {
  tiles: Tile[];
  selectedTileId: number;
  onSelectTile: (id: number) => void;
  onRenameTile: (id: number, newName: string) => void;
  onDeleteTile: (id: number) => void;
  isCollapsed: boolean;
}

export const TilePalette: FC<TilePaletteProps> = ({
  tiles,
  selectedTileId,
  onSelectTile,
  onRenameTile,
  onDeleteTile,
  isCollapsed,
}) => {
  const [editingTileId, setEditingTileId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleStartEditing = (tile: Tile) => {
    if (isCollapsed) return;
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <h3 className={cn("text-sm font-semibold p-4 pb-2 text-muted-foreground flex-shrink-0", isCollapsed && "hidden")}>Palette</h3>
      <ScrollArea className="flex-grow">
        <div className={cn(
            "grid gap-4 p-4 pt-2",
            isCollapsed ? "grid-cols-2" : "grid-cols-3"
          )}>
          {tiles
            .filter((t) => t.id !== 0)
            .map((tile) => (
              <div key={tile.id} className="group flex flex-col items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectTile(tile.id); }}
                      onClick={() => onSelectTile(tile.id)}
                      className={cn(
                        'relative aspect-square w-full rounded-md overflow-hidden border-2 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                        selectedTileId === tile.id
                          ? 'border-primary scale-105 shadow-lg'
                          : 'border-card hover:border-accent'
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
                        <Button 
                          variant="destructive"
                          size="icon"
                          className="absolute top-0.5 right-0.5 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDelete(e, tile.id)}
                          aria-label={`Delete tile ${tile.name}`}
                          tabIndex={-1} // Prevent tabbing to the delete button within the tile
                        >
                          <X className="h-4 w-4" />
                        </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                     {isCollapsed ? <p>{tile.name}</p> : <p>Double-click name to edit</p>}
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
        </div>
      </ScrollArea>
    </div>
  );
};
