# 响应式布局系统技术设计

## Context

### 当前状态

**现有架构**：
- 应用使用 Tauri + React + TypeScript 构建
- 布局采用固定宽度设计：
  - **侧边导航栏**（Sidebar，全局导航）: `w-auto` (约 60px，包含图标按钮)
  - **主内容侧边栏**（ChatSidebar，聊天列表）: `w-56` (224px，固定宽度)
  - **主内容区域**（ChatContent）: `flex-grow` (占据剩余空间)
- 布局层级：`Layout` → `ChatPage` → `ChatSidebar` + `ChatContent`
- 状态管理：Redux Toolkit，当前仅有 `isSidebarCollapsed` 布尔状态

**约束条件**：
- 必须保持 Desktop 模式下 UI 不变（向后兼容）
- 窗口 resize 性能要求：防抖 150ms，避免卡顿
- 可访问性要求：键盘导航、ARIA 标签、焦点管理
- 国际化要求：所有新组件支持 i18next

### 浏览器兼容性要求

| API/特性 | 最低支持版本 | 降级方案 |
|---------|-------------|---------|
| CSS Grid | Chrome 57+, Safari 10.1+, Firefox 52+ | 使用 Flexbox 降级 |
| window.matchMedia | IE 10+ | 无降级（必需） |
| CSS Container Queries | Chrome 105+, Firefox 110+ | 不使用（优化机会） |

**目标浏览器**：
- Chrome/Edge: 最新两个主版本
- Safari: 最新两个主版本
- Firefox: 最新两个主版本

### 技术栈

**现有依赖**：
- Tailwind CSS 4.1.14（支持完整的响应式工具类）
- React 19.2.0（支持最新 Hooks 和 Context）
- Radix UI (Dialog, DropdownMenu 等)
- React Router DOM 7.9.4
- Redux Toolkit 2.9.0

**需要新增的依赖**：
- ✅ Sheet 组件已存在（`src/components/ui/sheet.tsx`）
- 基于 `@radix-ui/react-dialog`，项目已安装

### 相关代码位置

```
src/
├── components/
│   ├── Layout/index.tsx              # 主布局容器
│   ├── Sidebar/index.tsx             # 全局导航侧边栏
│   └── ui/                           # shadcn/ui 组件库
├── pages/
│   └── Chat/
│       ├── index.tsx                 # 聊天页面主组件
│       └── components/
│           └── ChatSidebar/
│               ├── index.tsx         # 聊天侧边栏容器
│               └── components/
│                   ├── ChatButton.tsx  # 聊天按钮
│                   └── ToolsBar.tsx    # 工具栏
├── store/
│   └── slices/
│       └── chatPageSlices.ts         # 聊天页面状态
└── main.tsx                          # 应用入口
```

## Goals / Non-Goals

**Goals:**
- 实现四级响应式布局系统（Mobile/Compact/Compressed/Desktop）
- 窗口宽度变化时，布局自动平滑切换
- 移动端提供抽屉式主内容侧边栏和底部导航栏
- 压缩模式下优化主内容侧边栏宽度（192px：缩小宽度、字体、图标）
- 所有响应式逻辑完全自动化，无需用户手动切换
- 保持 Desktop 模式下现有 UI 完全不变
- 性能优化：防抖、CSS 过渡、避免重排
- 可访问性：键盘导航、ARIA 标签、焦点管理

**Non-Goals:**
- 不支持横向布局模式（如平板横屏的特殊布局）
- 不实现用户自定义断点
- 不修改 Desktop 模式下的 UI 细节
- 不实现主题切换（暗色模式等）
- 不支持服务端渲染（SSR）优化

## Decisions

### 决策 1: 响应式状态管理方案

**选择**：使用自定义 Hooks（`useResponsive`），不使用 Context Provider，不将响应式状态存入 Redux

**理由**：
- **性能考虑**：窗口 resize 事件触发频繁，存入 Redux 会产生大量 action，影响性能
- **职责分离**：响应式状态属于 UI 状态，不应混入应用状态（Redux 管理的是应用状态）
- **简化实现**：直接使用 Hook 获取响应式状态，无需 Provider 包装，避免 Context 的复杂性
- **业界最佳实践**：参考 React 生态的响应式设计模式（如 material-ui 的 useMediaQuery）

**状态管理原则**：

| 状态类型 | 存储位置 | 示例 | 理由 |
|---------|---------|------|------|
| **响应式状态**（自动计算） | Hook | `layoutMode`, `width`, `height`, `isMobile` | 频繁变化，UI 相关，无需持久化 |
| **用户交互状态**（需要持久化） | Redux | `isSidebarCollapsed`, `isDrawerOpen` | 用户偏好，需要持久化，应用状态 |

**性能优化**：
- **节流优化**：`useMediaQuery` Hook 使用 es-toolkit 的 `throttle` 函数，间隔 150ms
- **立即响应**：第一次窗口变化立即响应，然后在连续 resize 过程中每 150ms 更新一次
- **内存泄漏防护**：使用 `useRef` 管理监听器，避免全局变量
- **SSR 兼容**：服务端渲染时返回默认值，避免 hydration mismatch

**实现细节**：
```typescript
// src/hooks/useResponsive.ts
export function useResponsive(): {
  layoutMode: 'mobile' | 'compact' | 'compressed' | 'desktop';
  width: number | undefined;
  height: number | undefined;
  isMobile: boolean;
  isCompact: boolean;
  isCompressed: boolean;
  isDesktop: boolean;
}
```

### 决策 2: 断点系统设计

**选择**：使用 Tailwind 默认断点（兼容 3.x 和 4.x）

**断点定义**：

**Tailwind CSS 3.x 配置**：
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '640px',   // 保留默认
      'md': '768px',   // Mobile ↔ Compact 分界线（导航方式切换点）
      'lg': '1024px',  // Compact ↔ Compressed 分界线
      'xl': '1280px',  // Compressed ↔ Desktop 分界线
      '2xl': '1536px', // 保留默认
    }
  }
}
```

**响应式工具类使用**：
```tsx
{/* 方案 A：统一使用侧边导航栏 */}
{/* Mobile 模式下隐藏，其他模式显示 */}
<div className="md:block hidden">侧边导航栏</div>

{/* 仅在 Mobile 模式下显示 */}
<div className="md:hidden block">底部导航栏</div>
```

**理由**：
- **充分利用 Tailwind 生态**：使用默认断点可以无缝使用 Tailwind 的响应式工具类（如 `md:hidden`, `xl:flex`）
- **简化导航体验**：方案 A 提供一致的导航方式
  - Mobile (<768px): 底部导航栏（符合移动端习惯）
  - 其他 (≥768px): 侧边导航栏（符合桌面端习惯）
- **渐进式压缩策略**：
  - Mobile → Compact: 主内容侧边栏从隐藏变为显示（压缩状态）
  - Compact → Compressed: 主内容侧边栏保持压缩（192px）
  - Compressed → Desktop: 恢复完整布局（主内容侧边栏 224px）
- **清晰的语义**：
  - `md` (768px): 导航方式切换点（侧边导航栏 ↔ 底部导航栏）
  - `lg` (1024px): 平板横屏（iPad Pro）和小笔记本的分界线
  - `xl` (1280px): 笔记本和台式机的常见分界线

**断点验证**：
- Mobile (<768px): iPhone SE (375px), iPhone 12 Pro (390px)
  - 特点：屏幕小，主内容侧边栏在抽屉中（容器宽度 80% max-w-400px，内部 ChatSidebar 224px），使用顶部栏和底部导航栏
- Compact (768px-1023px): iPad 竖屏 (768px), 小平板 (800px)
  - 特点：屏幕略小，主内容侧边栏压缩显示（192px：缩小宽度、字体、图标），保留侧边导航栏
- Compressed (1024px-1279px): iPad Pro 横屏 (1024px), 小型笔记本 (1280px)
  - 特点：屏幕中等宽度，主内容侧边栏保持压缩（192px），保留侧边导航栏（方案 A）
- Desktop (≥1280px): 标准笔记本 (1366px+), 台式机 (1920px+)
  - 特点：大屏幕，完整的桌面布局（侧边导航栏 + 主内容侧边栏 224px）

**替代方案**：
- **完全自定义断点**（如 900px, 1200px）
  - ❌ 失去 Tailwind 生态优势
  - ❌ 需要为每个断点编写自定义 CSS

### 决策 3: 布局模式切换策略

**选择**：完全响应式（自动切换），不提供用户手动覆盖

**理由**：
- **简化用户心智模型**：用户不需要理解"布局模式"的概念
- **避免状态不一致**：手动覆盖可能导致响应式状态和用户偏好冲突
- **减少测试复杂度**：只需要测试自动切换逻辑，不需要测试各种组合

**实现细节**：
```typescript
// 布局模式由窗口宽度自动决定
const getLayoutMode = (width: number): LayoutMode => {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'compact';
  if (width < 1280) return 'compressed';
  return 'desktop';
};
```

**用户交互状态保留**：
- Desktop/Compact/Compressed 模式下的 `isSidebarCollapsed`：保留现有的主内容侧边栏手动折叠功能

**替代方案**：
- **允许用户手动覆盖布局模式**
  - ❌ 状态管理复杂：需要处理"响应式状态"和"用户偏好"的冲突
  - ❌ 测试复杂度增加：需要测试各种状态组合

### 决策 4: ChatButton 三态设计

**选择**：基于 `layoutMode` prop 动态切换布局，使用条件渲染和 Tailwind 工具类

**三种形态**：

**Desktop 模式** (`layoutMode === 'desktop'`):
```tsx
<div className="py-2 px-1 flex justify-between">
  <span className="pl-2 text-sm">{chat.name}</span>
  <Button className="h-8 w-8">
    <MoreHorizontal className="h-4 w-4" />
  </Button>
</div>
```

**Compact 模式** (`layoutMode === 'compact'`):
```tsx
<div className="py-1.5 px-1 flex justify-between">
  <span className="pl-2 text-xs">{chat.name}</span>  {/* 缩小字体 */}
  <Button className="h-7 w-7">
    <MoreHorizontal className="h-3.5 w-3.5" />  {/* 缩小图标 */}
  </Button>
</div>
```

**Compressed 模式** (`layoutMode === 'compressed'`):
```tsx
<div className="py-1.5 px-1 flex justify-between">
  <span className="pl-2 text-xs">{chat.name}</span>  {/* 压缩字体：与 Compact 相同 */}
  <Button className="h-7 w-7">
    <MoreHorizontal className="h-3.5 w-3.5" />  {/* 压缩图标：与 Compact 相同 */}
  </Button>
</div>
```

**Mobile 模式** (`layoutMode === 'mobile'`):
```tsx
<div className="py-2 px-1 flex justify-between">
  <span className="pl-2 text-sm">{chat.name}</span>  {/* 在抽屉中，正常显示 */}
  <Button className="h-8 w-8">
    <MoreHorizontal className="h-4 w-4" />  {/* 点击「更多」按钮弹出选项 */}
  </Button>
</div>
```

**理由**：
- **渐进式优化**：先缩小元素（Compact），再切换导航方式（Compressed），用户体验更平滑
- **Mobile 模式正常显示**：在抽屉中有足够空间，使用正常宽度和布局
- **点击「更多」按钮**：移动端用户习惯点击操作按钮，而非长按
- **简化实现**：无需实现长按事件和触摸事件处理

**技术细节**：
```typescript
// 无需长按事件处理
// 所有模式都使用相同的点击事件
const handleMoreClick = () => {
  setShowMenu(true);
};
```

### 决策 5: 移动端抽屉实现方案

**选择**：使用 shadcn/ui 的 Sheet 组件实现通用抽屉容器

**理由**：
- **基于现有依赖**：Sheet 组件基于 `@radix-ui/react-dialog`，项目已安装
- **与现有技术栈一致**：项目已使用 Radix UI（Dialog, DropdownMenu 等）
- **开箱即用的特性**：
  - 焦点管理（focus trap）
  - ESC 键关闭
  - 背景滚动锁定
  - Portal 渲染（避免 z-index 问题）
  - 支持从四个方向滑出（top/right/bottom/left）
- **通用容器**：接收 children 作为内容，各页面包装各自的侧边栏

**实现细节**：
```tsx
// src/components/MobileDrawer/index.tsx（通用容器组件）
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet'; // 已存在，可直接使用

interface MobileDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function MobileDrawer({ isOpen, onOpenChange, children }: MobileDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[80%] max-w-[400px]">
        {children}
      </SheetContent>
    </Sheet>
  );
}

// 使用示例：Chat 页面
<MobileDrawer isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
  <ChatSidebar layoutMode="mobile" />
</MobileDrawer>

// 使用示例：Settings 页面
<MobileDrawer isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
  <SettingsSidebar />
</MobileDrawer>
```

**动画配置**：
- 使用 Tailwind 的 `transition-transform duration-300 ease-in-out`
- 从左侧滑出：`-translate-x-full` → `translate-x-0`
- 遮罩淡入：`transition-opacity duration-300 ease-in-out`
- 使用 `will-change: transform` 优化性能

**滚动位置保持**：
```typescript
// 使用 useRef 保存和恢复滚动位置（全场景支持）
const sidebarRef = useRef<HTMLDivElement>(null);
const scrollPosition = useRef(0);
const prevLayoutMode = useRef<LayoutMode>(layoutMode);

// 单一 useEffect 处理 layoutMode 变化
useEffect(() => {
  // 保存当前滚动位置（在 layoutMode 变化前）
  if (sidebarRef.current && prevLayoutMode.current !== layoutMode) {
    scrollPosition.current = sidebarRef.current.scrollTop;
  }

  // 恢复滚动位置（在 DOM 更新后）
  const timer = setTimeout(() => {
    if (sidebarRef.current && scrollPosition.current > 0) {
      sidebarRef.current.scrollTop = scrollPosition.current;
    }
  }, 0);

  // 更新 prevLayoutMode
  const oldLayoutMode = prevLayoutMode.current;
  prevLayoutMode.current = layoutMode;

  return () => {
    clearTimeout(timer);
    // 组件卸载时保存滚动位置
    if (sidebarRef.current) {
      scrollPosition.current = sidebarRef.current.scrollTop;
    }
    prevLayoutMode.current = oldLayoutMode;
  };
}, [layoutMode]);
```

**滚动位置保持场景**：
- **Mobile ↔ Desktop 切换**：保持滚动位置
- **Compact ↔ Compressed 切换**：保持滚动位置
- **抽屉打开/关闭**：保持滚动位置
- **组件卸载/重新挂载**：通过 ref 保存滚动位置

**竞态条件防护**：
- 使用 `prevLayoutMode` 确保只在真正变化时保存
- 单一 useEffect 避免多个 effect 竞争
- cleanup 函数中恢复旧值防止意外更新

**注意**：此功能在 V1 中未实现，已移至未来版本需求。

**替代方案**：
- **自研抽屉组件**
  - ❌ 开发成本高：需要处理焦点管理、滚动锁定、动画等细节
  - ❌ 可访问性风险：可能遗漏 ARIA 属性或键盘导航

- **使用第三方库（如 react-swipeable-views）**
  - ❌ 增加依赖：引入额外的库增加 bundle 大小
  - ❌ 可能与现有代码风格不一致

- **直接使用 @radix-ui/react-dialog**
  - ⚠️ 需要自己封装滑出动画和位置样式
  - ✅ shadcn/ui Sheet 已封装好，直接使用更方便

**宽度策略优化**：
- **初始设计**：固定宽度 `w-[80%] max-w-[400px]`
- **优化后**：内容决定宽度 `w-fit max-w-[85vw] sm:max-w-md`
  - 移动端（<640px）：最大宽度为视窗宽度的 85%
  - 小屏幕及以上（≥640px）：最大宽度为 md（448px）
  - 确保各页面侧边栏在抽屉中正常显示（Chat 224px、Settings 256px、Model 240px）

### 决策 6: 底部导航栏实现方案

**选择**：新建 `BottomNav` 组件，采用**方案 A：统一使用侧边导航栏**

**方案 A 设计**：
- **Mobile (<768px)**: 使用底部导航栏 + 各页面自行实现的打开抽屉按钮
- **其他模式 (≥768px)**: 使用侧边导航栏

**理由**：
- **简化导航体验**：避免 1024px 处的导航方式突变，提供一致的用户体验
- **符合平台习惯**：
  - Mobile: 底部导航符合 iOS/Android 应用习惯
  - Desktop/Tablet: 侧边导航符合桌面应用习惯
- **简化实现**：减少条件判断，降低维护成本
- **渐进式优化**：主内容侧边栏仍然根据宽度调整（192px vs 224px）
- **灵活的打开抽屉按钮**：由各页面自行实现，可以根据页面状态决定按钮位置和样式

**实现细节**：
```tsx
// src/components/Layout/index.tsx
const { isMobile } = useResponsive();

// 方案 A：统一使用侧边导航栏
// 侧边导航栏（全局导航）：仅在非 Mobile 模式下显示
{!isMobile && <Sidebar />}

// 底部导航栏：仅在 Mobile 模式下显示
{isMobile && <BottomNav />}

// 注意：
// - "Sidebar" = 侧边导航栏（全局导航，src/components/Sidebar）
// - "ChatSidebar" = 主内容侧边栏（聊天列表，src/pages/Chat/components/ChatSidebar）
// - 非 Mobile 模式（≥768px）：侧边导航栏显示，主内容侧边栏根据宽度压缩显示
// - Mobile 模式（<768px）：侧边导航栏隐藏，主内容侧边栏在抽屉中（224px）
// - 打开抽屉按钮由各页面自行实现（Chat/Settings/Model 等）
```

**主内容区域适配**：

采用动态 padding 方案（推荐方案），使用 `onHeightChange` callback 动态获取 BottomNav 实际高度。

```tsx
// BottomNav 组件实现
interface BottomNavProps {
  onHeightChange?: (height: number) => void;
}

export function BottomNav({ onHeightChange }: BottomNavProps) {
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navRef.current && onHeightChange) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          onHeightChange(entry.contentRect.height);
        }
      });
      resizeObserver.observe(navRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [onHeightChange]);

  return (
    <nav 
      ref={navRef}
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t"
    >
      {/* 导航内容 */}
    </nav>
  );
}

// Layout 组件集成（方案 A）
const [bottomNavHeight, setBottomNavHeight] = useState(64);
const { isMobile } = useResponsive();

<main 
  className="flex-1 overflow-auto"
  style={{ paddingBottom: isMobile ? `${bottomNavHeight}px` : 0 }}
>
  {children}
</main>

{isMobile && (
  <BottomNav onHeightChange={setBottomNavHeight} />
)}
```

**动态 padding 方案优势**：
- 符合"主内容优先"策略：主内容先被压缩，底部导航栏固定
- 更好的浏览器兼容性
- 可以精确控制间距
- 支持动画过渡
- 滚动行为更自然（main 元素独立滚动）
- 自动处理字体加载导致的布局偏移（ResizeObserver 自动检测）

**方案 A 的优势**：
- **导航一致性**：所有 ≥768px 的模式统一使用侧边导航栏，避免 1024px 处的突变
- **简化实现**：只需判断 Mobile vs 非 Mobile，减少条件分支
- **更好的用户体验**：用户在平板横屏（1024px+）时仍然使用熟悉的侧边导航
- **实际实现**：BottomNav 仅在 Mobile 模式下显示（`isMobile` 为 true 时渲染）

**替代方案**：
- **方案 B（原设计）：Compressed 模式使用底部导航栏**
  - ❌ 导航体验不一致：1024px 处侧边导航栏突然消失，底部导航栏突然出现
  - ❌ 用户需要重新适应：从 Compact 到 Compressed 时导航方式突变
  - ❌ Compressed 和 Compact 的主内容侧边栏完全相同（都是 192px），只是导航栏不同
  - ❌ 增加测试复杂度：需要测试四种模式的导航栏切换逻辑

- **方案 C（选择）：统一使用侧边导航栏（方案 A）**
  - ✅ 导航体验一致：所有 ≥768px 的模式统一使用侧边导航栏
  - ✅ 简化实现：只需判断 Mobile vs 非 Mobile
  - ✅ 符合平台习惯：Mobile 用底部导航，其他用侧边导航
  - ✅ 减少测试复杂度：只需测试 Mobile 与非 Mobile 的切换

**选中状态设计方案**：
- **直接使用配置中的主题样式**：参考 Sidebar 实现，从 `src/config/navigation.tsx` 读取 `theme.base`、`theme.active`、`theme.inactive`
- **样式组成**（由配置文件定义）：
  - 基础样式：`theme.base`（如 `text-blue-400!`）
  - 激活样式：`theme.active`（如 `bg-blue-100! text-blue-500!`）
  - 未激活样式：`theme.inactive`（如 `hover:text-blue-500! hover:bg-blue-100!`）
- **路径匹配策略**：使用 `location.pathname.startsWith(item.path)` 以支持子路径高亮
  - 例如：`/model/create` 会高亮 Model 导航项
  - 排除根路径 `/` 避免所有路径都匹配
- **实现细节**（与 Sidebar 保持一致）：
  ```tsx
  // src/components/BottomNav/index.tsx
  interface NavItem {
    path: string;
    name: string;
    IconComponent: React.ComponentType<{ className?: string }>;
    id: "chat" | "model" | "setting";
    baseClassName: string;
    activeClassName: string;
    inactiveClassName: string;
  }

  const navItems = useMemo<NavItem[]>(
    () => NAVIGATION_ITEMS.map((item) => ({
      path: item.path,
      name: t(item.i18nKey as any),
      IconComponent: item.IconComponent,
      id: item.id,
      baseClassName: item.theme.base,
      activeClassName: item.theme.active,
      inactiveClassName: item.theme.inactive,
    })),
    [t],
  );

  // 路径匹配（支持子路径）
  const isActive = location.pathname.startsWith(item.path) && item.path !== '/';

  // Button className（与 Sidebar 一致）
  className={cn(
    "flex flex-col items-center justify-center gap-1 w-full h-full rounded-none",
    baseClassName,
    isActive ? activeClassName : inactiveClassName,
  )}
  ```
- **视觉效果**（由配置文件定义）：
  - 未选中：对应的浅色图标（如 Chat: `text-blue-400`）
  - hover 时：对应的深色图标 + 浅色背景（如 Chat: `hover:text-blue-500 hover:bg-blue-100`）
  - 选中：对应的深色图标 + 浅色背景（如 Chat: `bg-blue-100 text-blue-500`）
  - Model: 绿色主题（`text-emerald-400` → `hover:text-emerald-500 hover:bg-emerald-100` → `bg-emerald-100 text-emerald-500`）
  - Setting: 紫色主题（`text-violet-400` → `hover:text-violet-500 hover:bg-violet-100` → `bg-violet-100 text-violet-500`）
- **与 Sidebar 保持一致**：
  - 使用相同的配置源（`NAVIGATION_ITEMS`）
  - 使用相同的样式逻辑（`baseClassName` + `isActive ? activeClassName : inactiveClassName`）
  - 配置文件作为唯一的主题定义来源，避免重复定义

**架构决策**：MobileDrawer 和打开抽屉按钮实现方案

**选择 1**：MobileDrawer 作为通用容器组件，由各页面自行渲染
**选择 2**：打开抽屉按钮由各页面自行实现

**理由**：
- **职责清晰**：Layout 只处理全局布局组件（侧边导航栏/底部导航栏）
- **避免耦合**：不同页面的主内容侧边栏内容不同，不应在 Layout 层处理
- **复用性**：MobileDrawer 是通用容器，Chat/Settings/Model 等页面都可使用
- **性能优化**：各页面按需渲染，避免在 Layout 中处理所有页面的抽屉逻辑
- **灵活性**：各页面可以根据自身状态决定打开抽屉按钮的位置和样式

**实现结构**：
```tsx
// src/components/Layout/index.tsx
{(isDesktop || isCompact) && <Sidebar />}
{isMobile && <BottomNav />}
<Outlet />  {/* 各页面自行处理 MobileDrawer 和打开抽屉按钮 */}

// src/pages/Chat/index.tsx
{isMobile && <MobileDrawer><ChatSidebar layoutMode="mobile" /></MobileDrawer>}
{!isMobile && <ChatSidebar layoutMode={layoutMode} />}

// src/pages/Settings/index.tsx（示例）
{isMobile && <MobileDrawer><SettingsSidebar /></MobileDrawer>}
{!isMobile && <SettingsSidebar />}

// src/pages/Model/index.tsx（示例）
{isMobile && <MobileDrawer><ModelFormSidebar /></MobileDrawer>}
{!isMobile && <ModelFormSidebar />}
```

**打开抽屉按钮实现位置**：
- **Chat 页面**：`ChatPanelHeader` 左侧（已配置模型的聊天）
- **ChatContent 页面**：`ModelSelect` 操作栏左侧（未配置模型的聊天）
- **Settings 页面**：`SettingHeader` 左侧
- **Model 创建页面**：`ModelHeader` 左侧

注意：不再需要 `src/pages/Model/components/ModelSelect.tsx` 中的打开抽屉按钮（任务 6.9 已删除）。

### 决策 7: 状态管理扩展

**选择**：在 Redux store 中添加 `isDrawerOpen` 状态，保留 `isSidebarCollapsed`

**Redux 状态结构**：
```typescript
// src/store/slices/chatPageSlices.ts
export interface ChatPageSliceState {
  isSidebarCollapsed: boolean;      // 保留（Desktop/Compact/Compressed）
  isShowChatPage: boolean;          // 保留
  isDrawerOpen: boolean;            // 新增（Mobile）
}

// 新增 action
toggleDrawer: (state) => {
  state.isDrawerOpen = !state.isDrawerOpen;
}
```

**理由**：
- **职责分离**：
  - `isDrawerOpen`: Mobile 模式下的用户交互状态（抽屉打开/关闭）
  - `layoutMode`: 响应式状态（不存入 Redux，由 Context 管理）
- **保持现有逻辑不变**：`isSidebarCollapsed` 继续由用户手动控制
- **简化状态同步**：避免 Redux 中同时存在"响应式状态"和"用户偏好"

**状态使用场景**：
- `isDrawerOpen` (Mobile): 控制抽屉的打开/关闭，由汉堡菜单按钮触发
- `isSidebarCollapsed` (Desktop/Compact/Compressed): 控制主内容侧边栏的折叠/展开，由主内容侧边栏内的按钮触发

**替代方案**：
- **将所有响应式状态存入 Redux**
  - ❌ 性能问题（见决策 1）
  - ❌ 状态冗余：`layoutMode` 可以通过 `useResponsive()` 实时计算

## Risks / Trade-offs

### 风险 1: 窗口 resize 性能问题

**描述**：频繁的 resize 事件可能导致性能下降和卡顿

**缓解措施**：
- **防抖优化**：`useMediaQuery` Hook 使用 150ms 防抖
  ```typescript
  const handler = debounce(() => {
    setMatches(mediaQuery.matches);
  }, 150);
  ```
- **CSS 过渡**：使用 `transition-all duration-300` 平滑过渡，避免布局跳动
- **避免重排**：使用 CSS Grid 布局，避免频繁的 DOM 操作
- **性能监控**：使用 React DevTools Profiler 监控组件渲染性能

**验证方法**：
- 在 Chrome DevTools 中模拟 resize 事件，检查 FPS
- 使用 Lighthouse 性能审计

### 风险 2: 布局模式切换时的用户体验

**描述**：断点切换时可能出现内容跳动或闪烁

**缓解措施**：
- **CSS 过渡**：使用具体属性过渡，避免 `transition-all`
  ```css
  /* 正确 */
  transition-width duration-300 ease-in-out;
  transition-font-size duration-300 ease-in-out;
  
  /* 错误 */
  transition-all duration-300 ease-in-out;
  ```
- **GPU 加速**：优先使用 `transform` 和 `opacity`
- **渐进式渲染**：避免在切换时加载大量数据（如聊天列表）
- **测试覆盖**：编写 E2E 测试验证断点切换的平滑性

**测试场景**：
- 从 Desktop 拖拽窗口到 Mobile 尺寸
- 快速调整窗口大小（验证防抖效果）
- 在不同断点下验证侧边栏宽度和平滑过渡

### 风险 3: 移动端可访问性

**描述**：抽屉和底部导航栏可能不符合可访问性标准

**缓解措施**：
- **ARIA 标签**：
  ```tsx
  <button aria-label="打开聊天列表" onClick={openDrawer}>
    <Menu />
  </button>
  ```
- **焦点管理**：
  - 抽屉打开时，焦点移动到抽屉内第一个聊天按钮
  - 抽屉关闭时，焦点返回汉堡菜单按钮
  - shadcn/ui Sheet 组件自动处理焦点 trap（基于 Radix Dialog）
- **键盘导航流程**：
  1. Tab 键 → 汉堡菜单按钮 → 底部导航栏（Chat/Model/Setting）
  2. Enter/Space 键（汉堡菜单）→ 打开抽屉 → 焦点移动到第一个聊天按钮
  3. Tab 键（抽屉内）→ 在聊天按钮之间导航
  4. ESC 键（抽屉内）→ 关闭抽屉 → 焦点返回汉堡菜单按钮
  5. Shift + Tab（抽屉内第一个按钮）→ 焦点返回汉堡菜单按钮
- **屏幕阅读器测试**：使用 NVDA 或 VoiceOver 验证

**验证方法**：
- 使用 axe DevTools 进行可访问性审计
- 手动测试完整键盘导航流程
- 测试焦点顺序符合逻辑

### 风险 4: 向后兼容性

**描述**：Desktop 模式下的 UI 变化可能影响现有用户

**缓解措施**：
- **保持 Desktop 模式 UI 完全不变**：
  - 侧边栏宽度保持 224px
  - 布局结构保持不变
  - 所有组件样式保持不变
- **渐进式发布**：先在测试环境验证，再发布到生产环境
- **回滚策略**：如果发现问题，可以通过 feature flag 快速回滚

**验证方法**：
- 视觉回归测试（使用 Percy 或 Chromatic）
- 现有功能的单元测试和集成测试

### 风险 5: 第三方依赖兼容性

**描述**：shadcn/ui Sheet 组件可能与其他组件存在样式冲突

**缓解措施**：
- **版本验证**：确认 `@radix-ui/react-dialog` 已安装（Sheet 组件的底层依赖）
- **测试覆盖**：在新组件上编写完整的单元测试
- **备选方案**：如果出现问题，可以临时使用自研抽屉组件

**验证方法**：
- 运行 `npm ls @radix-ui` 检查版本依赖树
- 在开发环境中充分测试抽屉功能

## Migration Plan

### 阶段 1: 基础设施搭建（1-2 天）

**目标**：建立响应式状态管理系统

**步骤**：
1. 创建 `src/hooks/useMediaQuery.ts`（带 150ms 防抖）
2. 创建 `src/hooks/useResponsive.ts`
3. 编写单元测试验证响应式状态正确性

**验证标准**：
- `useResponsive()` Hook 返回正确的 `layoutMode`
- 窗口 resize 时状态更新（带防抖）
- 在不同窗口宽度下测试

### 阶段 2: 布局组件改造（2-3 天）

**目标**：实现四级布局系统

**步骤**：
1. 修改 `src/components/Layout/index.tsx`：
   - 集成 `useResponsive()` Hook
   - 根据 `layoutMode` 条件渲染 Mobile/Desktop 布局
2. 修改 `src/components/Sidebar/index.tsx`：
   - 添加 `md:hidden` 在 Mobile 模式下隐藏
3. 创建 `src/components/MobileTopBar/index.tsx`
4. 创建 `src/components/BottomNav/index.tsx`
5. ✅ 验证 `src/components/ui/sheet.tsx` 已存在（Sheet 组件）

**验证标准**：
- Desktop 模式下布局不变
- Mobile 模式下显示顶部栏和底部导航
- 布局切换时平滑过渡

### 阶段 3: 聊天侧边栏响应式（2-3 天）

**目标**：实现自适应侧边栏

**步骤**：
1. 创建 `src/components/ResponsiveChatSidebar/index.tsx`
2. 创建 `src/components/ResponsiveChatSidebar/components/ResponsiveChatButton.tsx`
3. 修改 `src/pages/Chat/index.tsx`：使用 `ResponsiveChatSidebar`
4. 修改 `src/pages/Chat/components/ChatSidebar/index.tsx`：根据 `layoutMode` 调整宽度
5. 修改 `src/pages/Chat/components/ChatSidebar/components/ChatButton.tsx`：支持三种布局模式
6. 修改 `src/pages/Chat/components/ChatSidebar/components/ToolsBar.tsx`：压缩模式优化

**验证标准**：
- Desktop 模式下主内容侧边栏宽度 224px
- Compact 模式下主内容侧边栏宽度 192px
- Compressed 模式下主内容侧边栏宽度 192px
- Mobile 模式下主内容侧边栏在抽屉内正常显示（224px）

### 阶段 4: 移动端抽屉实现（1-2 天）

**目标**：实现抽屉式侧边栏

**步骤**：
1. 创建 `src/components/MobileDrawer/index.tsx`（基于 shadcn/ui Sheet 组件）
2. 集成到 `src/pages/Chat/index.tsx`
3. 添加 Redux 状态 `isDrawerOpen`
4. 实现汉堡菜单按钮触发抽屉
5. 添加遮罩层和关闭逻辑

**验证标准**：
- 点击汉堡菜单打开抽屉
- 点击遮罩或 ESC 键关闭抽屉
- 抽屉打开时背景滚动锁定
- 焦点管理正确

### 阶段 5: 响应式侧边栏实现（2-3 天）

**目标**：实现自适应侧边栏

**步骤**：
1. 修改 `src/pages/Chat/index.tsx`：传递 `layoutMode` 给 `ChatSidebar`
2. 修改 `src/pages/Chat/components/ChatSidebar/index.tsx`：
   - 添加 `layoutMode` prop
   - 根据 `layoutMode` 调整容器宽度
   - 实现滚动位置保持逻辑
   - 添加 CSS 过渡动画
3. 修改 `src/pages/Chat/components/ChatSidebar/components/ChatButton.tsx`：支持四种布局模式
4. 修改 `src/pages/Chat/components/ChatSidebar/components/ToolsBar.tsx`：压缩模式优化

**验证标准**：
- Desktop 模式下侧边栏宽度 224px
- Compact 模式下侧边栏宽度压缩（192px）
- Compressed 模式下侧边栏宽度压缩（与 Compact 相同）
- Mobile 模式下侧边栏在抽屉中正常显示（224px）
- 侧边栏宽度变化时平滑过渡
- 滚动位置在抽屉打开/关闭时正确保持

### 阶段 5: 测试和优化（2-3 天）

**目标**：确保功能完整性和性能

**步骤**：
1. 编写单元测试（所有新组件）
2. 编写集成测试（布局切换逻辑）
3. 性能优化（验证防抖、过渡动画）
4. 可访问性测试（键盘导航、ARIA 标签）
5. 视觉回归测试（确保 Desktop 模式不变）

**验证标准**：
- 所有测试通过
- Lighthouse 性能分数 ≥ 90
- axe DevTools 无可访问性问题

### 阶段 6: 发布和监控（1 天）

**目标**：发布到生产环境并监控

**步骤**：
1. 代码审查
2. 合并到主分支
3. 构建生产版本
4. 部署到测试环境
5. 灰度发布到生产环境
6. 监控错误日志和用户反馈

**回滚策略**：
- 如果发现严重问题，立即回滚到上一个版本
- 通过 Tauri 的热更新机制快速推送修复

## Open Questions

### 问题 1: 是否需要支持用户自定义断点？

**背景**：某些用户可能希望在更大的屏幕上使用压缩模式

**当前决策**：不支持，使用固定断点（768px, 1280px）

**未来考虑**：
- 如果用户反馈强烈，可以添加设置选项
- 需要在用户设置中添加"断点偏好"配置
- 实现复杂度：中等（需要在 `getLayoutMode` 中读取用户设置）

### 问题 2: Mobile 模式下是否需要支持手势关闭抽屉？

**背景**：移动端用户习惯使用手势（如向右滑动关闭抽屉）

**当前决策**：暂不支持，仅支持点击遮罩或 ESC 键关闭

**未来考虑**：
- 可以使用 `react-swipeable` 库实现手势
- 需要权衡开发成本和用户体验提升

### 问题 3: 是否需要在压缩模式下显示聊天数量？

**背景**：压缩模式下空间有限，可能需要显示未读消息数量

**当前决策**：不显示，保持简洁

**未来考虑**：
- 如果用户反馈需要，可以在按钮右上角显示 Badge
- 实现复杂度：低

### 问题 4: Compact 模式命名是否需要优化？

**背景**：Compact 和 Compressed 命名容易混淆，且两档的侧边栏压缩程度相同

**当前决策**：保持当前命名，但优化语义说明

**命名优化建议**：
- **Compact**：强调"紧凑布局"，缩小元素但保持侧边导航栏
- **Compressed**：强调"压缩布局"，侧边导航切换为底部导航栏

**替代方案**：
- **方案 A**：将 Compact 重命名为 "Medium"
  - 优点：语义更清晰（Small → Medium → Large）
  - 缺点：失去"压缩"的语义

- **方案 B**：合并 Compact 和 Compressed
  - 优点：简化断点，减少维护成本
  - 缺点：失去渐进式优化，用户体验下降

**当前决策**：保持四档断点，优化文档说明

### 问题 5: 底部导航栏是否需要动画效果？

**背景**：某些移动应用会在切换 Tab 时使用过渡动画

**当前决策**：不添加特殊动画，使用简单的路由切换

**未来考虑**：
- 可以使用 Framer Motion 添加微动画
- 需要评估性能影响

### 问题 6: 是否需要支持横屏模式的特殊布局？

**背景**：平板横屏时可能有更多空间

**当前决策**：不特殊处理，使用相同的断点逻辑

**未来考虑**：
- 如果用户反馈强烈，可以添加 `landscape` 布局模式
- 实现复杂度：高（需要检测设备方向）

### 问题 7: Mobile 模式下用户如何访问聊天列表？

**背景**：Mobile 模式下侧边栏集成在抽屉中

**当前决策**：
- 点击顶部栏汉堡菜单打开抽屉
- 在抽屉中显示完整的聊天列表（224px 宽度）
- 点击聊天项或「更多」按钮弹出选项

**未来考虑**：
- 可以在 Chat 页面添加悬浮按钮（FAB）快速打开抽屉
- 需要评估与底部导航栏的交互冲突

### 优化机会 1: CSS Container Queries

**背景**：当前方案完全依赖 JS 计算响应式状态，部分场景可以用 CSS 优化

**优化方案**：使用 CSS Container Queries（浏览器支持度已足够）
```css
/* 使用 Container Queries 优化组件内部布局 */
@container (min-width: 768px) {
  .chat-sidebar {
    width: 192px;
  }
}

@container (min-width: 1280px) {
  .chat-sidebar {
    width: 224px;
  }
}
```

**优势**：
- 减少JS计算，提升性能
- CSS 过渡更平滑（无需等待 JS 状态更新）
- 代码更简洁

**限制**：
- 无法在 JS 中获取当前布局模式（如需要用于其他逻辑）
- 浏览器支持度要求（Chrome 105+, Firefox 110+）

**建议**：混合使用
- **显示/隐藏组件**：使用 JS `layoutMode`
- **组件内部宽度**：使用 CSS Container Queries

**实施优先级**：中（性能优化，可在第二版本迭代）
