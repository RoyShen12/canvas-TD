/// <reference path="../typedef.ts" />
/// <reference path="../motion.ts" />
/// <reference path="../types/pathfinding-types.ts" />
/// <reference path="../constants.ts" />
/// <reference path="./GameTypes.ts" />

/**
 * 游戏寻路管理器
 * 负责 A* 寻路算法封装、路径缓存管理和塔放置验证
 */
class GamePathfinder {
  /** A* 寻路图缓存 */
  private _graphCache: Optional<Astar.Graph> = null

  /** 寻路图是否需要重建 */
  private _graphDirty = true

  /** 路径缓存：起点网格坐标 -> 路径点数组 */
  private _pathCache = new Map<PathCacheKey, PositionLike[]>()

  /** 网格列数 */
  private readonly _gridColumns: number

  /** 网格行数 */
  private readonly _gridRows: number

  /** 单元格边长（像素） */
  private readonly _gridSize: number

  /** 终点网格坐标（带围墙偏移） */
  private readonly _destinationGrid: GridCoordinate

  /**
   * 创建寻路管理器实例
   * @param config 寻路配置
   */
  constructor(config: PathfinderConfig) {
    this._gridColumns = config.gridColumns
    this._gridRows = config.gridRows
    this._gridSize = config.gridSize
    this._destinationGrid = config.destinationGrid
  }

  /**
   * 将像素坐标转换为网格坐标
   * @param pos 像素位置
   * @returns 网格坐标
   */
  public positionToGridCoordinate(pos: PositionLike): GridCoordinate {
    const rubbed = [Math.round(pos.x), Math.round(pos.y)]
    return {
      gridX: Math.min(Math.max(Math.floor(rubbed[1]! / this._gridSize), 0), this._gridRows - 1),
      gridY: Math.min(Math.max(Math.floor(rubbed[0]! / this._gridSize), 0), this._gridColumns - 1),
    }
  }

  /**
   * 获取指定位置的完整网格信息
   * @param pos 像素位置
   * @param midSplitLineX 左右区域分割线 X 坐标
   * @returns 网格信息，如果位置在右侧区域则返回 null
   */
  public getGridInfoAtPosition(pos: Position, midSplitLineX: number): GridInfo | null {
    if (pos.x > midSplitLineX) {
      return null
    }

    const coord = this.positionToGridCoordinate(pos)
    return {
      gridX: coord.gridX,
      gridY: coord.gridY,
      centerX: (coord.gridY + 0.5) * this._gridSize,
      centerY: (coord.gridX + 0.5) * this._gridSize,
    }
  }

  /**
   * 计算从起点到终点的路径
   * @param startPos 起始像素位置
   * @param grids 游戏网格数组（0=障碍，1=可通行）
   * @param wallBoundary 围墙边界数组
   * @returns 路径点数组（像素坐标）
   */
  public findPath(startPos: Position, grids: number[][], wallBoundary: number[][]): PositionLike[] {
    const gridInfo = this.getGridInfoAtPosition(startPos, Infinity)
    if (!gridInfo) return []

    const cacheKey: PathCacheKey = `${gridInfo.gridX}|${gridInfo.gridY}`

    // 检查缓存
    if (this._pathCache.has(cacheKey)) {
      return this._pathCache.get(cacheKey)!
    }

    // 构建或获取寻路图
    const graph = this._getOrCreateGraph(grids, wallBoundary)

    // 执行 A* 寻路
    // 网格索引需要加 1 以跳过围墙
    const startNode = graph.grid[gridInfo.gridX + 1]?.[gridInfo.gridY + 1]
    const endNode = graph.grid[this._destinationGrid.gridX]?.[this._destinationGrid.gridY]

    if (!startNode || !endNode) {
      return []
    }

    // 清理图的脏状态，确保 A* 搜索从干净状态开始
    graph.cleanDirty()

    const rawPath = Astar.astar.search(graph, startNode, endNode)

    // 转换为像素坐标
    const path = rawPath.map(node => ({
      // 减去围墙偏移（0.5）并转换为像素坐标
      x: (node.y - 0.5) * this._gridSize,
      y: (node.x - 0.5) * this._gridSize,
    }))

    // 缓存结果
    this._pathCache.set(cacheKey, path)

    return path
  }

  /**
   * 检查在指定位置建塔是否会阻断所有路径
   * @param gridX 目标网格 X 索引
   * @param gridY 目标网格 Y 索引
   * @param grids 游戏网格数组
   * @param wallBoundary 围墙边界数组
   * @returns 如果会阻断路径返回 true
   */
  public wouldBlockAllPaths(
    gridX: number,
    gridY: number,
    grids: number[][],
    wallBoundary: number[][]
  ): boolean {
    // 边界检查
    if (gridX < 0 || gridX >= this._gridRows || gridY < 0 || gridY >= this._gridColumns) {
      return true
    }

    const originalValue = grids[gridX]?.[gridY]
    if (originalValue === undefined) {
      return true
    }

    // 临时设置为障碍
    grids[gridX]![gridY] = 0
    this.invalidateGraph()

    try {
      return this._hasAnyBlockedPath(grids, wallBoundary)
    } finally {
      // 恢复原值
      grids[gridX]![gridY] = originalValue
      this.invalidateGraph()
    }
  }

  /**
   * 使缓存失效
   * 在地图发生变化时调用
   */
  public invalidateGraph(): void {
    this._graphDirty = true
  }

  /**
   * 清除指定网格位置相关的路径缓存
   * @param gridX 网格 X 索引
   * @param gridY 网格 Y 索引
   */
  public invalidatePathsThrough(_gridX: number, _gridY: number): void {
    this.invalidateGraph()
    // 清除所有路径缓存：放置/移除塔改变了整个图，
    // 不仅经过该格子的路径可能受影响，其他路径的最优解也可能改变
    this._pathCache.clear()
  }

  /**
   * 清除所有路径缓存
   */
  public clearAllPathCache(): void {
    this._pathCache.clear()
    this.invalidateGraph()
  }

  /**
   * 获取或创建 A* 寻路图
   * @param grids 游戏网格数组
   * @param wallBoundary 围墙边界数组
   * @returns A* 寻路图
   */
  private _getOrCreateGraph(grids: number[][], wallBoundary: number[][]): Astar.Graph {
    if (!this._graphCache || this._graphDirty) {
      // 构建带围墙的网格
      const gridsWithWall = wallBoundary.concat(
        grids.map(row => [0, ...row, 0]).concat(wallBoundary)
      )
      this._graphCache = new Astar.Graph(gridsWithWall)
      this._graphDirty = false
    }
    return this._graphCache
  }

  /**
   * 检查是否有任何可通行格子无法到达终点
   * 使用 BFS 从终点洪泛填充，O(V) 判断所有可通行格是否可达
   * @param grids 游戏网格数组
   * @param _wallBoundary 围墙边界数组（BFS 直接在 grids 上操作，不再需要）
   * @returns 如果有格子被阻断返回 true
   */
  private _hasAnyBlockedPath(grids: number[][], _wallBoundary: number[][]): boolean {
    const rows = grids.length
    if (rows === 0) return true
    const cols = grids[0]!.length

    // 终点在 grids 中的坐标（不含围墙偏移）
    const destRow = this._destinationGrid.gridX - 1
    const destCol = this._destinationGrid.gridY - 1

    // 终点不可达或越界
    if (destRow < 0 || destRow >= rows || destCol < 0 || destCol >= cols) return true
    if (grids[destRow]![destCol] !== 1) return true

    // BFS 从终点开始洪泛
    const visited = new Uint8Array(rows * cols)
    const queue: number[] = []
    const startIdx = destRow * cols + destCol
    visited[startIdx] = 1
    queue.push(startIdx)

    const directions = [-cols, cols, -1, 1] // 上下左右

    let head = 0
    while (head < queue.length) {
      const idx = queue[head++]!
      const r = (idx / cols) | 0

      for (let d = 0; d < 4; d++) {
        const dir = directions[d]!
        const ni = idx + dir
        const nr = (ni / cols) | 0
        const nc = ni % cols

        // 边界检查：左右移动时行号不能变
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
        if (d >= 2 && nr !== r) continue // 左右方向越行

        if (visited[ni]) continue
        if (grids[nr]![nc] !== 1) continue

        visited[ni] = 1
        queue.push(ni)
      }
    }

    // 检查所有可通行格是否都被访问到
    for (let r = 0; r < rows; r++) {
      const row = grids[r]!
      for (let c = 0; c < cols; c++) {
        if (row[c] === 1 && !visited[r * cols + c]) {
          return true
        }
      }
    }

    return false
  }
}
