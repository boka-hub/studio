import React, { useState } from 'react';
import type { FC } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Tile } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TilePaletteProps {
  tiles: Tile[];
  selectedTileId: number;
  onSelectTile: (id: number) => void;
  onRenameTile: (id: number, newName: string) => void;
}

export const TilePalette: FC<TilePaletteProps> = ({
  tiles,
  selectedTileId,
  onSelectTile,
  onRenameTile,
}) => {
  const [editingTileId, setEditingTileId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleStartEditing = (tile: Tile) => {
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

  return (
    <div className="flex-1 flex flex-col">
      <h3 className="text-sm font-semibold p-2 px-4 text-muted-foreground">Palette</h3>
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-3 gap-4 p-4 pt-0">
          {tiles
            .filter((t) => t.id !== 0)
            .map((tile) => (
              <div key={tile.id} className="flex flex-col items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onSelectTile(tile.id)}
                      className={cn(
                        'relative aspect-square w-full rounded-md overflow-hidden border-2 transition-all duration-150',
                        selectedTileId === tile.id
                          ? 'border-primary scale-105 shadow-lg'
                          : 'border-card hover:border-accent'
                      )}
                      aria-label={`Select tile ${tile.name}`}
                      aria-pressed={selectedTileId === tile.id}
                    >
                      <Image
                        src={tile.src}
                        alt={tile.name}
                        fill
                        sizes="(max-width: 768px) 10vw, 5vw"
                        className="object-cover bg-muted/20"
                        unoptimized
                        data-ai-hint="pixel art"
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Double-click name to edit</p>
                  </TooltipContent>
                </Tooltip>

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
              </div>
            ))}
        </div>
      </ScrollArea>
    </div>
  );
};
