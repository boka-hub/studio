import type { FC } from 'react';
import React, { useState } from 'react';
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

type TerrainType = 'forest';

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
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleTileMappingChange = (elementType: string, tileId: string) => {
    setTileMapping((prev) => ({ ...prev, [elementType]: Number(tileId) }));
  };

  const isConfigValid = () => {
    if (terrainType === 'forest') {
      return tileMapping.ground > 0 && tileMapping.tree > 0;
    }
    return false;
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

  const renderForestConfig = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="ground-tile">Ground Tile</Label>
        <Select
          value={String(tileMapping.ground)}
          onValueChange={(value) => handleTileMappingChange('ground', value)}
        >
          <SelectTrigger id="ground-tile">
            <SelectValue placeholder="Select ground tile" />
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
      <div className="space-y-2">
        <Label htmlFor="tree-tile">Tree Tile</Label>
        <Select
          value={String(tileMapping.tree)}
          onValueChange={(value) => handleTileMappingChange('tree', value)}
        >
          <SelectTrigger id="tree-tile">
            <SelectValue placeholder="Select tree tile" />
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
    </>
  );

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
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-4">
            <h4 className="font-medium">Tile Configuration</h4>
            {terrainType === 'forest' && renderForestConfig()}
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
