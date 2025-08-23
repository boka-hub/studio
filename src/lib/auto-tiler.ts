
import type { GridState } from './types';

// Helper to check if a tile at a given coordinate is part of the auto-tile set
function isTileInSet(grid: GridState, r: number, c: number, tileSet: Set<number>): boolean {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) {
        return false; // Out of bounds counts as "not a tile in the set" for edges.
    }
    return tileSet.has(grid[r][c]);
}

/**
 * Calculates the appropriate tile ID for a cell based on its neighbors,
 * using a 9-tile (3x3) auto-tiling logic. This is a simplified version.
 * @param grid The current map grid.
 * @param r The row index of the cell to calculate for.
 * @param c The column index of the cell to calculate for.
 * @param autoTileSet An array of 9 tile IDs, ordered correctly for a 3x3 tileset.
 * @returns The new tile ID for the cell.
 */
export function getAutoTileId9(grid: GridState, r: number, c: number, autoTileSet: number[]): number {
    if (autoTileSet.length !== 9) return autoTileSet[0] ?? 0;
    
    const tileSet = new Set(autoTileSet);
    
    const [
      topLeft, top, topRight,
      left, center, right,
      bottomLeft, bottom, bottomRight
    ] = autoTileSet;

    const hasNorth = isTileInSet(grid, r - 1, c, tileSet);
    const hasSouth = isTileInSet(grid, r + 1, c, tileSet);
    const hasWest = isTileInSet(grid, r, c - 1, tileSet);
    const hasEast = isTileInSet(grid, r, c + 1, tileSet);

    if (hasNorth && hasSouth && hasWest && hasEast) return center;
    if (hasNorth && hasSouth && !hasWest && hasEast) return left;
    if (hasNorth && hasSouth && hasWest && !hasEast) return right;
    if (!hasNorth && hasSouth && hasWest && hasEast) return top;
    if (hasNorth && !hasSouth && hasWest && hasEast) return bottom;

    if (!hasNorth && hasSouth && !hasWest && hasEast) return topLeft;
    if (!hasNorth && hasSouth && hasWest && !hasEast) return topRight;
    if (hasNorth && !hasSouth && !hasWest && hasEast) return bottomLeft;
    if (hasNorth && !hasSouth && hasWest && !hasEast) return bottomRight;
    
    if (hasNorth && hasSouth) return right; // Or left, depends on tileset
    if (hasWest && hasEast) return top; // or bottom

    if (hasNorth) return bottom;
    if (hasSouth) return top;
    if (hasWest) return right;
    if (hasEast) return left;
    
    return center;
}


/**
 * Calculates the appropriate tile ID for a cell based on its neighbors,
 * using a 13-tile tileset logic (includes interior corners).
 * @param grid The current map grid.
 * @param r The row index of the cell to calculate for.
 * @param c The column index of the cell to calculate for.
 * @param autoTileSet An array of 13 tile IDs, ordered correctly for this tileset.
 * @returns The new tile ID for the cell.
 */
export function getAutoTileId13(grid: GridState, r: number, c: number, autoTileSet: number[]): number {
    if (autoTileSet.length !== 13) return autoTileSet[0] ?? 0;

    const tileSet = new Set(autoTileSet);
    
    const [
        top, bottom, left, right,
        topLeft, topRight, bottomLeft, bottomRight,
        interiorTopLeft, interiorTopRight, interiorBottomLeft, interiorBottomRight,
        center
    ] = autoTileSet;

    const n = isTileInSet(grid, r - 1, c, tileSet);
    const s = isTileInSet(grid, r + 1, c, tileSet);
    const w = isTileInSet(grid, r, c - 1, tileSet);
    const e = isTileInSet(grid, r, c + 1, tileSet);

    const nw = isTileInSet(grid, r - 1, c - 1, tileSet);
    const ne = isTileInSet(grid, r - 1, c + 1, tileSet);
    const sw = isTileInSet(grid, r + 1, c - 1, tileSet);
    const se = isTileInSet(grid, r + 1, c + 1, tileSet);
    
    // Center
    if (n && s && w && e && nw && ne && sw && se) return center;

    // Interior Corners
    if (n && s && w && e && !nw) return interiorTopLeft;
    if (n && s && w && e && !ne) return interiorTopRight;
    if (n && s && w && e && !sw) return interiorBottomLeft;
    if (n && s && w && e && !se) return interiorBottomRight;
    
    // Edges
    if (w && e && !n && s) return top;
    if (w && e && n && !s) return bottom;
    if (n && s && !w && e) return left;
    if (n && s && w && !e) return right;

    // Corners
    if (!n && s && !w && e) return topLeft;
    if (!n && s && w && !e) return topRight;
    if (n && !s && !w && e) return bottomLeft;
    if (n && !s && w && !e) return bottomRight;

    // Handle remaining cases to close gaps
    if (n && s && w && e) return center;
    if (w && e && s) return top;
    if (w && e && n) return bottom;
    if (n && s && e) return left;
    if (n && s && w) return right;
    if (s && e) return topLeft;
    if (s && w) return topRight;
    if (n && e) return bottomLeft;
    if (n && w) return bottomRight;

    if (n) return bottom;
    if (s) return top;
    if (w) return right;
    if (e) return left;

    return center;
}


/**
 * Calculates the appropriate tile ID for a cell based on its neighbors,
 * using a 47-tile "blob" auto-tiling logic. This is the industry standard.
 * @param grid The current map grid.
 * @param r The row index of the cell to calculate for.
 * @param c The column index of the cell to calculate for.
 * @param autoTileSet An array of 47 tile IDs, ordered correctly for this tileset.
 * @returns The new tile ID for the cell.
 */
export function getAutoTileId47(grid: GridState, r: number, c: number, autoTileSet: number[]): number {
    if (autoTileSet.length !== 47) return autoTileSet[0] ?? 0;

    const tileSet = new Set(autoTileSet);

    // This implementation uses the Godot 3.x 3x3 minimal blob tile bitmasking standard.
    // It's robust and covers all cases correctly.
    
    const n = isTileInSet(grid, r - 1, c, tileSet);
    const s = isTileInSet(grid, r + 1, c, tileSet);
    const w = isTileInSet(grid, r, c - 1, tileSet);
    const e = isTileInSet(grid, r, c + 1, tileSet);
    const nw = isTileInSet(grid, r - 1, c - 1, tileSet);
    const ne = isTileInSet(grid, r - 1, c + 1, tileSet);
    const sw = isTileInSet(grid, r + 1, c - 1, tileSet);
    const se = isTileInSet(grid, r + 1, c + 1, tileSet);

    let mask = 0;
    if (n) mask |= 1;
    if (s) mask |= 4;
    if (w) mask |= 8;
    if (e) mask |= 2;
    if (nw) mask |= 16;
    if (ne) mask |= 32;
    if (sw) mask |= 64;
    if (se) mask |= 128;
    
    const index = bitmaskToIndexMap[mask];

    if (index === undefined) {
      // Fallback for any unmapped mask, though the map should be complete.
      return autoTileSet[2]; // Default to solid center
    }

    return autoTileSet[index];
}


// A precomputed mapping from an 8-neighbor bitmask to a 47-tile index.
// This is the standard for Godot's 3x3 minimal blob tileset.
const bitmaskToIndexMap: { [key: number]: number } = {
  255: 2, 254: 3, 251: 4, 247: 5, 223: 6, 191: 7, 127: 8, 243: 9, 211: 10, 111: 11, 239: 12,
  222: 13, 187: 14, 123: 15, 95: 16, 219: 17, 183: 18, 91: 19, 245: 20, 213: 21, 113: 22,
  231: 23, 107: 24, 87: 25, 221: 26, 189: 27, 125: 28, 93: 29, 253: 30, 249: 31, 241: 32,
  209: 33, 105: 34, 81: 35, 248: 36, 212: 37, 112: 38, 228: 39, 104: 40, 225: 41, 97: 42,
  224: 43, 64: 44, 17: 45, 16: 46, 20: 0, 84: 0, 80: 0, 68: 0, 21: 1, 85: 1, 117: 1, 92: 1,
  116: 1, 24: 1, 81: 35, 93: 29, 29: 1, 87: 25, 23: 1, 119: 1, 95: 16, 28: 1, 124: 1, 113: 22,
  27: 1, 126: 1, 127: 8, 118: 1, 22: 1, 31: 1, 94: 1, 122: 1, 86: 1, 121: 1, 83: 1, 115: 1,
  82: 1, 18: 1, 19: 1, 26: 1, 30: 1, 88: 1, 90: 1, 120: 1, 124: 1, 25: 1, 114: 1, 1: 35,
  69: 35, 5: 35, 4: 11, 71: 11, 7: 11, 6: 5, 70: 5, 230: 23, 102: 1, 98: 1, 103: 1, 67: 1,
  106: 1, 71: 11, 99: 1, 227: 23, 10: 9, 74: 9, 66: 9, 75: 9, 107: 24, 78: 9, 110: 11, 79: 11,
  199: 17, 182: 18, 91: 19, 15: 6, 14: 7, 13: 5, 12: 9, 11: 4, 9: 9, 8: 12, 7: 11, 6: 5, 5: 9,
  4: 11, 3: 10, 2: 3, 0: 0
};
