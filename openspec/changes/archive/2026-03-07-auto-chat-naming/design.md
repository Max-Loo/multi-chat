# 聊天标题自动生成功能技术设计

## Context

**当前状态**：
- 聊天应用只能通过用户手动重命名来设置标题
- 大量新对话标题保持空白，用户难以区分和管理
- 手动命名流程位于 `ChatButton` 组件，通过 `editChatName` action 实现

**技术背景**：
- 前端：React 19 + TypeScript + Redux Toolkit
- 后端：Tauri 2.0 + Rust
- 聊天服务：使用 Vercel AI SDK 的 `streamText` 实现流式对话
- 数据持久化：聊天数据存储在 `chats.json`，应用配置存储在 localStorage
- 多模型支持：一个聊天可以同时使用多个模型并行响应

**约束条件**：
- 必须向后兼容现有聊天数据
- 不能阻塞或干扰多模型并行对话机制
- 失败时必须静默处理，不影响用户体验
- 使用现有的 `ai` 包依赖，不引入新的外部依赖

## Goals / Non-Goals

**Goals**:
- 在用户第一次收到 AI 回复后自动生成简洁的聊天标题
- 提供全局开关控制（默认打开），允许用户完全禁用此功能
- 用户手动命名后永久不再触发自动命名
- 保持向后兼容，不影响现有数据和流程

**Non-Goals**:
- 不实现基于用户反馈的标题重新生成
- 不实现标题编辑历史记录
- 不实现标题质量评分机制
- 不在 UI 层实现（此阶段仅后端逻辑，UI 开关作为后续增强）

## Decisions

### 决策 1：使用 `generateText` 而非 `streamText`

**选择**：使用 `generateText` API（非流式）生成标题

**理由**：
- 标题通常很短（5-10 字），流式响应无意义
- `generateText` 接口更简单，直接返回 `{ text }` 对象
- 减少代码复杂度，无需处理流式事件

**替代方案**：
- 使用 `streamText`：被拒绝，因为标题生成不需要流式体验

---

### 决策 2：触发时机选择

**选择**：在第一个模型完成回答时触发（`sendMessage.fulfilled`）

**理由**：
- 响应最快，用户无需等待所有模型完成
- 简化实现逻辑，直接在现有 Redux reducer 中添加检测
- 如果等待所有模型，用户会感知明显延迟

**实现位置**：
- 文件：`src/store/slices/chatSlices.ts`
- 钩子：`sendMessage.fulfilled` extraReducer
- 检测逻辑：`historyList.length === 2`（第一条用户消息 + 第一条 AI 回复）

**替代方案**：
- 等待所有模型完成：被拒绝，延迟感知明显
- 使用 `startSendChatMessage.fulfilled`：被拒绝，此时所有模型都已完成

---

### 决策 3：标题生成服务独立化

**选择**：创建独立的 `generateChatTitleService` 服务函数

**理由**：
- 符合单一职责原则
- 便于单元测试和 mock
- 可以独立优化提示词和后处理逻辑

**服务接口**：
```typescript
// src/services/chat/titleGenerator.ts
export async function generateChatTitleService(
  messages: StandardMessage[],
  model: Model
): Promise<string>
```

**关键实现**：
- 提取最后一条用户消息和最后一条 AI 回复
- 构建结构化提示词（严肃型、5-10 字要求）
- 调用 `generateText`
- 后处理：移除标点、截取长度

---

### 决策 4：Redux 异步 Thunk 实现

**选择**：使用 Redux Toolkit 的 `createAsyncThunk` 实现 `generateChatName`

**理由**：
- 与现有代码架构一致（`sendMessage` 也使用 thunk）
- 自动处理 pending/fulfilled/rejected 状态
- 便于错误处理和日志记录
- 触发逻辑在 middleware 中，保持 reducer 纯粹

**实现细节**：
- Thunk 负责调用标题生成服务并返回结果
- 触发逻辑在 `chatMiddleware.ts` 的 listener 中
- 使用 `listenerApi.dispatch(generateChatName({...}))` 触发
- 不阻塞原有流程，作为独立异步任务执行
- 失败时返回 `null`，在 fulfilled handler 中静默处理

---

### 决策 5：触发条件检测位置

**选择**：在 `chatMiddleware.ts` 中使用 listener middleware 检测所有条件

**检测顺序**（按性能优化）：
1. 快速失败：检查 `chat.isManuallyNamed`（最常见情况）
2. 检查全局开关：`state.appConfig.autoNamingEnabled`
3. 检查标题状态：`currentChat.name === '' || currentChat.name === undefined`
4. 检查对话长度：`historyList.length === 2`
5. 检查是否正在生成：使用 Map 防止并发重复触发

**实现位置**：
- 文件：`src/store/middleware/chatMiddleware.ts`
- 使用：`startListening({ matcher: sendMessage.fulfilled, ... })`
- 在 effect 中检测条件并 dispatch `generateChatName`

**并发控制**：
- 创建模块级 Map：`const generatingTitleChatIds = new Set<string>()`
- 在 dispatch 前检查：`if (generatingTitleChatIds.has(chatId)) return`
- 在 dispatch 后添加：`generatingTitleChatIds.add(chatId)`
- 在 fulfilled/rejected 后移除：`generatingTitleChatIds.delete(chatId)`

**理由**：
- **符合 Redux Toolkit 最佳实践**：副作用应该放在 middleware 或 thunk 中，而不是 reducer
- **保持 reducer 纯粹**：extraReducer 只负责状态更新，不包含副作用逻辑
- **清晰的关注点分离**：middleware 负责副作用的触发和持久化
- **与现有架构一致**：当前的持久化逻辑也在 middleware 中实现
- **防止竞态条件**：使用 Set 锁确保多模型并行时只触发一次标题生成

**替代方案**：
- 在 `sendMessage.fulfilled` extraReducer 中检测：被拒绝，因为 reducer 应该是纯函数，不应包含副作用逻辑
- 添加 `Chat.isTitleGenerated` 字段：被拒绝，因为内存锁更简单且不影响数据模型

---

### 决策 6：数据模型扩展

**选择**：新增最小化字段，保持向后兼容

**新增字段**：
```typescript
// src/types/chat.ts
export interface Chat {
  // ... 现有字段
  isManuallyNamed?: boolean; // 新增：用户是否手动命名过
}

// src/store/slices/appConfigSlices.ts
export interface AppConfigSliceState {
  // ... 现有字段
  autoNamingEnabled: boolean; // 新增：全局开关（默认 true）
}
```

**理由**：
- `isManuallyNamed` 使用可选字段，旧数据兼容（`undefined` 视为 `false`）
- 不添加 `Chat.autoNamingEnabled`（已根据用户需求删除），避免复杂性
- 全局开关存储在应用配置，不针对单个聊天

**替代方案**：
- 添加 `Chat.autoNamingEnabled` 字段：被拒绝，用户要求全局开关对所有聊天生效

---

### 决策 7：持久化策略

**选择**：利用现有中间件机制，自动持久化所有状态变更

**实现**：
- 修改 `chatMiddleware.ts`：监听 `generateChatName.fulfilled`
- 新增 `appConfigMiddleware.ts`：监听 `setAutoNamingEnabled` action
- localStorage 键名：`autoNamingEnabled`（存储全局开关）

**理由**：
- 与现有代码模式一致（`editChatName`、`createChat` 等都已通过中间件持久化）
- 无需手动调用保存逻辑
- 自动处理错误和重试

---

### 决策 8：错误处理策略

**选择**：在所有层级实现静默失败

**实现层级**：
1. **Service 层**：`generateChatTitleService` 抛出错误
2. **Thunk 层**：捕获错误，返回 `null`，记录警告日志
3. **Reducer 层**：检查 `action.payload === null`，跳过更新

**错误场景**：
- API 调用失败（网络错误、超时）
- 生成内容为空
- 生成内容格式异常

**用户可见行为**：
- 无错误提示
- 聊天标题保持空白
- 用户可以正常继续对话或手动命名

---

## Architecture

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      用户发送消息                            │
│                    startSendChatMessage                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              多个模型并行响应 (sendMessage)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Model A (最快) ────▶ sendMessage.fulfilled          │   │
│  │  Model B          ────▶ sendMessage.fulfilled          │   │
│  │  Model C          ────▶ sendMessage.fulfilled          │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼ (第一个 fulfilled)
┌─────────────────────────────────────────────────────────────┐
│           Redux Reducer: sendMessage.fulfilled              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  保存 AI 回复到历史记录（纯函数，无副作用）          │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼ (reducer 完成)
┌─────────────────────────────────────────────────────────────┐
│         Listener Middleware: chatMiddleware                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  监听: sendMessage.fulfilled                         │   │
│  │                                                      │   │
│  │  1. 检测触发条件:                                    │   │
│  │     - 全局开关 == true?                              │   │
│  │     - chat.name 为空?                                │   │
│  │     - chat.isManuallyNamed == false?                 │   │
│  │     - historyList.length == 2?                       │   │
│  │  2. 如果全部满足 → dispatch(generateChatName)       │   │
│  │  3. 持久化聊天列表到 chats.json                      │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            Thunk Action: generateChatName                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. 调用 generateChatTitleService                   │   │
│  │  2. 成功 → { chatId, name }                         │   │
│  │  3. 失败 → null (静默)                              │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Service: generateChatTitleService               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. 提取 messages[-2:] (用户 + 助手)                 │   │
│  │  2. 构建提示词 (严肃型、5-10 字要求)                │   │
│  │  3. generateText({ model, prompt })                 │   │
│  │  4. 后处理: 移除标点、截取长度                       │   │
│  │  5. 返回标题或抛出错误                              │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│          Redux Reducer: generateChatName.fulfilled          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. 检查 payload !== null                           │   │
│  │  2. 更新 chat.name = 生成的标题                      │   │
│  │  3. 保持 isManuallyNamed = false (允许手动覆盖)     │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Middleware: 持久化到 chats.json                 │
│         (监听 generateChatName.fulfilled)                   │
└─────────────────────────────────────────────────────────────┘
```

### 模块依赖关系

```
chatSlices.ts
  ├─ 依赖 → appConfigSlices.ts (全局开关状态)
  ├─ 依赖 → types/chat.ts (Chat 接口)
  └─ 提供 → generateChatName thunk action

titleGenerator.ts
  ├─ 依赖 → types/chat.ts (StandardMessage 类型)
  ├─ 依赖 → types/model.ts (Model 类型)
  └─ 调用 → ai (generateText API)

appConfigSlices.ts
  └─ 持久化 → localStorage (autoNamingEnabled 键)

chatMiddleware.ts
  ├─ 监听 → sendMessage.fulfilled (触发条件检测)
  ├─ 监听 → generateChatName.fulfilled (持久化)
  └─ 调用 → generateChatName thunk
```

## Risks / Trade-offs

### 风险 1：标题质量不稳定

**描述**：不同模型生成的标题质量差异较大，可能不符合 5-10 字要求或风格不统一

**缓解措施**：
- 使用结构化提示词，明确要求和示例
- 后处理逻辑强制执行长度限制和标点移除
- 失败时静默处理，不干扰用户

**权衡**：
- 接受一定质量波动，避免复杂的后处理逻辑
- 用户可以随时手动覆盖

---

### 风险 2：多模型并发时的竞态条件

**描述**：多个模型几乎同时完成时，可能触发多次标题生成

**缓解措施**：
- 在 middleware 中使用内存 Set 锁：`generatingTitleChatIds`
- 在 dispatch `generateChatName` 前检查并添加 chatId
- 在 fulfilled/rejected 后移除 chatId
- 确保即使多个模型同时完成，也只触发一次标题生成

**权衡**：
- 内存锁简单高效，不影响数据模型
- 失败时自动释放锁（在 rejected 中处理）
- 不依赖持久化状态，避免数据污染

---

### 风险 3：API 调用成本

**描述**：每个聊天的第一次回复都会额外调用一次 `generateText` API

**缓解措施**：
- 复用现有模型的 API key，无需额外配置
- 仅在标题为空时调用，一次聊天只调用一次
- 短 prompt + 短 response，token 消耗小（估算 < 100 tokens）

**权衡**：
- 成本增加可控，用户体验提升显著

---

### 风险 4：历史数据兼容性和全局开关行为

**描述**：
1. 旧聊天数据没有 `isManuallyNamed` 字段，可能误触发自动命名
2. 全局开关关闭后重新打开，对历史聊天的影响不明确

**缓解措施**：
- 使用可选字段 `isManuallyNamed?: boolean`
- 检测逻辑中 `undefined` 视为 `false`
- 增加额外条件：`historyList.length === 2`（只针对新对话）

**明确行为**：
- **新建聊天**：如果全局开关打开，会在第一次收到 AI 回复时生成标题
- **历史聊天**：即使在全局开关打开后发送消息，**也不会**触发自动命名（因为对话长度 > 2）
- **设计意图**：避免用户升级后突然为所有历史空白标题聊天生成标题，保持可控性

**权衡**：
- 接受历史聊天的限制，优先保证新用户体验和系统稳定性
- 用户可以手动命名历史聊天，或使用重新生成功能（如果后续添加）

---

### 风险 5：用户手动命名检测不完整

**描述**：如果用户通过其他途径（如直接编辑 `chats.json`）修改标题，`isManuallyNamed` 不会更新

**缓解措施**：
- 仅考虑应用内操作，外部编辑不作为主要场景
- 如果用户手动编辑文件后标题仍为空，可能再次触发，但影响小

**权衡**：
- 不增加复杂的数据校验逻辑

## Migration Plan

### 部署步骤

**阶段 1：类型定义和配置（无破坏性）**
1. 修改 `src/types/chat.ts`：添加 `Chat.isManuallyNamed` 可选字段
2. 修改 `src/store/slices/appConfigSlices.ts`：添加 `autoNamingEnabled` 状态
3. 修改 `src/store/middleware/appConfigMiddleware.ts`：添加持久化逻辑

**阶段 2：核心逻辑（向后兼容）**
1. 创建 `src/services/chat/titleGenerator.ts`：标题生成服务
2. 修改 `src/store/slices/chatSlices.ts`：
   - 添加 `generateChatName` thunk action
   - 修改 `sendMessage.fulfilled`：添加触发检测
   - 修改 `editChatName` reducer：设置 `isManuallyNamed = true`
   - 添加 `generateChatName.fulfilled` extraReducer
3. 修改 `src/store/middleware/chatMiddleware.ts`：监听 `generateChatName.fulfilled`

**阶段 3：测试和验证**
1. 单元测试：`titleGenerator.test.ts`
2. 集成测试：`chatSlices.test.ts`（修改现有测试）
3. 端到端测试：创建新聊天、手动命名、开关控制

**阶段 4：UI 增强（可选，后续）**
1. 设置页面添加全局开关组件
2. Toast 提示（仅在调试模式下）

---

### 回滚策略

**触发条件**：
- 发现严重 bug 影响用户对话
- 数据持久化出现问题
- 性能影响显著

**回滚步骤**：
1. 设置全局开关 `autoNamingEnabled = false`（通过 localStorage 或代码）
2. 回滚代码到变更前的版本
3. 清理 `chats.json` 中的 `isManuallyNamed` 字段（可选）

**数据兼容性**：
- `isManuallyNamed` 为可选字段，旧版本代码忽略此字段
- 回滚后用户手动命名的标题保留，无数据丢失

---

## Open Questions

### Q1: 是否需要添加标题重新生成功能？

**状态**：已决定暂不实现

**理由**：
- 用户可以随时手动修改标题
- 避免增加 UI 复杂度
- 如果后续需求强烈，可以作为独立功能添加

---

### Q2: 是否需要记录标题生成历史？

**状态**：已决定不记录

**理由**：
- 不在当前需求范围内
- 增加数据模型复杂度
- 用户更关心最终标题而非生成过程

---

### Q3: 是否需要在生成失败时显示提示？

**状态**：已决定不显示

**理由**：
- 用户可以手动命名作为兜底
- 避免干扰正常对话流程
- 失败概率低（API 稳定性较高）

---

### Q4: 多模型场景下是否允许用户选择用于生成标题的模型？

**状态**：已决定不支持

**理由**：
- 增加用户认知负担
- 第一个完成的模型通常质量可接受
- 用户可以手动覆盖不满意的结果

---

## Performance Considerations

### 性能影响评估

**增加的异步操作**：
- 每个聊天第一次回复时额外调用一次 `generateText`
- 估算耗时：0.5-2 秒（取决于模型响应速度）

**内存占用**：
- Redux store 新增 2 个字段（可忽略）
- 临时存储提示词和响应（< 1 KB）

**网络请求**：
- 每个 API 提供商额外 1 次 `generateText` 请求
- Token 消耗：估算 prompt 150 tokens + response 20 tokens = 170 tokens

**优化措施**：
- 使用独立异步任务，不阻塞主流程
- 失败时立即取消，不重试
- 最小化 prompt 长度

---

## Testing Strategy

### 单元测试

**标题生成服务** (`titleGenerator.test.ts`)：
- 测试提示词构建
- 测试标点移除逻辑
- 测试长度截取逻辑
- Mock `generateText` 返回值

**Redux Thunk** (`chatSlices.test.ts`)：
- 测试触发条件检测（4 个条件）
- 测试 `generateChatName` action
- 测试 `editChatName` 设置 `isManuallyNamed`

### 集成测试

**完整流程测试**：
1. 创建新聊天（标题为空）
2. 发送第一条消息
3. 等待 AI 回复
4. 验证标题已生成
5. 验证持久化到 `chats.json`

**边界条件测试**：
1. 全局开关关闭
2. 聊天已有标题
3. 用户手动命名后
4. API 失败场景

### 端到端测试

**用户场景测试**：
- 新用户首次使用（开关默认打开）
- 老用户升级（历史聊天不受影响）
- 用户手动命名覆盖
- 用户关闭全局开关
