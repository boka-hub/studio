
import type { GridState } from './types';

// Helper to check if a tile at a given coordinate is part of the auto-tile set
function isTileInSet(grid: GridState, r: number, c: number, tileSet: Set<number>): boolean {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) {
        return false; // Out of bounds is not a tile
    }
    return tileSet.has(grid[r][c]);
}

/**
 * Calculates the appropriate tile ID for a cell based on its neighbors,
 * using a 9-tile (3x3) auto-tiling logic.
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

    if (hasNorth && !hasSouth && !hasWest && !hasEast) return bottom;
    if (!hasNorth && hasSouth && !hasWest && !hasEast) return top;
    if (!hasNorth && !hasSouth && hasWest && !hasEast) return right;
    if (!hasNorth && !hasSouth && !hasWest && hasEast) return left;
    
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
        // Cardinal Edges (4)
        top, bottom, left, right,
        // Corners (4)
        topLeft, topRight, bottomLeft, bottomRight,
        // Interior Corners (4)
        interiorTopLeft, interiorTopRight, interiorBottomLeft, interiorBottomRight,
        // Center (1)
        center
    ] = autoTileSet;

    const n = isTileInSet(grid, r - 1, c, tileSet);
    const s = isTileInSet(grid, r + 1, c, tileSet);
    const w = isTileInSet(grid, r, c - 1, tileSet);
    const e = isTileInSet(grid, r, c + 1, tileSet);

    // Diagonal checks for interior corners
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
 * using a 47-tile "blob" auto-tiling logic.
 * @param grid The current map grid.
 * @param r The row index of the cell to calculate for.
 * @param c The column index of the cell to calculate for.
 * @param autoTileSet An array of 47 tile IDs, ordered correctly for this tileset.
 * @returns The new tile ID for the cell.
 */
export function getAutoTileId47(grid: GridState, r: number, c: number, autoTileSet: number[]): number {
    if (autoTileSet.length !== 47) return autoTileSet[0] ?? 0;

    const tileSet = new Set(autoTileSet);
    
    const bitmask =
        (isTileInSet(grid, r - 1, c, tileSet) ? 1 : 0) |     // N
        (isTileInSet(grid, r, c + 1, tileSet) ? 2 : 0) |      // E
        (isTileInSet(grid, r + 1, c, tileSet) ? 4 : 0) |     // S
        (isTileInSet(grid, r, c - 1, tileSet) ? 8 : 0);       // W

    let index = bitmaskToIndex[bitmask];

    if (index === undefined) {
      return autoTileSet[0];
    }
    
    // Diagonal checks for refining corners
    if (index === 15) { // Center piece, check diagonals for hollowing
        const nw = isTileInSet(grid, r - 1, c - 1, tileSet);
        const ne = isTileInSet(grid, r - 1, c + 1, tileSet);
        const sw = isTileInSet(grid, r + 1, c - 1, tileSet);
        const se = isTileInSet(grid, r + 1, c + 1, tileSet);
        if (!nw) index = 16;
        else if (!ne) index = 17;
        else if (!sw) index = 18;
        else if (!se) index = 19;
    } else if (index === 13) { // Top-left corner, check diagonal for filling
        if (isTileInSet(grid, r + 1, c + 1, tileSet)) index = 20;
    } else if (index === 14) { // Top-right corner
        if (isTileInSet(grid, r + 1, c - 1, tileSet)) index = 21;
    } else if (index === 7) { // Bottom-left corner
        if (isTileInSet(grid, r - 1, c + 1, tileSet)) index = 22;
    } else if (index === 11) { // Bottom-right corner
        if (isTileInSet(grid, r - 1, c - 1, tileSet)) index = 23;
    } else if (index === 12) { // Top edge
        const sw = isTileInSet(grid, r + 1, c - 1, tileSet);
        const se = isTileInSet(grid, r + 1, c + 1, tileSet);
        if (sw && !se) index = 24;
        else if (!sw && se) index = 25;
        else if (sw && se) index = 26;
    } else if (index === 5) { // Right edge
        const nw = isTileInSet(grid, r - 1, c - 1, tileSet);
        const sw = isTileInSet(grid, r + 1, c - 1, tileSet);
        if (nw && !sw) index = 27;
        else if (!nw && sw) index = 28;
        else if (nw && sw) index = 29;
    } else if (index === 3) { // Bottom edge
        const nw = isTileInSet(grid, r - 1, c - 1, tileSet);
        const ne = isTileInSet(grid, r - 1, c + 1, tileSet);
        if (nw && !ne) index = 30;
        else if (!nw && ne) index = 31;
        else if (nw && ne) index = 32;
    } else if (index === 10) { // Left edge
        const ne = isTileInSet(grid, r - 1, c + 1, tileSet);
        const se = isTileInSet(grid, r + 1, c + 1, tileSet);
        if (ne && !se) index = 33;
        else if (!ne && se) index = 34;
        else if (ne && se) index = 35;
    } else if (index === 4) { // U (N+S)
        const nw = isTileInSet(grid, r - 1, c - 1, tileSet);
        const ne = isTileInSet(grid, r - 1, c + 1, tileSet);
        const sw = isTileInSet(grid, r + 1, c - 1, tileSet);
        const se = isTileInSet(grid, r + 1, c + 1, tileSet);
        if (nw && ne && !sw && se) index = 36;
        else if (nw && ne && sw && !se) index = 37;
        else if (nw && !ne && sw && se) index = 38;
        else if (!nw && ne && sw && se) index = 39;
    } else if (index === 9) { // C (W+E)
        const nw = isTileInSet(grid, r - 1, c - 1, tileSet);
        const ne = isTileInSet(grid, r - 1, c + 1, tileSet);
        const sw = isTileInSet(grid, r + 1, c - 1, tileSet);
        const se = isTileInSet(grid, r + 1, c + 1, tileSet);
        if (ne && se && !nw && sw) index = 40;
        else if (ne && se && nw && !sw) index = 41;
        else if (nw && sw && !ne && se) index = 42;
        else if (nw && sw && ne && !se) index = 43;
    } else if (index === 2) { // Right cul-de-sac
        if (isTileInSet(grid, r - 1, c - 1, tileSet) && isTileInSet(grid, r + 1, c - 1, tileSet)) index = 44;
    } else if (index === 8) { // Left cul-de-sac
        if (isTileInSet(grid, r - 1, c + 1, tileSet) && isTileInSet(grid, r + 1, c + 1, tileSet)) index = 45;
    } else if (index === 1) { // Bottom cul-de-sac
        if (isTileInSet(grid, r - 1, c - 1, tileSet) && isTileInSet(grid, r - 1, c + 1, tileSet)) index = 46;
    }

    return autoTileSet[index];
}


// A precomputed mapping from an 4-neighbor bitmask to a 47-tile index.
// This is the standard for Godot's 3x3 minimal blob tileset.
const bitmaskToIndex: { [key: number]: number } = {
    0: 0,   // Empty
    8: 1,   // W
    10: 2,  // W, E
    2: 3,   // E
    11: 4,  // W, E, N
    13: 5,  // W, N, S
    7: 6,   // E, N, S
    15: 15, // W, E, N, S (center) - this will be refined by diagonal checks
    14: 7,  // W, E, S
    1: 8,   // N
    9: 9,   // W, N
    3: 10,  // E, N
    4: 11,  // S
    12: 12, // W, S
    6: 13,  // E, S
    5: 14,  // N, S
};
