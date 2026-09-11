/**
 * useTheme 主题组合式函数测试
 *
 * 验证主题切换即时生效（.dark 类）、localStorage 持久化、刷新后保持。
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTheme, type Theme } from '@/composables/useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('默认跟随系统，setTheme(dark) 即时生效并持久化', () => {
    const { theme, setTheme } = useTheme();

    expect(theme.value).toBe('system');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    setTheme('dark');

    expect(theme.value).toBe<Theme>('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('multi-chat-theme')).toBe('dark');
  });

  it('setTheme(light) 移除 .dark 类', () => {
    const { setTheme } = useTheme();

    // 显式建立起始状态（模块级单例跨用例共享，setTheme 为同值时不触发 watcher）
    setTheme('light');
    setTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    setTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('multi-chat-theme')).toBe('light');
  });

  it('切换回 system 时按系统偏好应用', () => {
    const { setTheme } = useTheme();

    // happy-dom 默认 prefers-color-scheme: light
    vi.stubGlobal('matchMedia', window.matchMedia);

    setTheme('dark');
    setTheme('system');

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
