/**
 * 脏矩形管理器 - 用于增量渲染优化
 * 只重绘发生变化的区域，而不是每帧全量重绘
 */

class DirtyRectManager {
  private rects: DirtyRect[] = []
  private fullRedrawFlag = true
  private readonly maxRects: number

  constructor(maxRects = 50) {
    this.maxRects = maxRects
  }

  /**
   * 标记一个矩形区域为脏（需要重绘）
   * @param x 左上角 X 坐标
   * @param y 左上角 Y 坐标
   * @param width 宽度
   * @param height 高度
   */
  markDirty(x: number, y: number, width: number, height: number): void {
    this.rects.push({ x, y, width, height })
  }

  /**
   * 根据对象位置标记脏区域
   * @param position 对象位置
   * @param radius 对象半径
   * @param padding 额外边距
   */
  markDirtyByPosition(position: Position, radius: number, padding = 5): void {
    const size = radius * 2 + padding * 2
    this.markDirty(
      position.x - radius - padding,
      position.y - radius - padding,
      size,
      size
    )
  }

  /**
   * 标记需要全屏重绘
   */
  markFullRedraw(): void {
    this.fullRedrawFlag = true
  }

  /**
   * 检查是否需要全屏重绘
   */
  needsFullRedraw(): boolean {
    return this.fullRedrawFlag || this.rects.length > this.maxRects
  }

  /**
   * 获取需要重绘的矩形区域
   * @param canvasWidth 画布宽度
   * @param canvasHeight 画布高度
   */
  getDirtyRects(canvasWidth: number, canvasHeight: number): DirtyRect[] {
    if (this.needsFullRedraw()) {
      return [{ x: 0, y: 0, width: canvasWidth, height: canvasHeight }]
    }
    return this.mergeOverlapping(this.rects)
  }

  /**
   * 清空脏矩形列表
   */
  clear(): void {
    this.rects = []
    this.fullRedrawFlag = false
  }

  /**
   * 获取当前脏矩形数量
   */
  get count(): number {
    return this.rects.length
  }

  /**
   * 合并重叠的矩形以减少重绘区域
   * @param rects 矩形列表
   */
  private mergeOverlapping(rects: DirtyRect[]): DirtyRect[] {
    if (rects.length <= 1) return rects

    // 简单实现：将所有矩形合并为一个边界矩形
    // 更复杂的实现可以保留多个不重叠的矩形
    const merged = rects.reduce((acc, rect) => {
      if (!acc) return { ...rect }

      const minX = Math.min(acc.x, rect.x)
      const minY = Math.min(acc.y, rect.y)
      const maxX = Math.max(acc.x + acc.width, rect.x + rect.width)
      const maxY = Math.max(acc.y + acc.height, rect.y + rect.height)

      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      }
    }, null as DirtyRect | null)

    return merged ? [merged] : []
  }

  /**
   * 检查一个点是否在任何脏矩形内
   * @param x X 坐标
   * @param y Y 坐标
   */
  isPointDirty(x: number, y: number): boolean {
    if (this.fullRedrawFlag) return true
    return this.rects.some(rect =>
      x >= rect.x && x <= rect.x + rect.width &&
      y >= rect.y && y <= rect.y + rect.height
    )
  }

  /**
   * 检查一个矩形是否与任何脏矩形相交
   * @param rect 要检查的矩形
   */
  isRectDirty(rect: DirtyRect): boolean {
    if (this.fullRedrawFlag) return true
    return this.rects.some(dirtyRect => this.rectsIntersect(rect, dirtyRect))
  }

  /**
   * 检查两个矩形是否相交
   */
  private rectsIntersect(a: DirtyRect, b: DirtyRect): boolean {
    return !(
      a.x + a.width < b.x ||
      b.x + b.width < a.x ||
      a.y + a.height < b.y ||
      b.y + b.height < a.y
    )
  }
}

// 全局脏矩形管理器实例
const globalDirtyRectManager = new DirtyRectManager()
