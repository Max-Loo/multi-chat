## 实施任务清单

### T1: 重写 RunningChatBubble.test.tsx
- [x] 移除 `vi.mock('@/components/chat/ChatBubble')` 及相关 mock 实现
- [x] 移除 `vi.mock('@/pages/Chat/hooks/useSelectedChat')` —— 改为通过 Redux state 驱动 hook 行为
- [x] 使用 `renderWithProviders` 渲染完整组件树
- [x] 配置 Redux state 包含 `chat.activeChatId` 和 `chat.chats`，使 `useSelectedChat` 返回正确的聊天数据
- [x] 将现有 5 个 `not.toThrow()` 断言替换为实际渲染内容验证（如验证 ChatBubble 接收到正确的 props 数据）
- **文件**: `src/__test__/components/RunningChatBubble.test.tsx`

### T2: 重写 Grid.test.tsx
- [x] 移除 `vi.mock('@/pages/Chat/components/Panel/Detail')` 及相关 mock 实现
- [x] 使用 `renderWithProviders` 渲染完整组件树
- [x] 将 CSS 选择器查询保持不变（此文件不在 CSS 断言修复范围内，但可酌情改进）
- **文件**: `src/__test__/components/Grid.test.tsx`

### T3: 重写 Splitter.test.tsx
- [x] 移除 `vi.mock('@/pages/Chat/components/Panel/Detail')` 及相关 mock 实现
- [x] 使用 `renderWithProviders` 渲染完整组件树
- **文件**: `src/__test__/components/Splitter.test.tsx`

### T4: 重写 ChatPanelContentDetail.test.tsx
- [x] 移除 `vi.mock('@/pages/Chat/hooks/useSelectedChat')` 和 `vi.mock('@/pages/Chat/hooks/useIsSending')`
- [x] 通过 `createTypeSafeTestStore` 配置 Redux state 驱动 hook 行为：
  - `chat.activeChatId = 'test-chat-1'`
  - `chat.chats['test-chat-1'] = mockChat`
  - 发送状态通过 store state 控制
- [x] 将 6 个 `not.toThrow()` 断言替换为实际内容验证：
  - "渲染模型标题" → `expect(screen.getByText(modelName)).toBeInTheDocument()`
  - "渲染 RunningChatBubble" → 验证组件出现
  - "接收 chatModel prop" → 验证使用 prop 数据渲染的内容
  - "渲染多条历史消息" → `expect(screen.getAllByTestId('chat-bubble')).toHaveLength(N)`
  - "为每条消息渲染独立 ChatBubble" → 类似
- [x] 修复"发送状态显示"测试：移除 `useIsSending` mock 后通过 store state 控制 `isSending`
- **文件**: `src/__test__/components/ChatPanelContentDetail.test.tsx`

### T5: MobileDrawer.test.tsx 添加 mock 注释
- [x] 在 Sheet mock 处添加注释说明原因："Sheet 基于 Radix UI Portal，在 happy-dom 中模拟困难"
- [x] 不移除 Sheet mock（基础设施组件 mock 合理）
- **文件**: `src/__test__/components/MobileDrawer.test.tsx`

### T6: 运行测试验证
- [x] 执行 `pnpm test` 确认全部测试通过
- [x] 重点关注移除 mock 后组件是否因缺少 Provider 失败
- [x] 如有 Provider 缺失，在测试中补充必要的 Provider 包裹
- **验证命令**: `pnpm test`
