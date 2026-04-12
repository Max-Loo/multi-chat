## 1. CSS 变量与基础设施

- [x] 1.1 在 `main.css` 的 `:root` 中新增 6 个导航主题色变量（`--nav-chat`、`--nav-chat-muted`、`--nav-model`、`--nav-model-muted`、`--nav-setting`、`--nav-setting-muted`）
- [x] 1.2 在 `main.css` 的 `.dark` 中新增对应的 6 个暗色值
- [x] 1.3 在 `main.css` 的 `@theme inline` 中注册 6 个 Tailwind 颜色 token（`--color-nav-chat` 等）

## 2. 自定义 useTheme Hook

- [x] 2.1 创建 `src/hooks/useTheme.ts`，实现 `ThemeProvider`（基于 React Context）和 `useTheme` Hook，管理主题状态（localStorage 持久化、`.dark` class 切换、系统偏好监听、所有消费者共享单一状态源）
- [x] 2.2 在 `main.tsx` 中 React 渲染之前添加同步初始化脚本，读取 localStorage 并设置 `.dark` class，避免闪烁
- [x] 2.3 在 `MainApp.tsx` 中用 `<ThemeProvider>` 包裹组件树，确保所有子组件可通过 `useTheme()` 访问共享主题状态
- [x] 2.4 更新 `src/components/ui/sonner.tsx`，接入自定义 `useTheme` Hook 的 `resolvedTheme`（`remove-next-themes` 变更已完成，sonner.tsx 当前使用 DOM 检测，改用 Hook 可统一主题状态消费方式）

## 3. 导航主题色迁移

- [x] 3.1 重写 `src/config/navigation.tsx` 中的 theme 配置，将 `blue-*`/`emerald-*`/`violet-*` 硬编码替换为 CSS 变量工具类（`text-nav-chat`、`bg-nav-chat-muted` 等）
- [x] 3.2 移除所有导航样式中的 `!important` 标记

## 4. 基础框架色值迁移

- [x] 4.1 `src/components/Layout/index.tsx`：`bg-white` → `bg-background`
- [x] 4.2 `src/components/Sidebar/index.tsx`：`bg-gray-50` → `bg-sidebar`，`border-gray-200` → `border-border`
- [x] 4.3 `src/components/Skeleton/PageSkeleton.tsx`：`bg-gray-50` → `bg-sidebar`，`bg-white` → `bg-background`，`border-gray-200` → `border-border`
- [x] 4.4 `src/main.tsx`：初始化错误重试按钮的 `text-white` → `text-primary-foreground`

## 5. 聊天页面色值迁移

- [x] 5.1 `src/pages/Chat/index.tsx`：`border-gray-200` → `border-border`
- [x] 5.2 `src/pages/Chat/components/Panel/Header.tsx`：`border-gray-200` → `border-border`
- [x] 5.3 `src/pages/Chat/components/Panel/Sender.tsx`：`bg-gray-900` → `bg-primary`，`text-white` → `text-primary-foreground`，`hover:bg-gray-800` → `hover:bg-primary/90`；spinner 部分：`border-gray-300` → `border-muted`，`border-t-gray-600` → `border-t-foreground/50`，`bg-white`（中心方块）→ `bg-primary-foreground`；输入框部分：`text-gray-500` → `text-muted-foreground`，`bg-white` → 需逐个验证语义（`bg-background` 或 `bg-card`），`border-gray-300` → `border-border`，`hover:border-gray-400` → `hover:border-border`，`hover:text-gray-700` → `hover:text-foreground`
- [x] 5.4 `src/pages/Chat/components/Panel/Detail/index.tsx`：`bg-gray-900` → `bg-primary`，`text-white` → `text-primary-foreground`，`hover:bg-gray-800` → `hover:bg-primary/90`；spinner 部分：`border-gray-300` → `border-muted`，`border-t-gray-600` → `border-t-foreground/50`，`bg-white` → `bg-primary-foreground`；`text-gray-700` → `text-foreground`，其余 `bg-white` → 需逐个验证语义（`bg-background` 或 `bg-card`）
- [x] 5.5 `src/pages/Chat/components/Panel/Grid.tsx`：`border-gray-300` → `border-border`
- [x] 5.6 `src/pages/Chat/components/Sidebar/index.tsx`：`border-gray-100` → `border-border`
- [x] 5.7 `src/components/chat/ChatBubble.tsx`：`bg-gray-100` → `bg-muted`，`text-gray-800` → `text-foreground`
- [x] 5.8 `src/components/chat/ThinkingSection.tsx`：`border-gray-300` → `border-border`，`text-sm text-muted-foreground` 验证已正确

## 6. 设置页面色值迁移

- [x] 6.1 `src/pages/Setting/index.tsx`：`border-gray-200` → `border-border`
- [x] 6.2 `src/pages/Setting/components/SettingHeader.tsx`：`bg-white` → `bg-background`，`border-gray-200` → `border-border`
- [x] 6.3 `src/pages/Setting/components/GeneralSetting/index.tsx`：`bg-gray-100` → `bg-muted`，`bg-white` → `bg-card`
- [x] 6.4 `src/pages/Setting/components/GeneralSetting/components/AutoNamingSetting.tsx`：`text-gray-500` → `text-muted-foreground`
- [x] 6.5 `src/pages/Setting/components/ToastTest/index.tsx`：`bg-gray-100` → `bg-muted`，`bg-white` → `bg-card`

## 7. 模型页面色值迁移

- [x] 7.1 `src/pages/Model/CreateModel/index.tsx`：`border-gray-200` → `border-border`
- [x] 7.2 `src/pages/Model/CreateModel/components/ModelSidebar.tsx`：`border-gray-300` → `border-border`，`bg-gray-200` → `bg-accent`（需验证语义：选中态用 `bg-accent`，普通次级背景用 `bg-muted`）
- [x] 7.3 `src/pages/Model/CreateModel/components/ModelHeader.tsx`：`bg-white` → `bg-background`，`border-gray-200` → `border-border`
- [x] 7.4 `src/pages/Model/components/ModelSelect.tsx`：`border-gray-200` → `border-border`，`border-gray-300` → `border-border`
- [x] 7.5 `src/pages/Model/ModelTable/index.tsx`：`text-white` → `text-primary-foreground`

## 8. 其他组件色值迁移

- [x] 8.1 `src/components/ProviderLogo/index.tsx`：`bg-gray-100` → `bg-muted`
- [x] 8.2 `src/components/FilterInput/index.tsx`：`text-gray-400` → `text-muted-foreground`
- [x] 8.3 `src/pages/Chat/components/Panel/Detail/Title.tsx`：`bg-orange-500` → 补充 `dark:bg-orange-600` 前缀（保留橙色强调语义，仅微调暗色模式下的亮度）
- [x] 8.4 `src/pages/Chat/components/Sidebar/components/ChatButton.tsx`：`text-white` → `text-primary-foreground`

## 9. 主题切换 UI

- [x] 9.1 创建 `src/pages/Setting/components/GeneralSetting/components/ThemeSetting.tsx` 组件，使用 shadcn/ui Select 提供浅色/深色/跟随系统三个选项，调用自定义 `useTheme` Hook
- [x] 9.2 在 `GeneralSetting` 中引入 ThemeSetting 组件，添加 i18n 翻译键
- [x] 9.3 添加主题相关的中文、英文、法文翻译文本

## 10. 验证与清理

- [x] 10.1 使用正则 `(?<!dark:)(?:bg|text|border(?:-t|-b|-l|-r)?|hover:(?:bg|text|border))-gray-\d{2,3}` 搜索业务代码，验证除 `bg-orange-500`（保留并搭配 `dark:` 变体）外不再存在硬编码 gray 色值；同时验证 `text-white` 仅出现在有彩色背景（如 `bg-orange-500`、`bg-primary`）的上下文中
- [x] 10.2 在亮色模式下目视验证所有页面无视觉回归
- [x] 10.3 在暗色模式下目视验证所有页面色彩适配正确
- [x] 10.4 运行 `pnpm lint` 和 `pnpm tsc` 确保无编译错误
- [x] 10.5 检查并更新现有测试中引用硬编码色值的选择器断言（如 `.toHaveClass('bg-white')`、快照测试等），确保测试套件通过
- [x] 10.6 运行 `pnpm test` 确保所有测试通过
