## Why

当前 ChatBubble 组件是纯展示组件，用户无法对单条消息执行任何操作。聊天应用的基本交互能力——编辑已发送消息并重新生成回复、复制消息内容——全部缺失。这些是用户管理对话内容的核心能力，直接影响使用效率。

## What Changes

- **新增** 消息操作工具栏：在消息气泡左下角固定显示操作按钮，纯图标 + hover tooltip
- **新增** 复制消息内容功能：将单条消息的纯文本内容复制到剪贴板，成功后 Toast 提示
- **新增** 编辑用户消息功能：仅允许编辑最新一条用户消息，保留编辑历史（版本翻页浏览），编辑后重新生成对应的最新 AI 回复
- **新增** 重新生成 AI 回复功能：仅对最后一条 AI 回复，对所有启用的模型重新生成
- **新增** 编辑历史翻页浏览：消息编辑历史通过 `content: string | string[]` 保存，UI 支持翻页查看历史版本
- **修改** `StandardMessage` 类型：`content` 和 `reasoningContent` 改为 `string | string[]`，支持编辑历史
- **修改** ChatBubble 组件接口：新增操作回调 props 和编辑历史翻页 props
- **修改** chatSlices：新增编辑和重新生成相关的 reducers/thunks
- **修改** chatMiddleware：新增对消息操作 action 的持久化监听

## Capabilities

### New Capabilities

- `message-operations`: 消息级操作能力，包括复制、编辑（含历史保留）和重新生成单条消息的完整行为规格

### Modified Capabilities

- `custom-chat-components`: ChatBubble 组件新增操作工具栏、行内编辑模式和历史翻页功能
- `chat-history-helper`: 新增消息级别的编辑辅助函数（原子更新用户消息和 AI 回复的历史数组）
- `chat-message-sending`: 支持基于编辑后消息重新生成单条 AI 回复的发送模式

## Impact

- **修改文件**：
  - `src/types/chat.ts` — `StandardMessage` 的 `content` 和 `reasoningContent` 类型改为 `string | string[]`
  - `src/services/chat/messageTransformer.ts` — `buildMessages` 读取 content 时取数组最后一个元素
  - `src/components/chat/ChatBubble.tsx` — 新增操作工具栏 UI、行内编辑模式、历史翻页
  - `src/pages/Chat/components/Panel/Detail/index.tsx` — 传递操作回调和历史翻页 props
  - `src/store/slices/chatSlices.ts` — 新增消息操作 reducers/thunks
  - `src/store/middleware/chatMiddleware.ts` — 监听消息操作并持久化
  - `src/locales/zh/chat.json`、`src/locales/en/chat.json`、`src/locales/fr/chat.json` — 新增操作按钮和 Toast 文案
- **依赖变更**：无（使用已有的 `lucide-react` 图标和 `copyToClipboard` 工具函数）
- **Breaking**: 无（`string | string[]` 向后兼容，`string` 为未编辑状态）
- **关键设计约束**：多模型并发时每个 ChatModel 的用户消息和 AI 回复 ID 各不相同，操作通过位置索引（而非 messageId）跨模型定位
