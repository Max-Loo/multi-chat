## Context

项目基于 Tauri + React + TypeScript，使用 Tailwind CSS v4 和 shadcn/ui 组件库。`main.css` 已包含 shadcn/ui 生成的完整暗色模式基础设施：

- `@custom-variant dark (&:is(.dark *))` — 暗色变体规则
- `:root { --background: oklch(1 0 0); ... }` — 亮色语义变量（约 30 个 token）
- `.dark { --background: oklch(0.145 0 0); ... }` — 暗色语义变量（约 30 个 token）
- `@theme inline { --color-background: var(--background); ... }` — CSS 变量到 Tailwind 工具类的映射

但业务代码中存在约 50 处硬编码色值（`bg-white`、`border-gray-200`、`bg-blue-100!` 等），分布在约 20 个源文件中，绕过了这套变量体系。且缺少主题切换机制，需要自建。

## Goals / Non-Goals

**Goals:**

- 实现自定义 `useTheme` Hook，管理 `.dark` class 切换，支持用户手动选择和系统偏好跟随
- 将所有硬编码色值迁移到 shadcn/ui 语义变量，使暗色模式在所有页面生效
- 导航主题色在暗色模式下保持品牌识别度但不刺眼
- 主题偏好持久化到 localStorage，重启后恢复
- 不引入任何新的外部依赖

**Non-Goals:**

- 不实现自定义主题编辑或多主题切换（仅 light/dark/system）
- 不修改 shadcn/ui 基础组件（`src/components/ui/`）的内部实现
- 不调整暗色模式下的 OKLCH 色值本身（使用 shadcn/ui 默认值，后续按需微调）
- 不处理 Markdown 渲染中代码块的语法高亮主题（后续独立处理）

## Decisions

### 决策 1：基于 Context 的 useTheme Hook

**选择**：使用 React Context + 自定义 Hook 模式，确保多组件间主题状态共享

**替代方案**：
- `next-themes`：已在 `remove-next-themes` 变更中决定移除
- Redux 管理主题状态：主题是 UI 层面关注点，不需要全局状态管理的复杂性
- 纯 Hook（无 Context）：多个组件独立调用 `useTheme()` 时各持有独立的 `useState`，主题切换后其他组件的 `theme`/`resolvedTheme` 不会更新，且 localStorage 可能被过时状态覆盖

**理由**：Context 模式约 50 行代码，单一状态源，所有消费组件自动响应变化。与项目已有的 `<Provider>` 模式一致。项目是 Tauri 桌面应用，不需要 SSR 兼容。

**实现要点**：

```typescript
// src/hooks/useTheme.tsx
type Theme = "light" | "dark" | "system";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "light",
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("multi-chat-theme") as Theme) || "system"
  );

  // 追踪系统偏好状态，确保 resolvedTheme 响应实时变化
  const [systemIsDark, setSystemIsDark] = useState(
    () => matchMedia("(prefers-color-scheme: dark)").matches
  );

  // 监听 theme 变化，同步到 DOM 和 localStorage
  useEffect(() => {
    const isDark = theme === "dark" ||
      (theme === "system" && systemIsDark);
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("multi-chat-theme", theme);
  }, [theme, systemIsDark]);

  // 监听系统偏好变化（仅 system 模式下响应）
  useEffect(() => {
    if (theme !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    // 切回 system 模式时同步刷新系统偏好状态
    setSystemIsDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle("dark", e.matches);
      setSystemIsDark(e.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  // 导出 resolvedTheme 供组件使用（如条件渲染）
  const resolvedTheme = useMemo(() => {
    if (theme !== "system") return theme;
    return systemIsDark ? "dark" : "light";
  }, [theme, systemIsDark]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
```

- `ThemeProvider` 在 `MainApp.tsx` 中包裹组件树，提供单一状态源
- `useTheme()` 供任意消费组件调用（如 `ThemeSetting`），所有消费者共享同一份状态
- localStorage key: `multi-chat-theme`（与项目命名规范一致）
- `.dark` class 切换在 `<html>` 元素上（与 `@custom-variant dark` 一致）
- 初始化时立即读取 localStorage 并应用，避免闪烁
- 系统偏好通过 `matchMedia("(prefers-color-scheme: dark)")` 监听
- 切回 `system` 模式时同步刷新 `systemIsDark`，避免过期值

### 决策 2：初始化时机

**选择**：在 `main.tsx` 中以同步脚本方式初始化主题，避免页面闪烁

**理由**：主题必须在 React 渲染之前就确定，否则会出现白屏闪烁。在 `main.tsx` 中、React DOM 渲染之前，同步读取 localStorage 并设置 `.dark` class：

```typescript
// main.tsx 中的同步初始化（在 ReactDOM.createRoot 之前）
const savedTheme = localStorage.getItem("multi-chat-theme");
const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
const isDark = savedTheme === "dark" || (!savedTheme && prefersDark) || (savedTheme === "system" && prefersDark);
document.documentElement.classList.toggle("dark", isDark);
```

`ThemeProvider` 在 `MainApp.tsx` 中包裹组件树，负责后续的切换和监听。`useTheme()` 供任意消费组件调用。初始化在 `main.tsx` 中完成，确保首次渲染即正确。

### 决策 3：硬编码色值映射策略

**选择**：直接映射到已有 shadcn/ui 语义变量

**映射表**：

| 硬编码 | 语义变量 | 用途 |
|--------|----------|------|
| `bg-white` | `bg-background` | 页面/容器背景 |
| `bg-gray-50` | `bg-sidebar` | 侧边栏背景 |
| `bg-gray-100` | `bg-muted` | 次级背景/气泡 |
| `bg-gray-200` | `bg-accent`（选中态）或 `bg-muted`（次级背景） | 需按语义逐个确认 |
| `bg-gray-900` | `bg-primary` | 主操作按钮 |
| `text-white` (按钮) | `text-primary-foreground` | 按钮文字 |
| `text-gray-800` | `text-foreground` | 主文字 |
| `text-gray-500` | `text-muted-foreground` | 次要文字 |
| `text-gray-400` | `text-muted-foreground` | 占位符/图标 |
| `text-gray-700` | `text-foreground` | 深灰文字（图标/正文） |
| `border-gray-200` | `border-border` | 标准边框 |
| `border-gray-300` | `border-border` | 标准边框 |
| `border-gray-300`（spinner） | `border-muted` | 加载动画边框（需与高亮边有明显对比） |
| `border-t-gray-600`（分隔线） | `border-t-border/50` | 输入区域顶部分隔线（半透明） |
| `border-t-gray-600`（spinner） | `border-t-foreground/50` | 加载动画高亮边（需在暗色模式下保持可见对比） |
| `bg-white`（spinner 中心方块） | `bg-primary-foreground` | 加载动画中心指示点（跟随按钮前景色） |
| `hover:bg-gray-800` | `hover:bg-primary/90` | 主按钮悬停态 |
| `hover:border-gray-400` | `hover:border-border` | 输入框悬停态边框 |
| `hover:text-gray-700` | `hover:text-foreground` | 输入框悬停态文字 |
| `bg-orange-500` | `bg-orange-500 dark:bg-orange-600` | 强调标签（保留原色，暗色微调） |

**理由**：这些变量在 `:root` 和 `.dark` 中都有对应值，切换主题时自动生效，无需写 `dark:` 前缀。

### 决策 4：导航主题色使用自定义 CSS 变量

**选择**：新增导航专属 CSS 变量，在 `@theme inline` 中注册

**新增变量**：

```css
:root {
  --nav-chat: oklch(0.709 0.165 259);
  --nav-chat-muted: oklch(0.929 0.045 256);
  --nav-model: oklch(0.765 0.177 163);
  --nav-model-muted: oklch(0.950 0.052 163);
  --nav-setting: oklch(0.711 0.183 293);
  --nav-setting-muted: oklch(0.943 0.029 294);
}
.dark {
  --nav-chat: oklch(0.623 0.180 259);
  --nav-chat-muted: oklch(0.22 0.05 256);
  --nav-model: oklch(0.696 0.15 163);
  --nav-model-muted: oklch(0.22 0.05 163);
  --nav-setting: oklch(0.653 0.2 293);
  --nav-setting-muted: oklch(0.22 0.05 294);
}
@theme inline {
  --color-nav-chat: var(--nav-chat);
  --color-nav-chat-muted: var(--nav-chat-muted);
  --color-nav-model: var(--nav-model);
  --color-nav-model-muted: var(--nav-model-muted);
  --color-nav-setting: var(--nav-setting);
  --color-nav-setting-muted: var(--nav-setting-muted);
}
```

**替代方案**：
- 继续用 `blue-*`/`emerald-*`/`violet-*` + `dark:` 前缀：需要在每个使用处写两套样式
- 用 Tailwind 内置色阶 + `dark:` 变体：同样冗余

**理由**：CSS 变量方案一次定义、全局生效，消除了 `!important`，与 shadcn/ui 的设计模式一致。暗色模式下通过降低亮度和饱和度保证可读性。

### 决策 5：主题切换 UI 放在设置页

**选择**：在 `GeneralSetting` 组件中新增 `ThemeSetting` 子组件，使用 shadcn/ui Select

**理由**：与语言、自动命名等设置放在一起，保持一致性。设置页是用户寻找偏好配置的自然位置。

## Risks / Trade-offs

- **Tauri webview 的 `prefers-color-scheme` 支持**: Tauri 的 webview 可能无法正确检测系统暗色偏好 → 降级为默认浅色主题，用户可在设置中手动切换
- **批量替换可能遗漏**: 约 50 处硬编码分布在约 20 个源文件中 → 使用 Grep 工具验证替换完整性
- **暗色模式下的视觉微调**: shadcn/ui 默认暗色值可能在某些组件上不够理想 → 本阶段先确保功能可用，视觉微调后续迭代
- **导航色值需要实际验证**: OKLCH 值是从 Tailwind 色阶近似转换，实际渲染效果需在暗色模式下目视确认 → 设计文档中标注为"待验证"
