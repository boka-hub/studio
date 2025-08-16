import {z} from 'genkit';

// auto-tile.ts
export const AutoTileInputSchema = z.object({
  surroundingTiles: z
    .array(z.array(z.number()))
    .describe('A 3x3 window of the grid centered on the target cell. The center tile is the one to be replaced.'),
  availableTiles: z.array(z.number()).describe('The list of available tile indices that are considered part of the path.'),
  pathTileId: z.number().describe('The generic path tile ID that was used for drawing the path initially.'),
});
export type AutoTileInput = z.infer<typeof AutoTileInputSchema>;

export const AutoTileOutputSchema = z.object({
  suggestedTile: z
    .number()
    .describe('The index of the suggested tile for the given position to make the path connect. This must be one of the availableTiles.'),
});
export type AutoTileOutput = z.infer<typeof AutoTileOutputSchema>;


// generate-terrain.ts
const TerrainConfigSchema = z.object({
  type: z.enum(['forest', 'desert', 'beach', 'volcanic', 'alien', 'grassland', 'jungle', 'mountains', 'swamp', 'crystal_caves', 'tundra', 'wasteland', 'farmland', 'ruins', 'simple_village', 'basic_dungeon']).describe('The type of terrain to generate.'),
  tileMapping: z
    .record(z.string(), z.number())
    .describe(
      'A mapping from terrain element (e.g., "ground", "tree") to tile ID.'
    ),
});

export const GenerateTerrainInputSchema = z.object({
  grid: z
    .array(z.array(z.number()))
    .describe('The current state of the grid.'),
  config: TerrainConfigSchema,
});
export type GenerateTerrainInput = z.infer<typeof GenerateTerrainInputSchema>;

export const GenerateTerrainOutputSchema = z.object({
  grid: z
    .array(z.array(z.number()))
    .describe('The new grid state with the generated terrain.'),
});
export type GenerateTerrainOutput = z.infer<typeof GenerateTerrainOutputSchema>;
