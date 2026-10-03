/**
 * useDark 主题切换组合式函数测试
 *
 * 验证与迁移前 next-themes 对齐的关键行为：
 * - localStorage 键为 "theme"（VueUse 存储模式值：dark/light/auto）
 * - class 策略：在 html 元素上添加/移除 "dark" 类（与 main.css 的 @custom-variant dark 一致）
 * - 切换后刷新（重新初始化）主题偏好保持
 *
 * 注意：@vueuse/core 的 useDark 在 nextTick 后同步 class 与存储（异步写入）
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { nextTick } from 'vue';
import { useDark } from '@/composables/useDark';

describe('useDark', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(async () => {
    // 恢复到亮色并清理存储，避免影响后续测试
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('切换到暗色后应该在 html 上添加 dark 类并持久化到 theme 键', async () => {
    const { isDark, toggleDark } = useDark();

    toggleDark();
    await nextTick();

    expect(isDark.value).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('从暗色切回亮色后应该移除 dark 类', async () => {
    const { isDark, toggleDark } = useDark();

    toggleDark();
    await nextTick();
    expect(isDark.value).toBe(true);

    toggleDark();
    await nextTick();

    expect(isDark.value).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    // 亮色模式下存储值不应是 dark（VueUse 为 auto/light 语义）
    expect(localStorage.getItem('theme')).not.toBe('dark');
  });

  it('刷新后（重新调用 useDark）暗色偏好应该保持', async () => {
    // 模拟已持久化的暗色偏好
    localStorage.setItem('theme', 'dark');

    const { isDark } = useDark();

    expect(isDark.value).toBe(true);
  });

  it('isDark 应该是响应式的（同一实例内同步更新）', () => {
    const { isDark, toggleDark } = useDark();

    expect(isDark.value).toBe(false);
    toggleDark();
    expect(isDark.value).toBe(true);
    toggleDark();
    expect(isDark.value).toBe(false);
  });
});
