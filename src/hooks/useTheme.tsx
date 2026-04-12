import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { LOCAL_STORAGE_THEME_KEY, resolveIsDark } from "@/utils/constants";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/**
 * 主题类型
 */
export type Theme = "light" | "dark" | "system";

/**
 * 主题上下文值类型
 */
interface ThemeContextValue {
  /** 用户设置的主题（light/dark/system） */
  theme: Theme;
  /** 设置主题 */
  setTheme: (theme: Theme) => void;
  /** 实际生效的主题（light/dark） */
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "light",
});

/**
 * 主题管理 Provider
 * 基于 React Context，管理 .dark class 切换、localStorage 持久化和系统偏好监听
 */
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(LOCAL_STORAGE_THEME_KEY) as Theme) || "system",
  );

  /**
   * 复用 useMediaQuery 监听系统暗色偏好，自带节流优化
   * 仅在 theme === "system" 时监听才生效（resolvedTheme 依赖 systemIsDark）
   */
  const systemIsDark = useMediaQuery("(prefers-color-scheme: dark)", false);

  useEffect(() => {
    const isDark = resolveIsDark(theme, systemIsDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, [theme, systemIsDark]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
  }, [theme]);

  const resolvedTheme = useMemo<"light" | "dark">(
    () => (resolveIsDark(theme, systemIsDark) ? "dark" : "light"),
    [theme, systemIsDark],
  );

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * 主题 Hook
 * 返回当前主题状态和设置函数
 */
export const useTheme = () => useContext(ThemeContext);
