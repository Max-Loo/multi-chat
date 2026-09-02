/**
 * 主题系统 Composable（对应原 next-themes 方案）
 *
 * 兼容性约定（与迁移前 next-themes 默认行为对齐）：
 * - localStorage 键：`theme`
 * - 取值：`light` / `dark` / `system`（存储与读取均兼容）
 * - 策略：class 策略，切换时在 <html> 根元素上添加/移除 `dark` 类
 */
import { useDark, useToggle } from "@vueuse/core";
import { computed } from "vue";

/** 与 next-themes 默认一致的 localStorage 键 */
export const THEME_STORAGE_KEY = "theme";

/** 当前是否为深色主题（响应式；`system` 取值时跟随系统） */
const isDark = useDark({
  selector: "html",
  attribute: "class",
  valueDark: "dark",
  valueLight: "light",
  storageKey: THEME_STORAGE_KEY,
  // 存储层兼容 next-themes 的三值语义：system 映射为跟随系统
  storage: {
    getItem(key) {
      try {
        const raw = localStorage.getItem(key);
        // next-themes 的 'system' 与 useDark 的 'auto' 语义相同
        if (raw === "system") return "auto";
        return raw ?? "auto";
      } catch {
        return "auto";
      }
    },
    setItem(key, value) {
      try {
        // 统一写回 next-themes 的三值语义
        localStorage.setItem(key, value === "auto" ? "system" : value);
      } catch {
        // 存储失败时忽略（内存态仍然生效）
      }
    },
    removeItem(key) {
      try {
        localStorage.removeItem(key);
      } catch {
        // 移除失败时忽略
      }
    },
  },
});

/** 切换深浅色（返回切换函数） */
const toggleDark = useToggle(isDark);

/**
 * 当前主题偏好（light / dark / system 三值语义，响应式只读）
 */
const theme = computed<"light" | "dark" | "system">(() => {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === "light" || raw === "dark") return raw;
    return "system";
  } catch {
    return "system";
  }
});

/**
 * 设置主题偏好
 * @param value 目标主题（light / dark / system）
 */
function setTheme(value: "light" | "dark" | "system"): void {
  if (value === "system") {
    // 跟随系统：写入 system 并按当前系统偏好应用
    localStorage.setItem(THEME_STORAGE_KEY, "system");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    isDark.value = prefersDark;
    return;
  }
  isDark.value = value === "dark";
}

export function useThemeManager() {
  return {
    isDark,
    toggleDark,
    theme,
    setTheme,
  };
}
