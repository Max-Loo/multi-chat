/**
 * matchMedia mock 工厂函数
 *
 * 提供共享的 window.matchMedia mock 实现，替代 useMediaQuery.test.ts 和
 * useResponsive.test.ts 中的重复代码。
 *
 * @example
 * ```typescript
 * import { createMockMatchMedia, setupMatchMediaMock } from '@/__test__/helpers/mocks/matchMedia';
 *
 * const mockMatchMedia = setupMatchMediaMock();
 *
 * afterEach(() => {
 *   mockMatchMedia.restore();
 * });
 * ```
 */

import { vi } from 'vitest';

/**
 * 创建单个 MediaQueryList mock 对象
 * @param query 媒体查询字符串
 * @param matches 是否匹配
 */
export function createMediaQueryListMock(query: string, matches: boolean = false) {
  return {
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

/**
 * 创建 matchMedia mock 函数
 *
 * 返回一个 mock 函数，调用时生成 MediaQueryList 对象。
 * 可通过参数控制默认匹配状态。
 *
 * @param defaultMatches 默认匹配状态（默认 false）
 */
export function createMockMatchMedia(defaultMatches: boolean = false) {
  return vi.fn((query: string) => createMediaQueryListMock(query, defaultMatches));
}

/**
 * 设置完整的 matchMedia mock（含 beforeEach/afterEach 自动恢复）
 *
 * 自动保存原始 window.matchMedia 并在 restore() 时恢复。
 *
 * @param defaultMatches 默认匹配状态（默认 false）
 * @returns 包含 mockFn 和 restore 方法的对象
 */
export function setupMatchMediaMock(defaultMatches: boolean = false) {
  const originalMatchMedia = window.matchMedia;
  const mockFn = createMockMatchMedia(defaultMatches);

  window.matchMedia = mockFn as unknown as typeof window.matchMedia;

  return {
    mockFn,
    restore: () => {
      window.matchMedia = originalMatchMedia;
      mockFn.mockReset();
    },
  };
}
