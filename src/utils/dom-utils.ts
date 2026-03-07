/// <reference path='../typedef.ts' />

/**
 * DOM 操作工具类
 * 提供 DOM 元素创建和操作的便捷方法
 */
class DomUtils {
  static _cache = new Map<string, Node | Node[]>()
  static _instance = new Map<string, ReturnType<typeof setInterval> | null>()

  /**
   * 将选项应用到节点
   */
  static __installOptionOnNode<T extends Node>(node: T, option: Partial<T> | {}): T {
    const keys = Object.keys(option) as (keyof typeof option)[]
    for (const key of keys) {
      const value = option[key]
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || typeof value === 'function') {
        (node as any)[key] = value
      } else if (typeof value === 'object' && value !== null) {
        const subKeys = Object.keys(value) as (keyof typeof value)[]
        for (const subKey of subKeys) {
          (node as any)[key][subKey] = value[subKey]
        }
      }
    }
    return node
  }

  /**
   * 创建并追加 div 元素
   */
  static generateDiv(node: Node, option?: RecursivePartial<HTMLDivElement> | {}): HTMLDivElement {
    option = option || {}
    const div = document.createElement('div')
    this.__installOptionOnNode(div, option)
    node.appendChild(div)
    return div
  }

  /**
   * 创建并追加 img 元素
   */
  static generateImg(node: Node, src: string, option?: RecursivePartial<HTMLImageElement> | {}): HTMLImageElement {
    option = option || {}
    const img = document.createElement('img')
    img.src = src
    this.__installOptionOnNode(img, option)
    node.appendChild(img)
    return img
  }

  /**
   * 创建两列布局
   */
  static generateTwoCol(
    node: Node,
    leftOpt: Optional<RecursivePartial<HTMLDivElement> | {}>,
    rightOpt: Optional<RecursivePartial<HTMLDivElement> | {}>,
    leftChildren?: Node[],
    rightChildren?: Node[]
  ): [HTMLDivElement, HTMLDivElement] {
    leftOpt = leftOpt || {}
    rightOpt = rightOpt || {}
    leftChildren = leftChildren || []
    rightChildren = rightChildren || []

    const colL = document.createElement('div')
    colL.className = 'col'
    this.__installOptionOnNode(colL, leftOpt)
    leftChildren.forEach(child => colL.appendChild(child))

    const colR = document.createElement('div')
    colR.className = 'col'
    this.__installOptionOnNode(colR, rightOpt)
    rightChildren.forEach(child => colR.appendChild(child))

    node.appendChild(colL)
    node.appendChild(colR)

    return [colL, colR]
  }

  /**
   * 创建行布局
   */
  static generateRow(
    node: Node,
    className?: string | null,
    option?: RecursivePartial<HTMLDivElement> | {},
    children?: Node[]
  ): HTMLDivElement {
    children = children || []
    option = option || {}

    const row = document.createElement('div')
    row.className = className || 'row'
    this.__installOptionOnNode(row, option)
    children.forEach(child => row.appendChild(child))

    node.appendChild(row)

    return row
  }

  /**
   * 移除节点的所有子元素
   */
  static removeAllChildren(node: Node): void {
    while (node.hasChildNodes()) {
      node.removeChild(node.lastChild!)
    }
  }

  /**
   * 重置节点的文本和样式
   */
  static removeNodeTextAndStyle(node: HTMLElement, className = 'row'): void {
    if (node.style.color) node.style.color = ''
    if (node.style.marginBottom) node.style.marginBottom = ''
    if (node.textContent) node.textContent = ''
    if (node.className != className) node.className = className
  }

  /**
   * 绑定长按事件
   * @param uniqueId 唯一标识符
   * @param node 按钮元素
   * @param onPressFx 按压回调，返回 true 时取消
   * @param onPressFxCallDelay 首次触发延迟
   * @param onPressFxCallInterval 重复触发间隔
   * @param accDelay 加速延迟
   * @param accInterval 加速后的间隔
   */
  static bindLongPressEventHelper(
    uniqueId: string,
    node: HTMLButtonElement,
    onPressFx: () => boolean,
    onPressFxCallDelay: number,
    onPressFxCallInterval: number,
    accDelay: number,
    accInterval: number
  ): void {
    accDelay = accDelay || Infinity

    let timerInst: ReturnType<typeof setTimeout> | null = null

    if (!this._instance.has(uniqueId)) {
      this._instance.set(uniqueId, null)
    }

    node.onmousedown = () => {
      // 清除上一次可能残留的定时器
      if (timerInst !== null) {
        clearTimeout(timerInst)
        timerInst = null
      }
      timerInst = setTimeout(() => {
        const startLevel1 = performance.now()

        const intervalInst = setInterval(() => {
          const cancel = onPressFx()

          if (cancel) {
            const currentInst = this._instance.get(uniqueId)
            if (currentInst) clearInterval(currentInst)
            this._instance.set(uniqueId, null)
          } else if (performance.now() - startLevel1 > accDelay) {
            const currentInst = this._instance.get(uniqueId)
            if (currentInst) clearInterval(currentInst)

            this._instance.set(
              uniqueId,
              setInterval(() => {
                const cancel = onPressFx()

                if (cancel) {
                  const innerInst = this._instance.get(uniqueId)
                  if (innerInst) clearInterval(innerInst)
                  this._instance.set(uniqueId, null)
                }
              }, accInterval)
            )
          }
        }, onPressFxCallInterval)

        this._instance.set(uniqueId, intervalInst)
      }, onPressFxCallDelay)
    }

    const cancelTokenFx = () => {
      if (timerInst !== null) {
        clearTimeout(timerInst)
        timerInst = null
      }

      const intervalInst = this._instance.get(uniqueId)

      if (intervalInst !== null && intervalInst !== undefined) {
        clearInterval(intervalInst)
        this._instance.set(uniqueId, null)
      }
    }

    node.onmouseup = cancelTokenFx
    node.onmouseleave = cancelTokenFx
  }
}
