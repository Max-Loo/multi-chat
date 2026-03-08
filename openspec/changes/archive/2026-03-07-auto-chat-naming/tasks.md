# 聊天标题自动生成功能实施清单

## 1. 类型定义和配置

- [x] 1.1 修改 `src/types/chat.ts`：在 `Chat` 接口添加 `isManuallyNamed?: boolean` 字段
- [x] 1.2 修改 `src/store/slices/appConfigSlices.ts`：
  - 在 `AppConfigSliceState` 接口添加 `autoNamingEnabled: boolean` 字段
  - 添加 `setAutoNamingEnabled` action
  - 在 `initialState` 设置 `autoNamingEnabled: true`
- [x] 1.3 创建 `src/store/middleware/appConfigMiddleware.ts`：
  - 创建 `saveAutoNamingEnabled` listener middleware
  - 监听 `setAutoNamingEnabled` action
  - 保存到 localStorage（键名：`autoNamingEnabled`）
- [x] 1.4 修改 `src/store/index.ts`：
  - 导入 `saveAutoNamingEnabled` middleware
  - 在 `middleware` 配置中添加 `saveAutoNamingEnabled.middleware`

## 2. 标题生成服务

- [x] 2.1 创建 `src/services/chat/titleGenerator.ts`：
  - 导入 `generateText` from 'ai'
  - 导入 `getProvider` from './providerFactory'
  - 导入类型：`Model`, `StandardMessage`, `ChatRoleEnum`
- [x] 2.2 实现 `generateChatTitleService` 函数：
  - 提取最后一条用户消息和最后一条 AI 回复
  - 构建符合要求的提示词
  - 调用 `generateText` API
  - 后处理：移除标点符号、截取前 10 个字符
  - 返回清理后的标题或抛出错误
- [x] 2.3 在 `src/services/chat/index.ts` 导出 `generateChatTitleService`

## 3. Redux 状态管理 - Thunk Actions

- [x] 3.1 在 `src/store/slices/chatSlices.ts` 添加导入：
  - 从 `@/services/chat/titleGenerator` 导入 `generateChatTitleService`
  - 从 `@/store/slices/appConfigSlices` 导入 `selectAutoNamingEnabled`
- [x] 3.2 创建 `generateChatName` thunk action：
  - 使用 `createAsyncThunk`
  - 参数类型：`{ chat: Chat; model: Model; historyList: StandardMessage[] }`
  - 返回类型：`{ chatId: string; name: string } | null`
  - 在执行函数中：
    - 检查全局开关状态
    - 调用 `generateChatTitleService`
    - 失败时记录警告日志并返回 `null`
- [x] 3.3 添加 `generateChatName.fulfilled` extraReducer：
  - 检查 `action.payload !== null`
  - 根据 `chatId` 查找聊天
  - 更新 `chat.name`
  - 不设置 `isManuallyNamed`（保持为 `false`，允许手动覆盖）

## 4. Redux 状态管理 - Reducers

- [x] 4.1 修改 `editChatName` reducer：
  - 在更新 `chat.name` 后
  - 设置 `chat.isManuallyNamed = true`
- [x] 4.2 添加 `generateChatName.fulfilled` extraReducer：
  - 检查 `action.payload !== null`
  - 根据 `chatId` 查找聊天
  - 更新 `chat.name`
  - 不设置 `isManuallyNamed`（保持为 `false`，允许手动覆盖）

## 5. Listener Middleware - 触发逻辑

- [x] 5.1 修改 `src/store/middleware/chatMiddleware.ts`：
  - 添加新的 listener：监听 `sendMessage.fulfilled`
  - 从 action.meta.arg 获取 `chat`, `model`
  - 从 listenerApi.getState() 获取最新状态
  - 检测触发条件（按顺序）：
    1. `chat.isManuallyNamed !== true`
    2. `state.appConfig.autoNamingEnabled === true`
    3. `chat.name === '' || chat.name === undefined`
    4. 找到对应的 chatModel，检查 `historyList.length === 2`
  - 如果全部满足：
    - 使用 `listenerApi.dispatch(generateChatName({...}))`
    - 传入 `chat`, `model`, `historyList`
- [x] 5.2 修改现有 `saveChatListMiddleware` listener：
  - 在 `isAnyOf` 中添加 `generateChatName.fulfilled`
  - 确保自动生成的标题持久化到 `chats.json`

## 6. 单元测试

- [x] 6.1 创建 `src/__test__/services/chat/titleGenerator.test.ts`：
  - Mock `generateText` from 'ai'
  - 测试用例：
    - 成功生成标题（使用标准对话）
    - 移除标点符号
    - 截取超长标题
    - API 失败时抛出错误
- [x] 6.2 修改 `src/__test__/store/slices/chatSlices.test.ts`：
  - 添加 `generateChatName` thunk 测试：
    - 测试触发条件（4 个条件全部满足）
    - 测试全局开关关闭时不触发
    - 测试聊天已有标题时不触发
    - 测试 `isManuallyNamed === true` 时不触发
  - 修改 `editChatName` 测试：
    - 验证 `isManuallyNamed` 被设置为 `true`
  - 添加并发场景测试：
    - 测试多模型同时完成时只生成一次标题
    - 使用 `jest.useFakeTimers()` 模拟时序
    - 验证内存 Set 锁机制
- [x] 6.3 修改 `src/__test__/store/slices/appConfigSlices.test.ts`：
  - 添加 `setAutoNamingEnabled` action 测试
  - 验证初始值为 `true`

## 7. 集成测试

- [x] 7.1 创建 `src/__test__/integration/auto-naming.integration.test.ts`：
  - 测试场景：新建聊天首次收到 AI 回复
    - 创建新聊天（`name: undefined`）
    - Mock `generateChatTitleService` 返回标题
    - 发送第一条消息
    - 触发 `sendMessage.fulfilled`
    - 验证 `generateChatName` 被调用
    - 验证 `chat.name` 已更新
  - 测试场景：用户手动命名后不再触发
    - 创建聊天并手动设置 `name`
    - 发送消息
    - 验证 `generateChatName` 未被调用
  - 测试场景：全局开关关闭时不触发
    - 设置 `autoNamingEnabled = false`
    - 发送消息
    - 验证 `generateChatName` 未被调用
  - 测试场景：多模型竞态条件
    - 创建新聊天
    - 模拟两个模型同时完成（快速连续触发 sendMessage.fulfilled）
    - 验证 `generateChatName` 只被调用一次
    - 验证内存 Set 锁机制正常工作

## 8. 验证和文档

- [x] 8.1 运行所有测试：
  - `pnpm test` - 单元测试
  - `pnpm test:integration` - 集成测试
  - `pnpm test:all` - 所有测试
- [x] 8.2 代码质量检查：
  - `pnpm lint` - ESLint 检查
  - `pnpm tsc` - TypeScript 类型检查
- [ ] 8.3 手动测试：
  - 启动应用：`pnpm tauri dev`
  - 测试场景 1：创建新聊天，发送消息，验证自动标题生成
  - 测试场景 2：手动重命名，发送新消息，验证不再触发
  - 测试场景 3：关闭全局开关，创建新聊天，验证不触发
  - 测试场景 4：打开全局开关，历史聊天（标题为空）发送消息，验证触发
- [ ] 8.4 验证数据持久化：
  - 检查 `chats.json` 中是否包含 `isManuallyNamed` 字段
  - 检查 localStorage 中是否包含 `autoNamingEnabled` 键
- [ ] 8.5 更新 AGENTS.md（如需要）：
  - 如果添加了新的开发规范或约定
