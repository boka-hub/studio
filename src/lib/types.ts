
export type Tool = 'brush' | 'eraser' | 'picker' | 'fill' | 'rectangle' | 'select' | 'spray' | 'gradient' | 'noise' | 'magic-wand' | 'scatter';

export interface Tile {
  id: number;
  name: string;
  src: string;
  solid?: boolean;
}

export type GridState = number[][];

export interface Selection {
  minRow: number;
  minCol: number;
  maxRow: number;
  maxCol: number;
  selectedCells?: GridState; // For non-rectangular selections like magic wand
}

export interface ProjectState {
    grid: GridState;
    tiles: Tile[];
}

export interface Project extends ProjectState {
    id: string;
    name: string;
    lastModified: number;
}
