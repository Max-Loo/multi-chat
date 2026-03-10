# 统一导航配置管理 - 技术设计

## Context

### 当前状态

- **Sidebar 组件** (`src/components/Sidebar/index.tsx`): 在内部定义 `navigationItems: NavigationItem[]`，包含 id、name、icon、path 和样式类名
- **BottomNav 组件** (`src/components/BottomNav/index.tsx`): 在内部定义 `navItems: NavItem[]`，包含 id、path、icon
- 两个组件的导航项定义重复，且类型不完全一致

### 约束条件

- 必须保持用户界面和交互行为不变
- 必须保持类型安全（TypeScript 严格模式）
- 必须支持现有的主题样式系统
- 不能影响现有的国际化机制

## Goals / Non-Goals

**Goals:**
- 创建统一的导航配置文件，消除重复定义
- 保持类型安全和 IDE 智能提示
- 提供类型安全的访问方式（Map 查找）
- 遵循项目现有的配置管理模式（参考 `initSteps.ts`）

**Non-Goals:**
- 不修改导航项的业务逻辑或交互行为
- 不改变路由配置
- 不修改国际化文件
- 不改变现有的样式系统

## Decisions

### 1. 配置文件位置：`src/config/navigation.ts`

**选择理由**：
- 项目已有 `src/config/` 目录，用于存放应用级配置（如 `initSteps.ts`）
- 符合项目的配置组织规范
- 便于统一管理和查找

**替代方案**：
- ❌ `src/utils/constants.ts` - 更适合全局常量，而非结构化配置
- ❌ `src/components/navigation/` - 导航配置是应用级配置，非组件私有

### 2. 配置数据结构：统一 `NavigationItem` 接口

**设计**：
```typescript
interface NavigationItem {
  id: NavigationItemId;
  i18nKey: `navigation.${NavigationItemId}`;
  path: string;
  icon: LucideIcon | ReactNode;
  theme: {
    base: string;
    active: string;
    inactive: string;
  };
}
```

**选择理由**：
- 合并两个组件的字段，保留所有必要信息
- 使用 `i18nKey` 替代 `name`，支持动态国际化
- 使用嵌套 `theme` 对象组织样式类名，提高可读性
- 支持 `LucideIcon` 组件类型（BottomNav）和 `ReactNode` 类型（Sidebar）

**类型安全**：
- 使用 `as const` 确保类型推导
- 使用 `Map` 提供 O(1) 查找性能

### 3. 导出形式：只读数组 + Map

**设计**：
```typescript
export const NAVIGATION_ITEMS: readonly NavigationItem[] = [...] as const;
export const NAVIGATION_ITEM_MAP = new Map([...]);
```

**选择理由**：
- 数组支持遍历（组件渲染）
- Map 支持快速查找（按 ID 获取）
- `readonly` 防止运行时修改
- `as const` 启用 TypeScript 字面量类型推导

### 4. 组件适配：数据转换层

**设计**：
在组件内部将统一配置转换为所需格式：
```typescript
const navigationItems = useMemo(() => {
  return NAVIGATION_ITEMS.map(item => ({
    ...item,
    name: t($ => $[item.i18nKey]),
  }));
}, [t]);
```

**选择理由**：
- 保持组件接口不变，降低迁移风险
- 支持动态国际化（`i18nKey` → `name`）
- 利用 `useMemo` 优化性能

## Risks / Trade-offs

### Risk 1: 图标类型不兼容
**风险**: Sidebar 使用 `ReactNode`（已渲染的组件），BottomNav 使用 `LucideIcon`（组件类）

**缓解措施**:
- 配置中 `icon` 字段类型为 `LucideIcon | ReactNode`
- Sidebar 渲染时直接使用（`<MessageSquare size={24} />` 在配置外处理）
- BottomNav 动态渲染（`<Icon className="..." />`）

### Risk 2: 样式类名硬编码
**风险**: Tailwind 类名使用 `!` 标记（如 `text-blue-400!`）可能在某些构建环境下不支持

**缓解措施**:
- 保持现有样式系统不变
- 使用注释说明为什么需要 `!` 标记
- 未来可考虑迁移到 CSS-in-JS 或 Tailwind 的 `@apply`

### Risk 3: 国际化键路径动态性
**风险**: `t($ => $[item.i18nKey])` 动态访问可能影响类型检查

**缓解措施**:
- 使用模板字面量类型 `` `navigation.${NavigationItemId}` `` 确保类型安全
- 保持国际化键路径与现有翻译文件一致

## Migration Plan

### 部署步骤

1. **创建配置文件**
   - 新建 `src/config/navigation.ts`
   - 定义 `NavigationItem` 接口和 `NAVIGATION_ITEMS` 常量

2. **更新组件**
   - 修改 `src/components/Sidebar/index.tsx`：删除内部定义，导入配置
   - 修改 `src/components/BottomNav/index.tsx`：删除内部定义，导入配置

3. **验证**
   - 运行 `pnpm tauri dev` 检查运行时行为
   - 运行 `pnpm lint` 和 `pnpm tsc` 检查代码质量

4. **更新测试**
   - 修改相关测试文件的导入路径
   - 运行 `pnpm test:all` 确保测试通过

### 回滚策略

如果出现问题：
- 删除 `src/config/navigation.ts`
- 恢复组件内部的导航项定义
- Git revert 相关提交

## Open Questions

无
