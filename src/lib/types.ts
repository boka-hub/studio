
export type Tool = 'brush' | 'eraser' | 'picker' | 'fill' | 'shape' | 'select' | 'spray' | 'gradient' | 'noise' | 'magic-wand' | 'scatter' | 'auto-tile';

export type Shape = 'rectangle' | 'circle' | 'line';
export type ShapeStyle = 'fill' | 'outline';

export type AutoTileMode = '9-tile' | '13-tile' | '47-tile';

export type ExportFormat = 'txt' | 'json';

export interface Tile {
  id: number;
  name: string;
  src: string;
  solid?: boolean;
  metadata?: Record<string, any>;
}

export type GridState = number[][];

export interface Layer {
    id: string;
    name:string;
    grid: GridState;
    isVisible: boolean;
}

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
    layers: Layer[];
    activeLayerId: string | null;
    tiles: Tile[];
    lastModified: number;
}

export interface ProjectsState {
    projects: Project[];
    currentProjectId: string | null;
}

export interface AppSettings {
    layersEnabled: boolean;
    exportFormat: ExportFormat;
}

export interface TileImportData {
  name: string;
  src: string; // Now a data URL
  isSolid: boolean;
  metadata?: Record<string, any>;
}
