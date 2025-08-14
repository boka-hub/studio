
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
  prompt: `You are an expert AI level designer specializing in 2D tile-based maps. Your task is to generate a natural-looking terrain based on the user's configuration, completely replacing the provided grid.

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
