# 实施任务清单

## 1. 测试环境准备

- [x] 1.1 创建测试文件目录结构
  - 创建 `src/__test__/services/` 目录
  - 创建 `src/__test__/store/slices/` 目录（如果不存在）
  - 创建 `src/__test__/store/middleware/` 目录

- [x] 1.2 扩展 Mock 工厂（按需）
  - 在 `src/__test__/helpers/mocks/` 中添加 `createMockStore` 辅助函数
  - 在 `src/__test__/helpers/mocks/` 中添加 `createMockFetch` 辅助函数

## 2. modelRemoteService 测试

- [x] 2.1 创建测试文件基础结构
  - 创建 `src/__test__/services/modelRemoteService.test.ts`
  - 设置 describe 套件和基础 Mock

- [x] 2.2 测试远程数据获取成功场景
  - 测试 `fetchRemoteData` 成功返回数据
  - 验证返回的 `fullApiResponse` 和 `filteredData`
  - 验证数据过滤逻辑（仅保留白名单供应商）

- [x] 2.3 测试网络超时处理
  - 测试 `fetchWithTimeout` 在超时时抛出 `NETWORK_TIMEOUT` 错误
  - 使用 `vi.useFakeTimers()` 模拟超时
  - 验证 AbortController 中止请求
  - 验证定时器清理

- [x] 2.4 测试重试机制
  - 测试网络错误后的重试逻辑
  - 测试服务器 5xx 错误的重试
  - 验证指数退避算法延迟时间（baseDelay * 2^retryCount）
  - 测试达到最大重试次数后失败

- [x] 2.5 测试客户端错误不重试
  - 测试 404 错误不触发重试
  - 验证立即抛出错误，无延迟

- [x] 2.6 测试缓存保存功能
  - 测试 `saveCachedProviderData` 保存完整 API 响应
  - 验证保存的时间戳格式（ISO 8601）
  - 验证数据来源标记为 'remote'
  - Mock Store 兼容层

- [x] 2.7 测试缓存加载功能
  - 测试 `loadCachedProviderData` 成功加载并过滤缓存
  - 测试缓存不存在时抛出 `NO_CACHE` 错误
  - Mock Store 兼容层

- [x] 2.8 测试数据适配器
  - 测试 `adaptApiResponseToInternalFormat` 正确转换数据
  - 验证字段映射（id → modelKey，name → modelName）
  - 验证白名单过滤

- [x] 2.9 测试请求取消功能
  - 测试通过 AbortSignal 取消请求
  - 验证抛出 `ABORTED` 错误
  - 验证取消时不触发重试

- [x] 2.10 测试组合信号功能
  - 测试 `combineSignals` 组合多个 AbortSignal
  - 验证任一信号中止时组合信号中止

- [x] 2.11 测试错误分类
  - 测试网络连接失败转换为 `NETWORK_ERROR`
  - 测试 JSON 解析失败转换为 `PARSE_ERROR`
  - 验证错误类型和消息

## 3. modelProviderSlice 测试

- [x] 3.1 创建测试文件基础结构
  - 创建 `src/__test__/store/slices/modelProviderSlice.test.ts`
  - 设置 Mock store 和 Redux 配置

- [x] 3.2 Mock 服务层依赖
  - Mock `@/services/modelRemoteService` 的所有函数
  - 配置 Mock 返回值和错误场景

- [x] 3.3 测试 initializeModelProvider 成功场景
  - 测试 Thunk fulfilled 状态转换
  - 验证 `loading` → false，`providers` 更新，`lastUpdate` 设置
  - 验证 `error` 为 null

- [x] 3.4 测试 initializeModelProvider 缓存降级（有缓存）
  - Mock `fetchRemoteData` 失败，`loadCachedProviderData` 成功
  - 验证从缓存加载数据
  - 验证 `lastUpdate` 为 null，`error` 设置降级消息

- [x] 3.5 测试 initializeModelProvider 完全失败（无缓存）
  - Mock `fetchRemoteData` 和 `loadCachedProviderData` 均失败
  - 验证 `providers` 为空数组
  - 验证 `error` 为严重错误消息

- [x] 3.6 测试 refreshModelProvider 成功场景
  - 测试 Thunk fulfilled 状态转换
  - 验证更新 `providers` 和 `lastUpdate`
  - 验证调用 `saveCachedProviderData`

- [x] 3.7 测试 refreshModelProvider 失败场景
  - Mock `fetchRemoteData` 失败
  - 验证保留原有 `providers` 和 `lastUpdate`
  - 验证设置 `error`

- [x] 3.8 测试 refreshModelProvider 取消功能
  - 测试 AbortSignal 中止请求
  - 验证 Thunk 被拒绝，错误类型为 `ABORTED`

- [x] 3.9 测试 clearError action
  - 测试 reducer 清除 `error`
  - 验证其他状态不变

- [x] 3.10 测试加载状态转换
  - 测试 pending 状态（loading → true）
  - 测试 fulfilled/rejected 状态（loading → false）

- [x] 3.11 测试 rejectWithValue 处理
  - 测试远程失败时返回错误和缓存数据
  - 验证 extraReducer 读取 `action.payload`

- [x] 3.12 测试 Redux 状态不可变性
  - 验证 reducer 不修改原始 state
  - 验证 extraReducer 的 Immer 不可变性

## 4. Middleware 测试

### 4.1 chatMiddleware 测试

- [x] 4.1.1 创建测试文件基础结构
  - 创建 `src/__test__/store/middleware/chatMiddleware.test.ts`
  - 设置包含 listener middleware 的 Mock store

- [x] 4.1.2 Mock 存储层依赖
  - Mock `@/store/storage` 的 `saveChatsToJson` 函数
  - 配置 Mock 返回 resolved Promise

- [x] 4.1.3 测试聊天消息发送成功触发保存
  - Dispatch `startSendChatMessage.fulfilled` action
  - 验证调用 `saveChatsToJson`
  - 验证传入最新的 chatList

- [x] 4.1.4 测试聊天消息发送失败触发保存
  - Dispatch `startSendChatMessage.rejected` action
  - 验证调用 `saveChatsToJson`

- [x] 4.1.5 测试创建聊天触发保存
  - Dispatch `createChat` action
  - 验证调用 `saveChatsToJson`

- [x] 4.1.6 测试编辑聊天触发保存
  - Dispatch `editChat` action
  - 验证调用 `saveChatsToJson`

- [x] 4.1.7 测试编辑聊天名称触发保存
  - Dispatch `editChatName` action
  - 验证调用 `saveChatsToJson`

- [x] 4.1.8 测试删除聊天触发保存
  - Dispatch `deleteChat` action
  - 验证调用 `saveChatsToJson` 和 `selectedChatId` 清除

- [x] 4.1.9 测试不匹配的 action 不触发保存
  - Dispatch 非 chat 相关 action
  - 验证不调用 `saveChatsToJson`

- [x] 4.1.10 测试从 Store 获取最新状态
  - 验证 effect 函数从 `listenerApi.getState()` 获取最新 chatList
  - 验证传递给 `saveChatsToJson` 的参数正确

### 4.2 modelMiddleware 测试

- [x] 4.2.1 创建测试文件基础结构
  - 创建 `src/__test__/store/middleware/modelMiddleware.test.ts`
  - 设置包含 listener middleware 的 Mock store

- [x] 4.2.2 Mock 存储层依赖
  - Mock `@/store/storage` 的 `saveModelsToJson` 函数
  - 配置 Mock 返回 resolved Promise

- [x] 4.2.3 测试创建模型触发保存
  - Dispatch `createModel` action
  - 验证调用 `saveModelsToJson`
  - 验证传入最新的 models 数组

- [x] 4.2.4 测试编辑模型触发保存
  - Dispatch `editModel` action
  - 验证调用 `saveModelsToJson`

- [x] 4.2.5 测试删除模型触发保存
  - Dispatch `deleteModel` action
  - 验证调用 `saveModelsToJson`

- [x] 4.2.6 测试不匹配的 action 不触发保存
  - Dispatch 非 model 相关 action
  - 验证不调用 `saveModelsToJson`

- [x] 4.2.7 测试从 Store 获取最新状态
  - 验证 effect 函数从 `listenerApi.getState()` 获取最新 models
  - 验证传递给 `saveModelsToJson` 的参数正确

## 5. 测试验证和优化

- [x] 5.1 运行所有测试并确保通过
  - 执行 `pnpm test:run`
  - 修复所有失败的测试
  - 注意：项目存在 `ai` 包依赖问题，需先安装：`pnpm add -D ai`

- [x] 5.2 检查测试覆盖率
  - 执行 `pnpm test:coverage`
  - 确保核心函数覆盖率 >90%
  - 确保整体覆盖率 >80%

- [x] 5.3 优化测试性能
  - 识别慢测试并添加 `test.slow()` 标记
  - 使用 `vi.useFakeTimers()` 优化超时测试
  - 验证测试并行执行无冲突

- [x] 5.4 清理和文档
  - 移除调试代码和 console.log
  - 添加必要的测试注释（中文）
  - 确保 test.describe 命名清晰
