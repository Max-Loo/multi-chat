/**
 * ToasterWrapper 组件测试
 *
 * 验证 isMobile 同步到 toastQueue 与就绪标记行为
 * 转写自 React ToasterWrapper 测试，行为断言保持一致
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/vue';

const { mockToastQueue, mockMatchMedia } = vi.hoisted(() => ({
  mockToastQueue: {
    setIsMobile: vi.fn(),
    markReady: vi.fn(),
  },
  mockMatchMedia: vi.fn(),
}));

vi.mock('@/services/toast/toastQueue', () => ({
  toastQueue: mockToastQueue,
}));

// 用可控的 matchMedia 模拟断点（useResponsive 内部使用 @vueuse/core 的 useMediaQuery）
vi.stubGlobal('matchMedia', mockMatchMedia);

import ToasterWrapper from '@/services/toast/ToasterWrapper.vue';

/**
 * 配置 matchMedia mock 的返回
 * @param matchesMax767 是否匹配 max-width: 767px
 */
function setupMatchMedia(matchesMax767: boolean): void {
  mockMatchMedia.mockImplementation((query: string) => ({
    matches: query === '(max-width: 767px)' ? matchesMax767 : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe('ToasterWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('桌面视口下应该同步 isMobile=false 并标记就绪', async () => {
    setupMatchMedia(false);

    render(ToasterWrapper);

    await vi.waitFor(() => {
      expect(mockToastQueue.setIsMobile).toHaveBeenCalledWith(false);
      expect(mockToastQueue.markReady).toHaveBeenCalled();
    });
  });

  it('移动视口下应该同步 isMobile=true 并标记就绪', async () => {
    setupMatchMedia(true);

    render(ToasterWrapper);

    await vi.waitFor(() => {
      expect(mockToastQueue.setIsMobile).toHaveBeenCalledWith(true);
      expect(mockToastQueue.markReady).toHaveBeenCalled();
    });
  });

  it('视口变化时应该更新 isMobile 同步', async () => {
    setupMatchMedia(false);

    const { rerender } = render(ToasterWrapper);

    await vi.waitFor(() => {
      expect(mockToastQueue.setIsMobile).toHaveBeenCalledWith(false);
    });

    // 修改断点匹配并触发监听器
    const listeners: Array<() => void> = {};
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: query === '(max-width: 767px)',
      media: query,
      addEventListener: (_type: string, listener: () => void) => {
        listeners[query] = listener;
      },
      removeEventListener: vi.fn(),
    }));

    await rerender({});

    // 模拟视口跨过移动端断点
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    listeners['(max-width: 767px)']?.();

    await vi.waitFor(() => {
      expect(mockToastQueue.setIsMobile).toHaveBeenLastCalledWith(false);
    });
  });
});
