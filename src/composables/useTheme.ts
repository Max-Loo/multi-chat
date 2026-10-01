/**
 * 主题管理 Vue 组合式函数
 *
 * 职责：
 * - dark class 策略：在 <html> 上切换 .dark class（配合 main.css 的 @custom-variant dark）
 * - localStorage 持久化：存储键 multi-chat-theme
 * - 系统偏好跟随：theme 为 'system' 时跟随 prefers-color-scheme 并监听变化
 *
 * 模块级单例状态：所有组件共享同一主题状态。
 */
import { ref, computed, type Ref, type ComputedRef } from 'vue';

/** 主题取值 */
export type Theme = 'light' | 'dark' | 'system';

/** localStorage 存储键（沿用 multi-chat- 前缀约定） */
export const THEME_STORAGE_KEY = 'multi-chat-theme';

/** 从 localStorage 读取持久化主题（非法值降级为 'system'） */
const readStoredTheme = (): Theme => {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') {
      return value;
    }
  } catch {
    // localStorage 不可用时降级
  }
  return 'system';
};

/** 全局共享的主题状态（模块级单例） */
const theme = ref<Theme>(readStoredTheme());

/** 系统当前是否偏好深色 */
const mediaQuery =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;
const systemPrefersDark = ref<boolean>(mediaQuery?.matches ?? false);

// 系统偏好变化监听（模块级只挂载一次）
if (mediaQuery) {
  mediaQuery.addEventListener('change', (event) => {
    systemPrefersDark.value = event.matches;
    applyTheme();
  });
}

/** 根据主题取值解析实际是否深色 */
const resolveDark = (value: Theme): boolean => {
  return value === 'dark' || (value === 'system' && systemPrefersDark.value);
};

/** 将当前主题应用到 <html> 的 dark class */
const applyTheme = (): void => {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', resolveDark(theme.value));
};

/** useTheme 返回值 */
export interface UseThemeResult {
  /** 当前主题取值（'light' | 'dark' | 'system'） */
  theme: Ref<Theme>;
  /** 实际是否为深色（'system' 时随系统偏好变化） */
  isDark: ComputedRef<boolean>;
  /** 设置主题并持久化 */
  setTheme: (value: Theme) => void;
}

/**
 * Vue 组合式函数：获取/设置应用主题
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useTheme } from '@/composables/useTheme';
 * const { theme, isDark, setTheme } = useTheme();
 * </script>
 *
 * <template>
 *   <button @click="setTheme(isDark ? 'light' : 'dark')">
 *     {{ isDark ? '切浅色' : '切深色' }}
 *   </button>
 * </template>
 * ```
 */
export const useTheme = (): UseThemeResult => {
  const isDark = computed(() => resolveDark(theme.value));

  const setTheme = (value: Theme): void => {
    theme.value = value;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, value);
    } catch {
      // 持久化失败不阻断切换（本次会话仍生效）
    }
    applyTheme();
  };

  // 首次调用时同步一次 DOM 状态（幂等）
  applyTheme();

  return { theme, isDark, setTheme };
};
