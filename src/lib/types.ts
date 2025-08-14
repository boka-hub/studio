export type Tool = 'brush' | 'eraser' | 'picker' | 'ai' | 'fill';

export interface Tile {
  id: number;
  name: string;
  src: string;
}

export type GridState = number[][];
