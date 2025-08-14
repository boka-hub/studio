
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
import {
    IntelligentTilePlacementInputSchema,
    IntelligentTilePlacementOutputSchema,
    type IntelligentTilePlacementInput,
    type IntelligentTilePlacementOutput,
} from '@/lib/schemas';


export async function intelligentTilePlacement(
  input: IntelligentTilePlacementInput
): Promise<IntelligentTilePlacementOutput> {
  return intelligentTilePlacementFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentTilePlacementPrompt',
  input: {schema: IntelligentTilePlacementInputSchema},
  output: {schema: IntelligentTilePlacementOutputSchema},
  prompt: `You are an expert AI tile map editor. Your task is to suggest the most appropriate tile for the center of the provided 5x5 grid window. The ID '0' represents an empty tile, which is the tile you need to replace.

Analyze the neighboring tiles around the center of this window. Based on the patterns and tile choices in the vicinity, select the best tile from the available options to create a seamless and logical map.

5x5 Grid Window (target is the center '0'):
{{#each surroundingTiles as |gridRow|}}
{{#each gridRow as |cell|}}{{cell}} {{/each}}
{{/each}}

Available Tile IDs: [{{#each availableTiles}}{{.}}{{#unless @last}}, {{/unless}}{{/each}}]

Your goal is to make the map look natural. For example, if the center cell is surrounded by 'water' tiles, you should probably suggest a 'water' tile. If it's at the border of 'grass' and 'sand', you might suggest a 'sand-to-grass-transition' tile if one is available.

Examine the provided grid window and available tiles carefully and decide which tile ID is the best fit for the center.
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
