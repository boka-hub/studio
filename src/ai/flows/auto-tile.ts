
'use server';

/**
 * @fileOverview This file implements the auto-tiling flow.
 * It takes the surrounding tiles and a set of available path tiles
 * and suggests the most appropriate tile for creating a path.
 * 
 * - autoTile - A function that handles the path tiling logic.
 * - AutoTileInput - The input type for the autoTile function.
 * - AutoTileOutput - The return type for the autoTile function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoTileInputSchema = z.object({
  surroundingTiles: z
    .array(z.array(z.number()))
    .describe('A 3x3 window of the grid centered on the target cell.'),
  availableTiles: z.array(z.number()).describe('The list of available tile indices that are considered part of the path.'),
});
export type AutoTileInput = z.infer<typeof AutoTileInputSchema>;

const AutoTileOutputSchema = z.object({
  suggestedTile: z
    .number()
    .describe('The index of the suggested tile for the given position to make the path connect.'),
});
export type AutoTileOutput = z.infer<typeof AutoTileOutputSchema>;

export async function autoTile(
  input: AutoTileInput
): Promise<AutoTileOutput> {
  return autoTileFlow(input);
}

const prompt = ai.definePrompt({
  name: 'autoTilePrompt',
  input: {schema: AutoTileInputSchema},
  output: {schema: AutoTileOutputSchema},
  prompt: `You are an expert AI tile map editor specializing in path creation. Your task is to select the correct tile from a set of available path tiles to place at the center of a 3x3 grid.

The center tile (originally a placeholder) needs to connect logically to its neighbors. The goal is to form a continuous path. The IDs in 'availableTiles' are the only ones you can use.

Analyze the 8 neighbors around the center. Based on which neighbors are also path tiles (present in 'availableTiles'), determine the correct tile for the center. For example:
- If path tiles are only above and below, you need a vertical straight piece.
- If a path tile is above and to the right, you need a corner piece that connects top and right.
- If path tiles are to the left, right, and below, you need a T-junction.
- If path tiles are on all 4 sides, you need a cross-junction.

3x3 Grid Window (target is the center):
{{#each surroundingTiles as |gridRow|}}
{{#each gridRow as |cell|}}{{cell}} {{/each}}
{{/each}}

Available Path Tile IDs: [{{#each availableTiles}}{{.}}{{#unless @last}}, {{/unless}}{{/each}}]

Your response must be one of the tile IDs from the 'availableTiles' list. Examine the grid and decide which tile creates the most logical connection.
`,
});

const autoTileFlow = ai.defineFlow(
  {
    name: 'autoTileFlow',
    inputSchema: AutoTileInputSchema,
    outputSchema: AutoTileOutputSchema,
  },
  async input => {
    // For now, we'll just return the first available tile as a placeholder.
    // The real implementation will call the AI prompt.
    if (input.availableTiles.length > 0) {
      return { suggestedTile: input.availableTiles[0] };
    }
    // Fallback to empty if no path tiles are provided.
    return { suggestedTile: 0 };
    
    // const {output} = await prompt(input);
    // return output!;
  }
);
