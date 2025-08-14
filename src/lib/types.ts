export type Tool = 'brush' | 'eraser' | 'picker' | 'ai' | 'fill' | 'rectangle' | 'select' | 'spray' | 'gradient' | 'noise' | 'magic-wand';

export interface Tile {
  id: number;
  name: string;
  src: string;
}

export type GridState = number[][];

export interface Selection {
  minRow: number;
  minCol: number;
  maxRow: number;
  maxCol: number;
  selectedCells?: GridState; // For non-rectangular selections like magic wand
}
