
'use server';

/**
 * @fileOverview This file implements the intelligent tile placement flow.
 * It takes the surrounding tiles as input and suggests the most appropriate tile.
 * 
 * - intelligentTilePlacement - A function that handles the plant diagnosis process.
 * - IntelligentTilePlacementInput - The input type for the diagnosePlant function.
 * - IntelligentTilePlacementOutput - The return type for the diagnosePlant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentTilePlacementInputSchema = z.object({
  grid: z
    .array(z.array(z.number()))
    .describe('The current state of the tile grid.'),
  row: z.number().describe('The row index of the tile to be placed.'),
  col: z.number().describe('The column index of the tile to be placed.'),
  availableTiles: z.array(z.number()).describe('The list of available tile indices.'),
});
export type IntelligentTilePlacementInput = z.infer<
  typeof IntelligentTilePlacementInputSchema
>;

const IntelligentTilePlacementOutputSchema = z.object({
  suggestedTile: z
    .number()
    .describe('The index of the suggested tile for the given position.'),
});
export type IntelligentTilePlacementOutput = z.infer<
  typeof IntelligentTilePlacementOutputSchema
>;

export async function intelligentTilePlacement(
  input: IntelligentTilePlacementInput
): Promise<IntelligentTilePlacementOutput> {
  return intelligentTilePlacementFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentTilePlacementPrompt',
  input: {schema: IntelligentTilePlacementInputSchema},
  output: {schema: IntelligentTilePlacementOutputSchema},
  prompt: `You are an expert AI tile map editor. Your task is to suggest the most appropriate tile for an empty space on a map to ensure visual consistency.

The tile map is represented as a grid of numbers, where each number is a tile ID. The ID '0' represents an empty tile.

You will be given the current grid, the coordinates (row, col) of the empty space to fill, and a list of available tile IDs to choose from.

Analyze the neighboring tiles around the target location (row={{row}}, col={{col}}). Based on the patterns and tile choices in the vicinity, select the best tile from the available options to create a seamless and logical map.

Current Grid State:
{{#each grid as |gridRow|}}
{{#each gridRow as |cell|}}{{cell}} {{/each}}
{{/each}}

Available Tile IDs: [{{#each availableTiles}}{{.}}{{#unless @last}}, {{/unless}}{{/each}}]

Your goal is to make the map look natural. For example, if the target cell is surrounded by 'water' tiles, you should probably suggest a 'water' tile. If it's at the border of 'grass' and 'sand', you might suggest a 'sand-to-grass-transition' tile if one is available.

Examine the provided grid and available tiles carefully and decide which tile ID is the best fit.
`,
});

const intelligentTilePlacementFlow = ai.defineFlow(
  {
    name: 'intelligentTilePlacementFlow',
    inputSchema: IntelligentTilePlacementInputSchema,
    outputSchema: IntelligentTilePlacementOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

    