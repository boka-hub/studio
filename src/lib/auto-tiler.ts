
import type { GridState, AutoTileMode } from './types';

// Helper to check if a tile at a given coordinate is part of the auto-tile set
function isTileInSet(grid: GridState, r: number, c: number, tileSet: Set<number>): boolean {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) {
        return true; // Out of bounds counts as a "match" to create edges.
    }
    return tileSet.has(grid[r][c]);
}

/**
 * Main dispatcher function for auto-tiling.
 */
export function getAutoTileId(grid: GridState, r: number, c: number, autoTileSet: number[], mode: AutoTileMode): number {
    switch (mode) {
        case '9-tile':
            return getAutoTileId9(grid, r, c, autoTileSet);
        case '13-tile':
            return getAutoTileId13(grid, r, c, autoTileSet);
        case '47-tile':
            return getAutoTileId47(grid, r, c, autoTileSet);
        default:
            return autoTileSet[0] ?? 0;
    }
}


/**
 * Calculates the appropriate tile ID for a cell based on its neighbors,
 * using a 9-tile (3x3) auto-tiling logic. This is a simplified version.
 */
function getAutoTileId9(grid: GridState, r: number, c: number, autoTileSet: number[]): number {
    if (autoTileSet.length !== 9) return autoTileSet[0] ?? 0;
    
    const tileSet = new Set(autoTileSet);
    
    const [
      topLeft, top, topRight,
      left, center, right,
      bottomLeft, bottom, bottomRight
    ] = autoTileSet;

    const n = isTileInSet(grid, r - 1, c, tileSet);
    const s = isTileInSet(grid, r + 1, c, tileSet);
    const w = isTileInSet(grid, r, c - 1, tileSet);
    const e = isTileInSet(grid, r, c + 1, tileSet);

    if (n && s && w && e) return center;
    if (n && s && !w && e) return right;
    if (n && s && w && !e) return left;
    if (!n && s && w && e) return bottom;
    if (n && !s && w && e) return top;

    if (!n && s && !w && e) return bottomRight;
    if (!n && s && w && !e) return bottomLeft;
    if (n && !s && !w && e) return topRight;
    if (n && !s && w && !e) return topLeft;
    
    if (n && s) return left;
    if (w && e) return top;

    if (n) return top;
    if (s) return bottom;
    if (w) return left;
    if (e) return right;
    
    return center;
}


/**
 * Calculates the appropriate tile ID for a cell based on its neighbors,
 * using a 13-tile tileset logic (includes interior corners).
 */
function getAutoTileId13(grid: GridState, r: number, c: number, autoTileSet: number[]): number {
    if (autoTileSet.length !== 13) return autoTileSet[0] ?? 0;

    const tileSet = new Set(autoTileSet);
    
    const [
        topLeft, topRight, bottomLeft, bottomRight,
        top, bottom, left, right,
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
    
    if (n && s && w && e) {
        if (!nw) return interiorTopLeft;
        if (!ne) return interiorTopRight;
        if (!sw) return interiorBottomLeft;
        if (!se) return interiorBottomRight;
        return center;
    }
    
    if (w && e && !n && s) return top;
    if (w && e && n && !s) return bottom;
    if (n && s && !w && e) return left;
    if (n && s && w && !e) return right;

    if (!n && s && !w && e) return topLeft;
    if (!n && s && w && !e) return topRight;
    if (n && !s && !w && e) return bottomLeft;
    if (n && !s && w && !e) return bottomRight;

    if (w && e) return n ? bottom : top;
    if (n && s) return w ? right : left;
    
    if (n && e) return bottomLeft;
    if (n && w) return bottomRight;
    if (s && e) return topLeft;
    if (s && w) return topRight;

    if (n) return bottom;
    if (s) return top;
    if (w) return right;
    if (e) return left;

    return center;
}


/**
 * Calculates the appropriate tile ID for a cell based on its neighbors,
 * using a 47-tile "blob" auto-tiling logic. This is the industry standard.
 */
function getAutoTileId47(grid: GridState, r: number, c: number, autoTileSet: number[]): number {
    if (autoTileSet.length < 16) return autoTileSet[0] ?? 0; // Needs at least the base 16
    const tileSet = new Set(autoTileSet);

    let bitmask = 0;
    if (isTileInSet(grid, r - 1, c, tileSet)) bitmask |= 1;  // North
    if (isTileInSet(grid, r, c + 1, tileSet)) bitmask |= 2;  // East
    if (isTileInSet(grid, r + 1, c, tileSet)) bitmask |= 4;  // South
    if (isTileInSet(grid, r, c - 1, tileSet)) bitmask |= 8;  // West
    
    let index = bitmaskToIndexMap4[bitmask];

    // Check for concave corners if the main shape is a solid blob
    if (index === 3 && autoTileSet.length === 47) {
      if (!isTileInSet(grid, r-1, c-1, tileSet)) index = 21; // Concave NW
      if (!isTileInSet(grid, r-1, c+1, tileSet)) index = 20; // Concave NE
      if (!isTileInSet(grid, r+1, c-1, tileSet)) index = 19; // Concave SW
      if (!isTileInSet(grid, r+1, c+1, tileSet)) index = 18; // Concave SE
    }

    if (index === undefined) {
      return autoTileSet[1]; // Default to solid center
    }
    return autoTileSet[index];
}

// Godot 3.x 3x3 minimal blob tile bitmask standard.
const bitmaskToIndexMap4: { [key: number]: number } = {
    2: 12,
    8: 10,
    10: 11,
    11: 15,
    1: 4,
    3: 9,
    9: 8,
    12: 6,
    13: 5,
    14: 7,
    4: 13,
    5: 14,
    6: 24,
    7: 25,
    15: 1, // Full
    0: 0, // Empty
};


// The full 47-tile mapping (for reference, the simplified one is used above for the most common cases)
const fullBitmaskMap = {
    1: 4, 2: 12, 3: 9, 4: 13, 5: 14, 6: 24, 7: 25, 8: 10, 9: 8, 10: 11, 11: 15, 12: 6, 13: 5, 14: 7, 15: 1,
    16: 18, 17: 20, 18: 38, 19: 39, 20: 30, 21: 31, 22: 40, 23: 41, 24: 16, 25: 17, 26: 36, 27: 37, 28: 28, 29: 29, 30: 32, 31: 33,
    32: 19, 33: 23, 34: 44, 35: 45, 36: 42, 37: 43, 38: 46, 39: 47, 40: 22, 41: 26, 42: 3, 43: 2, 44: 27, 45: 35, 46: 34, 47: 21
};
