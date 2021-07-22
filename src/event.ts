class EventManager {
  bindEvent(
    eventAndCallback: {
      evtName: string
      cb: (e: Event & MouseEvent & KeyboardEvent) => void
    }[],
    ele: HTMLElement | Document
  ) {
    eventAndCallback.forEach(eac => ((ele as unknown as Record<string, (e: Event & MouseEvent & KeyboardEvent) => void>)[eac.evtName] = eac.cb))
  }
}
