
import type { GridState } from './types';

// Standard 47-tile "blob" tileset mapping.
// The index corresponds to the bitmask value calculated from neighbors.
const TILE_MAP = [
  // 0-15: Basic 16 tiles (cardinal directions)
  2, 8, 10, 11, 16, 24, 26, 27, 2, 8, 10, 11, 16, 24, 26, 27,
  // 16-31
  32, 40, 42, 43, 48, 56, 58, 59, 32, 40, 42, 43, 48, 56, 58, 59,
  // 32-47
  34, 41, 46, 47, 49, 57, 62, 63, 34, 41, 46, 47, 49, 57, 62, 63,
  // 48-63
  32, 40, 42, 43, 48, 56, 58, 59, 32, 40, 42, 43, 48, 56, 58, 59,
  // 64-79
  1, 9, 10, 11, 17, 25, 26, 27, 1, 9, 10, 11, 17, 25, 26, 27,
  // 80-95
  33, 41, 42, 43, 49, 57, 58, 59, 33, 41, 42, 43, 49, 57, 58, 59,
  // 96-111
  33, 41, 46, 47, 49, 57, 62, 63, 33, 41, 46, 47, 49, 57, 62, 63,
  // 112-127
  33, 41, 42, 43, 49, 57, 58, 59, 33, 41, 42, 43, 49, 57, 58, 59,
  // 128-143
  6, 22, 30, 31, 6, 22, 30, 31, 6, 22, 30, 31, 6, 22, 30, 31,
  // 144-159
  38, 54, 62, 63, 38, 54, 62, 63, 38, 54, 62, 63, 38, 54, 62, 63,
  // 160-175
  38, 54, 62, 63, 38, 54, 62, 63, 38, 54, 62, 63, 38, 54, 62, 63,
  // 176-191
  38, 54, 62, 63, 38, 54, 62, 63, 38, 54, 62, 63, 38, 54, 62, 63,
  // 192-207
  5, 21, 29, 31, 5, 21, 29, 31, 5, 21, 29, 31, 5, 21, 29, 31,
  // 208-223
  37, 53, 61, 63, 37, 53, 61, 63, 37, 53, 61, 63, 37, 53, 61, 63,
  // 224-239
  37, 53, 61, 63, 37, 53, 61, 63, 37, 53, 61, 63, 37, 53, 61, 63,
  // 240-255
  37, 53, 61, 63, 37, 53, 61, 63, 37, 53, 61, 63, 4, 20, 28, 31,
];

const TILE_MAP_REVERSED: number[] = [
    0, 64, 0, 0, 240, 241, 0, 0, 1, 65, 0, 0, 248, 249, 0, 0,
    4, 68, 0, 0, 244, 245, 0, 0, 5, 69, 0, 0, 252, 253, 0, 0,
    128, 192, 0, 0, 112, 113, 0, 0, 129, 193, 0, 0, 120, 121, 0, 0,
    132, 196, 0, 0, 116, 117, 0, 0, 133, 197, 0, 0, 124, 125, 0, 0,
    16, 80, 0, 0, 242, 243, 0, 0, 17, 81, 0, 0, 250, 251, 0, 0,
    20, 84, 0, 0, 246, 247, 0, 0, 21, 85, 0, 0, 254, 255, 0, 0,
    144, 208, 0, 0, 114, 115, 0, 0, 145, 209, 0, 0, 122, 123, 0, 0,
    148, 212, 0, 0, 118, 119, 0, 0, 149, 213, 0, 0, 126, 127
];

function getTile(grid: GridState, r: number, c: number, tileSet: Set<number>): boolean {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) {
        return false; // Out of bounds is not a tile
    }
    return tileSet.has(grid[r][c]);
}

/**
 * Calculates the appropriate tile ID for a cell based on its neighbors,
 * using a 47-tile blob tileset logic.
 * @param grid The current map grid.
 * @param r The row index of the cell to calculate for.
 * @param c The column index of the cell to calculate for.
 * @param autoTileSet An array of 47 tile IDs, ordered according to the standard blob tileset mapping.
 * @returns The new tile ID for the cell.
 */
export function getAutoTileId(grid: GridState, r: number, c: number, autoTileSet: number[]): number {
    if (autoTileSet.length !== 47) {
        // Return a default or transparent tile if the set is invalid
        return autoTileSet[0] ?? 0;
    }
    
    const tileSet = new Set(autoTileSet);
    if (!tileSet.has(grid[r][c])) {
        // Not an auto-tile, don't change it
        return grid[r][c];
    }

    // Get neighbors (cardinal and diagonal)
    const north = getTile(grid, r - 1, c, tileSet);
    const west = getTile(grid, r, c - 1, tileSet);
    const east = getTile(grid, r, c + 1, tileSet);
    const south = getTile(grid, r + 1, c, tileSet);
    const northWest = getTile(grid, r - 1, c - 1, tileSet);
    const northEast = getTile(grid, r - 1, c + 1, tileSet);
    const southWest = getTile(grid, r + 1, c - 1, tileSet);
    const southEast = getTile(grid, r + 1, c + 1, tileSet);

    // Calculate bitmask
    let mask = 0;
    if (north) mask |= 1;
    if (west) mask |= 2;
    if (east) mask |= 4;
    if (south) mask |= 8;
    if (northWest && north && west) mask |= 16;
    if (northEast && north && east) mask |= 32;
    if (southWest && south && west) mask |= 64;
    if (southEast && south && east) mask |= 128;
    
    const tileMapIndex = TILE_MAP_REVERSED[mask];
    const tileIndex = TILE_MAP[tileMapIndex];

    if (tileIndex >= 0 && tileIndex < 47) {
        return autoTileSet[tileIndex];
    }
    
    // Fallback to a default tile in the set
    return autoTileSet[0];
}
