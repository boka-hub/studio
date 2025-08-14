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
import { ScrollArea } from './ui/scroll-area';

interface TerrainGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tiles: Tile[];
  grid: GridState;
  onGenerate: (grid: GridState) => void;
  onProcessingChange: (isProcessing: boolean) => void;
}

type TerrainType = 'forest' | 'desert' | 'beach' | 'volcanic' | 'alien' | 'grassland' | 'jungle' | 'mountains' | 'swamp' | 'crystal_caves' | 'tundra' | 'wasteland' | 'farmland' | 'ruins' | 'simple_village' | 'basic_dungeon';

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
    ice: 0,
    frozen_rock: 0,
    dead_earth: 0,
    toxic_waste: 0,
    ruined_debris: 0,
    plowed_soil: 0,
    crops: 0,
    fence: 0,
    path: 0,
    overgrown_grass: 0,
    ruined_wall: 0,
    debris_pile: 0,
    building_wall: 0,
    building_floor: 0,
    door: 0,
    dungeon_wall_solid: 0,
    dungeon_wall: 0,
    dungeon_floor: 0,
    stairs_up: 0,
    stairs_down: 0,
    debris: 0,
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
      case 'tundra':
          return tileMapping.snow > 0 && tileMapping.ice > 0 && tileMapping.frozen_rock > 0;
      case 'wasteland':
          return tileMapping.dead_earth > 0 && tileMapping.toxic_waste > 0 && tileMapping.ruined_debris > 0;
      case 'farmland':
          return tileMapping.plowed_soil > 0 && tileMapping.crops > 0 && tileMapping.fence > 0 && tileMapping.path > 0;
      case 'ruins':
          return tileMapping.overgrown_grass > 0 && tileMapping.ruined_wall > 0 && tileMapping.debris_pile > 0;
      case 'simple_village':
          return tileMapping.grass > 0 && tileMapping.building_wall > 0 && tileMapping.building_floor > 0 && tileMapping.door > 0 && tileMapping.path > 0 && tileMapping.tree > 0;
      case 'basic_dungeon':
          return tileMapping.dungeon_wall_solid > 0 && tileMapping.dungeon_wall > 0 && tileMapping.dungeon_floor > 0 && tileMapping.stairs_up > 0 && tileMapping.stairs_down > 0 && tileMapping.debris > 0;
      default:
        return false;
    }
  };

  const handleGenerate = async () => {
    if (!isConfigValid()) {
      toast({
        variant: 'destructive',
        title: 'Configuration Incomplete',
        description: 'Please select a tile for each required terrain element.',
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
       case 'tundra':
        return (
          <>
            <TileSelect id="snow-tile" label="Snow Tile" value={tileMapping.snow} onValueChange={(v) => handleTileMappingChange('snow', v)} />
            <TileSelect id="ice-tile" label="Ice Tile" value={tileMapping.ice} onValueChange={(v) => handleTileMappingChange('ice', v)} />
            <TileSelect id="frozen-rock-tile" label="Frozen Rock Tile" value={tileMapping.frozen_rock} onValueChange={(v) => handleTileMappingChange('frozen_rock', v)} />
          </>
        );
      case 'wasteland':
        return (
          <>
            <TileSelect id="dead-earth-tile" label="Dead Earth" value={tileMapping.dead_earth} onValueChange={(v) => handleTileMappingChange('dead_earth', v)} />
            <TileSelect id="toxic-waste-tile" label="Toxic Waste" value={tileMapping.toxic_waste} onValueChange={(v) => handleTileMappingChange('toxic_waste', v)} />
            <TileSelect id="ruined-debris-tile" label="Ruined Debris" value={tileMapping.ruined_debris} onValueChange={(v) => handleTileMappingChange('ruined_debris', v)} />
          </>
        );
      case 'farmland':
        return (
          <>
            <TileSelect id="plowed-soil-tile" label="Plowed Soil" value={tileMapping.plowed_soil} onValueChange={(v) => handleTileMappingChange('plowed_soil', v)} />
            <TileSelect id="crops-tile" label="Crops" value={tileMapping.crops} onValueChange={(v) => handleTileMappingChange('crops', v)} />
            <TileSelect id="fence-tile" label="Fence" value={tileMapping.fence} onValueChange={(v) => handleTileMappingChange('fence', v)} />
            <TileSelect id="path-tile" label="Path" value={tileMapping.path} onValueChange={(v) => handleTileMappingChange('path', v)} />
          </>
        );
      case 'ruins':
        return (
          <>
            <TileSelect id="overgrown-grass-tile" label="Overgrown Grass" value={tileMapping.overgrown_grass} onValueChange={(v) => handleTileMappingChange('overgrown_grass', v)} />
            <TileSelect id="ruined-wall-tile" label="Ruined Wall" value={tileMapping.ruined_wall} onValueChange={(v) => handleTileMappingChange('ruined_wall', v)} />
            <TileSelect id="debris-pile-tile" label="Debris Pile" value={tileMapping.debris_pile} onValueChange={(v) => handleTileMappingChange('debris_pile', v)} />
          </>
        );
      case 'simple_village':
        return (
          <>
            <TileSelect id="grass-tile" label="Grass" value={tileMapping.grass} onValueChange={(v) => handleTileMappingChange('grass', v)} />
            <TileSelect id="building-wall-tile" label="Building Wall" value={tileMapping.building_wall} onValueChange={(v) => handleTileMappingChange('building_wall', v)} />
            <TileSelect id="building-floor-tile" label="Building Floor" value={tileMapping.building_floor} onValueChange={(v) => handleTileMappingChange('building_floor', v)} />
            <TileSelect id="door-tile" label="Door" value={tileMapping.door} onValueChange={(v) => handleTileMappingChange('door', v)} />
            <TileSelect id="path-tile" label="Path" value={tileMapping.path} onValueChange={(v) => handleTileMappingChange('path', v)} />
            <TileSelect id="tree-tile" label="Tree" value={tileMapping.tree} onValueChange={(v) => handleTileMappingChange('tree', v)} />
          </>
        );
      case 'basic_dungeon':
        return (
          <>
            <TileSelect id="dungeon-wall-solid-tile" label="Solid Wall" value={tileMapping.dungeon_wall_solid} onValueChange={(v) => handleTileMappingChange('dungeon_wall_solid', v)} />
            <TileSelect id="dungeon-wall-tile" label="Interior Wall" value={tileMapping.dungeon_wall} onValueChange={(v) => handleTileMappingChange('dungeon_wall', v)} />
            <TileSelect id="dungeon-floor-tile" label="Floor" value={tileMapping.dungeon_floor} onValueChange={(v) => handleTileMappingChange('dungeon_floor', v)} />
            <TileSelect id="stairs-up-tile" label="Stairs Up" value={tileMapping.stairs_up} onValueChange={(v) => handleTileMappingChange('stairs_up', v)} />
            <TileSelect id="stairs-down-tile" label="Stairs Down" value={tileMapping.stairs_down} onValueChange={(v) => handleTileMappingChange('stairs_down', v)} />
            <TileSelect id="debris-tile" label="Debris" value={tileMapping.debris} onValueChange={(v) => handleTileMappingChange('debris', v)} />
          </>
        );
      default:
        return null;
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md flex flex-col h-[90vh]">
        <DialogHeader>
          <DialogTitle>Generate Random Terrain</DialogTitle>
          <DialogDescription>
            Use AI to generate natural-looking terrain. This will replace the
            current map content.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4 flex-grow overflow-hidden">
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
                  <SelectItem value="tundra">Tundra</SelectItem>
                  <SelectItem value="farmland">Farmland</SelectItem>
                  <SelectItem value="ruins">Ruins</SelectItem>
                  <SelectItem value="wasteland">Wasteland</SelectItem>
                  <SelectItem value="alien">Alien</SelectItem>
                  <SelectItem value="simple_village">Simple Village</SelectItem>
                  <SelectItem value="basic_dungeon">Basic Dungeon</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="flex-grow">
            <div className="space-y-4 pr-6">
                <h4 className="font-medium">Tile Configuration</h4>
                {renderConfigOptions()}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter className="flex-shrink-0">
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
