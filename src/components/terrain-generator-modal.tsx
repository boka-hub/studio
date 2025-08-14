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

type TerrainType = 'forest' | 'desert' | 'beach' | 'volcanic' | 'alien' | 'grassland' | 'jungle' | 'mountains' | 'swamp' | 'crystal_caves';

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
    grass: 0,
    flower: 0,
    jungle_tree: 0,
    vine: 0,
    snow: 0,
    mountain_rock: 0,
    mud: 0,
    swamp_water: 0,
    dead_tree: 0,
    cave_wall: 0,
    cave_floor: 0,
    glowing_crystal: 0,
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
      case 'grassland':
        return tileMapping.grass > 0 && tileMapping.flower > 0 && tileMapping.rock > 0;
      case 'jungle':
          return tileMapping.ground > 0 && tileMapping.jungle_tree > 0 && tileMapping.vine > 0;
      case 'mountains':
          return tileMapping.rock > 0 && tileMapping.snow > 0 && tileMapping.mountain_rock > 0;
      case 'swamp':
          return tileMapping.mud > 0 && tileMapping.swamp_water > 0 && tileMapping.dead_tree > 0;
      case 'crystal_caves':
          return tileMapping.cave_wall > 0 && tileMapping.cave_floor > 0 && tileMapping.glowing_crystal > 0;
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
      case 'grassland':
        return (
          <>
            <TileSelect id="grass-tile" label="Grass Tile" value={tileMapping.grass} onValueChange={(v) => handleTileMappingChange('grass', v)} />
            <TileSelect id="flower-tile" label="Flower Tile" value={tileMapping.flower} onValueChange={(v) => handleTileMappingChange('flower', v)} />
            <TileSelect id="rock-tile" label="Rock Tile" value={tileMapping.rock} onValueChange={(v) => handleTileMappingChange('rock', v)} />
          </>
        );
      case 'jungle':
        return (
          <>
            <TileSelect id="ground-tile" label="Jungle Floor" value={tileMapping.ground} onValueChange={(v) => handleTileMappingChange('ground', v)} />
            <TileSelect id="jungle-tree-tile" label="Jungle Tree" value={tileMapping.jungle_tree} onValueChange={(v) => handleTileMappingChange('jungle_tree', v)} />
            <TileSelect id="vine-tile" label="Vine Tile" value={tileMapping.vine} onValueChange={(v) => handleTileMappingChange('vine', v)} />
          </>
        );
      case 'mountains':
        return (
          <>
            <TileSelect id="rock-tile" label="Base Rock Tile" value={tileMapping.rock} onValueChange={(v) => handleTileMappingChange('rock', v)} />
            <TileSelect id="mountain-rock-tile" label="Mountain Face Tile" value={tileMapping.mountain_rock} onValueChange={(v) => handleTileMappingChange('mountain_rock', v)} />
            <TileSelect id="snow-tile" label="Snow Cap Tile" value={tileMapping.snow} onValueChange={(v) => handleTileMappingChange('snow', v)} />
          </>
        );
      case 'swamp':
        return (
          <>
            <TileSelect id="mud-tile" label="Mud Tile" value={tileMapping.mud} onValueChange={(v) => handleTileMappingChange('mud', v)} />
            <TileSelect id="swamp-water-tile" label="Swamp Water Tile" value={tileMapping.swamp_water} onValueChange={(v) => handleTileMappingChange('swamp_water', v)} />
            <TileSelect id="dead-tree-tile" label="Dead Tree Tile" value={tileMapping.dead_tree} onValueChange={(v) => handleTileMappingChange('dead_tree', v)} />
          </>
        );
      case 'crystal_caves':
        return (
          <>
            <TileSelect id="cave-wall-tile" label="Cave Wall Tile" value={tileMapping.cave_wall} onValueChange={(v) => handleTileMappingChange('cave_wall', v)} />
            <TileSelect id="cave-floor-tile" label="Cave Floor Tile" value={tileMapping.cave_floor} onValueChange={(v) => handleTileMappingChange('cave_floor', v)} />
            <TileSelect id="glowing-crystal-tile" label="Glowing Crystal Tile" value={tileMapping.glowing_crystal} onValueChange={(v) => handleTileMappingChange('glowing_crystal', v)} />
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
                <SelectItem value="grassland">Grassland</SelectItem>
                <SelectItem value="jungle">Jungle</SelectItem>
                <SelectItem value="desert">Desert</SelectItem>
                <SelectItem value="beach">Beach</SelectItem>
                <SelectItem value="mountains">Mountains</SelectItem>
                <SelectItem value="swamp">Swamp</SelectItem>
                <SelectItem value="volcanic">Volcanic</SelectItem>
                <SelectItem value="crystal_caves">Crystal Caves</SelectItem>
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
