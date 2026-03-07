/// <reference path="../typedef.ts" />
/// <reference path="../motion.ts" />
/// <reference path="../constants.ts" />
/// <reference path="../tower.ts" />
/// <reference path="../monsters/index.ts" />
/// <reference path="../utils/math-utils.ts" />
/// <reference path="./GameTypes.ts" />

/**
 * 游戏事件处理器
 * 负责鼠标和键盘事件的处理逻辑
 */
class GameEventHandler {
  /** Game 实例引用（用于访问游戏状态，预留扩展） */
  // @ts-expect-error - Reserved for future extension
  private readonly _game: Game

  /** 上次右键点击时间（用于双击检测） */
  private _lastRightClickTime = -1000

  /** 上次鼠标移动位置 */
  private _lastMouseMovePosition = Position.ORIGIN

  /** 是否按下了详情功能键（Ctrl） */
  private _detailFunctionKeyDown = false

  /** 当前选中要建造的塔类型 */
  private _selectedTowerTypeToBuild: Optional<IocItem> = null

  /** 当前显示状态面板的塔 */
  private _statusBoardOnTower: Optional<TowerBase> = null

  /**
   * 创建事件处理器实例
   * @param game Game 实例
   */
  constructor(game: Game) {
    this._game = game
  }

  /**
   * 获取上次鼠标移动位置
   */
  public get lastMouseMovePosition(): Position {
    return this._lastMouseMovePosition
  }

  /**
   * 获取详情功能键状态
   */
  public get detailFunctionKeyDown(): boolean {
    return this._detailFunctionKeyDown
  }

  /**
   * 获取当前选中要建造的塔类型
   */
  public get selectedTowerTypeToBuild(): Optional<IocItem> {
    return this._selectedTowerTypeToBuild
  }

  /**
   * 设置当前选中要建造的塔类型
   */
  public set selectedTowerTypeToBuild(value: Optional<IocItem>) {
    this._selectedTowerTypeToBuild = value
  }

  /**
   * 获取当前显示状态面板的塔
   */
  public get statusBoardOnTower(): Optional<TowerBase> {
    return this._statusBoardOnTower
  }

  /**
   * 处理鼠标左键点击
   * @param mousePos 鼠标位置
   * @param midSplitLineX 左右区域分割线 X 坐标
   * @param towerForSelect 可选择的塔列表
   * @param towers 已放置的塔列表
   * @param money 当前金币
   * @param onBuildTower 建造塔的回调
   * @param onUpdateMoney 更新金币的回调
   * @param mouseCtx 鼠标图层上下文
   */
  public handleLeftClick(
    mousePos: Position,
    midSplitLineX: number,
    towerForSelect: IocItem[],
    towers: readonly TowerBase[],
    independentTowers: readonly TowerBase[],
    money: number,
    gridSize: number,
    pathfinder: GamePathfinder,
    grids: number[][],
    wallBoundary: number[][],
    monsters: readonly MonsterBase[],
    onBuildTower: (pos: Position, ctorName: string, imgName: string, bImgName: Optional<string>, price: number) => void,
    onUpdateMoney: (delta: number) => void,
    mouseCtx: WrappedCanvasRenderingContextOnScreen2D
  ): void {
    // 建造模式
    if (this._selectedTowerTypeToBuild) {
      this._handleBuildModeClick(
        mousePos,
        midSplitLineX,
        money,
        gridSize,
        pathfinder,
        grids,
        wallBoundary,
        monsters,
        towers,
        onBuildTower
      )
      return
    }

    // 非建造模式
    if (mousePos.x > midSplitLineX) {
      this._handleRightMenuClick(mousePos, towerForSelect)
    } else {
      this._handleGameAreaClick(mousePos, towers, independentTowers, money, midSplitLineX, onUpdateMoney, mouseCtx)
    }
  }

  /**
   * 处理鼠标右键点击
   * @param mousePos 鼠标位置
   * @param towers 已放置的塔列表
   * @param onRemoveTower 移除塔的回调
   */
  public handleRightClick(
    mousePos: Position,
    towers: readonly TowerBase[],
    onRemoveTower: (tower: TowerBase) => void
  ): void {
    const now = performance.now()

    if (now - this._lastRightClickTime < GAME_TIMING.DOUBLE_CLICK_MS) {
      // 双击右键 - 出售塔
      if (!this._selectedTowerTypeToBuild) {
        const selectedT = towers.find(t => t.position.equal(mousePos, t.radius * 0.75))
        if (selectedT) {
          onRemoveTower(selectedT)
          GameUIManager.showToast(`已出售 ${selectedT.name || '塔'}，回收 ${selectedT.sellingPrice} 金币`, 'success')
        }
      }
    } else {
      // 单击右键 - 取消建造状态或提示出售
      if (this._selectedTowerTypeToBuild) {
        this._selectedTowerTypeToBuild.__re_render(0)
        this._selectedTowerTypeToBuild = null
      } else {
        const selectedT = towers.find(t => t.position.equal(mousePos, t.radius * 0.75))
        if (selectedT) {
          GameUIManager.showToast(`再次右键出售（回收 ${selectedT.sellingPrice} 金币）`, 'info', 1500)
        }
      }
    }

    this._lastRightClickTime = now
  }

  /**
   * 处理鼠标移动（节流版本）
   * @returns 节流后的事件处理函数
   */
  public createMouseMoveHandler(
    midSplitLineX: number,
    towerForSelect: IocItem[],
    getTowers: () => readonly TowerBase[],
    getIndependentTowers: () => readonly TowerBase[],
    getMonsters: () => readonly MonsterBase[],
    mouseCtx: WrappedCanvasRenderingContextOnScreen2D,
    pathfinder: GamePathfinder,
    gridSize: number
  ): (e: MouseEvent) => void {
    return _.throttle((e: MouseEvent) => {
      mouseCtx.clearRect(0, 0, innerWidth, innerHeight)

      const mousePos = new Position(e.offsetX, e.offsetY)
      this._lastMouseMovePosition = mousePos

      if (this._selectedTowerTypeToBuild) {
        // 在左侧区域时显示网格对齐的幽灵塔预览
        if (mousePos.x < midSplitLineX) {
          const gridInfo = pathfinder.getGridInfoAtPosition(mousePos, midSplitLineX)
          if (gridInfo) {
            const snapPos = new Position(gridInfo.centerX, gridInfo.centerY)
            const ctx = mouseCtx as unknown as CanvasRenderingContext2D

            // 绘制网格高亮
            ctx.fillStyle = 'rgba(64, 158, 255, 0.15)'
            ctx.fillRect(
              gridInfo.centerX - gridSize / 2,
              gridInfo.centerY - gridSize / 2,
              gridSize,
              gridSize
            )
            ctx.strokeStyle = 'rgba(64, 158, 255, 0.5)'
            ctx.lineWidth = 1
            ctx.strokeRect(
              gridInfo.centerX - gridSize / 2,
              gridInfo.centerY - gridSize / 2,
              gridSize,
              gridSize
            )

            // 绘制幽灵塔（半透明圆形）
            ctx.globalAlpha = 0.5
            ctx.beginPath()
            ctx.arc(snapPos.x, snapPos.y, gridSize / 2 - 2, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(64, 158, 255, 0.3)'
            ctx.fill()
            ctx.strokeStyle = 'rgba(64, 158, 255, 0.8)'
            ctx.lineWidth = 2
            ctx.stroke()
            ctx.globalAlpha = 1

            // 绘制射程圈
            TowerBase.prototype.renderRange.call(
              { position: snapPos, Rng: this._selectedTowerTypeToBuild.__rng_lv0 },
              mouseCtx
            )
          }
        } else {
          // 右侧区域只显示射程预览
          TowerBase.prototype.renderRange.call(
            { position: mousePos, Rng: this._selectedTowerTypeToBuild.__rng_lv0 },
            mouseCtx
          )
        }
        return
      }

      // 右侧菜单区域
      if (e.offsetX > midSplitLineX) {
        const selectedT = towerForSelect.find(tfs => tfs.position.equal(mousePos, tfs.radius))
        if (selectedT) {
          const ctor = TowerRegistry.getOrThrow(selectedT.__ctor_name)
          let virtualTow: TowerBase | null = new ctor()
          const descriptionChunked = _.cloneDeep(virtualTow.descriptionChunked)
          virtualTow.destroy()
          virtualTow = null

          TowerBase.prototype.renderStatusBoard.call(
            {
              position: mousePos,
              informationSeq: [[selectedT.__dn, '']],
              descriptionChunked: descriptionChunked,
              exploitsSeq: [['建造快捷键', `[${selectedT.__od}]`]],
              radius: selectedT.radius,
            },
            0,
            midSplitLineX,
            0,
            innerHeight,
            false,
            false
          )
        } else {
          Game.callHideStatusBlock()
        }
      }
      // 左侧方格区域
      else {
        const towers = getTowers()
        const independentTowers = getIndependentTowers()
        const monsters = getMonsters()

        // 给可操纵单位注入新位置
        independentTowers.forEach(t => {
          ;(t as _Jet).destinationPosition = mousePos
        })

        const selectedT =
          towers.find(t => t.position.equal(mousePos, t.radius)) ||
          independentTowers.find(t => t.position.equal(mousePos, t.radius))
        const selectedM = monsters.find(m => m.position.equal(mousePos, m.radius))

        if (selectedT) {
          this._statusBoardOnTower = selectedT
          selectedT.renderRange(mouseCtx)
          selectedT.renderStatusBoard(0, midSplitLineX, 0, innerHeight, true, this._detailFunctionKeyDown)
        } else if (selectedM) {
          selectedM.renderStatusBoard(0, midSplitLineX, 0, innerHeight, false, false)
        } else {
          Game.callHideStatusBlock()
          this._statusBoardOnTower = null
        }
      }
    }, GAME_TIMING.MOUSE_THROTTLE_MS)
  }

  /**
   * 处理键盘按下事件
   * @param e 键盘事件
   * @param towerForSelect 可选择的塔列表
   * @param isTestMode 是否测试模式
   * @param onPauseToggle 暂停切换回调
   * @param onSpawnDummy 生成测试怪物回调
   * @param midSplitLineX 左右区域分割线 X 坐标
   */
  public handleKeyDown(
    e: KeyboardEvent,
    towerForSelect: IocItem[],
    isTestMode: boolean,
    startAndPauseButton: Optional<ButtonOnDom>,
    onSpawnDummy: () => void,
    onSpawnDummyBatch: () => void,
    midSplitLineX: number,
    onLeftClick: () => void
  ): void {
    // 数字键快捷选择塔
    if (MathUtils.isNumberSafe(e.key)) {
      const index = +e.key - 1
      if (index >= 0 && index < towerForSelect.length) {
        this._selectedTowerTypeToBuild = towerForSelect[index] ?? null
        onLeftClick()
        this._selectedTowerTypeToBuild = null
      }
      return
    }

    console.log('keyDownHandler: ' + e.key)

    switch (e.key) {
      case 'c':
        onLeftClick()
        break
      case ' ':
        if (startAndPauseButton) startAndPauseButton.onMouseClick()
        break
      case 'h':
      case 'H': {
        const helpPanel = document.getElementById('help_panel')
        if (helpPanel) {
          helpPanel.style.display = helpPanel.style.display === 'none' ? 'block' : 'none'
        }
        break
      }
      case 'v':
        if (isTestMode) {
          onSpawnDummy()
        }
        break
      case 'b':
        if (isTestMode) {
          onSpawnDummyBatch()
        }
        break
      case 'q':
        CarrierTower.WeaponMode = CarrierTower.WeaponMode === 1 ? 2 : 1
        break
      case 'F1':
        CarrierTower.F1Mode = !CarrierTower.F1Mode
        e.preventDefault()
        break
      case 'Control':
        this._detailFunctionKeyDown = !this._detailFunctionKeyDown
        if (this._statusBoardOnTower) {
          this._statusBoardOnTower.renderStatusBoard(
            0,
            midSplitLineX,
            0,
            innerHeight,
            true,
            this._detailFunctionKeyDown
          )
        }
        break
      default:
        break
    }
  }

  /**
   * 处理建造模式下的点击
   */
  private _handleBuildModeClick(
    mousePos: Position,
    midSplitLineX: number,
    money: number,
    gridSize: number,
    pathfinder: GamePathfinder,
    _grids: number[][],
    wallBoundary: number[][],
    monsters: readonly MonsterBase[],
    towers: readonly TowerBase[],
    onBuildTower: (pos: Position, ctorName: string, imgName: string, bImgName: Optional<string>, price: number) => void
  ): void {
    if (!this._selectedTowerTypeToBuild) return

    const gridInfo = pathfinder.getGridInfoAtPosition(mousePos, midSplitLineX)

    // 不在左侧区域
    if (!gridInfo) {
      return
    }

    // 区块内有怪物
    if (this._hasMonsterAtGrid(gridInfo.gridX, gridInfo.gridY, monsters, gridSize)) {
      GameUIManager.showToast('无法建造：区块内有怪物', 'warning')
      return
    }

    // 区块内已有塔
    if (this._hasTowerAtGrid(gridInfo.gridX, gridInfo.gridY, towers, gridSize)) {
      GameUIManager.showToast('无法建造：区块内已有塔', 'warning')
      return
    }

    // 检查是否会阻断路径
    if (pathfinder.wouldBlockAllPaths(gridInfo.gridX, gridInfo.gridY, _grids, wallBoundary)) {
      GameUIManager.showToast('无法建造：会阻断怪物路径', 'error')
      return
    }

    // 金币不足
    if (money < this._selectedTowerTypeToBuild.__init_price[0]!) {
      GameUIManager.showToast('金币不足', 'warning')
      return
    }

    // 重置选中状态的视觉效果
    this._selectedTowerTypeToBuild.__re_render(0)

    // 执行建塔
    onBuildTower(
      mousePos,
      this._selectedTowerTypeToBuild.__ctor_name,
      this._selectedTowerTypeToBuild.__inner_img_u,
      this._selectedTowerTypeToBuild.__inner_b_img_u,
      -this._selectedTowerTypeToBuild.__init_price[0]!
    )

    // 清除建造状态
    this._selectedTowerTypeToBuild = null
  }

  /**
   * 处理右侧菜单区域的点击
   */
  private _handleRightMenuClick(mousePos: Position, towerForSelect: IocItem[]): void {
    const selectedT = towerForSelect.find(tfs => tfs.position.equal(mousePos, tfs.radius))
    if (selectedT) {
      this._selectedTowerTypeToBuild = selectedT
      Game.callHideStatusBlock()
      this._selectedTowerTypeToBuild.__re_render(2)
    }
  }

  /**
   * 处理左侧游戏区域的点击（塔升级）
   */
  private _handleGameAreaClick(
    mousePos: Position,
    towers: readonly TowerBase[],
    _independentTowers: readonly TowerBase[],
    money: number,
    midSplitLineX: number,
    onUpdateMoney: (delta: number) => void,
    mouseCtx: WrappedCanvasRenderingContextOnScreen2D
  ): void {
    const selectedT = towers.find(t => t.position.equal(mousePos, t.radius))
    if (selectedT) {
      onUpdateMoney(-1 * selectedT.levelUp(money))
      mouseCtx.clearRect(0, 0, innerWidth, innerHeight)
      selectedT.renderRange(mouseCtx)
      selectedT.renderStatusBoard(0, midSplitLineX, 0, innerHeight, true, this._detailFunctionKeyDown)
    }
  }

  /**
   * 检查指定网格位置是否有怪物
   */
  private _hasMonsterAtGrid(
    gridX: number,
    gridY: number,
    monsters: readonly MonsterBase[],
    gridSize: number
  ): boolean {
    return monsters.some(mst => {
      const mstGX = Math.max(Math.floor(Math.round(mst.position.y) / gridSize), 0)
      const mstGY = Math.max(Math.floor(Math.round(mst.position.x) / gridSize), 0)
      return gridX === mstGX && mstGY === gridY
    })
  }

  /**
   * 检查指定网格位置是否有塔
   */
  private _hasTowerAtGrid(
    gridX: number,
    gridY: number,
    towers: readonly TowerBase[],
    gridSize: number
  ): boolean {
    return towers.some(tow => {
      const towGX = Math.max(Math.floor(Math.round(tow.position.y) / gridSize), 0)
      const towGY = Math.max(Math.floor(Math.round(tow.position.x) / gridSize), 0)
      return gridX === towGX && towGY === gridY
    })
  }
}
