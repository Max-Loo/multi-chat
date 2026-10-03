import { useDark as useVueUseDark, useToggle } from '@vueuse/core';

/**
 * 主题切换组合式函数
 *
 * 对齐迁移前 next-themes 的行为：
 * - localStorage 键为 "theme"（next-themes 默认键）
 * - class 策略：在 html 元素上添加/移除 "dark" 类（与 main.css 的 @custom-variant dark 一致）
 *
 * @returns {isDark} 当前是否为暗色主题（响应式）
 * @returns {toggleDark} 切换亮/暗主题
 */
export function useDark() {
  // 对齐 next-themes：存储键 "theme"，dark 类添加到 html，亮色时无类
  const isDark = useVueUseDark({
    selector: 'html',
    attribute: 'class',
    valueDark: 'dark',
    valueLight: '',
    storageKey: 'theme',
  });

  const toggleDark = useToggle(isDark);

  return {
    isDark,
    toggleDark,
  };
}
