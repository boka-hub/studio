
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
    .describe('A 3x3 window of the grid centered on the target cell. The center tile is the one to be replaced.'),
  availableTiles: z.array(z.number()).describe('The list of available tile indices that are considered part of the path.'),
  pathTileId: z.number().describe('The generic path tile ID that was used for drawing the path initially.'),
});
export type AutoTileInput = z.infer<typeof AutoTileInputSchema>;

const AutoTileOutputSchema = z.object({
  suggestedTile: z
    .number()
    .describe('The index of the suggested tile for the given position to make the path connect. This must be one of the availableTiles.'),
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
  prompt: `You are an expert AI tile map editor. Your task is to select the correct tile from a set of available path tiles to place at the center of a 3x3 grid to form a continuous path.

The center tile (and any neighbors with the ID {{pathTileId}}) represents a part of the path. The goal is to connect it to its neighbors. The IDs in 'availableTiles' are the only ones you can use for the replacement.

Analyze the 8 neighbors. A neighbor is part of the path if its ID is {{pathTileId}} or if it's already one of the 'availableTiles'.

- If path neighbors are ONLY above and below, you need a vertical straight piece.
- If path neighbors are ONLY left and right, you need a horizontal straight piece.
- If path neighbors are above and to the right, you need a corner connecting top and right.
- If path neighbors are to the left, right, and below, you need a T-junction.
- If path neighbors are on all 4 sides (top, bottom, left, right), you need a cross-junction.
- Handle all 16 possible connectivity combinations for the 4 cardinal directions (top, right, bottom, left). Diagonals matter less but can inform the decision if the choice is ambiguous.

3x3 Grid Window (target is the center):
{{#each surroundingTiles as |gridRow|}}
{{#each gridRow as |cell|}}{{cell}} {{/each}}
{{/each}}

Generic Path Tile ID used for drawing: {{pathTileId}}
Available specialized Path Tile IDs for output: [{{#each availableTiles}}{{.}}{{#unless @last}}, {{/unless}}{{/each}}]

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
    const {output} = await prompt(input);
    return output!;
  }
);
