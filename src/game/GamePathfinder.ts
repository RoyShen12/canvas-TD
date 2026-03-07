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
      gridX: Math.max(Math.floor(rubbed[1]! / this._gridSize), 0),
      gridY: Math.max(Math.floor(rubbed[0]! / this._gridSize), 0),
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
  public invalidatePathsThrough(gridX: number, gridY: number): void {
    this.invalidateGraph()

    // 移除经过该格子的所有缓存路径
    this._pathCache.forEach((path, key) => {
      const pathPassesThrough = path.some(pos => {
        const coord = this.positionToGridCoordinate(pos)
        return coord.gridX === gridX && coord.gridY === gridY
      })

      if (pathPassesThrough) {
        console.log(`detect G pos-path-map ${key} has been contaminated.`)
        this._pathCache.delete(key)
      }
    })
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
   * @param grids 游戏网格数组
   * @param wallBoundary 围墙边界数组
   * @returns 如果有格子被阻断返回 true
   */
  private _hasAnyBlockedPath(grids: number[][], wallBoundary: number[][]): boolean {
    const graph = this._getOrCreateGraph(grids, wallBoundary)
    const destX = this._destinationGrid.gridX
    const destY = this._destinationGrid.gridY

    for (let rowI = 0; rowI < grids.length; rowI++) {
      const row = grids[rowI]
      if (!row) continue

      for (let colI = 0; colI < row.length; colI++) {
        // 跳过障碍格子
        if (row[colI] !== 1) continue

        // 跳过终点格子
        if (rowI === destX - 1 && colI === destY - 1) continue

        // 检查是否可以到达终点
        const startNode = graph.grid[rowI + 1]?.[colI + 1]
        const endNode = graph.grid[destX]?.[destY]

        if (!startNode || !endNode) continue

        const path = Astar.astar.search(graph, startNode, endNode)
        if (path.length === 0) {
          return true
        }
      }
    }

    return false
  }
}
