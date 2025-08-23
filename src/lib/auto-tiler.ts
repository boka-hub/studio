
import type { GridState, AutoTileMode } from './types';

// Helper to check if a tile at a given coordinate is part of the auto-tile set
function isTileInSet(grid: GridState, r: number, c: number, tileSet: Set<number>): boolean {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) {
        return false; // Out of bounds counts as "not a tile in the set" for edges.
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
    
    if (hasNorth && hasSouth) return right; 
    if (hasWest && hasEast) return top;

    if (hasNorth) return bottom;
    if (hasSouth) return top;
    if (hasWest) return right;
    if (hasEast) return left;
    
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

    const bitmask = 
        (isTileInSet(grid, r - 1, c, tileSet) ? 1 : 0) |
        (isTileInSet(grid, r, c + 1, tileSet) ? 2 : 0) |
        (isTileInSet(grid, r + 1, c, tileSet) ? 4 : 0) |
        (isTileInSet(grid, r, c - 1, tileSet) ? 8 : 0) |
        (isTileInSet(grid, r - 1, c - 1, tileSet) ? 16 : 0) |
        (isTileInSet(grid, r - 1, c + 1, tileSet) ? 32 : 0) |
        (isTileInSet(grid, r + 1, c + 1, tileSet) ? 64 : 0) |
        (isTileInSet(grid, r + 1, c - 1, tileSet) ? 128 : 0);

    const index = bitmaskToIndexMap[bitmask];

    if (index === undefined) {
      return autoTileSet[2]; // Default to solid center
    }
    return autoTileSet[index];
}

// Godot 3.x 3x3 minimal blob tile bitmask standard.
const bitmaskToIndexMap: { [key: number]: number } = {
  2: 1, 4: 17, 6: 18, 8: 20, 10: 21, 12: 37, 14: 38, 16: 24, 18: 25, 20: 33, 22: 34, 28: 53,
  30: 54, 32: 28, 34: 29, 38: 45, 42: 61, 44: 49, 46: 50, 58: 46, 60: 55, 62: 56, 64: 32,
  66: 36, 68: 41, 70: 42, 72: 44, 74: 46, 76: 61, 78: 62, 80: 48, 82: 49, 86: 53, 88: 65,
  90: 66, 92: 51, 94: 52, 104: 69, 106: 70, 108: 57, 110: 58, 120: 71, 122: 72, 128: 40,
  130: 44, 132: 57, 134: 58, 136: 68, 138: 69, 140: 59, 142: 60, 144: 52, 146: 56, 152: 67,
  154: 59, 156: 63, 158: 64, 192: 43, 194: 47, 196: 63, 198: 64, 200: 51, 202: 52, 204: 59,
  206: 60, 208: 55, 210: 56, 212: 59, 214: 60, 216: 71, 218: 72, 220: 67, 222: 68, 224: 16,
  226: 29, 228: 33, 230: 34, 232: 24, 234: 25, 236: 49, 238: 50, 240: 28, 242: 36, 244: 53,
  246: 54, 248: 45, 250: 46, 252: 55, 254: 56, 0: 0, 1: 4, 3: 5, 7: 6, 9: 22, 11: 23, 13: 39,
  15: 40, 17: 26, 19: 27, 23: 35, 25: 65, 27: 66, 29: 51, 31: 52, 33: 30, 35: 31, 37: 47, 39: 63,
  41: 57, 43: 58, 45: 49, 47: 50, 49: 67, 51: 68, 53: 59, 55: 60, 57: 71, 59: 72, 61: 55, 63: 56,
  65: 32, 67: 36, 69: 41, 71: 42, 73: 48, 75: 46, 77: 61, 79: 62, 81: 48, 83: 49, 85: 69, 87: 70,
  89: 65, 91: 66, 93: 51, 95: 52, 97: 69, 99: 70, 101: 57, 103: 58, 105: 69, 107: 70, 109: 57,
  111: 58, 113: 69, 115: 59, 117: 67, 119: 68, 121: 71, 123: 72, 124: 55, 125: 56, 127: 8, 129: 40,
  131: 44, 133: 57, 135: 58, 137: 68, 139: 69, 141: 59, 143: 60, 145: 52, 147: 56, 149: 63, 151: 64,
  153: 67, 155: 59, 157: 63, 159: 64, 161: 51, 163: 52, 165: 67, 167: 68, 169: 59, 171: 60, 173: 71,
  175: 72, 177: 67, 179: 59, 181: 63, 183: 64, 184: 53, 185: 54, 187: 55, 189: 56, 191: 7, 193: 16,
  195: 29, 197: 33, 199: 34, 201: 24, 203: 25, 205: 49, 207: 50, 209: 28, 211: 36, 213: 53, 215: 54,
  217: 45, 219: 46, 221: 55, 223: 56, 225: 16, 227: 29, 229: 33, 231: 34, 233: 24, 235: 25, 237: 49,
  239: 50, 241: 28, 243: 36, 245: 53, 247: 54, 249: 45, 251: 46, 253: 55, 255: 2, 126: 56, 96: 43
};
