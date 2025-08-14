
'use server';

/**
 * @fileOverview Implements the terrain generation flow.
 * - generateTerrain - A function that generates terrain based on a config.
 * - GenerateTerrainInput - The input type for the generateTerrain function.
 * - GenerateTerrainOutput - The return type for the generateTerrain function.
 */

import {ai} from '@/ai/genkit';
import {
    GenerateTerrainInputSchema, 
    GenerateTerrainOutputSchema,
    type GenerateTerrainInput,
    type GenerateTerrainOutput
} from '@/lib/schemas';


export async function generateTerrain(
  input: GenerateTerrainInput
): Promise<GenerateTerrainOutput> {
  return generateTerrainFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateTerrainPrompt',
  input: {schema: GenerateTerrainInputSchema},
  output: {schema: GenerateTerrainOutputSchema},
  prompt: `You are an expert AI level designer specializing in 2D tile-based maps. Your task is to generate a natural-looking terrain or a structured layout based on the user's configuration, completely replacing the provided grid.

The output MUST be a valid JSON object matching the output schema, representing the entire grid.

Current Grid Dimensions: {{grid.length}} rows, {{grid.0.length}} columns.

Generation Configuration:
- Terrain Type: {{config.type}}
- Tile Mapping:
{{#each config.tileMapping}}
- "{{@key}}": Tile ID {{this}}
{{/each}}

Instructions for 'forest':
1.  Fill the entire map with the 'ground' tile.
2.  Create a dense, but natural-looking forest by placing 'tree' tiles.
3.  The forest should have clearings and paths. Avoid placing trees in perfect lines or patterns. Use organic, clustered shapes.
4.  Ensure there are open areas, and the forest doesn't cover the entire map edge-to-edge. Create some natural-looking edges to the forest.

Instructions for 'desert':
1. Fill the entire map with the 'sand' tile.
2. Sparsely place 'cactus' tiles. Cacti should not be clustered together. They should appear randomly and infrequently.
3. Ensure large open areas of just sand.

Instructions for 'beach':
1. Create a shoreline that runs across the map, either horizontally or vertically. The shoreline should be irregular and curved, not a straight line.
2. One side of the shoreline should be 'water'.
3. The other side should be 'sand'.
4. Create a thin, intermittent border of 'shallow_water' between the 'water' and 'sand' to create a smooth transition.

Instructions for 'volcanic':
1. Fill most of the map with the 'rock' tile.
2. Create rivers or pools of 'lava' tiles. The lava flows should be winding and look natural.
3. Scatter 'obsidian' tiles near the edges of the lava flows.
4. Leave some areas of just rock.

Instructions for 'alien':
1. Fill the map with 'strange_ground'.
2. Place clusters of 'alien_plant' tiles. These clusters should be in strange, unnatural shapes.
3. Scatter individual 'crystal' tiles across the map, but not within the plant clusters. Crystals should be rare.

Instructions for 'grassland':
1. Fill the entire map with the 'grass' tile.
2. Sparsely place 'flower' tiles throughout the grassland.
3. Create small, scattered patches of 'rock' tiles to break up the monotony.
4. The overall feel should be open and rolling, not cluttered.

Instructions for 'jungle':
1. Fill the entire map with the 'ground' tile.
2. Create a very dense forest of 'jungle_tree' tiles. The trees should be tightly packed.
3. Weave 'vine' tiles throughout the tree areas, often hanging from where trees would be. They can also connect adjacent trees.
4. Leave very few, small clearings.

Instructions for 'mountains':
1. Fill the map with the 'rock' tile.
2. Create large, contiguous mountain ranges using the 'mountain_rock' tile. These should be massive, solid shapes.
3. Add 'snow' tiles to the tops (higher row numbers) of the mountain ranges to simulate snow caps. The transition from rock to snow should be somewhat irregular.
4. Create paths or valleys of the base 'rock' tile through the mountains.

Instructions for 'swamp':
1. Fill most of the map with 'mud' tiles.
2. Create large, amorphous pools of 'swamp_water'. These should not be simple circles; they should have irregular edges.
3. Scatter 'dead_tree' tiles sparsely within both the mud and shallow swamp water areas.

Instructions for 'crystal_caves':
1. Create a cavern system. The majority of the map should be the 'cave_wall' tile, representing solid earth.
2. Carve out open pathways and rooms using the 'cave_floor' tile. These paths should be winding and interconnected.
3. Place 'glowing_crystal' tiles in clusters along the 'cave_wall' edges bordering the 'cave_floor'. Crystals should not be in the middle of paths.

Instructions for 'tundra':
1. Fill the map with 'snow' tile.
2. Create large patches of 'ice' tiles, representing frozen lakes or glaciers. These should have hard, sharp edges.
3. Sparsely place 'frozen_rock' tiles. These should not be clustered.
4. The landscape should feel cold and barren.

Instructions for 'wasteland':
1. Fill the map with 'dead_earth' tile.
2. Create patches and small pools of 'toxic_waste' tiles.
3. Scatter 'ruined_debris' tiles around the edges of the toxic pools and randomly across the landscape.
4. The overall feel should be desolate and post-apocalyptic.

Instructions for 'farmland':
1. Create distinct rectangular or square fields using 'plowed_soil' and 'crops' tiles.
2. Separate the fields with lines of 'fence' tiles.
3. Place a few 'path' tiles to create dirt roads between some fields.
4. The layout should feel organized but not perfectly grid-aligned.

Instructions for 'ruins':
1. Fill the map with a base of 'overgrown_grass'.
2. Create the remnants of stone structures using 'ruined_wall' tiles. These should be broken, incomplete lines and small, hollow rectangular shapes.
3. Scatter 'debris_pile' tiles inside and around the ruined structures.
4. The structures should look ancient and reclaimed by nature.

Instructions for 'simple_village':
1. Fill the entire map with the 'grass' tile.
2. Create 3-5 simple, rectangular building shapes using the 'building_wall' tile. The buildings should not be touching.
3. Fill the inside of these buildings with the 'building_floor' tile.
4. For each building, replace one wall segment with a 'door' tile.
5. Create simple 'path' tiles connecting the doors of the buildings to each other. The paths should be 1 tile wide.
6. Sparsely place 'tree' tiles around the village, but not inside buildings or on paths.

Instructions for 'basic_dungeon':
1. The majority of the map should be 'dungeon_wall_solid', representing solid earth.
2. Carve out 4-6 rooms of varying rectangular sizes using the 'dungeon_floor' tile. Rooms should not overlap.
3. Connect the rooms with 1-tile-wide corridors, also using the 'dungeon_floor' tile. Ensure all rooms are accessible.
4. Replace the 'dungeon_wall_solid' tiles that are adjacent to the floor tiles with 'dungeon_wall' to create the interior walls.
5. Place a 'stairs_up' tile in one room and a 'stairs_down' tile in another, distant room.
6. Sparsely place 'debris' tiles in some rooms and corridors.

Generate a complete new grid according to these instructions. The output grid MUST have the same dimensions as the input grid.
`,
});

const generateTerrainFlow = ai.defineFlow(
  {
    name: 'generateTerrainFlow',
    inputSchema: GenerateTerrainInputSchema,
    outputSchema: GenerateTerrainOutputSchema,
  },
  async (input: GenerateTerrainInput) => {
    // The prompt is designed to return a full grid, so we just call it and return the output.
    // In a more complex scenario, we could pre-process the grid or combine multiple AI calls.
    const { output } = await prompt(input);
    return output!;
  }
);
