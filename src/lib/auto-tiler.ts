
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
    if (!tileSet.has(grid[r][c])) return grid[r][c];

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
    if (hasWest && hasEast && !hasNorth && hasSouth) return top;
    if (hasWest && hasEast && hasNorth && !hasSouth) return bottom;
    if (hasNorth && hasSouth && !hasWest && hasEast) return left;
    if (hasNorth && hasSouth && hasWest && !hasEast) return right;
    if (!hasNorth && hasSouth && !hasWest && hasEast) return topLeft;
    if (!hasNorth && hasSouth && hasWest && !hasEast) return topRight;
    if (hasNorth && !hasSouth && !hasWest && hasEast) return bottomLeft;
    if (hasNorth && !hasSouth && hasWest && !hasEast) return bottomRight;
    
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
    if (!tileSet.has(grid[r][c])) return grid[r][c];

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
    if (!tileSet.has(grid[r][c])) return grid[r][c];
    
    const bitmask =
        (isTileInSet(grid, r - 1, c - 1, tileSet) ? 1 : 0) |
        (isTileInSet(grid, r - 1, c, tileSet) ? 2 : 0) |
        (isTileInSet(grid, r - 1, c + 1, tileSet) ? 4 : 0) |
        (isTileInSet(grid, r, c - 1, tileSet) ? 8 : 0) |
        (isTileInSet(grid, r, c + 1, tileSet) ? 16 : 0) |
        (isTileInSet(grid, r + 1, c - 1, tileSet) ? 32 : 0) |
        (isTileInSet(grid, r + 1, c, tileSet) ? 64 : 0) |
        (isTileInSet(grid, r + 1, c + 1, tileSet) ? 128 : 0);

    const index = bitmaskToIndex[bitmask] ?? 0;
    return autoTileSet[index] ?? autoTileSet[0];
}


// A precomputed mapping from an 8-neighbor bitmask to a 47-tile index.
// This is a standard for "blob" tilesets.
const bitmaskToIndex: { [key: number]: number } = {
    2: 0, 8: 1, 10: 2, 11: 3, 16: 4, 18: 5, 22: 6, 24: 7, 26: 8, 27: 9,
    30: 10, 31: 11, 64: 12, 66: 13, 72: 14, 74: 15, 75: 16, 80: 17, 82: 18,
    86: 19, 88: 20, 90: 21, 91: 22, 94: 23, 95: 24, 104: 25, 106: 26, 107: 27,
    120: 28, 122: 29, 126: 30, 127: 31, 208: 32, 210: 33, 214: 34, 216: 35,
    218: 36, 219: 37, 222: 38, 223: 39, 248: 40, 250: 41, 251: 42, 254: 43,
    255: 44, 0: 45, 252: 46,
};
