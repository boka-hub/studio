
import type { GridState, AutoTileMode } from './types';

// Helper to check if a tile at a given coordinate is part of the auto-tile set
function isTileInSet(grid: GridState, r: number, c: number, tileSet: Set<number>): boolean {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) {
        return true; // Out of bounds counts as a "match" to create edges.
    }
    const tileId = grid[r][c];
    return tileSet.has(tileId);
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
 * It uses the Godot Engine standard for 3x3 minimal bitmasking.
 */
function getAutoTileId47(grid: GridState, r: number, c: number, autoTileSet: number[]): number {
    if (autoTileSet.length < 47) {
        if (autoTileSet.length >= 13) return getAutoTileId13(grid, r, c, autoTileSet);
        if (autoTileSet.length >= 9) return getAutoTileId9(grid, r, c, autoTileSet);
        return autoTileSet[0] ?? 0;
    }
    
    const tileSet = new Set(autoTileSet);

    // 3x3 minimal bitmasking (Godot standard)
    const n = isTileInSet(grid, r - 1, c, tileSet);
    const e = isTileInSet(grid, r, c + 1, tileSet);
    const s = isTileInSet(grid, r + 1, c, tileSet);
    const w = isTileInSet(grid, r, c - 1, tileSet);
    
    const ne = isTileInSet(grid, r - 1, c + 1, tileSet);
    const se = isTileInSet(grid, r + 1, c + 1, tileSet);
    const sw = isTileInSet(grid, r + 1, c - 1, tileSet);
    const nw = isTileInSet(grid, r - 1, c - 1, tileSet);

    let bitmask = 0;
    if (n) bitmask |= 1;
    if (e) bitmask |= 2;
    if (s) bitmask |= 4;
    if (w) bitmask |= 8;
    
    let index = godotBitmaskMap[bitmask] ?? 1; // Default to solid tile

    if (bitmask === 15) { // Center tile, check for concave corners
      if (!nw) index = 16;
      else if (!ne) index = 17;
      else if (!sw) index = 18;
      else if (!se) index = 19;
      else {
        let center_bitmask = 0;
        if(isTileInSet(grid, r-1, c-1, tileSet)) center_bitmask |= 1;
        if(isTileInSet(grid, r-1, c+1, tileSet)) center_bitmask |= 2;
        if(isTileInSet(grid, r+1, c-1, tileSet)) center_bitmask |= 4;
        if(isTileInSet(grid, r+1, c+1, tileSet)) center_bitmask |= 8;
        
        index = godotCenterMap[center_bitmask] ?? 1;
      }
    } else { // Edges and corners, check for extra neighbors to use alternative tiles
        const alternate_bitmask = 
            (bitmask & 1) && !n ? 1 : 0 |
            (bitmask & 2) && !e ? 2 : 0 |
            (bitmask & 4) && !s ? 4 : 0 |
            (bitmask & 8) && !w ? 8 : 0;
        
        switch(bitmask) {
            case 11: if(!se) index = 21; break;
            case 7: if(!sw) index = 22; break;
            case 14: if(!nw) index = 23; break;
            case 13: if(!ne) index = 24; break;
            
            case 5: // N, S
                if(!nw && !ne && !sw && !se) index = 8;
                else if(!nw && !ne) index = 26;
                else if(!sw && !se) index = 25;
                else if(!nw && !sw) index = 36;
                else if(!ne && !se) index = 34;
                break;
            case 10: // W, E
                if(!nw && !ne && !sw && !se) index = 13;
                else if(!nw && !sw) index = 28;
                else if(!ne && !se) index = 27;
                else if(!nw && !ne) index = 37;
                else if(!sw && !se) index = 35;
                break;
            
            case 3: if(!sw) index = 38; break;
            case 9: if(!se) index = 39; break;
            case 6: if(!nw) index = 40; break;
            case 12: if(!ne) index = 41; break;
            
            case 1: if(!sw && !se) index = 42; break;
            case 4: if(!nw && !ne) index = 43; break;
            case 2: if(!nw && !sw) index = 44; break;
            case 8: if(!ne && !se) index = 45; break;
            
            case 0:
                if (nw && ne && sw && se) index = 46;
                break;
        }
    }

    return autoTileSet[index];
}

// Godot Engine 3.x 47-tile blob bitmask standard
const godotBitmaskMap: { [key: number]: number } = {
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

const godotCenterMap: { [key: number]: number } = {
    15: 1,  // All corners filled
    14: 29, // Missing NW
    13: 30, // Missing NE
    11: 31, // Missing SW
    7: 32,  // Missing SE
    12: 33, // N corners missing
    5: 34,  // E corners missing
    3: 35,  // S corners missing
    10: 36, // W corners missing
};
