/**
 * useResponsive Mock 工厂（Vue 版）
 *
 * 提供统一的 useResponsive mock 创建函数，通过 globalThis.__createResponsiveMock 注册。
 * 返回与真实 useResponsive 相同的形状（Ref/ComputedRef），支持通过 __set 动态切换布局。
 *
 * @example
 * ```ts
 * const mockResponsive = vi.hoisted(() => globalThis.__createResponsiveMock());
 * vi.mock('@/composables/useResponsive', () => ({
 *   useResponsive: () => mockResponsive,
 * }));
 * // 测试中动态切换：
 * mockResponsive.__set({ isMobile: true, layoutMode: 'mobile' });
 * ```
 */

import { computed, ref } from 'vue';

/** 内部可变状态形状 */
export interface ResponsiveMockState {
  layoutMode: string;
  width: number;
  height: number;
  isMobile: boolean;
  isCompact: boolean;
  isCompressed: boolean;
  isDesktop: boolean;
}

/** 桌面端默认预设 */
const DESKTOP_DEFAULT: ResponsiveMockState = {
  layoutMode: 'desktop',
  width: 1280,
  height: 800,
  isMobile: false,
  isCompact: false,
  isCompressed: false,
  isDesktop: true,
};

/**
 * 创建 useResponsive mock（返回 Ref 形状，与真实实现一致）
 * @param overrides 可选的字段覆盖
 * @returns 含 Ref 字段的 mock 对象与 __set 切换方法
 */
export function createResponsiveMock(overrides?: Partial<ResponsiveMockState>) {
  const isMobile = ref(DESKTOP_DEFAULT.isMobile);
  const isCompact = ref(DESKTOP_DEFAULT.isCompact);
  const isCompressed = ref(DESKTOP_DEFAULT.isCompressed);
  const isDesktop = ref(DESKTOP_DEFAULT.isDesktop);
  const layoutMode = computed(() =>
    isMobile.value
      ? 'mobile'
      : isCompact.value
        ? 'compact'
        : isCompressed.value
          ? 'compressed'
          : 'desktop',
  );

  // 应用初始覆盖
  if (overrides) {
    applyOverrides(overrides);
  }

  function applyOverrides(patch: Partial<ResponsiveMockState>): void {
    if (patch.isMobile !== undefined) isMobile.value = patch.isMobile;
    if (patch.isCompact !== undefined) isCompact.value = patch.isCompact;
    if (patch.isCompressed !== undefined)
      isCompressed.value = patch.isCompressed;
    if (patch.isDesktop !== undefined) isDesktop.value = patch.isDesktop;
    // layoutMode 未显式提供时由各 ref 派生
  }

  return {
    layoutMode,
    width: DESKTOP_DEFAULT.width,
    height: DESKTOP_DEFAULT.height,
    isMobile,
    isCompact,
    isCompressed,
    isDesktop,
    /** 动态切换布局状态（layoutMode 自动派生） */
    __set(patch: Partial<ResponsiveMockState>): void {
      applyOverrides(patch);
    },
    /** 复位为桌面端默认 */
    __reset(): void {
      applyOverrides(DESKTOP_DEFAULT);
    },
  };
}

// 导出预设，供测试直接使用
export const responsivePresets = {
  desktop: { isMobile: false, isCompact: false, isCompressed: false, isDesktop: true },
  compact: { isMobile: false, isCompact: true, isCompressed: false, isDesktop: false },
  compressed: { isMobile: false, isCompact: false, isCompressed: true, isDesktop: false },
  mobile: { isMobile: true, isCompact: false, isCompressed: false, isDesktop: false },
} as const;
