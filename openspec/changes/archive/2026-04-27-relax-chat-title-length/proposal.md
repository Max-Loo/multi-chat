## Why

当前自动命名功能将标题硬性截断为 10 个字符，对英文内容（如 "TypeScript" 本身就占 10 字符）和需要更长描述的对话主题很不友好。同时，侧边栏标题没有任何 CSS 溢出处理，用户手动命名的长标题会破坏布局。

## What Changes

- 自动命名 prompt 长度约束从 5-10 个字符放宽至 5-20 个字符
- `truncateTitle` 兜底截断上限从 10 调整为 20 个字符
- 手动命名增加 20 字符上限（无下限限制）
- 侧边栏聊天标题（ChatButton）增加 CSS `text-overflow: ellipsis` 溢出省略处理

## Capabilities

### New Capabilities

（无新增 capability）

### Modified Capabilities

- `chat-auto-naming`: 标题长度约束从 5-10 字符调整为 5-20 字符，截断上限从 10 调整为 20

## Impact

- `src/services/chat/titleGenerator.ts` — prompt 和 truncateTitle 逻辑
- `src/pages/Chat/components/Sidebar/components/ChatButton.tsx` — 标题显示增加 CSS 截断
- `src/store/slices/chatSlices.ts` — editChatName 增加手动命名 20 字符上限
- `openspec/specs/chat-auto-naming/spec.md` — 更新标题格式要求
- 自动命名集成测试和单元测试需同步更新
