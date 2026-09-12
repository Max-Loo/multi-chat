/**
 * Vue useNavigateToExternalSite 组合式函数测试
 *
 * 行为基线与迁移前 React 版一致：新标签页打开外部链接（noopener,noreferrer）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useNavigateToExternalSite } from '@/composables/useNavigateToExternalSite';

describe('useNavigateToExternalSite（Vue 版）', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('以新标签页与安全参数打开外部链接', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    const { navToExternalSite } = useNavigateToExternalSite();
    navToExternalSite('https://example.com');

    expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
  });
});
