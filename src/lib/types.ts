
export type Tool = 'brush' | 'eraser' | 'picker' | 'fill' | 'shape' | 'select' | 'spray' | 'gradient' | 'noise' | 'magic-wand' | 'scatter' | 'auto-tile';

export type Shape = 'rectangle' | 'circle';

export type AutoTileMode = '9-tile' | '13-tile' | '47-tile';

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

export interface Project {
    id: string;
    name: string;
    grid: GridState;
    tiles: Tile[];
    lastModified: number;
}

export interface ProjectsState {
    projects: Project[];
    currentProjectId: string | null;
}
