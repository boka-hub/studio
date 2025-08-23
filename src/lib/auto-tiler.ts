
import type { GridState, AutoTileMode } from './types';

// Helper to check if a tile at a given coordinate is part of the auto-tile set
function isTileInSet(grid: GridState, r: number, c: number, tileSet: Set<number>): boolean {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) {
        return true; // Out of bounds counts as a "match" to create edges.
    }
    // A tile is considered part of the "set" if it's in the auto-tile set OR it's an empty tile that we want to overwrite.
    // The logic is: "does this tile connect to me?"
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
    if (n && s && !w && e) return left;
    if (n && s && w && !e) return right;
    if (!n && s && w && e) return top;
    if (n && !s && w && e) return bottom;

    if (!n && s && !w && e) return topLeft;
    if (!n && s && w && !e) return topRight;
    if (n && !s && !w && e) return bottomLeft;
    if (n && !s && w && !e) return bottomRight;
    
    if (n && s) return right; 
    if (w && e) return top;

    if (n) return bottom;
    if (s) return top;
    if (w) return right;
    if (e) return left;
    
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
    if (autoTileSet.length !== 47) return autoTileSet[0] ?? 0;
    const tileSet = new Set(autoTileSet);

    let bitmask = 0;
    if (isTileInSet(grid, r - 1, c, tileSet)) bitmask |= 1;  // North
    if (isTileInSet(grid, r, c + 1, tileSet)) bitmask |= 2;  // East
    if (isTileInSet(grid, r + 1, c, tileSet)) bitmask |= 4;  // South
    if (isTileInSet(grid, r, c - 1, tileSet)) bitmask |= 8;  // West
    
    // Get the base tile index from the cardinal directions
    let index = bitmaskToIndexMap4[bitmask];

    // If it's a convex corner, we don't need to check diagonals
    if(index === 0 || index === 1 || index === 4 || index === 5 || index === 16 || index === 17 || index === 20 || index === 21 || index === 22 || index === 23 || index === 26 || index === 27 || index === 32 || index === 33 || index === 36 || index === 37) {
      //pass
    } else {
      // Concave corners require diagonal checks to select the correct variation
      if ((bitmask & 1) && (bitmask & 8) && !isTileInSet(grid, r-1, c-1, tileSet)) index = 10; // Top-Left concave
      if ((bitmask & 1) && (bitmask & 2) && !isTileInSet(grid, r-1, c+1, tileSet)) index = 8; // Top-Right concave
      if ((bitmask & 4) && (bitmask & 8) && !isTileInSet(grid, r+1, c-1, tileSet)) index = 34; // Bottom-Left concave
      if ((bitmask & 4) && (bitmask & 2) && !isTileInSet(grid, r+1, c+1, tileSet)) index = 32; // Bottom-Right concave
    }

    if (index === undefined) {
      return autoTileSet[2]; // Default to solid center
    }
    return autoTileSet[index];
}

// Godot 3.x 3x3 minimal blob tile bitmask standard.
const bitmaskToIndexMap4: { [key: number]: number } = {
    0: 0,   // isolated tile
    1: 20,  // N
    2: 17,  // E
    3: 16,  // N, E
    4: 5,   // S
    5: 2,   // S, N
    6: 21,  // S, E
    7: 22,  // S, E, N
    8: 4,   // W
    9: 26,  // W, N
    10: 1,  // W, E
    11: 27, // W, E, N
    12: 37, // W, S
    13: 38, // W, S, N
    14: 33, // W, S, E
    15: 3,  // W, S, E, N
};

