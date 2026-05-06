import { vi } from 'vitest';

/**
 * 创建 useAdaptiveScrollbar mock
 * @param options 可选配置覆盖默认值
 */
export function createScrollbarMock(options?: {
  scrollbarClassname?: string;
  isScrolling?: boolean;
}) {
  return {
    onScrollEvent: vi.fn(),
    scrollbarClassname: options?.scrollbarClassname ?? 'custom-scrollbar',
    isScrolling: options?.isScrolling ?? false,
  };
}
