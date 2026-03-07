/// <reference path="../typedef.ts" />
/// <reference path="../motion.ts" />
/// <reference path="../utils/dom-utils.ts" />
/// <reference path="../utils/format-utils.ts" />

/**
 * 状态面板渲染数据接口
 * 提供渲染状态面板所需的所有数据
 */
interface IStatusBoardData {
  /** 实体位置 */
  position: Position
  /** 实体半径 */
  radius: number
  /** 信息序列 [[标签, 值], ...] */
  informationSeq: string[][]
  /** 说明文本（按行分割） */
  descriptionChunked: string[]
  /** 额外信息序列 [[标签, 值], ...] */
  exploitsSeq: string[][]
  /** 是否可镶嵌宝石 */
  canInsertGem: boolean
  /** 当前镶嵌的宝石 */
  gem: GemBase | null
  /** 实体 ID */
  id: number
  /** 是否已达最高等级 */
  isMaxLevel: boolean
  /** 等级 */
  level: number
  /** 各等级价格 */
  price: ArrayLike<number>
  /** 构造函数引用（用于获取静态属性） */
  constructorRef: typeof TowerBase
  /** 镶嵌宝石的回调 */
  inlayGem: (gemName: string) => GemBase
}

/**
 * 状态面板颜色常量
 */
const STATUS_BOARD_COLORS = {
  RED: '#F51818',
  GREEN: '#94C27E',
  GRAY: '#909399',
  DARK_GRAY: '#606266',
  LIGHT_GRAY: '#DCDFE6',
} as const

/**
 * 状态面板渲染器
 * 负责渲染塔/怪物的状态信息面板和宝石面板
 */
class StatusBoardRenderer {
  /**
   * 渲染数据行（标签-值对）
   */
  private static renderDataType1(
    rootNode: Node,
    dataChunk: string[][],
    offset: number,
    showDesc: boolean,
    constructorRef: typeof TowerBase,
    isMaxLevel: boolean,
    price: ArrayLike<number>,
    level: number,
    getMoney: () => [number, (delta: number) => void]
  ): number {
    let jump = 0
    dataChunk.forEach((data, idx) => {
      const showD = showDesc && constructorRef.informationDesc.has(data[0]!)

      const row = rootNode.childNodes.item(idx + offset + jump)
      DomUtils.removeNodeTextAndStyle(row as HTMLElement)

      if (!row.hasChildNodes()) {
        DomUtils.generateTwoCol(row, null, null)
      } else {
        DomUtils.removeNodeTextAndStyle(row.lastChild as HTMLElement)
        DomUtils.removeNodeTextAndStyle(row.firstChild as HTMLElement)
      }

      row.firstChild!.textContent = data[0]!
      row.lastChild!.textContent = data[1]!

      if (showD) {
        const rowD = rootNode.childNodes.item(idx + offset + jump + 1) as HTMLElement
        DomUtils.removeNodeTextAndStyle(rowD as HTMLElement)
        DomUtils.removeAllChildren(rowD)
        rowD.textContent = constructorRef.informationDesc.get(data[0] as string) || ''
        rowD.style.color = STATUS_BOARD_COLORS.GRAY
        rowD.style.marginBottom = '5px'
        jump++
      }

      if (data[0] === '售价' || data[0] === '类型') {
        ;(row.lastChild as HTMLElement).style.color = STATUS_BOARD_COLORS.DARK_GRAY
        this.renderDivision(rootNode, idx + offset + jump + (showD ? 2 : 1))
        jump++
      } else if (data[0] === '下一级') {
        if (isMaxLevel) {
          ;(row.lastChild as HTMLElement).style.color = STATUS_BOARD_COLORS.LIGHT_GRAY
        } else {
          ;(row.lastChild as HTMLElement).style.color =
            price[level + 1]! < getMoney()[0] ? STATUS_BOARD_COLORS.GREEN : STATUS_BOARD_COLORS.RED
        }
      }
    })
    return jump
  }

  /**
   * 渲染描述行
   */
  private static renderDataType2(rootNode: Node, dataChunk: string[], offset: number): void {
    dataChunk.forEach((data, idx) => {
      const row = rootNode.childNodes.item(idx + offset) as HTMLElement
      DomUtils.removeNodeTextAndStyle(row)
      DomUtils.removeAllChildren(row)
      if (data.includes('+')) row.style.color = 'rgba(204,51,51,1)'
      else if (data.includes('-')) row.style.color = 'rgba(0,102,204,1)'
      else row.style.color = ''
      row.textContent = data
    })
  }

  /**
   * 渲染分隔线
   */
  private static renderDivision(rootNode: Node, offset: number): void {
    const div = rootNode.childNodes.item(offset) as HTMLElement
    DomUtils.removeAllChildren(div)
    DomUtils.removeNodeTextAndStyle(div, 'division')
  }

  /**
   * 渲染状态面板
   * @param data 渲染数据
   * @param bx1 左边界 X
   * @param by1 上边界 Y
   * @param showGemPanel 是否显示宝石面板
   * @param showMoreDetail 是否显示详细信息
   * @param specifiedWidth 指定宽度
   * @param getElement 获取 DOM 元素的函数
   * @param getMoney 获取金币的函数
   * @param updateGemPoint 宝石升级点数
   */
  static render(
    data: IStatusBoardData,
    bx1: number,
    by1: number,
    showGemPanel: boolean,
    showMoreDetail: boolean,
    specifiedWidth: number = 150,
    getElement: (id: string) => Optional<Node | Node[]>,
    getMoney: () => [number, (delta: number) => void],
    updateGemPoint: number,
    setUpdateGemPoint: (delta: number) => void
  ): void {
    showGemPanel = showGemPanel && data.canInsertGem

    const blockElement = getElement('status_block') as HTMLDivElement
    blockElement.style.display = 'block'
    blockElement.style.width = specifiedWidth + 'px'
    blockElement.style.borderBottomLeftRadius = showGemPanel ? '0' : ''
    blockElement.style.borderBottomRightRadius = showGemPanel ? '0' : ''
    blockElement.style.borderBottom = showGemPanel ? '0' : ''

    const lineCount = data.informationSeq.length + data.descriptionChunked.length + data.exploitsSeq.length
    const moreDescLineCount = showMoreDetail
      ? data.informationSeq.filter(info => data.constructorRef.informationDesc.has(info[0]!)).length
      : 0
    const extraLineCount = 2 + 1 + moreDescLineCount

    if (blockElement.childNodes.length > lineCount + extraLineCount) {
      blockElement.childNodes.forEach((child, index) => {
        if (index > lineCount - 1 + extraLineCount) {
          DomUtils.removeAllChildren(child)
          DomUtils.removeNodeTextAndStyle(child as HTMLElement)
        }
      })
    }

    while (blockElement.childNodes.length < lineCount + extraLineCount) {
      DomUtils.generateRow(blockElement)
    }

    const l1 = data.informationSeq.length + 2 + moreDescLineCount
    const l2 = l1 + data.exploitsSeq.length + 1

    this.renderDataType1(
      blockElement,
      data.informationSeq,
      0,
      showMoreDetail,
      data.constructorRef,
      data.isMaxLevel,
      data.price,
      data.level,
      getMoney
    )

    this.renderDivision(blockElement, l1 - 1)

    this.renderDataType1(
      blockElement,
      data.exploitsSeq,
      l1,
      false,
      data.constructorRef,
      data.isMaxLevel,
      data.price,
      data.level,
      getMoney
    )

    this.renderDivision(blockElement, l2 - 1)

    this.renderDataType2(blockElement, data.descriptionChunked, l2)

    // 渲染宝石面板
    if (showGemPanel) {
      this.renderGemPanel(
        data,
        bx1,
        by1,
        showMoreDetail,
        specifiedWidth,
        getElement,
        getMoney,
        updateGemPoint,
        setUpdateGemPoint
      )
    } else {
      // 隐藏宝石面板
      const gemElement = getElement('gem_block') as HTMLDivElement
      gemElement.style.display = 'none'
    }

    // 计算位置
    this.calculateAndApplyPosition(data, bx1, by1, showGemPanel, specifiedWidth, getElement)
  }

  /**
   * 渲染宝石面板
   */
  private static renderGemPanel(
    data: IStatusBoardData,
    bx1: number,
    by1: number,
    showMoreDetail: boolean,
    specifiedWidth: number,
    getElement: (id: string) => Optional<Node | Node[]>,
    getMoney: () => [number, (delta: number) => void],
    updateGemPoint: number,
    setUpdateGemPoint: (delta: number) => void
  ): void {
    const gemElement = getElement('gem_block') as HTMLDivElement
    DomUtils.removeAllChildren(gemElement)
    gemElement.style.display = 'block'
    gemElement.style.width = specifiedWidth + 'px'

    if (!data.gem) {
      // 选择宝石
      this.renderGemSelection(data, bx1, by1, showMoreDetail, specifiedWidth, getElement, getMoney, updateGemPoint, setUpdateGemPoint)
    } else {
      // 展示已镶嵌宝石
      this.renderGemDisplay(data, bx1, by1, showMoreDetail, specifiedWidth, getElement, getMoney, updateGemPoint, setUpdateGemPoint)
    }
  }

  /**
   * 渲染宝石选择面板
   */
  private static renderGemSelection(
    data: IStatusBoardData,
    bx1: number,
    by1: number,
    showMoreDetail: boolean,
    specifiedWidth: number,
    getElement: (id: string) => Optional<Node | Node[]>,
    getMoney: () => [number, (delta: number) => void],
    _updateGemPoint: number,
    _setUpdateGemPoint: (delta: number) => void
  ): void {
    const gemElement = getElement('gem_block') as HTMLDivElement
    let selected = TowerBase.Gems[0]!.name

    DomUtils.generateRow(gemElement, null, {
      textContent: '选购一颗' + GemBase.gemName,
      style: { margin: '0 0 8px 0' }
    })

    if (showMoreDetail) {
      DomUtils.generateRow(gemElement, null, {
        textContent: GemBase.gemName + '可以极大得提高塔的能力，每个单位只能选择一枚' + GemBase.gemName + '镶嵌，之后可以使用点数升级继续提高' + GemBase.gemName + '的效用',
        style: { margin: '0 0 8px 0', color: STATUS_BOARD_COLORS.GRAY }
      })
    }

    const select = document.createElement('select')
    select.size = TowerBase.Gems.length
    select.style.width = '100%'
    select.style.fontSize = '12px'

    const rowImage = DomUtils.generateRow(gemElement) as HTMLDivElement & { firstChild: HTMLImageElement }
    const ctor = TowerBase.GemNameToGemCtor(selected) as unknown as typeof GemBase
    DomUtils.generateImg(rowImage, ctor.imgSrc, { className: 'lg_gem_img' })

    const rowPrice = DomUtils.generateRow(gemElement, null, { style: { marginBottom: '5px' } }, ctor.priceSpan) as HTMLDivElement & { lastChild: HTMLSpanElement }
    rowPrice.lastChild.style.color = ctor.price <= getMoney()[0] ? STATUS_BOARD_COLORS.GREEN : STATUS_BOARD_COLORS.RED

    const rowDesc = DomUtils.generateRow(gemElement, null, {
      textContent: ctor.stasisDescription,
      style: { lineHeight: '1.2', margin: '0 0 8px 0' }
    })

    select.onchange = () => {
      selected = select.value
      const newCtor = TowerBase.GemNameToGemCtor(selected) as unknown as typeof GemBase

      rowDesc.textContent = newCtor.stasisDescription
      ;(rowImage.firstChild as HTMLImageElement).src = newCtor.imgSrc
      rowPrice.lastChild.textContent = '$ ' + FormatUtils.formatterUs.format(newCtor.price)
      rowPrice.lastChild.style.color = newCtor.price <= getMoney()[0] ? STATUS_BOARD_COLORS.GREEN : STATUS_BOARD_COLORS.RED

      if (newCtor.price > getMoney()[0]) {
        btn.setAttribute('disabled', 'disabled')
      } else {
        btn.removeAttribute('disabled')
      }
    }

    select.innerHTML = data.constructorRef.GemsToOptionsInnerHtml
    // 将 select 插入到 rowImage 之前
    gemElement.insertBefore(DomUtils.generateRow(gemElement, 'row_nh', { style: { margin: '0 0 8px 0' } }, [select]), rowImage)

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = '确认'
    if (ctor.price > getMoney()[0]) {
      btn.setAttribute('disabled', 'disabled')
    }

    btn.onclick = () => {
      const ct = TowerBase.GemNameToGemCtor(selected) as unknown as typeof GemBase
      const [money, emitter] = getMoney()

      if (money > ct.price) {
        emitter(-ct.price)
        // 安装宝石并获取返回的宝石实例
        data.gem = data.inlayGem(selected)
        // 重新渲染
        this.render(data, bx1, by1, true, showMoreDetail, specifiedWidth, getElement, getMoney, _updateGemPoint, _setUpdateGemPoint)
      }
    }

    DomUtils.generateRow(gemElement, null, undefined, [btn])
  }

  /**
   * 渲染已镶嵌宝石展示面板
   */
  private static renderGemDisplay(
    data: IStatusBoardData,
    bx1: number,
    by1: number,
    showMoreDetail: boolean,
    specifiedWidth: number,
    getElement: (id: string) => Optional<Node | Node[]>,
    getMoney: () => [number, (delta: number) => void],
    updateGemPoint: number,
    setUpdateGemPoint: (delta: number) => void
  ): void {
    const gemElement = getElement('gem_block') as HTMLDivElement
    const gem = data.gem!
    const canUpdateNext = !gem.isMaxLevel && updateGemPoint >= gem.levelUpPoint

    DomUtils.generateRow(gemElement, null, {
      textContent: '升级你的' + GemBase.gemName
    })

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = '升级'
    btn.title = '长按快速升级'

    if (!canUpdateNext) {
      btn.setAttribute('disabled', 'disabled')
    }

    btn.onclick = () => {
      if (data.gem) {
        setUpdateGemPoint(-data.gem.levelUp(updateGemPoint))
        this.render(data, bx1, by1, true, showMoreDetail, specifiedWidth, getElement, getMoney, updateGemPoint, setUpdateGemPoint)
      }
    }

    DomUtils.bindLongPressEventHelper(
      data.id + '',
      btn,
      () => {
        if (data.gem && !data.gem.isMaxLevel && updateGemPoint >= data.gem.levelUpPoint) {
          btn.onclick && btn.onclick(new MouseEvent(''))
          return false
        } else {
          return true
        }
      },
      200,
      50,
      1500,
      10
    )

    DomUtils.generateRow(gemElement, null, {
      textContent: gem.gemName,
      style: { marginBottom: '10px' }
    })

    const [imgCol] = DomUtils.generateTwoCol(
      DomUtils.generateRow(gemElement, null, { style: { marginBottom: '5px' } }),
      null,
      null,
      [],
      [btn]
    )
    DomUtils.generateImg(imgCol, gem.imgSrc, { className: 'lg_gem_img' })

    DomUtils.generateRow(gemElement, null, {
      textContent: gem.level + '  级 / ' + gem.maxLevelHuman
    })

    DomUtils.generateTwoCol(
      DomUtils.generateRow(gemElement),
      { textContent: '下一级点数' },
      {
        textContent: gem.isMaxLevel ? '最高等级' : FormatUtils.formatterUs.format(gem.levelUpPoint),
        style: { color: canUpdateNext ? STATUS_BOARD_COLORS.GREEN : STATUS_BOARD_COLORS.RED }
      }
    )

    DomUtils.generateRow(gemElement, null, {
      textContent: gem.description
    })
  }

  /**
   * 计算并应用面板位置
   */
  private static calculateAndApplyPosition(
    data: IStatusBoardData,
    bx1: number,
    by1: number,
    showGemPanel: boolean,
    specifiedWidth: number,
    getElement: (id: string) => Optional<Node | Node[]>
  ): void {
    const blockElement = getElement('status_block') as HTMLDivElement
    const gemElement = getElement('gem_block') as HTMLDivElement
    const bHeight = blockElement.offsetHeight
    const gHeight = gemElement.offsetHeight

    // 位置计算：
    // 2 | 1
    // --o--
    // 3 | 4
    let position = 2

    if (data.position.x - bx1 < specifiedWidth + data.radius) {
      position = 1
      if (data.position.y - by1 < bHeight) {
        position = 4
      }
    }
    if (data.position.y - by1 < bHeight) {
      position = 3
      if (data.position.x - bx1 < specifiedWidth + data.radius) {
        position = 4
      }
    }

    const positionTLX = data.position.x - (position === 1 || position === 4 ? data.radius * -1 : specifiedWidth + data.radius)
    let positionTLY = data.position.y + (position === 1 || position === 2 ? -1 : 0) * (bHeight + data.radius)
    const pyBhGh = positionTLY + bHeight + gHeight

    if (position < 3 && positionTLY < 0) {
      positionTLY = 5
    } else if (pyBhGh > innerHeight) {
      const overflowH = pyBhGh - innerHeight
      positionTLY -= overflowH + 30
    }

    blockElement.style.top = positionTLY + 'px'
    blockElement.style.left = positionTLX + 'px'

    if (showGemPanel) {
      gemElement.style.top = positionTLY + bHeight + 'px'
      gemElement.style.left = positionTLX + 'px'
    }
  }
}
