## Why

当前聊天应用只能通过用户手动重命名来设置聊天标题，导致大量新对话保持空白状态，用户难以区分和管理历史对话。此功能通过在第一次 AI 回复完成后自动生成简洁的标题，减少用户手动操作成本，提升聊天管理的可识别性和用户体验。

## What Changes

- **新增功能**：自动生成聊天标题
  - 在用户第一次收到 AI 回复后，自动调用当前对话的模型生成标题
  - 标题风格：简洁明了、概括主题的严肃型标题（5-10 个汉字）
  - 使用 `generateText` API（非流式）生成标题

 - **用户控制**：
  - 用户手动命名后，该聊天不再触发自动命名
  - 新增全局开关控制（默认为打开状态），开启后对所有符合条件的聊天生效
  - 不允许用户手动命名为空字符串

 - **数据模型**：
  - `Chat` 接口新增 `isManuallyNamed?: boolean` 字段，标识用户是否手动命名过
  - `AppConfigSliceState` 接口新增 `autoNamingEnabled: boolean` 字段，作为全局开关（默认值：true）

 - **触发条件**（必须同时满足）：
  1. 全局开关 `autoNamingEnabled` 为打开状态
  2. 聊天标题为空字符串（`chat.name === '' || chat.name === undefined`）
  3. 用户触发聊天且有模型回答完成

 - **实现机制**：
  - 在 `sendMessage.fulfilled` 中检测第一个模型的第一条 AI 回复完成
  - 检查触发条件，全部满足则触发标题生成
  - 使用第一个完成的模型及其对话历史生成标题
  - 调用失败时静默处理，保持标题空白，不阻塞用户对话
  - 通过 Redux middleware 自动持久化

## Capabilities

### New Capabilities
- `chat-auto-naming`: 聊天标题自动生成功能，涵盖触发时机、标题生成策略、用户控制机制

### Modified Capabilities
无（现有功能的需求未发生变化，仅新增能力）

## Impact

**受影响的代码模块**：

- **类型定义**：
  - `src/types/chat.ts` - Chat 接口添加新字段
  - `src/store/slices/appConfigSlices.ts` - 添加全局开关状态

- **Redux 状态管理**：
  - `src/store/slices/chatSlices.ts` - 新增 `generateChatName` thunk action，修改 `sendMessage.fulfilled` 和 `editChatName` reducer
  - `src/store/middleware/chatMiddleware.ts` - 添加 `generateChatName.fulfilled` 到持久化监听
  - `src/store/middleware/appConfigMiddleware.ts` - 新增全局开关持久化中间件

- **服务层**：
  - 新增 `src/services/chat/titleGenerator.ts` - 标题生成服务，使用 `generateText` API

- **持久化**：
  - `src/store/storage/chatStorage.ts` - 自动持久化新增字段（无需修改，现有逻辑支持）
  - localStorage - 添加 `autoNamingEnabled` 键存储全局开关

- **UI 层**（可选，后续添加）：
  - 设置页面新增自动命名开关组件

**依赖变更**：
- 使用现有 `ai` 包的 `generateText` 接口（无需新增依赖）

**系统影响**：
- 不影响现有聊天数据（新字段可选，旧数据兼容）
- 不影响手动命名流程（向后兼容）
- 不影响多模型并行机制（独立异步任务）
- 全局开关打开后，**仅对新建聊天或对话长度为 2 的聊天生效**（历史聊天不受影响）
