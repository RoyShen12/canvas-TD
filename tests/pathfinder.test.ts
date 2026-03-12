/// <reference path="../src/game/GamePathfinder.ts" />
import { describe, test, expect, beforeEach, vi } from 'vitest'

// ============================================================================
// Inline type definitions (outFile architecture: cannot import from source)
// ============================================================================

type Optional<T> = T | null
type PathCacheKey = `${number}|${number}`

interface PositionLike {
  x: number
  y: number
}

interface GridCoordinate {
  gridX: number
  gridY: number
}

interface GridInfo extends GridCoordinate {
  centerX: number
  centerY: number
}

interface PathfinderConfig {
  gridColumns: number
  gridRows: number
  gridSize: number
  destinationGrid: GridCoordinate
}

class Position implements PositionLike {
  constructor(public x: number, public y: number) {}
}

// ============================================================================
// Inline GamePathfinder (copied from src/game/GamePathfinder.ts)
// Only public API + _hasAnyBlockedPath (BFS). findPath and A* omitted.
// ============================================================================

class GamePathfinder {
  private _graphCache: Optional<unknown> = null
  private _graphDirty = true
  private _pathCache = new Map<PathCacheKey, PositionLike[]>()
  private readonly _gridColumns: number
  private readonly _gridRows: number
  private readonly _gridSize: number
  private readonly _destinationGrid: GridCoordinate

  constructor(config: PathfinderConfig) {
    this._gridColumns = config.gridColumns
    this._gridRows = config.gridRows
    this._gridSize = config.gridSize
    this._destinationGrid = config.destinationGrid
  }

  positionToGridCoordinate(pos: PositionLike): GridCoordinate {
    const rubbed = [Math.round(pos.x), Math.round(pos.y)]
    return {
      gridX: Math.min(Math.max(Math.floor(rubbed[1]! / this._gridSize), 0), this._gridRows - 1),
      gridY: Math.min(Math.max(Math.floor(rubbed[0]! / this._gridSize), 0), this._gridColumns - 1),
    }
  }

  getGridInfoAtPosition(pos: Position, midSplitLineX: number): GridInfo | null {
    if (pos.x > midSplitLineX) return null
    const coord = this.positionToGridCoordinate(pos)
    return {
      gridX: coord.gridX,
      gridY: coord.gridY,
      centerX: (coord.gridY + 0.5) * this._gridSize,
      centerY: (coord.gridX + 0.5) * this._gridSize,
    }
  }

  wouldBlockAllPaths(gridX: number, gridY: number, grids: number[][], wallBoundary: number[][]): boolean {
    if (gridX < 0 || gridX >= this._gridRows || gridY < 0 || gridY >= this._gridColumns) return true
    const originalValue = grids[gridX]?.[gridY]
    if (originalValue === undefined) return true
    grids[gridX]![gridY] = 0
    this.invalidateGraph()
    try {
      return this._hasAnyBlockedPath(grids, wallBoundary)
    } finally {
      grids[gridX]![gridY] = originalValue
      this.invalidateGraph()
    }
  }

  invalidateGraph(): void {
    this._graphDirty = true
  }

  invalidatePathsThrough(_gridX: number, _gridY: number): void {
    this.invalidateGraph()
    this._pathCache.clear()
  }

  clearAllPathCache(): void {
    this._pathCache.clear()
    this.invalidateGraph()
  }

  private _hasAnyBlockedPath(grids: number[][], _wallBoundary: number[][]): boolean {
    const rows = grids.length
    if (rows === 0) return true
    const cols = grids[0]!.length
    const destRow = this._destinationGrid.gridX - 1
    const destCol = this._destinationGrid.gridY - 1
    if (destRow < 0 || destRow >= rows || destCol < 0 || destCol >= cols) return true
    if (grids[destRow]![destCol] !== 1) return true

    const visited = new Uint8Array(rows * cols)
    const queue: number[] = []
    const startIdx = destRow * cols + destCol
    visited[startIdx] = 1
    queue.push(startIdx)
    const directions = [-cols, cols, -1, 1]
    let head = 0
    while (head < queue.length) {
      const idx = queue[head++]!
      const r = (idx / cols) | 0
      for (let d = 0; d < 4; d++) {
        const dir = directions[d]!
        const ni = idx + dir
        const nr = (ni / cols) | 0
        const nc = ni % cols
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
        if (d >= 2 && nr !== r) continue
        if (visited[ni]) continue
        if (grids[nr]![nc] !== 1) continue
        visited[ni] = 1
        queue.push(ni)
      }
    }

    for (let r = 0; r < rows; r++) {
      const row = grids[r]!
      for (let c = 0; c < cols; c++) {
        if (row[c] === 1 && !visited[r * cols + c]) return true
      }
    }
    return false
  }
}

// ============================================================================
// Helper utilities
// ============================================================================

/** Deep-copy a 2D number array */
function cloneGrid(grids: number[][]): number[][] {
  return grids.map(row => [...row])
}

// ============================================================================
// Tests
// ============================================================================

describe('GamePathfinder', () => {
  // Common config: 10x10 grid, 40px cells
  const DEFAULT_CONFIG: PathfinderConfig = {
    gridColumns: 10,
    gridRows: 10,
    gridSize: 40,
    destinationGrid: { gridX: 10, gridY: 10 },
  }

  // ========================================================================
  // positionToGridCoordinate
  // ========================================================================

  describe('positionToGridCoordinate', () => {
    let pf: GamePathfinder

    beforeEach(() => {
      pf = new GamePathfinder(DEFAULT_CONFIG)
    })

    test('basic conversion at center of a cell', () => {
      // pos.y -> gridX (row), pos.x -> gridY (column)
      // Position(20, 20) is center of cell (0,0): floor(20/40)=0
      const coord = pf.positionToGridCoordinate({ x: 20, y: 20 })
      expect(coord).toEqual({ gridX: 0, gridY: 0 })
    })

    test('cell at (3,2) from pixel position (80, 120)', () => {
      // x=80 -> gridY = floor(80/40) = 2
      // y=120 -> gridX = floor(120/40) = 3
      const coord = pf.positionToGridCoordinate({ x: 80, y: 120 })
      expect(coord).toEqual({ gridX: 3, gridY: 2 })
    })

    test('position exactly on cell boundary maps to the next cell', () => {
      // x=40, y=40 -> floor(40/40)=1 for both
      const coord = pf.positionToGridCoordinate({ x: 40, y: 40 })
      expect(coord).toEqual({ gridX: 1, gridY: 1 })
    })

    test('position just before cell boundary stays in previous cell', () => {
      // x=39, y=39 -> round(39)=39, floor(39/40)=0
      const coord = pf.positionToGridCoordinate({ x: 39, y: 39 })
      expect(coord).toEqual({ gridX: 0, gridY: 0 })
    })

    test('negative values clamp to 0', () => {
      const coord = pf.positionToGridCoordinate({ x: -100, y: -50 })
      expect(coord).toEqual({ gridX: 0, gridY: 0 })
    })

    test('values beyond grid max clamp to max index', () => {
      // gridRows=10, gridColumns=10: max gridX=9, max gridY=9
      // x=500 -> floor(500/40)=12 -> clamped to 9
      // y=500 -> floor(500/40)=12 -> clamped to 9
      const coord = pf.positionToGridCoordinate({ x: 500, y: 500 })
      expect(coord).toEqual({ gridX: 9, gridY: 9 })
    })

    test('fractional pixels are rounded before division', () => {
      // x=19.7 -> round=20, floor(20/40)=0
      // y=39.3 -> round=39, floor(39/40)=0
      const coord = pf.positionToGridCoordinate({ x: 19.7, y: 39.3 })
      expect(coord).toEqual({ gridX: 0, gridY: 0 })
    })

    test('rounding at 0.5 rounds up, pushing into next cell', () => {
      // x=19.5 -> round=20, floor(20/40)=0 (still cell 0)
      // y=39.5 -> round=40, floor(40/40)=1 (cell 1)
      const coord = pf.positionToGridCoordinate({ x: 19.5, y: 39.5 })
      expect(coord).toEqual({ gridX: 1, gridY: 0 })
    })

    test('zero position maps to (0,0)', () => {
      const coord = pf.positionToGridCoordinate({ x: 0, y: 0 })
      expect(coord).toEqual({ gridX: 0, gridY: 0 })
    })

    test('last pixel of last cell maps to max index', () => {
      // 10 cells * 40px = 400px total. Last pixel is 399.
      // floor(399/40) = 9
      const coord = pf.positionToGridCoordinate({ x: 399, y: 399 })
      expect(coord).toEqual({ gridX: 9, gridY: 9 })
    })
  })

  // ========================================================================
  // getGridInfoAtPosition
  // ========================================================================

  describe('getGridInfoAtPosition', () => {
    let pf: GamePathfinder

    beforeEach(() => {
      pf = new GamePathfinder(DEFAULT_CONFIG)
    })

    test('returns correct grid info with center coordinates', () => {
      // Position(80, 120): gridY=2, gridX=3
      // centerX = (gridY + 0.5) * 40 = 2.5 * 40 = 100
      // centerY = (gridX + 0.5) * 40 = 3.5 * 40 = 140
      const info = pf.getGridInfoAtPosition(new Position(80, 120), 500)
      expect(info).toEqual({
        gridX: 3,
        gridY: 2,
        centerX: 100,
        centerY: 140,
      })
    })

    test('returns null when position x exceeds midSplitLineX', () => {
      const info = pf.getGridInfoAtPosition(new Position(301, 100), 300)
      expect(info).toBeNull()
    })

    test('returns info when position x equals midSplitLineX', () => {
      // pos.x === midSplitLineX is NOT greater, so should return info
      const info = pf.getGridInfoAtPosition(new Position(300, 100), 300)
      expect(info).not.toBeNull()
    })

    test('centerX and centerY point to the center of the grid cell', () => {
      // Position(0, 0) -> grid (0,0)
      // centerX = 0.5 * 40 = 20, centerY = 0.5 * 40 = 20
      const info = pf.getGridInfoAtPosition(new Position(0, 0), 1000)
      expect(info).not.toBeNull()
      expect(info!.centerX).toBe(20)
      expect(info!.centerY).toBe(20)
    })

    test('center coordinates for cell (5,7)', () => {
      // We need gridX=5, gridY=7
      // gridX comes from pos.y: floor(round(y)/40)=5 -> y=200
      // gridY comes from pos.x: floor(round(x)/40)=7 -> x=280
      const info = pf.getGridInfoAtPosition(new Position(280, 200), 1000)
      expect(info).not.toBeNull()
      expect(info!.gridX).toBe(5)
      expect(info!.gridY).toBe(7)
      expect(info!.centerX).toBe(7.5 * 40) // 300
      expect(info!.centerY).toBe(5.5 * 40) // 220
    })
  })

  // ========================================================================
  // wouldBlockAllPaths (BFS-based path connectivity check)
  // ========================================================================

  describe('wouldBlockAllPaths', () => {
    const WALL: number[][] = [] // wallBoundary is unused by BFS implementation

    // Helper: create pathfinder matching a grid's dimensions.
    // destinationGrid uses +1 offset (wall boundary convention).
    function makePF(grids: number[][], destRow: number, destCol: number): GamePathfinder {
      const rows = grids.length
      const cols = grids[0]!.length
      return new GamePathfinder({
        gridRows: rows,
        gridColumns: cols,
        gridSize: 40,
        destinationGrid: { gridX: destRow + 1, gridY: destCol + 1 },
      })
    }

    test('open grid: blocking a non-essential cell does NOT block paths', () => {
      // All cells walkable, destination at bottom-right
      const grids = [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ]
      const pf = makePF(grids, 2, 2)

      // Blocking (0,0) leaves all remaining cells connected to (2,2)
      expect(pf.wouldBlockAllPaths(0, 0, grids, WALL)).toBe(false)

      // Blocking a center cell still leaves connected paths
      expect(pf.wouldBlockAllPaths(1, 1, grids, WALL)).toBe(false)
    })

    test('corridor: blocking the only path DOES block', () => {
      // L-shaped corridor: left column + bottom row
      const grids = [
        [1, 0, 0],
        [1, 0, 0],
        [1, 1, 1],
      ]
      const pf = makePF(grids, 2, 2)

      // Blocking (1,0) disconnects (0,0) from destination
      expect(pf.wouldBlockAllPaths(1, 0, grids, WALL)).toBe(true)
    })

    test('already blocked cell (value 0): does not create new blockage', () => {
      // Cell (0,1) is already 0 in an otherwise connected grid
      const grids = [
        [1, 0, 1],
        [1, 1, 1],
        [1, 1, 1],
      ]
      const pf = makePF(grids, 2, 2)

      // "Blocking" an already-blocked cell changes nothing
      expect(pf.wouldBlockAllPaths(0, 1, grids, WALL)).toBe(false)
    })

    test('out-of-bounds coordinates: returns true', () => {
      const grids = [
        [1, 1],
        [1, 1],
      ]
      const pf = makePF(grids, 1, 1)

      expect(pf.wouldBlockAllPaths(-1, 0, grids, WALL)).toBe(true)
      expect(pf.wouldBlockAllPaths(0, -1, grids, WALL)).toBe(true)
      expect(pf.wouldBlockAllPaths(2, 0, grids, WALL)).toBe(true)
      expect(pf.wouldBlockAllPaths(0, 2, grids, WALL)).toBe(true)
    })

    test('grid restores original value after check', () => {
      const grids = [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ]
      const original = cloneGrid(grids)
      const pf = makePF(grids, 2, 2)

      pf.wouldBlockAllPaths(1, 1, grids, WALL)

      expect(grids).toEqual(original)
    })

    test('grid restores even when path IS blocked', () => {
      const grids = [
        [1, 0, 0],
        [1, 0, 0],
        [1, 1, 1],
      ]
      const original = cloneGrid(grids)
      const pf = makePF(grids, 2, 2)

      const blocked = pf.wouldBlockAllPaths(1, 0, grids, WALL)
      expect(blocked).toBe(true)

      // Grid must be restored to its pre-call state
      expect(grids).toEqual(original)
    })

    test('2x2 grid: blocking one corner still leaves paths', () => {
      const grids = [
        [1, 1],
        [1, 1],
      ]
      const pf = makePF(grids, 1, 1)

      // Blocking (0,0): remaining (0,1), (1,0), (1,1) still form a connected cluster
      expect(pf.wouldBlockAllPaths(0, 0, grids, WALL)).toBe(false)

      // Blocking (0,1): (0,0) can reach (1,1) via (1,0)
      expect(pf.wouldBlockAllPaths(0, 1, grids, WALL)).toBe(false)

      // Blocking (1,0): (0,0) can reach (1,1) via (0,1)
      expect(pf.wouldBlockAllPaths(1, 0, grids, WALL)).toBe(false)
    })

    test('2x2 grid: blocking destination cell blocks paths', () => {
      const grids = [
        [1, 1],
        [1, 1],
      ]
      const pf = makePF(grids, 1, 1)

      // Blocking the destination itself: BFS finds dest is 0, returns true
      expect(pf.wouldBlockAllPaths(1, 1, grids, WALL)).toBe(true)
    })

    test('L-shaped corridor: blocking the corner blocks the path', () => {
      const grids = [
        [1, 0, 0],
        [1, 0, 0],
        [1, 1, 1],
      ]
      const pf = makePF(grids, 2, 2)

      // (2,0) is the corner where the L turns. Blocking it severs the connection.
      expect(pf.wouldBlockAllPaths(2, 0, grids, WALL)).toBe(true)
    })

    test('multiple paths exist: blocking one does not block all', () => {
      // Two paths around center obstacle
      const grids = [
        [1, 1, 1],
        [1, 0, 1],
        [1, 1, 1],
      ]
      const pf = makePF(grids, 2, 2)

      // Blocking top-middle (0,1): left path still works via column 0 + row 2
      expect(pf.wouldBlockAllPaths(0, 1, grids, WALL)).toBe(false)

      // Blocking bottom-middle (2,1): top path still works via row 0 + column 2
      expect(pf.wouldBlockAllPaths(2, 1, grids, WALL)).toBe(false)

      // Blocking top-left (0,0): all other cells still connected around the ring
      expect(pf.wouldBlockAllPaths(0, 0, grids, WALL)).toBe(false)
    })

    test('multiple paths: blocking a chokepoint blocks all', () => {
      // Two regions connected only through cell (1,2)
      //  [1,1,1]
      //  [0,0,1]
      //  [1,1,1]
      const grids = [
        [1, 1, 1],
        [0, 0, 1],
        [1, 1, 1],
      ]
      const pf = makePF(grids, 2, 2)

      // (1,2) is the only bridge between top row and bottom row
      expect(pf.wouldBlockAllPaths(1, 2, grids, WALL)).toBe(true)
    })

    test('single-cell grid: blocking the only cell blocks', () => {
      const grids = [[1]]
      const pf = makePF(grids, 0, 0)

      // The single cell is also the destination; blocking it returns true
      expect(pf.wouldBlockAllPaths(0, 0, grids, WALL)).toBe(true)
    })

    test('no walkable cells except destination: blocking any is safe', () => {
      const grids = [
        [0, 0],
        [0, 1],
      ]
      const pf = makePF(grids, 1, 1)

      // (0,0) is already 0, "blocking" it changes nothing; dest still reachable (it is the only 1)
      expect(pf.wouldBlockAllPaths(0, 0, grids, WALL)).toBe(false)
    })

    test('larger grid with winding path', () => {
      // Snake-like path through a 5x5 grid
      const grids = [
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 1],
        [1, 1, 1, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1],
      ]
      const pf = makePF(grids, 4, 4)

      // The path snakes: row 0 -> col 4 down -> row 2 left -> col 0 down -> row 4 right
      // Blocking (0,4) severs the connection between row 0 and the right column
      expect(pf.wouldBlockAllPaths(0, 4, grids, WALL)).toBe(true)

      // Blocking (4,0) disconnects cells (2,0), (3,0) from the rest
      expect(pf.wouldBlockAllPaths(4, 0, grids, WALL)).toBe(true)

      // Blocking (4,2) in the bottom row still leaves a connected path
      // because (4,0)-(4,1) can reach (3,0)-(2,0)-(2,1)-(2,2) and
      // (4,3)-(4,4) connects to right column
      // But (4,0)-(4,1)-(3,0)-(2,0)-(2,1)-(2,2) group cannot reach (4,3)-(4,4) group
      // Actually let me trace: blocking (4,2):
      //   [1,1,1,1,1]
      //   [0,0,0,0,1]
      //   [1,1,1,0,1]
      //   [1,0,0,0,1]
      //   [1,1,0,1,1]
      // From dest (4,4): BFS reaches (4,3), (3,4), (2,4), (1,4), (0,4), (0,3), (0,2), (0,1), (0,0)
      // (4,1) -> need to check: (4,1) neighbors are (3,1)=0, (4,0), (4,2)=blocked. Can (4,0) reach? (4,0) neighbors: (3,0)=1, (4,1).
      // (3,0) neighbors: (2,0)=1, (4,0). (2,0) neighbors: (2,1)=1, (1,0)=0. (2,1) neighbors: (2,2)=1, (2,0), (1,1)=0.
      // So group {(4,0),(4,1),(3,0),(2,0),(2,1),(2,2)} is isolated from dest. Returns true.
      expect(pf.wouldBlockAllPaths(4, 2, grids, WALL)).toBe(true)
    })

    test('blocking a dead-end cell does not block paths', () => {
      // (0,0) is a dead end connected only through (0,1)
      const grids = [
        [1, 1, 0],
        [0, 1, 0],
        [0, 1, 1],
      ]
      const pf = makePF(grids, 2, 2)

      // Removing (0,0) disconnects nothing else (it is a leaf)
      expect(pf.wouldBlockAllPaths(0, 0, grids, WALL)).toBe(false)
    })
  })

  // ========================================================================
  // invalidatePathsThrough and clearAllPathCache
  // ========================================================================

  describe('invalidatePathsThrough', () => {
    test('does not throw on valid invocation', () => {
      const pf = new GamePathfinder(DEFAULT_CONFIG)
      expect(() => pf.invalidatePathsThrough(3, 5)).not.toThrow()
    })

    test('can be called multiple times without error', () => {
      const pf = new GamePathfinder(DEFAULT_CONFIG)
      expect(() => {
        pf.invalidatePathsThrough(0, 0)
        pf.invalidatePathsThrough(9, 9)
        pf.invalidatePathsThrough(5, 5)
      }).not.toThrow()
    })
  })

  describe('clearAllPathCache', () => {
    test('does not throw on valid invocation', () => {
      const pf = new GamePathfinder(DEFAULT_CONFIG)
      expect(() => pf.clearAllPathCache()).not.toThrow()
    })

    test('can be called multiple times without error', () => {
      const pf = new GamePathfinder(DEFAULT_CONFIG)
      expect(() => {
        pf.clearAllPathCache()
        pf.clearAllPathCache()
      }).not.toThrow()
    })
  })

  describe('invalidateGraph', () => {
    test('does not throw on valid invocation', () => {
      const pf = new GamePathfinder(DEFAULT_CONFIG)
      expect(() => pf.invalidateGraph()).not.toThrow()
    })
  })
})
