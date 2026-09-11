import { ref, watch } from 'vue';

/** 主题模式 */
export type Theme = 'light' | 'dark' | 'system';

/** localStorage 存储键 */
const THEME_STORAGE_KEY = 'multi-chat-theme';

/** 系统深色偏好媒体查询 */
const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)';

/** 主题响应式单例（跨组件共享） */
const theme = ref<Theme>(readStoredTheme());

/** 读取持久化的主题设置，缺省跟随系统 */
function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // localStorage 不可用时降级为跟随系统
  }
  return 'system';
}

/** 解析实际生效的主题（system 时按系统偏好） */
function resolveTheme(mode: Theme): 'light' | 'dark' {
  if (mode !== 'system') {
    return mode;
  }
  return window.matchMedia(SYSTEM_DARK_QUERY).matches ? 'dark' : 'light';
}

/** 将实际主题应用到文档根元素（Tailwind .dark 类策略） */
function applyTheme(mode: Theme): void {
  const resolved = resolveTheme(mode);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

/** 系统深色偏好变化监听（仅 system 模式需要响应） */
const mediaQuery = window.matchMedia(SYSTEM_DARK_QUERY);
mediaQuery.addEventListener('change', () => {
  if (theme.value === 'system') {
    applyTheme('system');
  }
});

// 初始化即应用一次
applyTheme(theme.value);

// 主题变化时同步 DOM 与持久化（flush: sync 保证 setTheme 后 DOM 立即生效）
watch(
  theme,
  (value) => {
    applyTheme(value);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, value);
    } catch (error) {
      console.warn('[ThemePersistence] 持久化失败:', error);
    }
  },
  { flush: 'sync' },
);

/**
 * 主题组合式函数（替代 next-themes）
 *
 * 支持明/暗/跟随系统三种模式，持久化到 localStorage，
 * 并将实际主题以 .dark 类形式应用到 documentElement（配合 Tailwind dark 变体）。
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useTheme } from '@/composables/useTheme';
 * const { theme, setTheme } = useTheme();
 * setTheme('dark');
 * </script>
 * ```
 */
export function useTheme() {
  return {
    /** 当前主题模式 */
    theme,
    /** 实际生效的主题（解析 system 后） */
    resolvedTheme: () => resolveTheme(theme.value),
    /** 设置主题模式（light | dark | system），即时生效并持久化 */
    setTheme: (value: Theme) => {
      theme.value = value;
    },
  };
}
