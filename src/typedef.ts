type Optional<T> = T | undefined | null

const __global_test_mode: boolean = localStorage.getItem('debug_mode') === '1'
let g: Optional<Game> = null
let __debug_show_refresh_rect: boolean = false
let __debug_black_magic_tower_always_enhance: boolean = true

type CanvasEle = HTMLCanvasElement | OffscreenCanvas

interface WrappedCanvasFx {
  _off_screen_paint?: () => void
  manager: CanvasManager
  dom: CanvasEle
}

type WrappedAllCanvasRenderingContext = Partial<
  CanvasRenderingContext2D & OffscreenCanvasRenderingContext2D & ImageBitmapRenderingContext & WrappedCanvasFx
>

type WrappedCanvasRenderingContext = (CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | ImageBitmapRenderingContext) & WrappedCanvasFx

type WrappedCanvasRenderingContext2D = (CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) & WrappedCanvasFx

type WrappedCanvasRenderingContextBitmap = ImageBitmapRenderingContext & WrappedCanvasFx

type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array

type efx = (x: number) => number

interface PlainObject {
  [s: string]: number
}

type BorderPosition = 'tr' | 'tl' | 'br' | 'bl'

type BorderRadius = Record<BorderPosition, number>

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[] ? RecursivePartial<U>[] : T[P] extends object ? RecursivePartial<T[P]> : T[P]
}

declare interface GridNode extends PositionLike {
  closed: boolean
  f: number
  g: number
  h: number
  parent: GridNode
  visited: boolean
  weight: number
  x: number
  y: number
}

declare namespace Astar {
  class Graph {
    grid: GridNode[][]
    constructor(g: number[][])
  }

  namespace astar {
    function search(graph: Astar.Graph, start: GridNode, end: GridNode): GridNode[]
  }
}

interface IocExtras {
  __re_render_text: (p?: number) => void
  reRender: (width?: number) => void
  __dn: string
  __od: number
  __inner_img_u: string
  __inner_b_img_u?: string
  __init_price: ArrayLike<number>
  __ctor_name: string
  __rng_lv0: number
  __tlx: number
  __tly: number
}

type IocItem = ItemBase & IocExtras

type WithRefresh<T> = T & { refresh: () => void }

interface ClassOf<T> {
  new (...args: any[]): T
}

type IBase = new (...args: any[]) => Base
type IGemBase = new () => GemBase
type IItemBase = new (...args: any[]) => ItemBase
type ITowerBase = new (...args: any[]) => TowerBase
type IMonsterBase = new (...args: any[]) => MonsterBase
type IBulletBase = new (...args: any) => BulletBase
