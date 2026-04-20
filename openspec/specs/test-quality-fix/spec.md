## Requirements

### Requirement: ChatContent 测试精简

ChatContent.test.tsx SHALL 仅保留验证组件实际行为的测试，删除仅断言 `container.firstChild` 的占位测试。

#### Scenario: 测试数量精简

- **WHEN** 检查 `src/__test__/pages/Chat/ChatContent.test.tsx`
- **THEN** 测试用例数量 SHALL 不超过 4 个

#### Scenario: 不包含仅断言 firstChild 的测试

- **WHEN** 检查 ChatContent.test.tsx 中所有 `it()` 调用的断言
- **THEN** 不 SHALL 存在仅包含 `expect(container.firstChild).toBeInTheDocument()` 而无其他行为断言的测试

#### Scenario: 保留有意义的行为测试

- **WHEN** 检查保留的测试用例
- **THEN** SHALL 包含至少以下场景：空状态占位文本显示、有聊天内容时正常渲染

### Requirement: BottomNav mock 提取到共享模块

系统 SHALL 在 `src/__test__/helpers/mocks/navigation.ts` 中导出共享的导航配置 mock。

#### Scenario: 创建 navigation mock 文件

- **WHEN** 检查 `src/__test__/helpers/mocks/navigation.ts`
- **THEN** 文件 SHALL 存在并导出 `createNavigationItemsMock` 或等效函数

#### Scenario: BottomNav 测试使用共享 mock

- **WHEN** 检查 `src/__test__/components/BottomNav.test.tsx` 和 `src/__test__/integration/bottom-nav.integration.test.tsx`
- **THEN** 两个文件 SHALL 不再各自内联 35 行导航配置 mock，改为使用共享模块

### Requirement: 自定义工厂函数替换为已有工厂

测试文件中的自定义工厂函数 SHALL 替换为项目已有的共享工厂。

#### Scenario: DetailTitle 使用已有工厂

- **WHEN** 检查 `src/__test__/components/DetailTitle.test.tsx`
- **THEN** 文件 SHALL 不包含 `createTestModel` 和 `createTestChatModel` 本地定义，改用 `createMockModel` 和 `createMockPanelChatModel`

#### Scenario: RunningChatBubble 使用已有工厂

- **WHEN** 检查 `src/__test__/components/RunningChatBubble.test.tsx`
- **THEN** 文件 SHALL 不包含 `createMockChatModelForTest` 本地定义，改用 `createMockPanelChatModel`

### Requirement: 使用类型化 action creator dispatch

ChatPanel.test.tsx 中的字符串字面量 action dispatch SHALL 替换为 slice 导出的 action creator。

#### Scenario: 不使用字符串字面量 dispatch

- **WHEN** 检查 `src/__test__/components/ChatPanel.test.tsx`
- **THEN** 文件 SHALL 不包含 `{ type: 'chat/setSelectedChatId'` 或 `{ type: 'chat/editChat'` 的字符串字面量 dispatch 模式

#### Scenario: 使用 action creator

- **WHEN** 检查 ChatPanel.test.tsx 中的 dispatch 调用
- **THEN** SHALL 使用从 `@/store/slices/chatSlices` 导入的 `setSelectedChatId` 和 `editChat` action creator

### Requirement: 清理 Sidebar 测试冗余注释

Sidebar.test.tsx 中与测试标题重复的注释 SHALL 被删除。

#### Scenario: 不包含与标题重复的注释

- **WHEN** 检查 `src/__test__/components/Sidebar/Sidebar.test.tsx` 中每个 `it()` 前的注释
- **THEN** 不 SHALL 存在与下行 `it()` 标题语义完全重复的注释（如 `/** 测试组件正常渲染 3 个导航项 */` 后跟 `it('应该渲染 3 个导航项')`）

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
