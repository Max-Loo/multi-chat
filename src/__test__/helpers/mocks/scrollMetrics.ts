/**
 * 滚动指标 Mock 工具
 *
 * 通过 Object.defineProperty 模拟 DOM 容器的 scrollHeight、clientHeight、scrollTop 属性，
 * 用于在 jsdom 环境中测试滚动相关逻辑。
 */

/** 滚动指标配置 */
interface ScrollMetrics {
  scrollHeight?: number
  clientHeight?: number
  scrollTop?: number
}

/**
 * 模拟 DOM 容器的滚动指标属性
 *
 * 关键：所有属性必须设置 writable: true + configurable: true。
 * writable: true 是必要的 — Detail 的 scrollToBottom 会执行
 * container.scrollTop = container.scrollHeight，如果 scrollTop 不可写则赋值静默失败。
 */
export function mockContainerMetrics(
  container: HTMLElement,
  metrics: ScrollMetrics,
): void {
  if (metrics.scrollHeight !== undefined) {
    Object.defineProperty(container, 'scrollHeight', {
      value: metrics.scrollHeight,
      writable: true,
      configurable: true,
    })
  }

  if (metrics.clientHeight !== undefined) {
    Object.defineProperty(container, 'clientHeight', {
      value: metrics.clientHeight,
      writable: true,
      configurable: true,
    })
  }

  if (metrics.scrollTop !== undefined) {
    Object.defineProperty(container, 'scrollTop', {
      value: metrics.scrollTop,
      writable: true,
      configurable: true,
    })
  }
}
