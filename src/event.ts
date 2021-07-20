class EventManager {
  bindEvent(
    eventAndCallback: {
      ename: string
      cb: (e: Event & MouseEvent & KeyboardEvent) => void
    }[],
    ele: HTMLElement | Document
  ) {
    eventAndCallback.forEach(eac => (ele[eac.ename] = eac.cb))
  }
}
