import type { FC } from 'react';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Tile, GridState } from '@/lib/types';
import { generateTerrain } from '@/ai/flows/generate-terrain';
import { Loader } from 'lucide-react';

interface TerrainGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tiles: Tile[];
  grid: GridState;
  onGenerate: (grid: GridState) => void;
  onProcessingChange: (isProcessing: boolean) => void;
}

type TerrainType = 'forest' | 'desert' | 'beach' | 'volcanic' | 'alien';

interface TerrainConfig {
  type: TerrainType;
  tileMapping: Record<string, number>;
}

export const TerrainGeneratorModal: FC<TerrainGeneratorModalProps> = ({
  isOpen,
  onClose,
  tiles,
  grid,
  onGenerate,
  onProcessingChange,
}) => {
  const [terrainType, setTerrainType] = useState<TerrainType>('forest');
  const [tileMapping, setTileMapping] = useState<Record<string, number>>({
    ground: 0,
    tree: 0,
    sand: 0,
    cactus: 0,
    water: 0,
    shallow_water: 0,
    rock: 0,
    lava: 0,
    obsidian: 0,
    strange_ground: 0,
    alien_plant: 0,
    crystal: 0,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleTileMappingChange = (elementType: string, tileId: string) => {
    setTileMapping((prev) => ({ ...prev, [elementType]: Number(tileId) }));
  };

  const isConfigValid = () => {
    switch (terrainType) {
      case 'forest':
        return tileMapping.ground > 0 && tileMapping.tree > 0;
      case 'desert':
        return tileMapping.sand > 0 && tileMapping.cactus > 0;
      case 'beach':
        return tileMapping.water > 0 && tileMapping.sand > 0 && tileMapping.shallow_water > 0;
      case 'volcanic':
        return tileMapping.rock > 0 && tileMapping.lava > 0 && tileMapping.obsidian > 0;
      case 'alien':
        return tileMapping.strange_ground > 0 && tileMapping.alien_plant > 0 && tileMapping.crystal > 0;
      default:
        return false;
    }
  };

  const handleGenerate = async () => {
    if (!isConfigValid()) {
      toast({
        variant: 'destructive',
        title: 'Configuration Incomplete',
        description: 'Please select a tile for each terrain element.',
      });
      return;
    }

    setIsGenerating(true);
    onProcessingChange(true);
    toast({ title: 'Generating Terrain...', description: 'The AI is creating your map. This may take a moment.' });

    try {
      const result = await generateTerrain({
        grid,
        config: { type: terrainType, tileMapping },
      });
      onGenerate(result.grid);
      onClose();
    } catch (error) {
      console.error('Terrain generation failed', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'The AI could not generate the terrain. Please try again.',
      });
    } finally {
      setIsGenerating(false);
      onProcessingChange(false);
    }
  };
  
  const TileSelect = ({ id, label, value, onValueChange }: { id: string, label: string, value: number, onValueChange: (value: string) => void}) => (
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <Select value={String(value)} onValueChange={onValueChange}>
          <SelectTrigger id={id}>
            <SelectValue placeholder={`Select ${label.toLowerCase()} tile`} />
          </SelectTrigger>
          <SelectContent>
            {tiles.map((tile) => (
              <SelectItem key={tile.id} value={String(tile.id)}>
                {tile.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
  );

  const renderConfigOptions = () => {
    switch (terrainType) {
      case 'forest':
        return (
          <>
            <TileSelect id="ground-tile" label="Ground Tile" value={tileMapping.ground} onValueChange={(v) => handleTileMappingChange('ground', v)} />
            <TileSelect id="tree-tile" label="Tree Tile" value={tileMapping.tree} onValueChange={(v) => handleTileMappingChange('tree', v)} />
          </>
        );
      case 'desert':
        return (
          <>
            <TileSelect id="sand-tile" label="Sand Tile" value={tileMapping.sand} onValueChange={(v) => handleTileMappingChange('sand', v)} />
            <TileSelect id="cactus-tile" label="Cactus Tile" value={tileMapping.cactus} onValueChange={(v) => handleTileMappingChange('cactus', v)} />
          </>
        );
      case 'beach':
          return (
            <>
              <TileSelect id="water-tile" label="Water Tile" value={tileMapping.water} onValueChange={(v) => handleTileMappingChange('water', v)} />
              <TileSelect id="shallow-water-tile" label="Shallow Water Tile" value={tileMapping.shallow_water} onValueChange={(v) => handleTileMappingChange('shallow_water', v)} />
              <TileSelect id="sand-tile" label="Sand Tile" value={tileMapping.sand} onValueChange={(v) => handleTileMappingChange('sand', v)} />
            </>
          );
      case 'volcanic':
        return (
          <>
            <TileSelect id="rock-tile" label="Rock Tile" value={tileMapping.rock} onValueChange={(v) => handleTileMappingChange('rock', v)} />
            <TileSelect id="lava-tile" label="Lava Tile" value={tileMapping.lava} onValueChange={(v) => handleTileMappingChange('lava', v)} />
            <TileSelect id="obsidian-tile" label="Obsidian Tile" value={tileMapping.obsidian} onValueChange={(v) => handleTileMappingChange('obsidian', v)} />
          </>
        );
      case 'alien':
        return (
          <>
            <TileSelect id="strange-ground-tile" label="Strange Ground Tile" value={tileMapping.strange_ground} onValueChange={(v) => handleTileMappingChange('strange_ground', v)} />
            <TileSelect id="alien-plant-tile" label="Alien Plant Tile" value={tileMapping.alien_plant} onValueChange={(v) => handleTileMappingChange('alien_plant', v)} />
            <TileSelect id="crystal-tile" label="Crystal Tile" value={tileMapping.crystal} onValueChange={(v) => handleTileMappingChange('crystal', v)} />
          </>
        );
      default:
        return null;
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Random Terrain</DialogTitle>
          <DialogDescription>
            Use AI to generate natural-looking terrain. This will replace the
            current map content.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="terrain-type">Terrain Type</Label>
            <Select
              value={terrainType}
              onValueChange={(v) => setTerrainType(v as TerrainType)}
            >
              <SelectTrigger id="terrain-type">
                <SelectValue placeholder="Select terrain type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="forest">Forest</SelectItem>
                <SelectItem value="desert">Desert</SelectItem>
                <SelectItem value="beach">Beach</SelectItem>
                <SelectItem value="volcanic">Volcanic</SelectItem>
                <SelectItem value="alien">Alien</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-4">
            <h4 className="font-medium">Tile Configuration</h4>
            {renderConfigOptions()}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={!isConfigValid() || isGenerating}
          >
            {isGenerating && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
