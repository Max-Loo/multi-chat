/**
 * useResponsive hook Mock 工厂
 *
 * 提供统一的 useResponsive mock 创建函数，通过 globalThis.__createResponsiveMock 注册。
 * 支持桌面端和移动端两种默认预设，以及自定义 overrides。
 *
 * @example
 * ```ts
 * // 可变对象（配合 vi.hoisted 使用）
 * const mockResponsive = vi.hoisted(() => globalThis.__createResponsiveMock());
 * vi.mock('@/hooks/useResponsive', () => ({ useResponsive: () => mockResponsive }));
 *
 * // 自定义初始值
 * const mockMobile = vi.hoisted(() => globalThis.__createResponsiveMock({ isMobile: true }));
 * ```
 */

/**
 * 创建 useResponsive mock 返回的可变状态对象
 * @param overrides 可选的字段覆盖
 * @returns 包含 layoutMode、width、height、isMobile、isCompact、isCompressed、isDesktop 的可变对象
 */
export function createResponsiveMock(overrides?: Record<string, unknown>) {
  return {
    layoutMode: 'desktop' as string,
    width: 1280,
    height: 800,
    isMobile: false,
    isCompact: false,
    isCompressed: false,
    isDesktop: true,
    ...overrides,
  };
}
