/**
 * useTheme 组合式函数测试
 *
 * 覆盖：dark class 策略、localStorage 持久化、系统偏好跟随、跨实例状态共享
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { THEME_STORAGE_KEY, type Theme } from '@/composables/useTheme';

/** 构造可控制的 matchMedia stub */
const stubMatchMedia = (initialDark: boolean) => {
  const listeners = new Set<(event: { matches: boolean }) => void>();
  const mql = {
    matches: initialDark,
    addEventListener: (_: string, listener: (event: { matches: boolean }) => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: (event: { matches: boolean }) => void) =>
      listeners.delete(listener),
  };
  vi.stubGlobal('matchMedia', vi.fn(() => mql));
  return {
    /** 模拟系统偏好变化 */
    emit(matches: boolean) {
      mql.matches = matches;
      listeners.forEach((listener) => listener({ matches }));
    },
  };
};

describe('useTheme', () => {
  let system: ReturnType<typeof stubMatchMedia>;

  beforeEach(() => {
    localStorage.clear();
    // 默认模拟系统偏好：深色
    system = stubMatchMedia(true);
    document.documentElement.classList.remove('dark');
    // 每个用例重新加载模块，保证单例状态干净
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('无持久化记录时默认为 system 主题', async () => {
    const { theme, isDark } = await import('@/composables/useTheme').then((m) => m.useTheme());

    expect(theme.value).toBe('system');
    // 系统偏好为深色 → isDark 为 true
    expect(isDark.value).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('setTheme("dark") 应添加 dark class 并持久化', async () => {
    const { setTheme } = await import('@/composables/useTheme').then((m) => m.useTheme());

    setTheme('dark');

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('setTheme("light") 应移除 dark class 并持久化', async () => {
    const { setTheme } = await import('@/composables/useTheme').then((m) => m.useTheme());

    setTheme('light');

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('system 主题应跟随系统偏好变化', async () => {
    // 系统初始为浅色
    system = stubMatchMedia(false);
    const { setTheme, isDark } = await import('@/composables/useTheme').then((m) => m.useTheme());

    setTheme('system');
    expect(isDark.value).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // 系统偏好切换为深色 → isDark 与 DOM 同步更新
    system.emit(true);
    expect(isDark.value).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('非法持久化值应降级为 system', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'not-a-theme');

    const { theme } = await import('@/composables/useTheme').then((m) => m.useTheme());

    expect(theme.value).toBe('system');
  });

  it('跨实例应共享同一主题状态', async () => {
    const mod = await import('@/composables/useTheme');
    const a = mod.useTheme();
    const b = mod.useTheme();

    a.setTheme('light');

    expect(b.theme.value).toBe('light');
    expect(b.isDark.value).toBe(false);
  });

  it('持久化读取应遵循既有存储键', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    const mod = await import('@/composables/useTheme');
    expect(mod.THEME_STORAGE_KEY).toBe('multi-chat-theme');

    const { theme } = mod.useTheme();
    expect(theme.value as Theme).toBe('dark');
  });
});
