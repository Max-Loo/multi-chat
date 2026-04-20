## MODIFIED Requirements

### Requirement: 组件测试不 mock 内部子组件

组件测试 MUST NOT 使用 `vi.mock` mock 项目内部的子组件。测试 SHALL 使用 `renderWithProviders` 渲染完整组件树。

以下例外情况允许 mock：基于第三方 UI 库的基础设施组件（如 Radix UI 的 Sheet），但 MUST 添加注释说明 mock 原因。

#### Scenario: RunningChatBubble 测试不 mock ChatBubble

- **WHEN** 测试 `RunningChatBubble` 组件
- **THEN** SHALL 移除 `vi.mock('@/components/chat/ChatBubble')`，渲染完整组件树，断言 ChatBubble 接收到正确的 props

#### Scenario: Grid/Splitter 测试不 mock Detail

- **WHEN** 测试 `Grid` 或 `Splitter` 组件
- **THEN** SHALL 移除 `vi.mock('@/pages/Chat/components/Panel/Detail')`，渲染完整组件树

#### Scenario: MobileDrawer Sheet mock 保留

- **WHEN** 测试 `MobileDrawer` 组件
- **THEN** Sheet mock MAY 保留，但 MUST 添加注释说明原因："Sheet 基于 Radix UI，在 happy-dom 中 Portal 模拟困难"
