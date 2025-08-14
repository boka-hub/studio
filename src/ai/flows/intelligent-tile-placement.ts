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
  prompt: `You are an AI assistant that suggests the best tile to place in a tile grid based on the surrounding tiles.

Given the following tile grid:
{{#each grid}}
  {{this}}
{{/each}}

And the target row and column: row={{row}}, col={{col}}

And the available tiles: {{availableTiles}}

Suggest the most appropriate tile (as an index from the available tiles) to place in the grid at the specified row and column, considering the surrounding tiles to create a consistent and visually appealing map.

Return ONLY the index of the suggested tile from the availableTiles.
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
