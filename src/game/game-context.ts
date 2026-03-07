/// <reference path="../typedef.ts" />
/// <reference path="../motion.ts" />

/**
 * 游戏上下文接口
 * 用于解耦 TowerBase/MonsterBase 等实体类与 Game 类的静态方法调用
 *
 * 使用方式：
 * 1. 在实体类中通过构造函数或 setter 注入 IGameContext
 * 2. 实体类调用 context.xxx() 而非 Game.callXxx()
 * 3. 测试时可以提供 mock 实现
 */
interface IGameContext {
  /**
   * 获取网格边长
   */
  getGridSideSize(): number

  /**
   * 获取怪物列表
   */
  getMonsterList(): readonly MonsterBase[]

  /**
   * 获取塔列表
   */
  getTowerList(): readonly TowerBase[]

  /**
   * 获取独立塔列表（如舰载机）
   */
  getIndependentTowerList(): readonly TowerBase[]

  /**
   * 获取金币和更新函数
   */
  getMoney(): [number, (delta: number) => void]

  /**
   * 获取 DOM 元素
   * @param id 元素 ID
   */
  getElement(id: string): Optional<Node | Node[]>

  /**
   * 获取 ImageBitmap
   * @param name 图片名称
   */
  getImageBitmap(name: string): Optional<ImageBitmap>

  /**
   * 获取 Canvas 上下文
   * @param name Canvas 名称
   */
  getCanvasContext(name: string): WrappedCanvasRenderingContext

  /**
   * 获取边界位置
   */
  getBoundaryPosition(): Position

  /**
   * 获取中线 X 坐标
   */
  getMidSplitLineX(): number

  /**
   * 获取怪物起点位置
   */
  getOriginPosition(): Position

  /**
   * 获取怪物终点位置
   */
  getDestinationPosition(): Position

  /**
   * 获取对角线长度
   */
  getDiagonalLength(): number

  /**
   * 播放动画
   */
  playAnimation(
    name: string,
    pos: Position,
    w: number,
    h: number,
    speed: number,
    delay?: number,
    fps?: number
  ): void

  /**
   * 隐藏状态面板
   */
  hideStatusBlock(): void

  /**
   * 移除塔
   */
  removeTower(tower: TowerBase): void

  /**
   * 获取塔工厂
   */
  getTowerFactory(): (
    towerName: string,
    position: Position,
    image: string | ImageBitmap | AnimationSprite,
    bulletImage: Optional<ImageBitmap>,
    radius: number,
    ...extraArgs: any[]
  ) => TowerBase
}

/**
 * Game 类适配器
 * 将 Game 静态方法包装为 IGameContext 实现
 */
class GameContextAdapter implements IGameContext {
  getGridSideSize(): number {
    return Game.callGridSideSize()
  }

  getMonsterList(): readonly MonsterBase[] {
    return Game.callMonsterList()
  }

  getTowerList(): readonly TowerBase[] {
    return Game.callTowerList()
  }

  getIndependentTowerList(): readonly TowerBase[] {
    return Game.callIndependentTowerList()
  }

  getMoney(): [number, (delta: number) => void] {
    return Game.callMoney()
  }

  getElement(id: string): Optional<Node | Node[]> {
    return Game.callElement(id)
  }

  getImageBitmap(name: string): Optional<ImageBitmap> {
    return Game.callImageBitMap(name)
  }

  getCanvasContext(name: string): WrappedCanvasRenderingContext {
    return Game.callCanvasContext(name)
  }

  getBoundaryPosition(): Position {
    return Game.callBoundaryPosition()
  }

  getMidSplitLineX(): number {
    return Game.callMidSplitLineX()
  }

  getOriginPosition(): Position {
    return Game.callOriginPosition()
  }

  getDestinationPosition(): Position {
    return Game.callDestinationPosition()
  }

  getDiagonalLength(): number {
    return Game.callDiagonalLength()
  }

  playAnimation(
    name: string,
    pos: Position,
    w: number,
    h: number,
    speed: number,
    delay?: number,
    fps?: number
  ): void {
    Game.callAnimation(name, pos, w, h, speed, delay ?? 0, fps)
  }

  hideStatusBlock(): void {
    Game.callHideStatusBlock()
  }

  removeTower(tower: TowerBase): void {
    Game.callRemoveTower(tower)
  }

  getTowerFactory(): (
    towerName: string,
    position: Position,
    image: string | ImageBitmap | AnimationSprite,
    bulletImage: Optional<ImageBitmap>,
    radius: number,
    ...extraArgs: any[]
  ) => TowerBase {
    return Game.callTowerFactory()
  }
}

/**
 * 全局游戏上下文实例
 * 在 Game 初始化后可用
 */
let globalGameContext: IGameContext | null = null

/**
 * 获取游戏上下文
 * @returns 游戏上下文实例
 * @throws 如果游戏尚未初始化
 */
function getGameContext(): IGameContext {
  if (!globalGameContext) {
    // 延迟初始化，确保 Game 类已加载
    globalGameContext = new GameContextAdapter()
  }
  return globalGameContext
}
