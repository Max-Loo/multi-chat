## MODIFIED Requirements

### Requirement: 测试断言必须验证有意义的被测行为

测试 SHALL NOT 使用 `expect(true).toBe(true)` 等恒真断言。每个测试用例 SHALL 验证与其描述匹配的实际组件行为或输出。

#### Scenario: 替换空断言为有意义的验证
- **WHEN** ModelSelect.test.tsx 第 87-90 行使用 `expect(true).toBe(true)` 空断言
- **THEN** SHALL 替换为验证组件实际渲染行为的断言（如验证表格、模型名称等 UI 元素存在）

### Requirement: 测试断言必须与测试名称描述的行为一致

每个测试用例的断言 SHALL 验证其名称所描述的具体行为。如果测试名称声称验证 "Flexbox 布局"、"屏幕高度" 或 "移动端适配" 等行为，则断言 SHALL 实际验证这些特征。

#### Scenario: Layout Flexbox 布局验证
- **WHEN** 测试名称为 "应该有正确的 Flexbox 布局结构"
- **THEN** 断言 SHALL 验证布局容器具有 `flex` 相关的 CSS 类

#### Scenario: Layout 屏幕高度验证
- **WHEN** 测试名称为 "应该占满整个屏幕高度"
- **THEN** 断言 SHALL 验证布局容器具有 `h-screen` CSS 类

#### Scenario: Layout Suspense 包裹验证
- **WHEN** 测试名称为 "应该使用 Suspense 包裹 Outlet"
- **THEN** 断言 SHALL 验证 `role="main"` 区域内包含内容渲染结构

#### Scenario: Sidebar 渲染验证
- **WHEN** 测试名称为 "应该正确渲染 Sidebar 组件"
- **THEN** 断言 SHALL 验证 Sidebar 元素在桌面端（非移动端）存在于 DOM 中

#### Scenario: Sidebar 和 main 的 DOM 顺序验证
- **WHEN** 测试名称为 "Sidebar 应该位于主内容区域之前"
- **THEN** 断言 SHALL 验证 Sidebar 在 DOM 顺序上位于 `role="main"` 之前

#### Scenario: 移动端和桌面端差异渲染验证
- **WHEN** 测试名称为 "应该在移动端和桌面端都正确渲染"
- **THEN** 断言 SHALL 分别验证桌面端（显示 Sidebar，不显示 BottomNav）和移动端（不显示 Sidebar，显示 BottomNav）的渲染差异

#### Scenario: 固定高度布局不受视口影响验证
- **WHEN** 测试名称为 "应该保持固定高度布局不受视口影响"
- **THEN** 断言 SHALL 验证 `h-screen` 类在移动端和桌面端均存在

#### Scenario: 主内容区域占满父容器高度验证
- **WHEN** 测试名称为 "主内容区域应该占满父容器高度"
- **THEN** 断言 SHALL 验证 `role="main"` 元素具有 `flex-1` CSS 类
