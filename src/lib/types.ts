export type Tool = 'brush' | 'eraser' | 'picker' | 'ai' | 'fill' | 'rectangle' | 'select' | 'spray' | 'gradient' | 'noise';

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
}
