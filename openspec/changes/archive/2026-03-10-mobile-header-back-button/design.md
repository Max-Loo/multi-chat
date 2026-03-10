# 移动端头部返回按钮 - 技术设计

## Context

**当前状态：**
- 模型创建页面使用 `ModelSidebar` 组件显示供应商列表和返回按钮
- 桌面端：侧边栏固定显示，返回按钮可见
- 移动端：侧边栏被收入 `MobileDrawer`，返回按钮不可见
- 用户需要打开抽屉才能点击返回按钮

**约束：**
- 必须保持桌面端体验不变
- 必须使用现有的响应式系统（`useResponsive` hook）
- 不能破坏现有的路由和导航逻辑
- 必须支持无障碍访问（ARIA 标签）

## Goals / Non-Goals

**Goals：**
- 在移动端头部提供可访问的返回按钮
- 减少移动端用户的操作步骤
- 保持桌面端现有体验
- 遵循项目的响应式设计模式

**Non-Goals：**
- 不修改桌面端侧边栏的行为
- 不改变路由结构
- 不引入新的依赖库
- 不修改其他页面的头部组件

## Decisions

### 决策 1：返回按钮位置

**选择：** 在 `ModelHeader` 中添加返回按钮，位于菜单按钮左边

**理由：**
- 符合移动端导航习惯（返回按钮通常在左上角）
- 与现有菜单按钮（左上角）形成一致的导航区域
- 实现简单，不需要调整布局
- 方案 A（左边）比方案 B（右边）更符合用户期望

**替代方案：**
- 方案 B：返回按钮在菜单按钮右边 - 不符合常见模式
- 方案 C：抽屉打开后显示返回按钮 - 仍需额外操作

### 决策 2：响应式断点使用

**选择：** 使用 `isMobile` 状态（`< 768px`）控制显示逻辑

**理由：**
- 项目已有明确的响应式断点定义
- `isMobile` 与侧边栏抽屉的触发条件一致
- 避免在 `isCompact` 和 `isCompressed` 模式下产生混淆

**技术细节：**
```typescript
const { isMobile } = useResponsive();
// ModelHeader 中：{isMobile && <BackButton />}
// ModelSidebar 中：{!isMobile && <BackButton />}
```

### 决策 3：组件职责划分

**选择：** 保持组件职责清晰，不引入共享状态

**理由：**
- `ModelHeader`：负责移动端头部导航
- `ModelSidebar`：负责供应商列表和桌面端导航
- 两个组件独立响应 `isMobile` 状态，无需共享逻辑
- 符合单一职责原则

**实现方式：**
- `ModelHeader`：导入 `useNavigate`，添加返回按钮
- `ModelSidebar`：使用条件渲染包裹现有返回按钮

### 决策 4：导航实现

**选择：** 使用 `react-router-dom` 的 `useNavigate` hook

**理由：**
- 项目已使用 `react-router-dom`
- `ModelSidebar` 中已使用 `useNavigate`，保持一致
- 类型安全，支持 TypeScript

**代码：**
```typescript
const navigate = useNavigate();
const handleBack = () => navigate("/model/table");
```

## Risks / Trade-offs

### 风险 1：返回按钮重复显示

**描述：** 如果响应式判断逻辑错误，可能在桌面端同时显示两个返回按钮

**缓解措施：**
- 严格测试各个断点（mobile、compact、compressed、desktop）
- 使用互斥的条件（`isMobile` vs `!isMobile`）
- 代码审查时重点检查条件渲染逻辑

### 风险 2：国际化缺失

**描述：** 返回按钮的 ARIA 标签可能缺少国际化支持

**缓解措施：**
- 使用 `t(($) => $.navigation.back)` 或现有翻译 key
- 检查翻译文件，确保所有语言都有对应翻译
- 如需要，添加新的翻译 key

### 权衡 1：代码重复 vs 抽象

**当前选择：** 接受少量代码重复（两个组件都有返回按钮逻辑）

**理由：**
- 两个组件的上下文和职责不同
- 抽象共享组件可能过度设计（YAGNI 原则）
- 简单的重复代码易于理解和维护

**未来优化：** 如果更多页面需要类似模式，可考虑抽象 `PageHeader` 组件

## Migration Plan

**步骤：**

1. **修改 `ModelHeader.tsx`**
   - 导入 `useNavigate` 和 `ArrowLeft`
   - 在移动端渲染返回按钮
   - 添加点击处理函数

2. **修改 `ModelSidebar.tsx`**
   - 使用条件渲染包裹返回按钮
   - 仅在 `!isMobile` 时显示

3. **添加国际化支持（如需要）**
   - 检查现有翻译 key
   - 如缺失，添加到各语言文件

4. **测试**
   - 测试移动端（< 768px）：头部显示返回按钮，抽屉内不显示
   - 测试桌面端（≥ 1280px）：头部不显示，侧边栏显示
   - 测试中间断点（768px - 1279px）：行为符合预期
   - 验证返回按钮功能正常

5. **无障碍测试**
   - 验证 ARIA 标签正确
   - 测试键盘导航和屏幕阅读器

**回滚策略：**
- 使用 Git 版本控制，可随时回滚
- 变更局限于两个组件，不影响其他功能
- 无数据库或配置变更

## Open Questions

**无** - 这是一个简单直接的 UI 优化，所有技术决策都已明确。
