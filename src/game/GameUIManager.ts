/// <reference path="../typedef.ts" />
/// <reference path="../motion.ts" />
/// <reference path="../constants.ts" />
/// <reference path="../timer-manager.ts" />
/// <reference path="../utils/dom-utils.ts" />
/// <reference path="../utils/format-utils.ts" />
/// <reference path="./GameTypes.ts" />

/**
 * 游戏 UI 管理器
 * 负责按钮、状态面板等 DOM 元素的管理
 */
class GameUIManager {
  /** 开始/暂停按钮 */
  private _startPauseButton: Optional<ButtonOnDom> = null

  /** 速度控制按钮 */
  private _speedControlButton: Optional<ButtonOnDom> = null

  /** 测试模式控制器（如果存在） */
  private _testModeControls: HTMLElement[] = []

  /**
   * 获取开始/暂停按钮
   */
  public get startPauseButton(): Optional<ButtonOnDom> {
    return this._startPauseButton
  }

  /**
   * 初始化所有控制按钮
   * @param config 按钮配置
   */
  public initButtons(config: ButtonConfig): void {
    const buttonTopA = config.gridSize * UI_LAYOUT.BUTTON_TOP_MULTIPLIER_A + 'px'

    this._startPauseButton = new ButtonOnDom({
      id: 'start_pause_btn',
      className: 'sp_btn',
      type: 'button',
      textContent: '开始',
      title: '快捷键 [空格]',
      style: {
        zIndex: CANVAS_Z_INDEX.BUTTON,
        top: buttonTopA,
        left: config.leftAreaWidth + UI_LAYOUT.TOWER_SELECTOR_MARGIN + 'px',
      },
      onclick: config.onPauseToggle,
    })

    let iterator = config.loopSpeeds[Symbol.iterator]()

    this._speedControlButton = new ButtonOnDom({
      id: 'speed_ctrl_btn',
      className: 'sc_btn',
      type: 'button',
      textContent: '1 倍速',
      style: {
        zIndex: CANVAS_Z_INDEX.BUTTON,
        top: buttonTopA,
        left: config.leftAreaWidth + 150 + 'px',
      },
      onclick: () => {
        let next = iterator.next()
        if (next.done) {
          iterator = config.loopSpeeds[Symbol.iterator]()
          next = iterator.next()
        }
        config.onSpeedChange(next.value)
      },
    })

    // 测试模式切换按钮
    new ButtonOnDom({
      className: 'tm_btn',
      type: 'button',
      textContent: '以' + (config.isTestMode ? '普通' : '测试') + '模式重启',
      style: {
        zIndex: CANVAS_Z_INDEX.BUTTON,
        top: buttonTopA,
        right: '30px',
      },
      onclick: () => {
        localStorage.setItem('debug_mode', config.isTestMode ? '0' : '1')
        window.location.reload()
      },
    })
  }

  /**
   * 初始化测试模式专用 UI
   * @param config 测试模式 UI 配置
   */
  public initTestModeUI(config: TestModeUIConfig): void {
    const buttonTopB = config.gridSize * UI_LAYOUT.BUTTON_TOP_MULTIPLIER_B + 'px'
    const buttonTopC = config.gridSize * UI_LAYOUT.BUTTON_TOP_MULTIPLIER_C + 'px'

    // 步长控制滑块
    const ipt = DomUtils.__installOptionOnNode(document.createElement('input'), {
      type: 'range',
      min: '1',
      max: '30',
      step: '1',
      value: config.stepDivide,
      onchange: () => {
        config.onStepDivideChange(+ipt.value)
        spn.refresh()
      },
      style: {
        width: '50px',
      },
    }) as WithRefresh<HTMLInputElement>

    // 步长显示
    const spn = DomUtils.__installOptionOnNode(document.createElement('span'), {
      style: {
        marginLeft: '10px',
      },
      refresh: () => {
        spn.textContent = '升级步长 ' + ipt.value
      },
    }) as WithRefresh<HTMLSpanElement>
    spn.refresh()

    // 步数显示
    const spn2 = DomUtils.__installOptionOnNode(document.createElement('span'), {
      style: {
        marginLeft: '30px',
      },
      refresh: () => {
        spn2.textContent = '步数 ' + FormatUtils.formatterUs.format(config.count)
      },
    }) as WithRefresh<HTMLSpanElement>
    spn2.refresh()
    globalTimerManager.setInterval(() => spn2.refresh(), 50)

    // 第一行：步长和步数控制
    const row1 = DomUtils.generateRow(
      document.body,
      null,
      {
        style: {
          position: 'fixed',
          top: buttonTopB,
          left: config.leftAreaWidth + UI_LAYOUT.TOWER_SELECTOR_MARGIN + 'px',
          lineHeight: '20px',
          zIndex: CANVAS_Z_INDEX.BUTTON,
        },
      },
      [
        ipt,
        spn,
        spn2,
        DomUtils.__installOptionOnNode(document.createElement('button'), {
          type: 'button',
          textContent: '+100',
          style: { marginLeft: '10px' },
          onclick: () => config.onCountChange(100),
        }),
        DomUtils.__installOptionOnNode(document.createElement('button'), {
          type: 'button',
          textContent: '+1万',
          onclick: () => config.onCountChange(1e4),
        }),
        DomUtils.__installOptionOnNode(document.createElement('button'), {
          type: 'button',
          textContent: '+100万',
          onclick: () => config.onCountChange(1e6),
        }),
        DomUtils.__installOptionOnNode(document.createElement('button'), {
          type: 'button',
          textContent: '+1亿',
          onclick: () => config.onCountChange(1e8),
        }),
      ]
    )
    this._testModeControls.push(row1)

    // 第二行：调试选项
    const row2 = DomUtils.generateRow(
      document.body,
      null,
      {
        style: {
          position: 'fixed',
          top: buttonTopC,
          left: config.leftAreaWidth + UI_LAYOUT.TOWER_SELECTOR_MARGIN + 'px',
          lineHeight: '20px',
          zIndex: CANVAS_Z_INDEX.BUTTON,
        },
      },
      [
        DomUtils.__installOptionOnNode(document.createElement('span'), {
          style: { marginRight: '10px' },
          textContent: '切换显示重绘边框',
        }),
        DomUtils.__installOptionOnNode(document.createElement('input'), {
          type: 'checkbox',
          value: 'on',
          onchange: (e: Event) => {
            config.onDebugRectToggle((e.target as HTMLInputElement).checked)
          },
        }),
      ]
    )
    this._testModeControls.push(row2)
  }

  /**
   * 更新暂停/开始按钮状态
   * @param isPausing 是否暂停中
   */
  public updatePauseButton(isPausing: boolean): void {
    if (this._startPauseButton) {
      this._startPauseButton.ele.textContent = isPausing ? '开始' : '暂停'
    }
  }

  /**
   * 更新速度控制按钮
   * @param speedRatio 当前速度倍率
   */
  public updateSpeedButton(speedRatio: number): void {
    if (this._speedControlButton) {
      this._speedControlButton.ele.textContent = `${speedRatio} 倍速`
    }
  }

  /**
   * 隐藏状态面板
   */
  public static hideStatusPanel(): void {
    const statusBlock = document.getElementById('status_block')
    const gemBlock = document.getElementById('gem_block')
    if (statusBlock) statusBlock.style.display = 'none'
    if (gemBlock) gemBlock.style.display = 'none'
  }

  /**
   * 创建交互层 DOM 元素
   * @returns 交互层 DOM 元素
   */
  public createReactLayer(): HTMLDivElement {
    return DomUtils.generateDiv(document.body, {
      id: 'react',
      style: {
        margin: '0',
        position: 'fixed',
        top: '0',
        left: '0',
        border: '0',
        zIndex: CANVAS_Z_INDEX.REACT,
        width: '100%',
        height: '100%',
        opacity: '0',
      },
    })
  }

  /**
   * 销毁测试模式 UI
   */
  public destroyTestModeUI(): void {
    this._testModeControls.forEach(el => {
      if (el.parentNode) {
        el.parentNode.removeChild(el)
      }
    })
    this._testModeControls = []
  }

  // ============ Toast 提示系统 ============

  /**
   * 显示 Toast 提示
   * @param message 提示文本
   * @param type 提示类型
   * @param duration 显示时长(ms)
   */
  public static showToast(message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info', duration: number = 3000): void {
    const container = document.getElementById('toast_container')
    if (!container) return

    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.textContent = message

    // 动态设置动画时长以匹配 duration 参数
    const fadeOutDelay = Math.max(0, duration - 300) / 1000
    toast.style.animation = `toast-in 0.3s ease, toast-out 0.3s ease ${fadeOutDelay}s`
    toast.style.animationFillMode = 'forwards'

    container.appendChild(toast)

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, duration)
  }

  // ============ 游戏状态覆盖层 ============

  /**
   * 显示暂停覆盖层
   * @param onResume 恢复游戏的回调
   */
  public static showPauseOverlay(onResume: () => void): void {
    const overlay = document.getElementById('pause_overlay')
    if (!overlay) return
    overlay.style.display = 'flex'

    const btn = document.getElementById('resume_btn')
    if (btn) {
      btn.onclick = () => {
        GameUIManager.hidePauseOverlay()
        onResume()
      }
    }
  }

  /**
   * 隐藏暂停覆盖层
   */
  public static hidePauseOverlay(): void {
    const overlay = document.getElementById('pause_overlay')
    if (overlay) overlay.style.display = 'none'
  }

  /**
   * 显示游戏结束覆盖层
   * @param stats 游戏统计数据
   * @param onRestart 重新开始回调
   */
  public static showGameOverOverlay(stats: { totalDamage: number; totalKill: number; wavesCleared: number; survivalTime: number }, onRestart: () => void): void {
    const overlay = document.getElementById('gameover_overlay')
    if (!overlay) return

    const statsEl = document.getElementById('gameover_stats')
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="overlay-stat-row"><span>总伤害</span><span class="stat-value">${FormatUtils.chineseFormatter(stats.totalDamage, 0)}</span></div>
        <div class="overlay-stat-row"><span>击杀数</span><span class="stat-value">${FormatUtils.chineseFormatter(stats.totalKill, 0)}</span></div>
        <div class="overlay-stat-row"><span>波次通过</span><span class="stat-value">${stats.wavesCleared}</span></div>
        <div class="overlay-stat-row"><span>存活时间</span><span class="stat-value">${Math.floor(stats.survivalTime / 1000)} 秒</span></div>
      `
    }

    overlay.style.display = 'flex'

    const btn = document.getElementById('restart_btn')
    if (btn) {
      btn.onclick = onRestart
    }
  }

  /**
   * 显示胜利覆盖层
   * @param stats 游戏统计数据
   * @param onEndless 进入无尽模式回调
   * @param onRestart 重新开始回调
   */
  public static showVictoryOverlay(stats: { totalDamage: number; totalKill: number; survivalTime: number; lifeRemaining: number }, onEndless: () => void, onRestart: () => void): void {
    const overlay = document.getElementById('victory_overlay')
    if (!overlay) return

    const statsEl = document.getElementById('victory_stats')
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="overlay-stat-row"><span>总伤害</span><span class="stat-value">${FormatUtils.chineseFormatter(stats.totalDamage, 0)}</span></div>
        <div class="overlay-stat-row"><span>击杀数</span><span class="stat-value">${FormatUtils.chineseFormatter(stats.totalKill, 0)}</span></div>
        <div class="overlay-stat-row"><span>存活时间</span><span class="stat-value">${Math.floor(stats.survivalTime / 1000)} 秒</span></div>
        <div class="overlay-stat-row"><span>剩余生命</span><span class="stat-value">${stats.lifeRemaining}</span></div>
      `
    }

    overlay.style.display = 'flex'

    const endlessBtn = document.getElementById('endless_btn')
    if (endlessBtn) {
      endlessBtn.onclick = () => {
        overlay.style.display = 'none'
        onEndless()
      }
    }

    const restartBtn = document.getElementById('victory_restart_btn')
    if (restartBtn) {
      restartBtn.onclick = onRestart
    }
  }

  /**
   * 隐藏所有覆盖层
   */
  public static hideAllOverlays(): void {
    const ids = ['pause_overlay', 'gameover_overlay', 'victory_overlay']
    ids.forEach(id => {
      const el = document.getElementById(id)
      if (el) el.style.display = 'none'
    })
  }
}
