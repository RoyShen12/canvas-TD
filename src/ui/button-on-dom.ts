/// <reference path="../typedef.ts" />
/// <reference path="../utils/dom-utils.ts" />

/**
 * 按钮基类
 * 使用 DOM 渲染而不是 canvas
 */
class ButtonOnDom {
  public readonly ele: HTMLButtonElement

  constructor(domOptions: RecursivePartial<HTMLButtonElement>, appendOnToDom = true) {
    this.ele = document.createElement('button')

    if (appendOnToDom) document.body.appendChild(this.ele)

    DomUtils.__installOptionOnNode(this.ele, domOptions)
  }

  onMouseClick(): void {
    this.ele.click()
  }
}
