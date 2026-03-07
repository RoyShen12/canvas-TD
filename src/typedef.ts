/**
 * Canvas-TD 核心类型定义文件
 *
 * 本文件必须是项目中第一个加载的 TypeScript 文件
 * 包含全局类型、接口和类型别名
 */

// ============= 通用工具类型 =============

/** 可选值类型（包括 undefined 和 null） */
type Optional<T> = T | undefined | null

/** 可空类型（仅包括 null） */
type Nullable<T> = T | null

// ============= Canvas 类型定义 =============

/** Canvas 元素类型（支持普通和离屏 Canvas） */
type CanvasEle = HTMLCanvasElement | OffscreenCanvas

/**
 * Canvas 包装函数接口
 * 用于扩展 Canvas 上下文的功能
 */
interface WrappedCanvasFx {
  /** 离屏绘制函数（可选） */
  _off_screen_paint?: () => void
  /** Canvas 管理器引用 */
  manager: CanvasManager
  /** Canvas DOM 元素 */
  dom: CanvasEle
}

/** 通用包装 Canvas 上下文（支持所有类型） */
type WrappedCanvasRenderingContext = (
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D
  | ImageBitmapRenderingContext
) & WrappedCanvasFx

/** 在屏 2D Canvas 上下文 */
type WrappedCanvasRenderingContextOnScreen2D = CanvasRenderingContext2D & WrappedCanvasFx

/** 2D Canvas 上下文（普通 + 离屏） */
type WrappedCanvasRenderingContext2D = (
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D
) & WrappedCanvasFx

/** ImageBitmap 渲染上下文 */
type WrappedCanvasRenderingContextBitmap = ImageBitmapRenderingContext & WrappedCanvasFx

// ============= 数组类型 =============

/** 所有类型化数组的联合类型 */
type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array

// ============= 函数类型 =============

/** 缓动函数类型（将 [0,1] 映射到 [0,1]） */
type EasingFunction = (x: number) => number

/** 等级函数类型 - 根据等级返回属性值 */
type LevelFunction = (level: number) => number

/** @deprecated 使用 EasingFunction 代替 */
type efx = EasingFunction

// ============= 对象类型 =============

/** 简单键值对对象（键为字符串，值为数字） */
interface PlainObject {
  [s: string]: number
}

/** 边框位置类型（四个角） */
type BorderPosition = 'tr' | 'tl' | 'br' | 'bl'

/** 边框圆角配置（记录类型） */
type BorderRadius = Record<BorderPosition, number>

/** 递归部分类型（深度可选） */
type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object
      ? RecursivePartial<T[P]>
      : T[P]
}

// ============= UI 类型 =============

/**
 * IOC（控制反转）扩展属性
 * 用于在 UI 组件中注入渲染和数据属性
 */
interface IocExtras {
  /** 重新渲染文本 */
  __re_render_text: (p?: number) => void
  /** 重新渲染（指定宽度） */
  __re_render: (width: number) => void
  /** 显示名称 */
  __dn: string
  /** 排序值 */
  __od: number
  /** 内部图片 URL */
  __inner_img_u: string
  /** 内部背景图片 URL（可选） */
  __inner_b_img_u?: string
  /** 初始价格数组 */
  __init_price: ArrayLike<number>
  /** 构造函数名称 */
  __ctor_name: string
  /** 等级 0 范围 */
  __rng_lv0: number
  /** 左上角 X 坐标 */
  __tlx: number
  /** 左上角 Y 坐标 */
  __tly: number
}

/** IOC Item 类型（ItemBase + 扩展属性） */
type IocItem = ItemBase & IocExtras

/** 带刷新方法的包装类型 */
type WithRefresh<T> = T & { refresh: () => void }

// ============= 类构造函数类型 =============

/**
 * 通用类构造函数接口
 * @template T 实例类型
 * @template Args 构造函数参数类型数组
 */
interface ClassOf<T, Args extends unknown[] = unknown[]> {
  new (...args: Args): T
}

/** Tower 构造函数参数类型 */
type TowerConstructorArgs = [
  position: Position,
  image: string | ImageBitmap | AnimationSprite,
  bulletImage: Optional<ImageBitmap>,
  radius: number,
  ...extraArgs: unknown[]
]

/** Monster 构造函数参数类型 */
type MonsterConstructorArgs = [
  position: Position,
  image: string | ImageBitmap | AnimationSprite,
  level: number,
  ...extraArgs: unknown[]
]

/** Bullet 构造函数参数类型 */
type BulletConstructorArgs = [
  position: Position,
  atk: number,
  target: MonsterBase | Position,
  image: Optional<ImageBitmap | string>,
  ...extraArgs: unknown[]
]

// 实体类构造函数接口类型
type IBase = new (...args: unknown[]) => Base
type IGemBase = new () => GemBase
type IItemBase = new (...args: unknown[]) => ItemBase
type ITowerBase = new (...args: unknown[]) => TowerBase
type IMonsterBase = new (...args: unknown[]) => MonsterBase
type IBulletBase = new (...args: unknown[]) => BulletBase

// ============= 脏矩形类型 =============

/**
 * 脏矩形接口
 * 用于增量渲染优化
 */
interface DirtyRect {
  /** 矩形左上角 X 坐标 */
  x: number
  /** 矩形左上角 Y 坐标 */
  y: number
  /** 矩形宽度 */
  width: number
  /** 矩形高度 */
  height: number
}
