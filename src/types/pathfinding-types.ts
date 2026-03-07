/// <reference path="../motion.ts" />

/**
 * A* 寻路库类型声明
 *
 * 注意：这些类型对应外部 JavaScript 库 astar.min.js
 * 该库在 index.html 中通过 <script> 标签加载
 */

// ============= A* 寻路类型 =============

/**
 * A* 算法中的网格节点
 * 扩展 PositionLike 接口以包含寻路所需的属性
 */
declare interface GridNode extends PositionLike {
  /** 节点是否已关闭（已完成搜索） */
  closed: boolean
  /** 总代价（f = g + h） */
  f: number
  /** 起点到该节点的实际代价 */
  g: number
  /** 该节点到终点的启发式估计代价 */
  h: number
  /** 父节点（用于回溯路径） */
  parent: GridNode
  /** 节点是否已访问 */
  visited: boolean
  /** 节点权重（用于路径计算） */
  weight: number
  /** 网格 X 坐标 */
  x: number
  /** 网格 Y 坐标 */
  y: number
}

/**
 * A* 寻路库的命名空间
 * 对应外部库 astar.js 的全局命名空间
 */
declare namespace Astar {
  /**
   * A* 寻路图类
   * 用于表示可寻路的网格地图
   */
  class Graph {
    /** 二维网格节点数组 */
    grid: GridNode[][]
    /**
     * 构造寻路图
     * @param g 二维数组，0 表示可通行，1 表示障碍物
     */
    constructor(g: number[][])
    /**
     * 清理上次搜索留下的脏状态
     * 在同一 Graph 上执行多次搜索时必须调用
     */
    cleanDirty(): void
  }

  /**
   * A* 寻路算法命名空间
   */
  namespace astar {
    /**
     * 执行 A* 寻路
     * @param graph 寻路图
     * @param start 起点节点
     * @param end 终点节点
     * @returns 路径节点数组（不包含起点）
     */
    function search(graph: Astar.Graph, start: GridNode, end: GridNode): GridNode[]
  }
}
