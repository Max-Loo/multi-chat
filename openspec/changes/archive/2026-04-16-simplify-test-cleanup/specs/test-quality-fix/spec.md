## ADDED Requirements

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
