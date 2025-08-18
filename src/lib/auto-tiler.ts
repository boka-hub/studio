
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
export function getAutoTileId(grid: GridState, r: number, c: number, autoTileSet: number[]): number {
    if (autoTileSet.length !== 9) {
        // Fallback to the first tile in the set or empty if invalid
        return autoTileSet[0] ?? 0;
    }
    
    const tileSet = new Set(autoTileSet);
    if (!tileSet.has(grid[r][c])) {
        // Not an auto-tile, don't change it
        return grid[r][c];
    }

    // --- Tile Layout Indices ---
    // 0: top-left, 1: top, 2: top-right
    // 3: left,     4: center, 5: right
    // 6: bottom-left, 7: bottom, 8: bottom-right
    const [
      topLeft, top, topRight,
      left, center, right,
      bottomLeft, bottom, bottomRight
    ] = autoTileSet;

    // Check cardinal neighbors
    const hasNorth = isTileInSet(grid, r - 1, c, tileSet);
    const hasSouth = isTileInSet(grid, r + 1, c, tileSet);
    const hasWest = isTileInSet(grid, r, c - 1, tileSet);
    const hasEast = isTileInSet(grid, r, c + 1, tileSet);

    // Determine the tile based on neighbors
    if (hasNorth && hasSouth && hasWest && hasEast) return center;

    // Edges
    if (hasWest && hasEast && !hasNorth && hasSouth) return top;
    if (hasWest && hasEast && hasNorth && !hasSouth) return bottom;
    if (hasNorth && hasSouth && !hasWest && hasEast) return left;
    if (hasNorth && hasSouth && hasWest && !hasEast) return right;

    // Corners
    if (!hasNorth && hasSouth && !hasWest && hasEast) return topLeft;
    if (!hasNorth && hasSouth && hasWest && !hasEast) return topRight;
    if (hasNorth && !hasSouth && !hasWest && hasEast) return bottomLeft;
    if (hasNorth && !hasSouth && hasWest && !hasEast) return bottomRight;

    // Fallback if no specific pattern matches (e.g., single tile or complex shape)
    // This part can be adjusted for more complex logic if needed
    if (hasNorth || hasSouth || hasWest || hasEast) {
        return center;
    }
    
    return center; // Default to center tile if isolated
}
