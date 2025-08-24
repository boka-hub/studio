
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
 * It uses the Godot Engine standard for 3x3 bitmasking.
 */
function getAutoTileId47(grid: GridState, r: number, c: number, autoTileSet: number[], mode: AutoTileMode): number {
    const requiredTiles = (mode === '47-tile') ? 47 : 0;
    if (autoTileSet.length < requiredTiles) {
        // Fallback for incomplete sets
        if(autoTileSet.length >= 16) return getAutoTileId47(grid, r, c, autoTileSet, '13-tile'); // a bit of a lie, but it's a 16-tile mapping
        if(autoTileSet.length >= 13) return getAutoTileId13(grid, r, c, autoTileSet);
        if(autoTileSet.length >= 9) return getAutoTileId9(grid, r, c, autoTileSet);
        return autoTileSet[0] ?? 0;
    }
    
    const tileSet = new Set(autoTileSet);

    let bitmask = 0;
    if (isTileInSet(grid, r - 1, c, tileSet)) bitmask |= 1;  // North
    if (isTileInSet(grid, r, c + 1, tileSet)) bitmask |= 2;  // East
    if (isTileInSet(grid, r + 1, c, tileSet)) bitmask |= 4;  // South
    if (isTileInSet(grid, r, c - 1, tileSet)) bitmask |= 8;  // West
    
    let index = bitmaskMap[bitmask];

    if (bitmask === 15) { // Center tile, check for concave corners
      if (!isTileInSet(grid, r-1, c-1, tileSet)) index = 16;
      else if (!isTileInSet(grid, r-1, c+1, tileSet)) index = 17;
      else if (!isTileInSet(grid, r+1, c-1, tileSet)) index = 18;
      else if (!isTileInSet(grid, r+1, c+1, tileSet)) index = 19;
      else { // It's a truly solid center piece, check all 8 directions
        if (isTileInSet(grid, r-1, c-1, tileSet) && isTileInSet(grid, r-1, c+1, tileSet) && isTileInSet(grid, r+1, c-1, tileSet) && isTileInSet(grid, r+1, c+1, tileSet)) {
           // All 8 neighbors are tiles, choose a random center piece
           index = 29 + Math.floor(Math.random() * 4); // 29, 30, 31, 32
        } else {
           index = 1; // Default center
        }
      }
    } else if (bitmask === 11) { // North, West, South
        if (!isTileInSet(grid, r+1, c+1, tileSet)) index = 21;
    } else if (bitmask === 7) { // North, East, South
        if (!isTileInSet(grid, r+1, c-1, tileSet)) index = 22;
    } else if (bitmask === 14) { // West, South, East
        if (!isTileInSet(grid, r-1, c-1, tileSet)) index = 23;
    } else if (bitmask === 13) { // West, North, East
        if (!isTileInSet(grid, r-1, c+1, tileSet)) index = 24;
    } else if (bitmask === 5) { // North, South
        if (!isTileInSet(grid, r+1, c+1, tileSet) && !isTileInSet(grid, r+1, c-1, tileSet)) index = 25;
        else if (!isTileInSet(grid, r-1, c+1, tileSet) && !isTileInSet(grid, r-1, c-1, tileSet)) index = 26;
        else if (!isTileInSet(grid, r+1, c-1, tileSet) && !isTileInSet(grid, r-1, c-1, tileSet)) index = 34; // All right open
        else if (!isTileInSet(grid, r+1, c+1, tileSet) && !isTileInSet(grid, r-1, c+1, tileSet)) index = 36; // All left open
        else if (!isTileInSet(grid, r-1, c-1, tileSet) && !isTileInSet(grid, r+1, c+1, tileSet)) index = 34;
        else if (!isTileInSet(grid, r-1, c+1, tileSet) && !isTileInSet(grid, r+1, c-1, tileSet)) index = 36;
    } else if (bitmask === 10) { // West, East
        if (!isTileInSet(grid, r+1, c-1, tileSet) && !isTileInSet(grid, r-1, c-1, tileSet)) index = 27;
        else if (!isTileInSet(grid, r+1, c+1, tileSet) && !isTileInSet(grid, r-1, c+1, tileSet)) index = 28;
        else if (!isTileInSet(grid, r-1, c-1, tileSet) && !isTileInSet(grid, r-1, c+1, tileSet)) index = 35; // All top open
        else if (!isTileInSet(grid, r+1, c-1, tileSet) && !isTileInSet(grid, r+1, c+1, tileSet)) index = 37; // All bottom open
        else if (!isTileInSet(grid, r-1, c-1, tileSet) && !isTileInSet(grid, r+1, c+1, tileSet)) index = 35;
        else if (!isTileInSet(grid, r-1, c+1, tileSet) && !isTileInSet(grid, r+1, c-1, tileSet)) index = 37;
    } else if (bitmask === 3) { // N, E
         if (!isTileInSet(grid, r+1, c-1, tileSet)) index = 38;
    } else if (bitmask === 9) { // N, W
         if (!isTileInSet(grid, r+1, c+1, tileSet)) index = 39;
    } else if (bitmask === 6) { // S, E
         if (!isTileInSet(grid, r-1, c-1, tileSet)) index = 40;
    } else if (bitmask === 12) { // S, W
         if (!isTileInSet(grid, r-1, c+1, tileSet)) index = 41;
    } else if (bitmask === 1) { // N
         if (!isTileInSet(grid, r+1,c+1, tileSet) && !isTileInSet(grid, r+1, c-1, tileSet)) index = 42;
    } else if (bitmask === 4) { // S
         if (!isTileInSet(grid, r-1,c+1, tileSet) && !isTileInSet(grid, r-1, c-1, tileSet)) index = 43;
    } else if (bitmask === 2) { // E
         if (!isTileInSet(grid, r+1,c-1, tileSet) && !isTileInSet(grid, r-1, c-1, tileSet)) index = 44;
    } else if (bitmask === 8) { // W
         if (!isTileInSet(grid, r+1,c+1, tileSet) && !isTileInSet(grid, r-1, c+1, tileSet)) index = 45;
    } else if (bitmask === 0) { // No neighbors
         if (isTileInSet(grid, r-1, c-1, tileSet) && isTileInSet(grid, r-1, c+1, tileSet) && isTileInSet(grid, r+1, c-1, tileSet) && isTileInSet(grid, r+1, c+1, tileSet)) {
             index = 46;
         }
    }


    if (index === undefined) {
      return autoTileSet[1]; // Default to solid center
    }
    return autoTileSet[index];
}

// Godot Engine 3.x 47-tile blob bitmask standard
const bitmaskMap: { [key: number]: number } = {
  0: 0,   // isolated
  15: 1,  // center
  13: 2,  // n, w, e
  7: 3,   // n, e, s
  3: 4,   // n, e
  1: 5,   // n
  11: 6,  // n, w, s
  9: 7,   // n, w
  5: 8,   // n, s (vertical)
  14: 9,  // w, s, e
  6: 10,  // e, s
  4: 11,  // s
  12: 12, // w, s
  10: 13, // w, e (horizontal)
  8: 14,  // w
  2: 15,  // e
};
